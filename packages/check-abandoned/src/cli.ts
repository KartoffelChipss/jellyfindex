import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { LINK_TYPES } from '@jellyfindex/schema';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '../../..');
const CONTENT_ROOT = join(REPO_ROOT, 'content');
const SUMMARY_PATH = join(REPO_ROOT, 'check-abandoned-summary.md');

const COLLECTIONS = ['clients', 'plugins', 'themes'] as const;
const STALE_MONTHS = 6;
const GRAPHQL_BATCH_SIZE = 50;

interface Link {
    type: string;
    url: string;
    sourcelink?: boolean;
}

interface Entry {
    collection: string;
    id: string;
    metaPath: string;
    relPath: string;
    rawText: string;
    owner: string;
    repo: string;
    currentlyAbandoned: boolean;
}

interface RepoActivity {
    isArchived: boolean;
    lastActivity: string | null;
}

/** Mirrors hasSourceLink() in packages/schema/src/common.ts, but also returns the link itself. */
function findGithubSource(links: unknown): { owner: string; repo: string } | null {
    if (!Array.isArray(links)) return null;
    const source = (links as Link[]).find(
        (l) => l.sourcelink ?? LINK_TYPES[l.type as keyof typeof LINK_TYPES]?.defaultSourceLink
    );
    if (!source || source.type !== 'github') return null;

    const match = source.url.match(
        /^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?(?:[/?#].*)?$/
    );
    if (!match) return null;
    return { owner: match[1], repo: match[2] };
}

function collectEntries(): { entries: Entry[]; ignoredIds: string[] } {
    const entries: Entry[] = [];
    const ignoredIds: string[] = [];

    for (const collection of COLLECTIONS) {
        const dir = join(CONTENT_ROOT, collection);
        if (!existsSync(dir)) continue;

        for (const id of readdirSync(dir).filter((name) =>
            statSync(join(dir, name)).isDirectory()
        )) {
            const metaPath = join(dir, id, 'meta.yaml');
            if (!existsSync(metaPath)) continue;

            const rawText = readFileSync(metaPath, 'utf-8');
            const meta = (parseYaml(rawText) ?? {}) as Record<string, unknown>;

            if (meta.ignoreAbandonedCheck === true) {
                ignoredIds.push(`${collection}/${id}`);
                continue;
            }

            const source = findGithubSource(meta.links);
            if (!source) continue;

            entries.push({
                collection,
                id,
                metaPath,
                relPath: `content/${collection}/${id}/meta.yaml`,
                rawText,
                owner: source.owner,
                repo: source.repo,
                currentlyAbandoned: Boolean(meta.abandoned),
            });
        }
    }
    return { entries, ignoredIds };
}

/**
 * Fetches archived/last-commit status for every entry in the list, batching them into GraphQL requests to avoid rate limits
 */
async function fetchActivity(
    entries: Entry[],
    token: string
): Promise<Map<string, RepoActivity | null>> {
    const results = new Map<string, RepoActivity | null>();

    for (let i = 0; i < entries.length; i += GRAPHQL_BATCH_SIZE) {
        const batch = entries.slice(i, i + GRAPHQL_BATCH_SIZE);
        const query = `query {\n${batch
            .map(
                (e, idx) =>
                    `  r${idx}: repository(owner: ${JSON.stringify(e.owner)}, name: ${JSON.stringify(e.repo)}) {\n` +
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
                'User-Agent': 'jellyfindex-check-abandoned',
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
                results.set(entry.relPath, null);
                return;
            }
            results.set(entry.relPath, {
                isArchived: data.isArchived,
                lastActivity: data.defaultBranchRef?.target?.committedDate ?? data.pushedAt ?? null,
            });
        });
    }

    return results;
}

function setAbandoned(rawText: string, abandoned: boolean): string {
    const fieldPattern = /^abandoned:\s*(true|false)\s*$/m;

    if (abandoned) {
        if (fieldPattern.test(rawText)) {
            return rawText.replace(fieldPattern, 'abandoned: true');
        }
        if (/^openSource:.*$/m.test(rawText)) {
            return rawText.replace(/^(openSource:.*)$/m, '$1\nabandoned: true');
        }
        return `${rawText.trimEnd()}\nabandoned: true\n`;
    }

    return rawText.replace(/^abandoned:\s*(true|false)\s*\n/m, '');
}

async function main() {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
        console.error('GITHUB_TOKEN environment variable is required');
        process.exit(1);
    }

    const { entries, ignoredIds } = collectEntries();
    console.log(`Checking ${entries.length} entries with a GitHub source link...`);
    if (ignoredIds.length > 0) {
        console.log(
            `Skipping ${ignoredIds.length} entr${ignoredIds.length === 1 ? 'y' : 'ies'} with ignoreAbandonedCheck: true (${ignoredIds.join(', ')})`
        );
    }

    const activity = await fetchActivity(entries, token);
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - STALE_MONTHS);

    const changed: {
        collection: string;
        id: string;
        repo: string;
        action: 'marked abandoned' | 'unmarked abandoned';
        lastActivity: string | null;
    }[] = [];
    const unresolved: string[] = [];

    for (const entry of entries) {
        const result = activity.get(entry.relPath);
        if (!result) {
            unresolved.push(`${entry.owner}/${entry.repo}`);
            continue;
        }

        const lastActivityDate = result.lastActivity ? new Date(result.lastActivity) : null;
        const isStale =
            result.isArchived || (lastActivityDate !== null && lastActivityDate < cutoff);

        if (isStale === entry.currentlyAbandoned) continue;

        writeFileSync(entry.metaPath, setAbandoned(entry.rawText, isStale));
        changed.push({
            collection: entry.collection,
            id: entry.id,
            repo: `${entry.owner}/${entry.repo}`,
            action: isStale ? 'marked abandoned' : 'unmarked abandoned',
            lastActivity: result.lastActivity,
        });
    }

    if (unresolved.length > 0) {
        console.warn(
            `\nCould not resolve ${unresolved.length} repo(s) (renamed, deleted, or private?):`
        );
        for (const repo of unresolved) console.warn(`  - ${repo}`);
    }

    if (changed.length === 0) {
        console.log('\nNo changes needed.');
        return;
    }

    console.log(`\n${changed.length} change(s):`);
    for (const c of changed) {
        console.log(
            `  - [${c.collection}] ${c.id} (${c.repo}): ${c.action} (last activity: ${c.lastActivity ?? 'unknown'})`
        );
    }

    const lines = [
        `Automated check for projects with no commits in the last ${STALE_MONTHS} months.`,
        '',
        '| Project | Repo | Action | Last activity |',
        '| --- | --- | --- | --- |',
        ...changed.map(
            (c) =>
                `| ${c.collection}/${c.id} | [${c.repo}](https://github.com/${c.repo}) | ${c.action} | ${
                    c.lastActivity ? c.lastActivity.slice(0, 10) : 'unknown'
                } |`
        ),
    ];
    if (unresolved.length > 0) {
        lines.push(
            '',
            `> [!WARNING]`,
            `> Could not resolve ${unresolved.length} repo(s), left unchanged: ${unresolved.join(', ')}`
        );
    }
    lines.push(
        '',
        '_Please double-check before merging. A repo can be quiet for reasons other than abandonment (stable/feature-complete, maintained elsewhere, etc.)._'
    );

    writeFileSync(SUMMARY_PATH, `${lines.join('\n')}\n`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
