import { z } from 'zod';
import { hasSourceLink, licenseSchema, linkSchema, previewImageSchema } from './common.js';

function buildThemeFields<ImageSchema extends z.ZodType>(imageSchema: ImageSchema) {
    return z.object({
        name: z.string(),
        previewImages: z.array(previewImageSchema(imageSchema)).min(1),

        developerName: z.string(),
        developerGithub: z.string().optional(),

        dateAdded: z.coerce.date(),
        dateCreated: z.coerce.date().optional(),
        submittedBy: z.string(),

        openSource: z.boolean(),
        license: licenseSchema.optional(),
        shortDescription: z.string().max(250),
        // Synthesized by the content loader from index.md
        description: z.string(),

        official: z.boolean().default(false),
        beta: z.boolean().default(false),
        abandoned: z.boolean().default(false),
        ignoreAbandonedCheck: z.boolean().default(false),

        links: z.array(linkSchema).default([]),
        installationLink: linkSchema.optional(),
        // Can be written inline in meta.yaml, or as an install.md file
        installationInstructions: z.string().optional(),
        // Synthesized by the content loader from installationInstructions
        installationInstructionsHtml: z.string().default(''),

        aiUsed: z.boolean().default(false),
        aiDisclaimer: z.string().optional(),
    });
}

export function buildThemeSchema<ImageSchema extends z.ZodType>(imageSchema: ImageSchema) {
    return buildThemeFields(imageSchema).superRefine((data, ctx) => {
        if (data.openSource && !hasSourceLink(data.links)) {
            ctx.addIssue({
                code: 'custom',
                path: ['links'],
                message:
                    'openSource is true but no link has sourcelink true (add a link with sourcelink: true, or set the type to github/gitlab/bitbucket/sourcehut/codeberg)',
            });
        }

        if (data.aiDisclaimer && !data.aiUsed) {
            ctx.addIssue({
                code: 'custom',
                path: ['aiDisclaimer'],
                message: 'aiDisclaimer set but aiUsed is false',
            });
        }
    });
}

/** Plain-string image variant, for use outside Astro. */
export const themeSchema = buildThemeSchema(z.string());

export type Theme = z.infer<typeof themeSchema>;

export const themeMetaSchema = buildThemeFields(z.string()).omit({
    description: true,
    installationInstructionsHtml: true,
});

export const IMMUTABLE_THEME_FIELDS = ['dateAdded', 'dateCreated', 'submittedBy'] as const;
