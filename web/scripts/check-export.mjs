/**
 * Проверяет, что каждый URL из sitemap.xml существует в out/ как файл.
 * Карта, ведущая на 404, Search Console засчитывает как ошибку — дешевле
 * поймать это в CI, чем через неделю в отчёте «Страницы».
 */
import { readFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'out');
const xml = await readFile(join(out, 'sitemap.xml'), 'utf8');
const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

if (locs.length === 0) {
  console.error('sitemap.xml пуст — сборка явно не та');
  process.exit(1);
}

const missing = [];
for (const url of locs) {
  const path = new URL(url).pathname.replace(/^\/|\/$/g, '');
  const file = path ? join(out, path, 'index.html') : join(out, 'index.html');
  try {
    await access(file);
  } catch {
    missing.push(url);
  }
}

if (missing.length) {
  console.error(`в sitemap ${missing.length} URL без файла:`);
  for (const m of missing) console.error('  ' + m);
  process.exit(1);
}

console.log(`sitemap: ${locs.length} URL, все существуют`);
