import type { APIRoute, GetStaticPaths } from 'astro';
import type { CollectionEntry } from 'astro:content';
import { getCollection } from 'astro:content';
import { serializeClient } from '@/lib/api-serialize';

export const getStaticPaths = (async () => {
    const entries = await getCollection('clients');
    return entries.map((entry) => ({
        params: { id: entry.id },
        props: { entry },
    }));
}) satisfies GetStaticPaths;

interface Props {
    entry: CollectionEntry<'clients'>;
}

export const GET: APIRoute<Props> = async ({ props }) => {
    const data = await serializeClient(props.entry);
    return new Response(JSON.stringify(data, null, 2), {
        headers: { 'Content-Type': 'application/json' },
    });
};
