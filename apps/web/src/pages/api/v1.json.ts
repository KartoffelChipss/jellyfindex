import type { APIRoute } from 'astro';

const SITE_URL = 'https://jellyfindex.com';

export const GET: APIRoute = async () => {
    return new Response(
        JSON.stringify(
            {
                version: 1,
                description: 'Read-only JSON API for the jellyfindex directory.',
                fairUse:
                    'Build tools, bots, and integrations with this. Please do not use it to launch a competing directory site with the same concept and dataset — see /api for details.',
                endpoints: {
                    clients: `${SITE_URL}/api/v1/clients.json`,
                    client: `${SITE_URL}/api/v1/clients/:id.json`,
                    plugins: `${SITE_URL}/api/v1/plugins.json`,
                    plugin: `${SITE_URL}/api/v1/plugins/:id.json`,
                    themes: `${SITE_URL}/api/v1/themes.json`,
                    theme: `${SITE_URL}/api/v1/themes/:id.json`,
                },
                docs: `${SITE_URL}/api`,
            },
            null,
            2
        ),
        { headers: { 'Content-Type': 'application/json' } }
    );
};
