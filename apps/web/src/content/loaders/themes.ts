import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Loader } from 'astro/loaders';
import { parse as parseYaml } from 'yaml';

function toRootRelativePath(root: URL, absolutePath: string): string {
    return relative(fileURLToPath(root), absolutePath).split(sep).join('/');
}

export function themesLoader(): Loader {
    return {
        name: 'jellyfindex-themes-loader',
        load: async ({
            config,
            store,
            parseData,
            generateDigest,
            renderMarkdown,
            logger,
            watcher,
        }) => {
            const repoRoot = new URL('../../', config.root);
            const themesDir = fileURLToPath(new URL('content/themes/', repoRoot));
            if (!existsSync(themesDir)) {
                logger.warn(`No themes directory found at ${themesDir}`);
                return;
            }

            store.clear();

            const slugs = readdirSync(themesDir).filter((name) =>
                statSync(join(themesDir, name)).isDirectory()
            );

            for (const slug of slugs) {
                const entryDir = join(themesDir, slug);
                const metaPath = join(entryDir, 'meta.yaml');
                const descriptionPath = join(entryDir, 'index.md');
                const installPath = join(entryDir, 'install.md');

                if (!existsSync(metaPath)) {
                    logger.warn(`Skipping "${slug}": missing meta.yaml`);
                    continue;
                }

                const rawMeta = readFileSync(metaPath, 'utf-8');
                const meta = (parseYaml(rawMeta) ?? {}) as Record<string, unknown>;
                const rawDescription = existsSync(descriptionPath)
                    ? readFileSync(descriptionPath, 'utf-8').trim()
                    : '';

                // installationInstructions can be written inline in meta.yaml, or as an install.md file
                const installationInstructions = existsSync(installPath)
                    ? readFileSync(installPath, 'utf-8').trim()
                    : ((meta.installationInstructions as string | undefined) ?? '');

                const installationInstructionsHtml = installationInstructions
                    ? (
                          await renderMarkdown(installationInstructions, {
                              fileURL: existsSync(installPath)
                                  ? pathToFileURL(installPath)
                                  : pathToFileURL(metaPath),
                          })
                      ).html
                    : '';

                const data = await parseData({
                    id: slug,
                    data: {
                        ...meta,
                        description: rawDescription,
                        installationInstructions,
                        installationInstructionsHtml,
                    },
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
                    digest: generateDigest(rawMeta + rawDescription + installationInstructions),
                    rendered,
                });

                watcher?.add(metaPath);
                if (existsSync(descriptionPath)) watcher?.add(descriptionPath);
                if (existsSync(installPath)) watcher?.add(installPath);
            }
        },
    };
}
