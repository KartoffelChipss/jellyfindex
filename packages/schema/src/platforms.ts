export const PLATFORM_CATEGORIES = {
    mobile: {
        label: 'Mobile',
        platforms: { android: 'Android', ios: 'iOS' },
    },
    desktop: {
        label: 'Desktop',
        platforms: { windows: 'Windows', macos: 'macOS', linux: 'Linux' },
    },
    tv: {
        label: 'TV',
        platforms: {
            webos: 'webOS',
            tizen: 'Tizen',
            androidtv: 'Android TV',
            tvos: 'tvOS',
            titanos: 'Titan OS',
            rokuos: 'Roku OS',
            harmonyos: 'HarmonyOS',
            fireos: 'Fire OS',
            vegaos: 'Vega OS',
        },
    },
    console: {
        label: 'Gaming Console',
        platforms: {
            xbox: 'Xbox',
            playstation: 'PlayStation',
            'nintendo-switch': 'Nintendo Switch',
            'nintendo-wiiu': 'Nintendo Wii U',
            'nintendo-3ds': 'Nintendo 3DS',
        },
    },
    wearable: {
        label: 'Wearable',
        platforms: { wearos: 'Wear OS', watchos: 'watchOS' },
    },
    vr: {
        label: 'VR',
        platforms: { 'meta-quest': 'Meta Quest', steamvr: 'SteamVR' },
    },
    other: {
        label: 'Other',
        platforms: { web: 'Web', cli: 'CLI', other: 'Other' },
    },
} as const;

export type PlatformCategoryId = keyof typeof PLATFORM_CATEGORIES;

export const PLATFORM_LABELS: Record<string, string> = Object.fromEntries(
    Object.values(PLATFORM_CATEGORIES).flatMap((c) => Object.entries(c.platforms))
);

export const ALL_PLATFORMS = Object.values(PLATFORM_CATEGORIES).flatMap((c) =>
    Object.keys(c.platforms)
) as readonly string[];

export type Platform = (typeof ALL_PLATFORMS)[number];

export function categoryForPlatform(platform: Platform): PlatformCategoryId {
    const entry = Object.entries(PLATFORM_CATEGORIES).find(([, cat]) =>
        Object.hasOwn(cat.platforms, platform)
    );
    if (!entry) throw new Error(`Unknown platform: ${platform}`);
    return entry[0] as PlatformCategoryId;
}

export function labelForPlatform(platform: Platform): string {
    for (const cat of Object.values(PLATFORM_CATEGORIES)) {
        if (platform in cat.platforms) return (cat.platforms as Record<string, string>)[platform];
    }
    throw new Error(`Unknown platform: ${platform}`);
}
