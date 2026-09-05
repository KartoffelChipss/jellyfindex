import z from 'zod';

const AI_USAGE_OPTIONS = ['unknown', 'none', 'ai-assisted', 'vibe-coded'] as const;

export type AiUsage = (typeof AI_USAGE_OPTIONS)[number];

export const aiUsageSchema = z.enum(AI_USAGE_OPTIONS);
