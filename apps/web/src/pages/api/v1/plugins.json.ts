import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { serializePlugin } from '@/lib/api-serialize';

export const GET: APIRoute = async () => {
    const entries = await getCollection('plugins');
    const plugins = await Promise.all(entries.map(serializePlugin));

    return new Response(
        JSON.stringify(
            { generatedAt: new Date().toISOString(), count: plugins.length, plugins },
            null,
            2
        ),
        { headers: { 'Content-Type': 'application/json' } }
    );
};
