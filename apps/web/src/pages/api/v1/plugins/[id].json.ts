import type { APIRoute, GetStaticPaths } from 'astro';
import type { CollectionEntry } from 'astro:content';
import { getCollection } from 'astro:content';
import { serializePlugin } from '@/lib/api-serialize';

export const getStaticPaths = (async () => {
    const entries = await getCollection('plugins');
    return entries.map((entry) => ({
        params: { id: entry.id },
        props: { entry },
    }));
}) satisfies GetStaticPaths;

interface Props {
    entry: CollectionEntry<'plugins'>;
}

export const GET: APIRoute<Props> = async ({ props }) => {
    const data = await serializePlugin(props.entry);
    return new Response(JSON.stringify(data, null, 2), {
        headers: { 'Content-Type': 'application/json' },
    });
};
