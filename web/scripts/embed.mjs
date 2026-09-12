/**
 * Кладёт результат экспорта в internal/web/out — туда, где его видит go:embed.
 * Отдельным скриптом, а не `rm -rf && cp`, потому что на Windows этих команд нет.
 */
import { cp, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const from = resolve(here, '..', 'out');
const to = resolve(here, '..', '..', 'internal', 'web', 'out');

// .gitkeep единственный файл каталога, который лежит в git: без хотя бы
// одного файла `go:embed all:out` не компилируется, и бекенд нельзя собрать,
// не поставив Node. Копирование каталога его затирает, поэтому кладём обратно.
const keep = resolve(to, '.gitkeep');
const keepContent = await readFile(keep, 'utf8').catch(() => '');

await rm(to, { recursive: true, force: true });
await cp(from, to, { recursive: true });
await writeFile(keep, keepContent);
console.log(`сайт скопирован в ${to}`);
