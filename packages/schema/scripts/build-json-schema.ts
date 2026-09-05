import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { clientMetaSchema } from '../src/clients.js';
import { pluginMetaSchema } from '../src/plugins.js';
import { themeMetaSchema } from '../src/themes.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '../schemas');

const SCHEMAS: { fileName: string; id: string; title: string; schema: z.ZodType }[] = [
    {
        fileName: 'client.schema.json',
        id: 'https://jellyfindex.com/schemas/client.schema.json',
        title: 'Jellyfindex client meta.yaml',
        schema: clientMetaSchema,
    },
    {
        fileName: 'plugin.schema.json',
        id: 'https://jellyfindex.com/schemas/plugin.schema.json',
        title: 'Jellyfindex plugin meta.yaml',
        schema: pluginMetaSchema,
    },
    {
        fileName: 'theme.schema.json',
        id: 'https://jellyfindex.com/schemas/theme.schema.json',
        title: 'Jellyfindex theme meta.yaml',
        schema: themeMetaSchema,
    },
];

mkdirSync(outDir, { recursive: true });

for (const { fileName, id, title, schema } of SCHEMAS) {
    const jsonSchema = z.toJSONSchema(schema, { unrepresentable: 'any', io: 'input' }) as {
        properties: Record<string, Record<string, unknown>>;
        [key: string]: unknown;
    };
    jsonSchema.properties.dateAdded = { type: 'string', format: 'date' };
    jsonSchema.$id = id;
    jsonSchema.title = title;

    const outFile = join(outDir, fileName);
    writeFileSync(outFile, `${JSON.stringify(jsonSchema, null, 2)}\n`);
    console.log(`Wrote ${outFile}`);
}
