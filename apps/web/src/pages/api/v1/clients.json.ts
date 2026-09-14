import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { serializeClient } from '@/lib/api-serialize';

export const GET: APIRoute = async () => {
    const entries = await getCollection('clients');
    const clients = await Promise.all(entries.map(serializeClient));

    return new Response(
        JSON.stringify(
            { generatedAt: new Date().toISOString(), count: clients.length, clients },
            null,
            2
        ),
        { headers: { 'Content-Type': 'application/json' } }
    );
};
