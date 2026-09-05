import { defineCollection } from 'astro:content';
import { buildClientSchema, buildPluginSchema } from '@jellyfindex/schema';
import { clientsLoader } from './content/loaders/clients.js';
import { pluginsLoader } from './content/loaders/plugins.js';

const clients = defineCollection({
    loader: clientsLoader(),
    schema: ({ image }) => buildClientSchema(image()),
});

const plugins = defineCollection({
    loader: pluginsLoader(),
    schema: ({ image }) => buildPluginSchema(image()),
});

export const collections = { clients, plugins };
