export const PLUGIN_CATEGORIES = {
    general: 'General',
    metadata: 'Metadata',
    library: 'Library',
    integrations: 'Integrations',
    notifications: 'Notifications',
    authentication: 'Authentication',
    automation: 'Automation',
    theme: 'Theme',
    companion: 'Companion',
    other: 'Other',
} as const;

export const ALL_PLUGIN_CATEGORIES = Object.keys(PLUGIN_CATEGORIES) as readonly string[];

export type PluginCategory = (typeof ALL_PLUGIN_CATEGORIES)[number];

export function labelForPluginCategory(category: PluginCategory): string {
    return (PLUGIN_CATEGORIES as Record<string, string>)[category] ?? category;
}
