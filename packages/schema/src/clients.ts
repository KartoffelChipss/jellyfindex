import { z } from 'zod';
import { ALL_PLATFORMS } from './platforms.js';
import { FEATURE_FLAG_IDS, FEATURE_FLAG_MAP } from './features.js';
import { hasSourceLink, licenseSchema, linkSchema, previewImageSchema } from './common.js';
import { aiUsageSchema } from './ai-usage.js';

const platformEnum = z.enum(ALL_PLATFORMS as [string, ...string[]]);

function buildClientFields<ImageSchema extends z.ZodType>(imageSchema: ImageSchema) {
    return z.object({
        name: z.string(),
        logo: imageSchema,
        banner: imageSchema.optional(),
        previewImages: z
            .array(previewImageSchema(imageSchema, { platform: platformEnum.optional() }))
            .default([]),

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

        platforms: z.array(platformEnum).min(1),
        mainPlatform: platformEnum.optional(),

        official: z.boolean().default(false),
        beta: z.boolean().default(false),
        abandoned: z.boolean().default(false),
        ignoreAbandonedCheck: z.boolean().default(false),
        pricing: z.enum(['free', 'subscription', 'one-time-purchase']).default('free'),
        music: z.enum(['none', 'supported', 'main']).default('none'),

        links: z.array(linkSchema).default([]),
        installationLink: linkSchema.optional(),
        installationInstructions: z.partialRecord(platformEnum, z.string()).optional(),
        installationInstructionsHtml: z.partialRecord(platformEnum, z.string()).default({}),

        features: z.partialRecord(z.enum(FEATURE_FLAG_IDS), z.boolean()).default({}),

        relatedPlugins: z.array(z.string()).default([]),

        aiUsage: aiUsageSchema.default('unknown'),
        aiDescription: z.string().optional(),
    });
}

export function buildClientSchema<ImageSchema extends z.ZodType>(imageSchema: ImageSchema) {
    return buildClientFields(imageSchema).superRefine((data, ctx) => {
        if (data.mainPlatform && !data.platforms.includes(data.mainPlatform)) {
            ctx.addIssue({
                code: 'custom',
                path: ['mainPlatform'],
                message: `mainPlatform "${data.mainPlatform}" is not in platforms list`,
            });
        }

        if (data.openSource) {
            if (!hasSourceLink(data.links)) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['links'],
                    message:
                        'openSource is true but no link has sourcelink true (add a link with sourcelink: true, or set the type to github/gitlab/bitbucket/sourcehut/codeberg)',
                });
            }
        }

        for (const flagId of Object.keys(data.features)) {
            const def = FEATURE_FLAG_MAP.get(flagId);
            if (!def) continue;
            if (def.platforms && def.platforms.length > 0) {
                const overlaps = def.platforms.some((p) => data.platforms.includes(p));
                if (!overlaps) {
                    ctx.addIssue({
                        code: 'custom',
                        path: ['features', flagId],
                        message: `Feature "${flagId}" only applies to [${def.platforms.join(', ')}], but client doesn't support any of those platforms`,
                    });
                }
            }
        }

        if (data.installationInstructions) {
            for (const p of Object.keys(data.installationInstructions)) {
                if (!data.platforms.includes(p as (typeof data.platforms)[number])) {
                    ctx.addIssue({
                        code: 'custom',
                        path: ['installationInstructions', p],
                        message: `installationInstructions has a key "${p}" not in platforms`,
                    });
                }
            }
        }

        data.previewImages.forEach((entry, index) => {
            const platform = (entry as { platform?: (typeof data.platforms)[number] } | null)
                ?.platform;
            if (platform && !data.platforms.includes(platform)) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['previewImages', index, 'platform'],
                    message: `previewImages platform "${platform}" is not in platforms list`,
                });
            }
        });
    });
}

/** Plain-string image variant, for use outside Astro. */
export const clientSchema = buildClientSchema(z.string());

export type Client = z.infer<typeof clientSchema>;

/**
 * The fields a contributor actually writes in meta.yaml
 */
export const clientMetaSchema = buildClientFields(z.string()).omit({
    description: true,
    installationInstructionsHtml: true,
});

export const IMMUTABLE_CLIENT_FIELDS = ['dateAdded', 'dateCreated', 'submittedBy'] as const;
