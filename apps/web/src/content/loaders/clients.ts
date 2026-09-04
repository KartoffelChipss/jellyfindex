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
            const repoRoot = new URL('../../', config.root);
            const clientsDir = fileURLToPath(new URL('content/clients/', repoRoot));
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
                const installDir = join(entryDir, 'install');

                if (!existsSync(metaPath)) {
                    logger.warn(`Skipping "${slug}": missing meta.yaml`);
                    continue;
                }

                const rawMeta = readFileSync(metaPath, 'utf-8');
                const meta = (parseYaml(rawMeta) ?? {}) as Record<string, unknown>;
                const rawDescription = existsSync(descriptionPath)
                    ? readFileSync(descriptionPath, 'utf-8').trim()
                    : '';

                // installationInstructions can be written inline in meta.yaml, or as install/<platform>.md files
                const installationInstructions = {
                    ...((meta.installationInstructions as Record<string, string>) ?? {}),
                };
                const installFiles = existsSync(installDir)
                    ? readdirSync(installDir).filter((name) => name.endsWith('.md'))
                    : [];
                for (const fileName of installFiles) {
                    const platform = fileName.slice(0, -'.md'.length);
                    installationInstructions[platform] = readFileSync(
                        join(installDir, fileName),
                        'utf-8'
                    ).trim();
                }

                const installationInstructionsHtml: Record<string, string> = {};
                for (const [platform, text] of Object.entries(installationInstructions)) {
                    const fileURL = installFiles.includes(`${platform}.md`)
                        ? pathToFileURL(join(installDir, `${platform}.md`))
                        : pathToFileURL(metaPath);
                    installationInstructionsHtml[platform] = (
                        await renderMarkdown(text, { fileURL })
                    ).html;
                }

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
                    digest: generateDigest(
                        rawMeta +
                            rawDescription +
                            installFiles
                                .map((f) => installationInstructions[f.slice(0, -3)])
                                .join('')
                    ),
                    rendered,
                });

                watcher?.add(metaPath);
                if (existsSync(descriptionPath)) watcher?.add(descriptionPath);
                if (existsSync(installDir)) watcher?.add(installDir);
                for (const fileName of installFiles) {
                    watcher?.add(join(installDir, fileName));
                }
            }
        },
    };
}
