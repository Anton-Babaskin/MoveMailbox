/**
 * Дописывает Content-Security-Policy в каждую страницу статического экспорта.
 *
 * Зачем отдельный шаг. Когда сайт отдаёт наш Go-сервер, политику ставит
 * securityHeaders в internal/api, а internal/web/static.go добавляет к ней
 * хэши инлайновых скриптов конкретной страницы. На GitHub Pages своих
 * заголовков поставить нельзя вообще: там раздаётся голая статика. Остаётся
 * <meta http-equiv>, и этот скрипт делает для экспорта ровно то же, что
 * static.go делает на лету.
 *
 * Что в meta работать не будет — и почему это не забыто, а принято:
 *   frame-ancestors, report-uri и sandbox браузер в <meta> игнорирует.
 *   Защиту от встраивания в чужой фрейм на GitHub Pages поставить нечем:
 *   нужен либо свой сервер, либо прокси перед доменом. То же и с HSTS.
 *
 * Хэши, а не 'unsafe-inline': Next кладёт на страницу несколько десятков
 * инлайновых скриптов гидратации, и они меняются от сборки к сборке —
 * поэтому хэши считаются здесь, по факту, из готового файла.
 */
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const OUT = new URL('../out/', import.meta.url).pathname;

/** Инлайновый тег — без src/href. Текст берём ровно как он лежит в файле:
 *  браузер считает хэш от тех же байт. */
const inlineRe = (tag) =>
  new RegExp(`<${tag}(?![^>]*\\b(?:src|href)=)[^>]*>([\\s\\S]*?)</${tag}>`, 'g');

function hashes(html, tag) {
  const set = new Set();
  for (const [, body] of html.matchAll(inlineRe(tag))) {
    if (!body) continue;
    set.add(`'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`);
  }
  return [...set];
}

/**
 * Политика повторяет securityHeaders из internal/api, чтобы в двух способах
 * раздачи сайта не разъехались правила.
 *
 * style-src-attr 'unsafe-inline' — вынужденно: на страницах есть style=""
 * у отдельных элементов. Это атрибуты, а не теги: выполнить через них код
 * нельзя, директива отделена от style-src намеренно.
 */
function policy(scriptHashes, styleHashes) {
  return [
    "default-src 'self'",
    `script-src 'self'${scriptHashes.map((h) => ' ' + h).join('')}`,
    `style-src 'self'${styleHashes.map((h) => ' ' + h).join('')}`,
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "base-uri 'none'",
    "form-action 'none'",
    "object-src 'none'",
  ].join('; ');
}

async function* pages(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* pages(path);
    else if (entry.name.endsWith('.html')) yield path;
  }
}

let count = 0;
for await (const path of pages(OUT)) {
  const html = await readFile(path, 'utf8');
  if (html.includes('http-equiv="Content-Security-Policy"')) continue;

  const content = policy(hashes(html, 'script'), hashes(html, 'style'));
  const meta = `<meta http-equiv="Content-Security-Policy" content="${content}"/>`;

  /* Ставим сразу после charset: он обязан попасть в первые 1024 байта,
     а политика — до первого скрипта, иначе она его уже не застанет. */
  const anchor = html.match(/<meta charSet="[^"]*"\/>/i);
  if (!anchor) {
    console.error(`add-csp: в ${relative(OUT, path)} нет <meta charSet> — не могу поставить политику`);
    process.exit(1);
  }
  const at = anchor.index + anchor[0].length;
  await writeFile(path, html.slice(0, at) + meta + html.slice(at));
  count += 1;
}

/* Ни одной страницы — значит экспорт не тот или регулярка перестала
   попадать: молча пропустить это нельзя, иначе сайт уедет без политики. */
if (count === 0) {
  console.error('add-csp: не найдено ни одной страницы в out/');
  process.exit(1);
}
console.log(`add-csp: политика проставлена на ${count} страницах`);
