import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { serializeTheme } from '@/lib/api-serialize';

export const GET: APIRoute = async () => {
    const entries = await getCollection('themes');
    const themes = await Promise.all(entries.map(serializeTheme));

    return new Response(
        JSON.stringify(
            { generatedAt: new Date().toISOString(), count: themes.length, themes },
            null,
            2
        ),
        { headers: { 'Content-Type': 'application/json' } }
    );
};
