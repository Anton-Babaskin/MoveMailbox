/**
 * Проверяет, что каждый URL из sitemap.xml существует в out/ как файл.
 * Карта, ведущая на 404, Search Console засчитывает как ошибку — дешевле
 * поймать это в CI, чем через неделю в отчёте «Страницы».
 */
import { readFile, access } from 'node:fs/promises';
import { existsSync } from 'node:fs';
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

/**
 * Фавиконка.
 *
 * Робот Яндекса ищет /favicon.ico по корню и без него пишет в диагностике
 * «Файл фавиконки не найден», даже когда SVG-иконка отдаётся и браузер её
 * показывает. Файл лежит в public/ и легко теряется при чистке, поэтому
 * инвариант закреплён здесь: и сам файл, и ссылка на него с главной.
 */
const icon = join(out, 'favicon.ico');
if (!existsSync(icon)) {
  console.error('нет out/favicon.ico: Яндекс сочтёт, что фавиконки у сайта нет');
  process.exit(1);
}
const home = await readFile(join(out, 'index.html'), 'utf8');
if (!home.includes('/favicon.ico')) {
  console.error('главная не ссылается на /favicon.ico');
  process.exit(1);
}

/**
 * robots.txt не должен закрывать то, что мы сами же отдали в карту сайта.
 *
 * Запреты там точечные: служебные выгрузки Next (__next.*.txt и index.txt
 * рядом с каждой страницей) съедают бюджет обхода, а страницами не являются.
 * Шаблон легко испортить одним символом — `/*.txt$` вместо `/*index.txt$`
 * закроет заодно llms.txt, а `/*_next` вместо `/*__next` унесёт скрипты и
 * стили, без которых робот не отрисует страницу. Поэтому здесь проверяется
 * и то, что ни один адрес из карты не попал под запрет, и то, что нужное
 * осталось открытым.
 */
const robots = await readFile(join(out, 'robots.txt'), 'utf8');
const disallow = robots
  .split('\n')
  .filter((line) => /^disallow:/i.test(line.trim()))
  .map((line) => line.split(':')[1].trim())
  .filter(Boolean);

const blockedBy = (path) =>
  disallow.find((rule) => {
    const anchored = rule.endsWith('$');
    const body = anchored ? rule.slice(0, -1) : rule;
    const source =
      '^' + body.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + (anchored ? '$' : '');
    return new RegExp(source).test(path);
  });

for (const loc of locs) {
  const path = new URL(loc).pathname;
  const rule = blockedBy(path);
  if (rule) {
    console.error(`robots.txt закрывает страницу из карты сайта: ${path} (правило ${rule})`);
    process.exit(1);
  }
}

for (const open of ['/llms.txt', '/favicon.ico', '/og.png', '/_next/static/chunks/a.js']) {
  const rule = blockedBy(open);
  if (rule) {
    console.error(`robots.txt закрывает нужный ресурс: ${open} (правило ${rule})`);
    process.exit(1);
  }
}

if (!blockedBy('/index.txt') || !blockedBy('/imap/gmx/__next._full.txt')) {
  console.error('robots.txt больше не закрывает служебные выгрузки Next — они съедят бюджет обхода');
  process.exit(1);
}

console.log(`sitemap: ${locs.length} URL, все существуют и без плейсхолдеров; 404.html целый; favicon.ico на месте; robots не задевает страницы и закрывает служебные выгрузки`);
