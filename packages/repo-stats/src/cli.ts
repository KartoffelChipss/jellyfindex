import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { findGithubSource } from '@jellyfindex/schema';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '../../..');
const CONTENT_ROOT = join(REPO_ROOT, 'content');
const OUTPUT_PATH = join(REPO_ROOT, 'apps/web/src/data/repo-stats.json');

const COLLECTIONS = ['clients', 'plugins', 'themes'] as const;
const GRAPHQL_BATCH_SIZE = 50;

interface Entry {
    key: string;
    owner: string;
    repo: string;
}

interface RepoStat {
    repo: string;
    stars: number;
    lastActivity: string | null;
    isArchived: boolean;
}

function collectEntries(): Entry[] {
    const entries: Entry[] = [];

    for (const collection of COLLECTIONS) {
        const dir = join(CONTENT_ROOT, collection);
        if (!existsSync(dir)) continue;

        for (const id of readdirSync(dir)
            .filter((name) => statSync(join(dir, name)).isDirectory())
            .sort()) {
            const metaPath = join(dir, id, 'meta.yaml');
            if (!existsSync(metaPath)) continue;

            const meta = (parseYaml(readFileSync(metaPath, 'utf-8')) ?? {}) as Record<
                string,
                unknown
            >;
            const source = findGithubSource(meta.links);
            if (!source) continue;

            entries.push({ key: `${collection}/${id}`, owner: source.owner, repo: source.repo });
        }
    }

    return entries;
}

/** Fetches stars/activity for every entry, batching them into GraphQL requests to stay well under the rate limit. */
async function fetchStats(entries: Entry[], token: string): Promise<Map<string, RepoStat | null>> {
    const results = new Map<string, RepoStat | null>();

    for (let i = 0; i < entries.length; i += GRAPHQL_BATCH_SIZE) {
        const batch = entries.slice(i, i + GRAPHQL_BATCH_SIZE);
        const query = `query {\n${batch
            .map(
                (e, idx) =>
                    `  r${idx}: repository(owner: ${JSON.stringify(e.owner)}, name: ${JSON.stringify(e.repo)}) {\n` +
                    `    stargazerCount\n` +
                    `    isArchived\n` +
                    `    pushedAt\n` +
                    `    defaultBranchRef { target { ... on Commit { committedDate } } }\n` +
                    `  }`
            )
            .join('\n')}\n}`;

        const res = await fetch('https://api.github.com/graphql', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                'User-Agent': 'jellyfindex-repo-stats',
            },
            body: JSON.stringify({ query }),
        });

        if (!res.ok) {
            throw new Error(`GitHub GraphQL request failed: ${res.status} ${await res.text()}`);
        }

        const json = (await res.json()) as {
            data?: Record<
                string,
                {
                    stargazerCount: number;
                    isArchived: boolean;
                    pushedAt: string;
                    defaultBranchRef: { target: { committedDate?: string } | null } | null;
                } | null
            >;
            errors?: { message: string }[];
        };

        for (const err of json.errors ?? []) {
            console.warn(`  ! GraphQL error: ${err.message}`);
        }

        batch.forEach((entry, idx) => {
            const data = json.data?.[`r${idx}`];
            if (!data) {
                results.set(entry.key, null);
                return;
            }
            results.set(entry.key, {
                repo: `${entry.owner}/${entry.repo}`,
                stars: data.stargazerCount,
                lastActivity: data.defaultBranchRef?.target?.committedDate ?? data.pushedAt ?? null,
                isArchived: data.isArchived,
            });
        });
    }

    return results;
}

async function main() {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
        console.error('GITHUB_TOKEN environment variable is required');
        process.exit(1);
    }

    const entries = collectEntries();
    console.log(`Fetching stats for ${entries.length} entries with a GitHub source link...`);

    const stats = await fetchStats(entries, token);

    const unresolved: string[] = [];
    const output: { generatedAt: string; entries: Record<string, RepoStat> } = {
        generatedAt: new Date().toISOString(),
        entries: {},
    };

    for (const entry of entries) {
        const result = stats.get(entry.key);
        if (!result) {
            unresolved.push(`${entry.key} (${entry.owner}/${entry.repo})`);
            continue;
        }
        output.entries[entry.key] = result;
    }

    if (unresolved.length > 0) {
        console.warn(
            `\nCould not resolve ${unresolved.length} repo(s) (renamed, deleted, or private?):`
        );
        for (const repo of unresolved) console.warn(`  - ${repo}`);
    }

    writeFileSync(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`);
    console.log(
        `\nWrote stats for ${Object.keys(output.entries).length} repo(s) to ${OUTPUT_PATH}`
    );
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
