import { defineCollection } from 'astro:content';
import { buildClientSchema } from '@jellyfindex/schema';
import { clientsLoader } from './content/loaders/clients.js';

const clients = defineCollection({
    loader: clientsLoader(),
    schema: ({ image }) => buildClientSchema(image()),
});

export const collections = { clients };
