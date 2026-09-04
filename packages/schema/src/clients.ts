import { z } from 'zod';
import { ALL_PLATFORMS } from './platforms.js';
import { FEATURE_FLAG_IDS, FEATURE_FLAG_MAP } from './features.js';
import { LINK_TYPES } from './links.js';

const platformEnum = z.enum(ALL_PLATFORMS as [string, ...string[]]);

export const linkSchema = z.object({
    type: z.enum(Object.keys(LINK_TYPES) as [string, ...string[]]),
    url: z.url(),
    sourcelink: z.boolean().optional(),
});

function buildClientFields<ImageSchema extends z.ZodType>(imageSchema: ImageSchema) {
    return z.object({
        name: z.string(),
        logo: imageSchema,
        banner: imageSchema.optional(),
        previewImages: z.array(imageSchema).default([]),

        developerName: z.string(),
        developerGithub: z.string().optional(),

        dateAdded: z.coerce.date(),
        submittedBy: z.string(),

        openSource: z.boolean(),
        shortDescription: z.string().max(250),
        // Synthesized by the content loader from index.md
        description: z.string(),

        platforms: z.array(platformEnum).min(1),
        mainPlatform: platformEnum.optional(),

        official: z.boolean().default(false),
        music: z.enum(['none', 'supported', 'main']).default('none'),

        links: z.array(linkSchema).default([]),
        installationLink: linkSchema.optional(),
        installationInstructions: z.partialRecord(platformEnum, z.string()).optional(),
        installationInstructionsHtml: z.partialRecord(platformEnum, z.string()).default({}),

        features: z.partialRecord(z.enum(FEATURE_FLAG_IDS), z.boolean()).default({}),

        aiUsed: z.boolean().default(false),
        aiDisclaimer: z.string().optional(),
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
            const hasSource = data.links.some(
                (l) =>
                    l.sourcelink ?? LINK_TYPES[l.type as keyof typeof LINK_TYPES].defaultSourceLink
            );
            if (!hasSource) {
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
export const clientSchema = buildClientSchema(z.string());

export type Client = z.infer<typeof clientSchema>;

/**
 * The fields a contributor actually writes in meta.yaml
 */
export const clientMetaSchema = buildClientFields(z.string()).omit({
    description: true,
    installationInstructionsHtml: true,
});

export const IMMUTABLE_CLIENT_FIELDS = ['dateAdded', 'submittedBy'] as const;
