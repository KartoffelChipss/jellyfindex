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
