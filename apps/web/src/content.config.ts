import { defineCollection } from 'astro:content';
import { buildClientSchema, buildPluginSchema, buildThemeSchema } from '@jellyfindex/schema';
import { clientsLoader } from './content/loaders/clients.js';
import { pluginsLoader } from './content/loaders/plugins.js';
import { themesLoader } from './content/loaders/themes.js';

const clients = defineCollection({
    loader: clientsLoader(),
    schema: ({ image }) => buildClientSchema(image()),
});

const plugins = defineCollection({
    loader: pluginsLoader(),
    schema: ({ image }) => buildPluginSchema(image()),
});

const themes = defineCollection({
    loader: themesLoader(),
    schema: ({ image }) => buildThemeSchema(image()),
});

export const collections = { clients, plugins, themes };
