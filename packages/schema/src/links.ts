export interface LinkTypeDef {
    label: string;
    defaultSourceLink: boolean;
    domains?: RegExp[];
}

export const LINK_TYPES = {
    github: {
        label: 'GitHub',
        defaultSourceLink: true,
        domains: [/^github\.com$/, /\.github\.io$/],
    },
    gitlab: {
        label: 'GitLab',
        defaultSourceLink: true,
        domains: [/^gitlab\.com$/],
    },
    bitbucket: {
        label: 'Bitbucket',
        defaultSourceLink: true,
        domains: [/^bitbucket\.org$/],
    },
    sourcehut: {
        label: 'SourceHut',
        defaultSourceLink: true,
        domains: [/^srht\.io$/, /^sourcehut\.org$/],
    },
    codeberg: {
        label: 'Codeberg',
        defaultSourceLink: true,
        domains: [/^codeberg\.org$/],
    },
    website: { label: 'Website', defaultSourceLink: false },
    documentation: { label: 'Documentation', defaultSourceLink: false },
    translations: { label: 'Translations', defaultSourceLink: false },
    donation: {
        label: 'Donation',
        defaultSourceLink: false,
        domains: [/^ko-fi\.com$/, /^patreon\.com$/, /^opencollective\.com$/, /^buymeacoffee\.com$/],
    },
    'app-store': {
        label: 'App Store',
        defaultSourceLink: false,
        domains: [/^apps\.apple\.com$/],
    },
    'google-play': {
        label: 'Google Play',
        defaultSourceLink: false,
        domains: [/^play\.google\.com$/],
    },
    'f-droid': {
        label: 'F-Droid',
        defaultSourceLink: false,
        domains: [/^f-droid\.org$/],
    },
    obtainium: {
        label: 'Obtainium',
        defaultSourceLink: false,
        domains: [/^obtainium\.imranr\.dev$/],
    },
    other: { label: 'Other', defaultSourceLink: false },
} as const satisfies Record<string, LinkTypeDef>;

export type LinkType = keyof typeof LINK_TYPES;
