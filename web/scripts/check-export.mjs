import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import assert from 'node:assert/strict';

const root = resolve('out');
const origin = 'https://movemailbox.com';
const read = p => readFileSync(join(root, p), 'utf8');
const sitemap = read('sitemap.xml');
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
assert(urls.length >= 20, 'Unexpectedly small sitemap');
assert.equal(new Set(urls).size, urls.length, 'Duplicate sitemap URLs');
const titles = new Set();
const descriptions = new Set();
for (const url of urls) {
  assert(url.startsWith(origin + '/') && url.endsWith('/'), 'Noncanonical sitemap URL: ' + url);
  const path = new URL(url).pathname;
  const html = read(path.slice(1) + 'index.html');
  const title = html.match(/<title>(.*?)<\/title>/s)?.[1];
  const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
  assert(title && description, 'Missing metadata: ' + url);
  assert(!titles.has(title), 'Duplicate title: ' + title);
  assert(!descriptions.has(description), 'Duplicate description: ' + url);
  titles.add(title); descriptions.add(description);
  assert(html.includes(`rel="canonical" href="${url}"`), 'Canonical mismatch: ' + url);
  assert(!/hreflang="(?:en|uk)"/i.test(html), 'Nonexistent locale: ' + url);
  assert(!/name="robots" content="[^"]*noindex/.test(html), 'Noindex URL in sitemap: ' + url);
  assert.equal([...html.matchAll(/<h1(?:\s|>)/g)].length, 1, 'Expected one h1: ' + url);
  for (const match of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) JSON.parse(match[1]);
}
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]);
}
let checkedLinks = 0;
for (const file of walk(root).filter(f => f.endsWith('.html') && !f.endsWith('404.html') && !f.includes(join('404', 'index.html')))) {
  const html = readFileSync(file, 'utf8');
  for (const [, attr, value] of html.matchAll(/\b(href|src)="(\/[^" ]*)"/g)) {
    if (value.startsWith('//')) continue;
    const url = new URL(value.replaceAll('&amp;', '&'), origin);
    const path = decodeURIComponent(url.pathname).slice(1);
    const target = join(root, path.endsWith('/') || !path ? path + 'index.html' : path);
    assert(existsSync(target), `Broken ${attr} ${value} in ${file}`);
    if (url.hash && target.endsWith('.html')) {
      assert(readFileSync(target, 'utf8').includes(`id="${url.hash.slice(1)}"`), `Missing anchor ${value} in ${file}`);
    }
    checkedLinks++;
  }
}
for (const path of ['privacy', 'terms', 'blog']) {
  assert(/name="robots" content="[^"]*noindex/.test(read(path + '/index.html')), 'Draft must be noindex');
  assert(!urls.includes(origin + '/' + path + '/'), 'Draft in sitemap');
}
const home = read('index.html');
assert(/<fieldset[^>]*disabled/.test(home), 'Public credentials must be disabled in server-rendered HTML');
assert(home.includes('Онлайн-перенос готовится к запуску'), 'Missing preview notice');
assert(!/\{\{[^}]+\}\}/.test(home), 'Unfilled home placeholder');
assert.equal(read('CNAME').trim(), 'movemailbox.com');
assert(read('robots.txt').includes(origin + '/sitemap.xml'));
assert(existsSync(join(root, '.nojekyll')));
console.log(`PASS: ${urls.length} indexable pages; unique metadata, canonical/sitemap, JSON-LD, ${checkedLinks} local links/assets, draft noindex and disabled credentials.`);
