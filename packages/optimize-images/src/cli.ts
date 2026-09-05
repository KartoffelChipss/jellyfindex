import {
    existsSync,
    readFileSync,
    readdirSync,
    renameSync,
    statSync,
    unlinkSync,
    writeFileSync,
} from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { parse as parseYaml } from 'yaml';
import {
    MAX_IMAGE_DIMENSION,
    MAX_RASTER_IMAGE_BYTES,
    resolvePreviewImage,
} from '@jellyfindex/schema';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '../../..');
const CONTENT_ROOT = join(REPO_ROOT, 'content');
const COLLECTIONS = ['clients', 'plugins', 'themes'] as const;

/** Quality levels tried, in order, until the output fits under MAX_RASTER_IMAGE_BYTES. */
const QUALITY_STEPS = [82, 75, 65, 55, 45];

interface ImageRef {
    relPath: string;
}

function collectImageRefs(meta: Record<string, unknown>): ImageRef[] {
    const refs: ImageRef[] = [];
    for (const field of ['logo', 'banner'] as const) {
        if (typeof meta[field] === 'string' && meta[field]) {
            refs.push({ relPath: meta[field] as string });
        }
    }
    const previewImages = (meta.previewImages as (string | { image: string })[] | undefined) ?? [];
    for (const entry of previewImages) {
        const { image } = resolvePreviewImage(entry);
        if (typeof image === 'string' && image) refs.push({ relPath: image });
    }
    return refs;
}

function replaceAllLiteral(text: string, search: string, replacement: string): string {
    return text.split(search).join(replacement);
}

async function optimize(inputPath: string): Promise<Buffer> {
    const image = sharp(inputPath, { animated: true });
    const metadata = await image.metadata();

    const needsResize =
        (metadata.width ?? 0) > MAX_IMAGE_DIMENSION || (metadata.height ?? 0) > MAX_IMAGE_DIMENSION;

    let pipeline = sharp(inputPath, { animated: true });
    if (needsResize) {
        pipeline = pipeline.resize({
            width: MAX_IMAGE_DIMENSION,
            height: MAX_IMAGE_DIMENSION,
            fit: 'inside',
            withoutEnlargement: true,
        });
    }

    let best: Buffer | null = null;
    for (const quality of QUALITY_STEPS) {
        const buffer = await pipeline.clone().webp({ quality }).toBuffer();
        best = buffer;
        if (buffer.byteLength <= MAX_RASTER_IMAGE_BYTES) return buffer;
    }
    return best!;
}

async function processEntry(entryDir: string, metaRelPath: string): Promise<void> {
    const metaPath = join(entryDir, 'meta.yaml');
    let rawText = readFileSync(metaPath, 'utf-8');
    const meta = (parseYaml(rawText) ?? {}) as Record<string, unknown>;

    let changed = false;

    for (const { relPath } of collectImageRefs(meta)) {
        const fullPath = join(entryDir, relPath);
        if (!existsSync(fullPath)) {
            console.warn(`  ! missing file, skipping: ${metaRelPath} -> ${relPath}`);
            continue;
        }

        const ext = extname(relPath).toLowerCase();
        if (ext === '.svg') continue;

        const beforeBytes = statSync(fullPath).size;
        const metadata = await sharp(fullPath, { animated: true }).metadata();
        const oversized =
            (metadata.width ?? 0) > MAX_IMAGE_DIMENSION ||
            (metadata.height ?? 0) > MAX_IMAGE_DIMENSION;
        const needsWork = ext !== '.webp' || oversized || beforeBytes > MAX_RASTER_IMAGE_BYTES;

        if (!needsWork) continue;

        const newRelPath = relPath.slice(0, relPath.length - ext.length) + '.webp';
        const newFullPath = join(entryDir, newRelPath);
        const tmpPath = `${newFullPath}.tmp`;

        const optimized = await optimize(fullPath);
        writeFileSync(tmpPath, optimized);
        renameSync(tmpPath, newFullPath);
        if (newFullPath !== fullPath) unlinkSync(fullPath);

        if (newRelPath !== relPath) {
            rawText = replaceAllLiteral(rawText, relPath, newRelPath);
            changed = true;
        }

        const afterBytes = optimized.byteLength;
        console.log(
            `  ${relPath} -> ${newRelPath}: ${Math.round(beforeBytes / 1024)}KB -> ${Math.round(afterBytes / 1024)}KB` +
                (afterBytes > MAX_RASTER_IMAGE_BYTES
                    ? ' (still over budget, needs a manual look)'
                    : '')
        );
    }

    if (changed) {
        writeFileSync(metaPath, rawText);
    }
}

async function main() {
    for (const collection of COLLECTIONS) {
        const dir = join(CONTENT_ROOT, collection);
        if (!existsSync(dir)) continue;

        for (const id of readdirSync(dir).filter((name) =>
            statSync(join(dir, name)).isDirectory()
        )) {
            const entryDir = join(dir, id);
            const metaRelPath = `content/${collection}/${id}/meta.yaml`;
            if (!existsSync(join(entryDir, 'meta.yaml'))) continue;

            console.log(`${collection}/${id}`);
            await processEntry(entryDir, metaRelPath);
        }
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
