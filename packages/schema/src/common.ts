import { z } from 'zod';
import { LINK_TYPES } from './links.js';

export const linkSchema = z.object({
    type: z.enum(Object.keys(LINK_TYPES) as [string, ...string[]]),
    url: z.url(),
    sourcelink: z.boolean().optional(),
    label: z.string().optional(),
});

export const licenseSchema = z.object({
    name: z.string(),
    url: z.url().optional(),
});

export function hasSourceLink(links: z.infer<typeof linkSchema>[]): boolean {
    return links.some(
        (l) => l.sourcelink ?? LINK_TYPES[l.type as keyof typeof LINK_TYPES].defaultSourceLink
    );
}

export function previewImageSchema<ImageSchema extends z.ZodType>(imageSchema: ImageSchema) {
    return z.union([imageSchema, z.object({ image: imageSchema, title: z.string().optional() })]);
}

export interface PreviewImage<Image> {
    image: Image;
    title?: string;
}

/** Normalizes a preview image entry (plain image, or `{ image, title }`) to `{ image, title? }`. */
export function resolvePreviewImage<Image>(
    entry: Image | PreviewImage<Image>
): PreviewImage<Image> {
    if (entry !== null && typeof entry === 'object' && 'image' in entry) {
        return entry as PreviewImage<Image>;
    }
    return { image: entry as Image };
}
