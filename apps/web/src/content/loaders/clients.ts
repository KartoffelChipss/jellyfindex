import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Loader } from 'astro/loaders';
import { parse as parseYaml } from 'yaml';

function toRootRelativePath(root: URL, absolutePath: string): string {
    return relative(fileURLToPath(root), absolutePath).split(sep).join('/');
}

export function clientsLoader(): Loader {
    return {
        name: 'jellyfindex-clients-loader',
        load: async ({
            config,
            store,
            parseData,
            generateDigest,
            renderMarkdown,
            logger,
            watcher,
        }) => {
            const clientsDir = fileURLToPath(new URL('content/clients/', config.srcDir));
            if (!existsSync(clientsDir)) {
                logger.warn(`No clients directory found at ${clientsDir}`);
                return;
            }

            store.clear();

            const slugs = readdirSync(clientsDir).filter((name) =>
                statSync(join(clientsDir, name)).isDirectory()
            );

            for (const slug of slugs) {
                const entryDir = join(clientsDir, slug);
                const metaPath = join(entryDir, 'meta.yaml');
                const descriptionPath = join(entryDir, 'index.md');

                if (!existsSync(metaPath)) {
                    logger.warn(`Skipping "${slug}": missing meta.yaml`);
                    continue;
                }

                const rawMeta = readFileSync(metaPath, 'utf-8');
                const meta = (parseYaml(rawMeta) ?? {}) as Record<string, unknown>;
                const rawDescription = existsSync(descriptionPath)
                    ? readFileSync(descriptionPath, 'utf-8').trim()
                    : '';

                const data = await parseData({
                    id: slug,
                    data: { ...meta, description: rawDescription },
                    filePath: metaPath,
                });

                const rendered = rawDescription
                    ? await renderMarkdown(rawDescription, {
                          fileURL: pathToFileURL(descriptionPath),
                      })
                    : undefined;

                store.set({
                    id: slug,
                    data,
                    body: rawDescription,
                    filePath: toRootRelativePath(config.root, metaPath),
                    digest: generateDigest(rawMeta + rawDescription),
                    rendered,
                });

                watcher?.add(metaPath);
                if (existsSync(descriptionPath)) watcher?.add(descriptionPath);
            }
        },
    };
}
