# MoveMailbox public website

Imported from the owner's Next.js archive. Design, CSS and framework retained.
This is a **static documentation/product preview**, not the hosted migration service.
No passwords, payment details or migration jobs are accepted by GitHub Pages.
The original API adapter is retained in lib/workspace.ts for a separate reviewed
backend integration; it is not imported by the public Workspace component.
Backend handlers, CSP, Docker and Proxmox are unchanged.

## Build and verify

Node 24.18.0, npm and network access for packages/build-time Google Fonts:

~~~sh
npm ci --ignore-scripts
npm run build
npm run check
~~~

Static files are in out/ and are not committed. Fonts are downloaded at build
and self-hosted; the published site needs no Node server. The export checker
verifies canonical URLs, unique titles/descriptions, sitemap routes, JSON-LD,
local assets/links, noindex drafts and disabled credentials in initial HTML.

## Publishing

The Website Pages workflow builds and checks the site, then deploys the artifact.
PRs only build/check. Initial publication is authorized from web/github-pages-seo;
after review/merge, remove that branch from the workflow and the Pages environment
allowlist. Main remains the long-term publishing branch. Backend PR #11 is separate.
GitHub Pages is for the static site only, not a SaaS runtime or payment checkout.

## Domain and HTTPS

Pages custom domain: movemailbox.com. Namecheap Advanced DNS, when Namecheap
hosts the authoritative DNS:

| Type | Host | Value |
| --- | --- | --- |
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | Anton-Babaskin.github.io |

Replace only conflicting web A/AAAA/ALIAS/URL Redirect records for @ and www.
Preserve MX, TXT (SPF/DKIM/DMARC), NS and other subdomains. Do not use the VM IP.
Do not add a wildcard. Export/screenshot old records before replacing them.
GitHub must finish DNS validation and issue its certificate before Enforce HTTPS
can be enabled. Check both apex and www redirects, certificate and deep routes.
Do not use IP/Host-header tests as proof that the public DNS/HTTPS path works.

Official instructions: [custom domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).
For takeover protection, verify the domain in the owner's GitHub Pages account
settings using the unique TXT record GitHub supplies; never invent that token.

## SEO and launch limits

- Russian only; no nonexistent EN/UK hreflang. Add translations, language links
  and reciprocal hreflang together in a later reviewed change.
- Real static HTML, directory URLs ending in /, matching canonical and sitemap.
  No hash router or universal 200 fallback for unknown paths.
- Sitemap excludes unfinished legal/blog pages, which have noindex, follow.
- No invented last-modified dates. Existing social card retained.
- No claim that indexing, rankings or FAQ rich results are guaranteed.
- After DNS and HTTPS work, verify ownership in Search Console and submit
  https://movemailbox.com/sitemap.xml. User supplies Google verification token.
- Full online-service legal terms/operator details, commercial entitlements,
  live backend contract verification and payment handling remain future work.
- License selection remains with the owner. Public source does not itself grant
  an open-source license; avoid advertising one before it is chosen.
