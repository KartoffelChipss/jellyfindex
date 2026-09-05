const REPO = 'KartoffelChipss/jellyfindex';
const SITE_URL = 'https://jellyfindex.com';

export type ReportEntryType = 'Client' | 'Plugin' | 'Theme';

export function reportEntryUrl(entryType: ReportEntryType, name: string, path: string): string {
    const params = new URLSearchParams({
        template: 'report-entry.yml',
        'entry-type': entryType,
        'entry-name': name,
        'entry-link': `${SITE_URL}${path}`,
    });
    return `https://github.com/${REPO}/issues/new?${params.toString()}`;
}
