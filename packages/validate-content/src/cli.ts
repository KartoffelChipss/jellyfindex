import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';
import {
    clientSchema,
    IMMUTABLE_CLIENT_FIELDS,
    pluginSchema,
    IMMUTABLE_PLUGIN_FIELDS,
    themeSchema,
    IMMUTABLE_THEME_FIELDS,
    resolvePreviewImage,
    MAX_IMAGE_DIMENSION,
    MAX_RASTER_IMAGE_BYTES,
    MAX_SVG_IMAGE_BYTES,
} from '@jellyfindex/schema';

function formatKb(bytes: number): string {
    return `${Math.round(bytes / 1024)}KB`;
}

async function checkImage(fullPath: string, imgPath: string): Promise<string[]> {
    const messages: string[] = [];
    const ext = extname(imgPath).toLowerCase();
    const sizeBytes = statSync(fullPath).size;

    if (ext === '.svg') {
        if (sizeBytes > MAX_SVG_IMAGE_BYTES) {
            messages.push(
                `${imgPath} is ${formatKb(sizeBytes)}, over the ${formatKb(MAX_SVG_IMAGE_BYTES)} limit for SVGs`
            );
        }
        return messages;
    }

    if (ext !== '.webp') {
        messages.push(
            `${imgPath} must be a .webp file (found "${ext || 'no extension'}") — run "pnpm run optimize-images"`
        );
        return messages;
    }

    if (sizeBytes > MAX_RASTER_IMAGE_BYTES) {
        messages.push(
            `${imgPath} is ${formatKb(sizeBytes)}, over the ${formatKb(MAX_RASTER_IMAGE_BYTES)} limit — run "pnpm run optimize-images"`
        );
    }

    const { width, height } = await sharp(fullPath).metadata();
    if ((width ?? 0) > MAX_IMAGE_DIMENSION || (height ?? 0) > MAX_IMAGE_DIMENSION) {
        messages.push(
            `${imgPath} is ${width}x${height}px, over the ${MAX_IMAGE_DIMENSION}px max dimension — run "pnpm run optimize-images"`
        );
    }

    return messages;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '../../..');
const CONTENT_ROOT = join(REPO_ROOT, 'content');

/** Lowercase kebab-case: letters/digits, single hyphens between words, no leading/trailing hyphen. */
const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

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

interface CrossReferenceField {
    field: string;
    target: string;
}

const COLLECTIONS: {
    name: string;
    schema: z.ZodType;
    immutableFields: readonly string[];
    buildInstallationInstructions: (
        entryDir: string,
        meta: Record<string, unknown>
    ) => Record<string, string> | string;
    crossReferenceFields?: CrossReferenceField[];
}[] = [
    {
        name: 'clients',
        schema: clientSchema,
        immutableFields: IMMUTABLE_CLIENT_FIELDS,
        buildInstallationInstructions: readPerPlatformInstallationInstructions,
        crossReferenceFields: [{ field: 'relatedPlugins', target: 'plugins' }],
    },
    {
        name: 'plugins',
        schema: pluginSchema,
        immutableFields: IMMUTABLE_PLUGIN_FIELDS,
        buildInstallationInstructions: readSingleInstallationInstructions,
        crossReferenceFields: [
            { field: 'requires', target: 'plugins' },
            { field: 'relatedClients', target: 'clients' },
        ],
    },
    {
        name: 'themes',
        schema: themeSchema,
        immutableFields: IMMUTABLE_THEME_FIELDS,
        buildInstallationInstructions: readSingleInstallationInstructions,
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

async function validateCollection(
    collection: (typeof COLLECTIONS)[number],
    knownIdsByCollection: Map<string, Set<string>>,
    changedFiles: Set<string> | null,
    baseRef: string | null,
    errors: ValidationError[]
): Promise<number> {
    const dir = join(CONTENT_ROOT, collection.name);
    if (!existsSync(dir)) return 0;

    const entries = readdirSync(dir).filter((name) => statSync(join(dir, name)).isDirectory());

    for (const entry of entries) {
        const entryDir = join(dir, entry);
        const metaPath = join(entryDir, 'meta.yaml');
        const descriptionPath = join(entryDir, 'index.md');
        const metaRelPath = `content/${collection.name}/${entry}/meta.yaml`;

        if (!SLUG_REGEX.test(entry)) {
            errors.push({
                file: `content/${collection.name}/${entry}`,
                message: `Invalid slug "${entry}" — directory names must be lowercase kebab-case (letters, digits, and single hyphens between words, e.g. "my-cool-app")`,
            });
            continue;
        }

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
        const previewImagePaths = (
            (parsed.previewImages as (string | { image: string; title?: string })[]) ?? []
        ).map((entry) => resolvePreviewImage(entry).image);
        const imagePaths = [parsed.logo, parsed.banner, ...previewImagePaths].filter(
            (p): p is string => typeof p === 'string' && p.length > 0
        );
        for (const imgPath of imagePaths) {
            const fullPath = join(entryDir, imgPath);
            if (!existsSync(fullPath)) {
                errors.push({
                    file: metaRelPath,
                    message: `Referenced image does not exist: ${imgPath}`,
                });
                continue;
            }
            for (const message of await checkImage(fullPath, imgPath)) {
                errors.push({ file: metaRelPath, message });
            }
        }

        for (const { field, target } of collection.crossReferenceFields ?? []) {
            const refs = (parsed[field] as string[] | undefined) ?? [];
            const targetIds = knownIdsByCollection.get(target) ?? new Set();
            for (const refId of refs) {
                if (target === collection.name && refId === entry) {
                    errors.push({
                        file: metaRelPath,
                        message: `"${field}" cannot reference itself: ${refId}`,
                    });
                } else if (!targetIds.has(refId)) {
                    errors.push({
                        file: metaRelPath,
                        message: `"${field}" references unknown ${target} entry: ${refId}`,
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

async function main() {
    const baseRef = getBaseRef();
    const changedFiles = baseRef ? getChangedFiles(baseRef) : null;
    const errors: ValidationError[] = [];
    let total = 0;

    const knownIdsByCollection = new Map<string, Set<string>>();
    for (const collection of COLLECTIONS) {
        const dir = join(CONTENT_ROOT, collection.name);
        const ids = existsSync(dir)
            ? readdirSync(dir).filter((name) => statSync(join(dir, name)).isDirectory())
            : [];
        knownIdsByCollection.set(collection.name, new Set(ids));
    }

    for (const collection of COLLECTIONS) {
        total += await validateCollection(
            collection,
            knownIdsByCollection,
            changedFiles,
            baseRef,
            errors
        );
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

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
