import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';
import {
    clientSchema,
    IMMUTABLE_CLIENT_FIELDS,
    pluginSchema,
    IMMUTABLE_PLUGIN_FIELDS,
} from '@jellyfindex/schema';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '../../..');
const CONTENT_ROOT = join(REPO_ROOT, 'content');

/** Reads `installationInstructions`, keyed per-platform from meta.yaml and/or install/<platform>.md files. */
function readPerPlatformInstallationInstructions(
    entryDir: string,
    meta: Record<string, unknown>
): Record<string, string> {
    const installDir = join(entryDir, 'install');
    const installationInstructions = {
        ...((meta.installationInstructions as Record<string, string>) ?? {}),
    };
    if (existsSync(installDir)) {
        for (const fileName of readdirSync(installDir).filter((name) => name.endsWith('.md'))) {
            const platform = fileName.slice(0, -'.md'.length);
            installationInstructions[platform] = readFileSync(
                join(installDir, fileName),
                'utf-8'
            ).trim();
        }
    }
    return installationInstructions;
}

/** Reads `installationInstructions` as a single string from meta.yaml and/or an install.md file. */
function readSingleInstallationInstructions(
    entryDir: string,
    meta: Record<string, unknown>
): string {
    const installPath = join(entryDir, 'install.md');
    return existsSync(installPath)
        ? readFileSync(installPath, 'utf-8').trim()
        : ((meta.installationInstructions as string | undefined) ?? '');
}

const COLLECTIONS: {
    name: string;
    schema: z.ZodType;
    immutableFields: readonly string[];
    buildInstallationInstructions: (
        entryDir: string,
        meta: Record<string, unknown>
    ) => Record<string, string> | string;
    /** Field holding ids of other entries in this same collection (e.g. required plugins). */
    crossReferenceField?: string;
}[] = [
    {
        name: 'clients',
        schema: clientSchema,
        immutableFields: IMMUTABLE_CLIENT_FIELDS,
        buildInstallationInstructions: readPerPlatformInstallationInstructions,
    },
    {
        name: 'plugins',
        schema: pluginSchema,
        immutableFields: IMMUTABLE_PLUGIN_FIELDS,
        buildInstallationInstructions: readSingleInstallationInstructions,
        crossReferenceField: 'requires',
    },
];

interface ValidationError {
    file: string;
    message: string;
}

function getBaseRef(): string | null {
    const idx = process.argv.indexOf('--base');
    if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
    if (process.env.GITHUB_BASE_REF) return `origin/${process.env.GITHUB_BASE_REF}`;
    return null;
}

function getChangedFiles(baseRef: string): Set<string> {
    try {
        const out = execSync(`git diff --name-only ${baseRef}...HEAD`, {
            cwd: REPO_ROOT,
            encoding: 'utf-8',
        });
        return new Set(out.split('\n').filter(Boolean));
    } catch {
        return new Set();
    }
}

function getFileAtRef(ref: string, relPath: string): string | null {
    try {
        return execSync(`git show ${ref}:${relPath}`, {
            cwd: REPO_ROOT,
            encoding: 'utf-8',
        });
    } catch {
        return null;
    }
}

function validateCollection(
    collection: (typeof COLLECTIONS)[number],
    changedFiles: Set<string> | null,
    baseRef: string | null,
    errors: ValidationError[]
): number {
    const dir = join(CONTENT_ROOT, collection.name);
    if (!existsSync(dir)) return 0;

    const entries = readdirSync(dir).filter((name) => statSync(join(dir, name)).isDirectory());
    const knownIds = new Set(entries);

    for (const entry of entries) {
        const entryDir = join(dir, entry);
        const metaPath = join(entryDir, 'meta.yaml');
        const descriptionPath = join(entryDir, 'index.md');
        const metaRelPath = `content/${collection.name}/${entry}/meta.yaml`;

        if (!existsSync(metaPath)) {
            errors.push({ file: metaRelPath, message: 'Missing meta.yaml' });
            continue;
        }
        if (!existsSync(descriptionPath)) {
            errors.push({
                file: `content/${collection.name}/${entry}/index.md`,
                message: 'Missing index.md (long-form description)',
            });
            continue;
        }

        const rawMeta = readFileSync(metaPath, 'utf-8');
        const meta = (parseYaml(rawMeta) ?? {}) as Record<string, unknown>;
        const description = readFileSync(descriptionPath, 'utf-8').trim();

        const installationInstructions = collection.buildInstallationInstructions(entryDir, meta);

        const result = collection.schema.safeParse({
            ...meta,
            description,
            installationInstructions,
        });
        if (!result.success) {
            for (const issue of result.error.issues) {
                errors.push({
                    file: metaRelPath,
                    message: `${issue.path.join('.')}: ${issue.message}`,
                });
            }
            continue;
        }

        const parsed = result.data as Record<string, unknown>;
        const imagePaths = [
            parsed.logo,
            parsed.banner,
            ...((parsed.previewImages as string[]) ?? []),
        ].filter((p): p is string => typeof p === 'string' && p.length > 0);
        for (const imgPath of imagePaths) {
            if (!existsSync(join(entryDir, imgPath))) {
                errors.push({
                    file: metaRelPath,
                    message: `Referenced image does not exist: ${imgPath}`,
                });
            }
        }

        if (collection.crossReferenceField) {
            const refs = (parsed[collection.crossReferenceField] as string[] | undefined) ?? [];
            for (const refId of refs) {
                if (refId === entry) {
                    errors.push({
                        file: metaRelPath,
                        message: `"${collection.crossReferenceField}" cannot reference itself: ${refId}`,
                    });
                } else if (!knownIds.has(refId)) {
                    errors.push({
                        file: metaRelPath,
                        message: `"${collection.crossReferenceField}" references unknown entry: ${refId}`,
                    });
                }
            }
        }

        if (changedFiles?.has(metaRelPath) && baseRef) {
            const baseContent = getFileAtRef(baseRef, metaRelPath);
            if (baseContent !== null) {
                const baseMeta = (parseYaml(baseContent) ?? {}) as Record<string, unknown>;
                for (const field of collection.immutableFields) {
                    if (field in baseMeta && String(baseMeta[field]) !== String(meta[field])) {
                        errors.push({
                            file: metaRelPath,
                            message: `Field "${field}" is immutable and cannot change after initial submission (was "${baseMeta[field]}", now "${meta[field]}")`,
                        });
                    }
                }
            }
        }
    }

    return entries.length;
}

function main() {
    const baseRef = getBaseRef();
    const changedFiles = baseRef ? getChangedFiles(baseRef) : null;
    const errors: ValidationError[] = [];
    let total = 0;

    for (const collection of COLLECTIONS) {
        total += validateCollection(collection, changedFiles, baseRef, errors);
    }

    if (errors.length > 0) {
        console.error(`\n✗ ${errors.length} validation error(s):\n`);
        for (const err of errors) {
            console.error(`  ${err.file}\n    ${err.message}\n`);
        }
        process.exit(1);
    }

    console.log(
        `✓ Validated ${total} entr${total === 1 ? 'y' : 'ies'} across ${COLLECTIONS.length} collection(s)`
    );
}

main();
