/**
 * Кладёт результат экспорта в internal/web/out — туда, где его видит go:embed.
 * Отдельным скриптом, а не `rm -rf && cp`, потому что на Windows этих команд нет.
 */
import { cp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const from = resolve(here, '..', 'out');
const to = resolve(here, '..', '..', 'internal', 'web', 'out');

await rm(to, { recursive: true, force: true });
await cp(from, to, { recursive: true });
console.log(`сайт скопирован в ${to}`);
