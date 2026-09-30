/**
 * IndexNow: сообщает Bing, Яндексу и другим участникам протокола, какие
 * страницы появились или изменились в этой сборке.
 *
 * Google протокол не читает — ему по-прежнему хватает sitemap.xml. Но Bing
 * и Яндекс без подсказки обходят молодой домен неделями, а IndexNow даёт им
 * адрес сразу после выкладки.
 *
 * Как выбираются адреса. Скрипт запускается в CI после сборки, но ДО
 * выкладки: живой sitemap ещё старый. Сравниваем его с новым out/sitemap.xml
 * и отправляем только то, что отличается: новые адреса, адреса с другим
 * lastmod и исчезнувшие (по ним поисковик увидит 404 и уберёт страницу).
 * Если живого ключа ещё нет — это первая отправка, уходит вся карта.
 * Если живой sitemap недоступен — не отправляем ничего: лучше пропустить
 * одну выкладку, чем разослать всю карту по сетевой ошибке.
 *
 * Сам ключ не секрет: протокол требует выложить его файлом в корень сайта,
 * этим поисковик и проверяет, что запрос пришёл от владельца домена.
 *
 * Результат — одна строка JSON в $GITHUB_OUTPUT (payload=...) или пустое
 * значение, если отправлять нечего. Отправляет отдельный шаг после выкладки:
 * до неё новые адреса ещё отдают 404.
 */
import { appendFile, readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const origin = 'https://movemailbox.com';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const LIMIT = 10000; // потолок протокола на один запрос

function parse(xml) {
  const map = new Map();
  for (const [, block] of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1];
    if (loc) map.set(loc, block.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1] ?? '');
  }
  return map;
}

async function live(path) {
  const response = await fetch(origin + path, {
    signal: AbortSignal.timeout(20000),
    headers: { 'User-Agent': 'MoveMailbox-indexnow/1.0' },
  });
  return response;
}

async function output(value) {
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `payload=${value}\n`);
}

const keys = (await readdir(join(root, 'public'))).filter((f) => /^[a-f0-9]{32}\.txt$/.test(f));
if (keys.length !== 1) {
  console.error(`indexnow: в public/ должен лежать ровно один файл ключа, найдено ${keys.length}`);
  process.exit(1);
}
const key = keys[0].slice(0, -4);

const next = parse(await readFile(join(root, 'out', 'sitemap.xml'), 'utf8'));

let urls;
try {
  const keyResponse = await live(`/${key}.txt`);
  const firstRun = keyResponse.status === 404;
  if (firstRun) {
    urls = [...next.keys()];
    console.log(`indexnow: ключа на сайте ещё нет — первая отправка, вся карта (${urls.length})`);
  } else {
    const sitemap = await live('/sitemap.xml');
    if (!sitemap.ok) throw new Error(`sitemap.xml: ${sitemap.status}`);
    const prev = parse(await sitemap.text());
    const changed = [...next].filter(([loc, mod]) => prev.get(loc) !== mod).map(([loc]) => loc);
    const removed = [...prev.keys()].filter((loc) => !next.has(loc));
    urls = [...changed, ...removed];
    console.log(`indexnow: новых или изменённых ${changed.length}, удалённых ${removed.length}`);
  }
} catch (error) {
  console.log(`indexnow: живая версия недоступна (${error.message}) — пропускаем отправку`);
  await output('');
  process.exit(0);
}

if (urls.length === 0) {
  await output('');
  process.exit(0);
}

const payload = {
  host: new URL(origin).host,
  key,
  keyLocation: `${origin}/${key}.txt`,
  urlList: urls.slice(0, LIMIT),
};
await output(JSON.stringify(payload));
for (const url of payload.urlList) console.log('  ' + url);
