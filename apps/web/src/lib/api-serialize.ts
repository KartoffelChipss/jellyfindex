import { getImage } from 'astro:assets';
import type { CollectionEntry } from 'astro:content';
import { resolvePreviewImage } from '@jellyfindex/schema';
import { getRepoStats } from '@/lib/repo-stats';

const SITE_URL = 'https://jellyfindex.com';

async function resolveImageUrl(image: unknown): Promise<string> {
    const optimized = await getImage({ src: image as Parameters<typeof getImage>[0]['src'] });
    return new URL(optimized.src, SITE_URL).toString();
}

async function serializePreviewImages(previewImages: unknown[]) {
    return Promise.all(
        previewImages.map(async (entry) => {
            const resolved = resolvePreviewImage(entry) as {
                image: unknown;
                title?: string;
                platform?: string;
            };
            return {
                image: await resolveImageUrl(resolved.image),
                title: resolved.title,
                platform: resolved.platform,
            };
        })
    );
}

export async function serializeClient(entry: CollectionEntry<'clients'>) {
    const {
        installationInstructionsHtml: _html,
        logo,
        banner,
        previewImages,
        ...rest
    } = entry.data;
    return {
        id: entry.id,
        url: `${SITE_URL}/clients/${entry.id}`,
        ...rest,
        logo: await resolveImageUrl(logo),
        banner: banner ? await resolveImageUrl(banner) : undefined,
        previewImages: await serializePreviewImages(previewImages),
        repoStats: getRepoStats('clients', entry.id) ?? null,
    };
}

export async function serializePlugin(entry: CollectionEntry<'plugins'>) {
    const {
        installationInstructionsHtml: _html,
        logo,
        banner,
        previewImages,
        ...rest
    } = entry.data;
    return {
        id: entry.id,
        url: `${SITE_URL}/plugins/${entry.id}`,
        ...rest,
        logo: await resolveImageUrl(logo),
        banner: banner ? await resolveImageUrl(banner) : undefined,
        previewImages: await serializePreviewImages(previewImages),
        repoStats: getRepoStats('plugins', entry.id) ?? null,
    };
}

export async function serializeTheme(entry: CollectionEntry<'themes'>) {
    const { installationInstructionsHtml: _html, previewImages, ...rest } = entry.data;
    return {
        id: entry.id,
        url: `${SITE_URL}/themes/${entry.id}`,
        ...rest,
        previewImages: await serializePreviewImages(previewImages),
        repoStats: getRepoStats('themes', entry.id) ?? null,
    };
}
