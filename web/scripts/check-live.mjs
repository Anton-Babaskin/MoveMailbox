import assert from 'node:assert/strict';

// Read-only check of the public deployment. Uses ordinary DNS and verified TLS.
// Intentionally separate from build checks: a PR is not deployed yet.
const origin = 'https://movemailbox.com';
const links = new Set();
const pages = new Map();
const titles = new Set();
const descriptions = new Set();

async function request(url, status = 200, method = 'GET') {
  const response = await fetch(url, {
    method, redirect: 'manual', signal: AbortSignal.timeout(20000),
    headers: { 'User-Agent': 'MoveMailbox-deployment-check/1.0' },
  });
  assert.equal(response.status, status, `${method} ${url}: expected ${status}, received ${response.status}`);
  return response;
}

function metadata(html, name) {
  return html.match(new RegExp(`<meta name="${name}" content="([^"]*)"`))?.[1];
}

for (const path of ['/', '/security/']) {
  for (const base of ['http://movemailbox.com', 'https://www.movemailbox.com', 'http://www.movemailbox.com']) {
    const response = await request(base + path, 301, 'HEAD');
    const target = new URL(response.headers.get('location'), base);
    // www over HTTP may first upgrade HTTPS before dropping www.
    if (target.href === 'https://www.movemailbox.com' + path) {
      const next = await request(target, 301, 'HEAD');
      assert.equal(next.headers.get('location'), origin + path);
    } else {
      assert.equal(target.href, origin + path, 'Redirect lost canonical host or path');
    }
  }
}

const robots = await (await request(origin + '/robots.txt')).text();
assert(robots.includes('Sitemap: ' + origin + '/sitemap.xml'), 'Missing sitemap in robots.txt');
assert(!/^Disallow:\s*\/\s*$/mi.test(robots), 'robots.txt blocks the site');
const sitemap = await (await request(origin + '/sitemap.xml')).text();
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
assert(urls.length >= 20 && urls.length <= 200, 'Unexpected sitemap size');
assert.equal(new Set(urls).size, urls.length, 'Duplicate sitemap URLs');

for (const url of urls) {
  const parsed = new URL(url);
  assert(parsed.origin === origin && !parsed.search && !parsed.hash && parsed.pathname.endsWith('/'), 'Noncanonical sitemap URL: ' + url);
  const response = await request(url);
  assert(response.headers.get('content-type')?.includes('text/html'), 'Expected HTML: ' + url);
  assert(!/noindex|none/i.test(response.headers.get('x-robots-tag') ?? ''), 'Indexing blocked by header: ' + url);
  const html = await response.text();
  pages.set(url, html);
  const title = html.match(/<title>(.*?)<\/title>/s)?.[1];
  const description = metadata(html, 'description');
  assert(title && description, 'Missing metadata: ' + url);
  assert(!titles.has(title) && !descriptions.has(description), 'Duplicate metadata: ' + url);
  titles.add(title); descriptions.add(description);
  assert(html.includes(`rel="canonical" href="${url}"`), 'Canonical mismatch: ' + url);
  assert(!/noindex|none/i.test(metadata(html, 'robots') ?? ''), 'Noindex page in sitemap: ' + url);
  assert.equal([...html.matchAll(/<h1(?:\s|>)/g)].length, 1, 'Expected one h1: ' + url);
  for (const match of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) JSON.parse(match[1]);
  for (const [, value] of html.matchAll(/\b(?:href|src)="([^" ]+)"/g)) {
    const target = new URL(value.replaceAll('&amp;', '&'), url);
    if (target.origin === origin) {
      target.hash = '';
      links.add(target.href);
    }
  }
}

for (const path of ['privacy', 'terms', 'blog']) {
  const url = `${origin}/${path}/`;
  assert(!urls.includes(url), 'Draft in sitemap: ' + url);
  const html = await (await request(url)).text();
  assert(/noindex/i.test(metadata(html, 'robots') ?? ''), 'Draft missing noindex: ' + url);
  pages.set(url, html);
}
const home = pages.get(origin + '/');
assert(/<fieldset[^>]*disabled/.test(home), 'Preview credentials are not disabled');
assert(home.includes('Онлайн-перенос готовится к запуску'), 'Missing preview notice');
await request(origin + '/__movemailbox_missing_page_check__/', 404);
for (const url of links) {
  if (pages.has(url)) continue;
  if (pages.has(url + '/')) {
    const response = await request(url, 301, 'HEAD');
    assert.equal(new URL(response.headers.get('location'), url).href, url + '/', 'Unexpected internal redirect: ' + url);
  } else {
    await request(url, 200, 'HEAD');
  }
}
console.log(`PASS: verified HTTPS; HTTP/www redirects preserve paths; ${urls.length} sitemap pages; unique metadata, canonicals and JSON-LD; ${links.size} internal URLs; draft noindex; real 404; disabled preview credentials.`);
