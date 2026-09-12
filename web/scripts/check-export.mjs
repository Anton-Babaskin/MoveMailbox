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

/**
 * Незаполненные плейсхолдеры на индексируемой странице.
 *
 * Правовые страницы содержат {{...}} и держатся под noindex, пока владелец
 * не подставит реквизиты. Опасность не в них самих, а в шаге, когда noindex
 * снимут: {{ОПЕРАТОР}} в опубликованной политике хуже, чем её отсутствие.
 * Проверка привязана к sitemap: страница попала в карту — значит, заявлена
 * готовой, и скобок в ней быть не должно.
 */
const withPlaceholders = [];
for (const url of locs) {
  const path = new URL(url).pathname.replace(/^\/|\/$/g, '');
  const file = path ? join(out, path, 'index.html') : join(out, 'index.html');
  const html = await readFile(file, 'utf8');
  const found = html.match(/\{\{[^}]{1,80}\}\}/g);
  if (found) withPlaceholders.push(`${url} → ${[...new Set(found)].join(', ')}`);
}

if (withPlaceholders.length) {
  console.error(`в sitemap ${withPlaceholders.length} URL с незаполненными плейсхолдерами:`);
  for (const m of withPlaceholders) console.error('  ' + m);
  process.exit(1);
}

/**
 * Страница 404 должна быть одним нормальным документом.
 *
 * Корневого layout у проекта нет — их два, по одному на языковое дерево, —
 * и обычный not-found.tsx получал от Next собственную обёртку поверх нашей:
 * в файле оказывалось два тега <html>, браузер второй выбрасывал, React
 * падал с ошибкой гидратации. Лечится это global-not-found.tsx и флагом
 * experimental.globalNotFound. Флаг экспериментальный, поэтому инвариант
 * закреплён проверкой: если Next однажды снова начнёт оборачивать страницу,
 * сборка упадёт здесь, а не тихо на живом сайте.
 */
const notFound = await readFile(join(out, '404.html'), 'utf8');
const htmlTags = notFound.match(/<html[^>]*>/g) ?? [];
if (htmlTags.length !== 1) {
  console.error(`404.html: тегов <html> ${htmlTags.length}, ожидался ровно один: ${htmlTags.join(' ')}`);
  process.exit(1);
}
if (!/<html[^>]*\blang=/.test(htmlTags[0])) {
  console.error(`404.html: у <html> нет атрибута lang: ${htmlTags[0]}`);
  process.exit(1);
}

console.log(`sitemap: ${locs.length} URL, все существуют и без плейсхолдеров; 404.html целый`);
