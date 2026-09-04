import { Book, Download, ExternalLink, Globe, Languages, PiggyBank } from 'lucide-react';
import type { LinkType } from '@jellyfindex/schema';
import GitHub from '@/components/icons/GitHub.astro';
import GitLab from '@/components/icons/GitLab.astro';
import Bitbucket from '@/components/icons/Bitbucket.astro';
import Sourcehut from '@/components/icons/Sourcehut.astro';
import Codeberg from '@/components/icons/Codeberg.astro';
import AppStore from '@/components/icons/AppStore.astro';
import GooglePlay from '@/components/icons/GooglePlay.astro';
import Fdroid from '@/components/icons/FDroid.astro';

/** Picks an icon for a client link, preferring a brand mark for known hosts/stores. */
export function iconForLink(type: LinkType, isInstall: boolean) {
    if (isInstall) return Download;
    switch (type) {
        case 'website':
            return Globe;
        case 'documentation':
            return Book;
        case 'donation':
            return PiggyBank;
        case 'translations':
            return Languages;
        case 'github':
            return GitHub;
        case 'gitlab':
            return GitLab;
        case 'bitbucket':
            return Bitbucket;
        case 'sourcehut':
            return Sourcehut;
        case 'codeberg':
            return Codeberg;
        case 'app-store':
            return AppStore;
        case 'google-play':
            return GooglePlay;
        case 'f-droid':
            return Fdroid;
        default:
            return ExternalLink;
    }
}
