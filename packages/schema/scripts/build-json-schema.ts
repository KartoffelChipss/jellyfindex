import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { clientMetaSchema } from '../src/clients.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '../schemas');
const outFile = join(outDir, 'client.schema.json');

const jsonSchema = z.toJSONSchema(clientMetaSchema, { unrepresentable: 'any', io: 'input' }) as {
    properties: Record<string, Record<string, unknown>>;
    [key: string]: unknown;
};
jsonSchema.properties.dateAdded = { type: 'string', format: 'date' };
jsonSchema.$id = 'https://jellyfindex.com/schemas/client.schema.json';
jsonSchema.title = 'Jellyfindex client meta.yaml';

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, `${JSON.stringify(jsonSchema, null, 2)}\n`);
console.log(`Wrote ${outFile}`);
