import { z } from 'zod';
import { ALL_PLUGIN_CATEGORIES } from './plugin-categories.js';
import { hasSourceLink, licenseSchema, linkSchema, previewImageSchema } from './common.js';
import { aiUsageSchema } from './ai-usage.js';

const categoryEnum = z.enum(ALL_PLUGIN_CATEGORIES as [string, ...string[]]);

function buildPluginFields<ImageSchema extends z.ZodType>(imageSchema: ImageSchema) {
    return z.object({
        name: z.string(),
        logo: imageSchema,
        banner: imageSchema.optional(),
        previewImages: z.array(previewImageSchema(imageSchema)).default([]),

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

        categories: z.array(categoryEnum).min(1),

        // Ids (directory slugs) of other plugin entries this plugin requires
        requires: z.array(z.string()).default([]),
        relatedClients: z.array(z.string()).default([]),

        official: z.boolean().default(false),
        beta: z.boolean().default(false),
        abandoned: z.boolean().default(false),
        ignoreAbandonedCheck: z.boolean().default(false),

        minimumJellyfinVersion: z.string().optional(),

        links: z.array(linkSchema).default([]),
        installationLink: linkSchema.optional(),
        // Can be written inline in meta.yaml, or as an install.md file
        installationInstructions: z.string().optional(),
        // Synthesized by the content loader from installationInstructions
        installationInstructionsHtml: z.string().default(''),

        aiUsage: aiUsageSchema.default('unknown'),
        aiDescription: z.string().optional(),
    });
}

export function buildPluginSchema<ImageSchema extends z.ZodType>(imageSchema: ImageSchema) {
    return buildPluginFields(imageSchema).superRefine((data, ctx) => {
        if (data.openSource && !hasSourceLink(data.links)) {
            ctx.addIssue({
                code: 'custom',
                path: ['links'],
                message:
                    'openSource is true but no link has sourcelink true (add a link with sourcelink: true, or set the type to github/gitlab/bitbucket/sourcehut/codeberg)',
            });
        }
    });
}

/** Plain-string image variant, for use outside Astro. */
export const pluginSchema = buildPluginSchema(z.string());

export type Plugin = z.infer<typeof pluginSchema>;

export const pluginMetaSchema = buildPluginFields(z.string()).omit({
    description: true,
    installationInstructionsHtml: true,
});

export const IMMUTABLE_PLUGIN_FIELDS = ['dateAdded', 'dateCreated', 'submittedBy'] as const;
