import repoStats from '@/data/repo-stats.json';

export interface RepoStat {
    repo: string;
    stars: number;
    lastActivity: string | null;
    isArchived: boolean;
}

const entries = repoStats.entries as Record<string, RepoStat>;

/** Looks up cached GitHub stats for an entry, e.g. getRepoStats('clients', 'jellysee'). */
export function getRepoStats(collection: string, id: string): RepoStat | undefined {
    return entries[`${collection}/${id}`];
}

export function formatStars(stars: number): string {
    if (stars >= 10_000) return `${Math.round(stars / 1000)}k`;
    if (stars >= 1_000) return `${(stars / 1000).toFixed(1).replace(/\.0$/, '')}k`;
    return String(stars);
}

export function timeAgo(iso: string): string {
    const diffDays = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 30) return `${diffDays} days ago`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;
    const diffYears = Math.floor(diffMonths / 12);
    return `${diffYears} year${diffYears === 1 ? '' : 's'} ago`;
}

export type ActivityTone = 'fresh' | 'normal' | 'stale' | 'archived';

const FRESH_DAYS = 30;
/** Matches the 6-month cutoff @jellyfindex/check-abandoned uses to flag a project abandoned. */
const STALE_DAYS = 30 * 6;

/** Classifies how recently a repo was touched, for color-coding the "Updated" tag. */
export function getActivityTone(stat: RepoStat): ActivityTone {
    if (stat.isArchived) return 'archived';
    if (!stat.lastActivity) return 'normal';

    const diffDays = (Date.now() - new Date(stat.lastActivity).getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays <= FRESH_DAYS) return 'fresh';
    if (diffDays <= STALE_DAYS) return 'normal';
    return 'stale';
}

export type StarTone = 'low' | 'mid' | 'high';

/** Classifies star count into rough popularity tiers, for color-coding the star count. */
export function getStarTone(stars: number): StarTone {
    if (stars >= 1000) return 'high';
    if (stars >= 100) return 'mid';
    return 'low';
}
