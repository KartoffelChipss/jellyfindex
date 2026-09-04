import type { Platform } from './platforms.js';

export type FeatureCategory =
    'playback' | 'subtitles' | 'audio' | 'casting' | 'library' | 'account' | 'platform-integration';

export interface FeatureFlagDef {
    flag: string;
    displayName: string;
    category: FeatureCategory;
    platforms?: Platform[]; // omit or empty = applies to all platforms
}

export const FEATURE_FLAGS: FeatureFlagDef[] = [
    { flag: 'offline-download', displayName: 'Offline downloads', category: 'playback' },
    { flag: 'chromecast', displayName: 'Chromecast support', category: 'casting' },
    { flag: 'hw-decode', displayName: 'Hardware-accelerated decoding', category: 'playback' },
    { flag: 'syncplay', displayName: 'SyncPlay', category: 'casting' },
    {
        flag: 'android-auto',
        displayName: 'Android Auto',
        category: 'platform-integration',
        platforms: ['android'],
    },
    {
        flag: 'carplay',
        displayName: 'CarPlay',
        category: 'platform-integration',
        platforms: ['ios'],
    },
    { flag: 'direct-play', displayName: 'Direct play', category: 'playback' },
    { flag: '10bit-hevc', displayName: '10-bit HEVC support', category: 'playback' },
    { flag: 'dolby-vision', displayName: 'Dolby Vision', category: 'playback' },
    { flag: 'trickplay', displayName: 'Scrubbing thumbnails (trickplay)', category: 'playback' },
    { flag: 'external-subtitles', displayName: 'External subtitle files', category: 'subtitles' },
    {
        flag: 'pgs-ass-subtitles',
        displayName: 'PGS / ASS subtitle rendering',
        category: 'subtitles',
    },
    { flag: 'gapless-playback', displayName: 'Gapless playback', category: 'audio' },
    { flag: 'lyrics', displayName: 'Lyrics display', category: 'audio' },
    { flag: 'airplay', displayName: 'AirPlay', category: 'casting' },
    { flag: 'dlna', displayName: 'DLNA', category: 'casting' },
    { flag: 'quick-connect', displayName: 'Quick Connect login', category: 'account' },
    { flag: 'multi-server', displayName: 'Multiple server connections', category: 'account' },
    { flag: 'parental-controls', displayName: 'Parental controls', category: 'account' },
    { flag: 'live-tv-dvr', displayName: 'Live TV & DVR', category: 'library' },
    {
        flag: 'seerr-integration',
        displayName: 'Seerr integration',
        category: 'library',
    },
    { flag: 'trakt-scrobbling', displayName: 'Trakt scrobbling', category: 'library' },
    { flag: 'user-profiles', displayName: 'User profiles', category: 'account' },
    { flag: 'kevintweaks-watchlist', displayName: "KevinTweak's watchlist", category: 'library' },
    {
        flag: 'streamystats-recommendations',
        displayName: 'StreamyStats recommendations',
        category: 'library',
    },
];

export const FEATURE_FLAG_IDS = FEATURE_FLAGS.map((f) => f.flag) as [string, ...string[]];

export const FEATURE_FLAG_MAP = new Map(FEATURE_FLAGS.map((f) => [f.flag, f]));
