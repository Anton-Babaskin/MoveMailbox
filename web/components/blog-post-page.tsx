import type { Metadata } from 'next';
import { JsonLd } from '@/components/json-ld';
import { FinalCta } from '@/components/sections/final-cta';
import {
  blogPosts,
  findPost,
  readingMinutes,
  type BlogBlock,
} from '@/data/blog-posts';
import { blogPost, dateLocale } from '@/content/blog-post';
import { blogPostingLd, breadcrumbLd, buildMetadata, faqLd } from '@/lib/seo';
import { href, type Lang } from '@/i18n/config';

export function blogPostMetadata(lang: Lang, slug: string): Metadata {
  const post = findPost(slug);
  if (!post) return {};
  const copy = post[lang];
  return buildMetadata({
    language: lang,
    path: `/blog/${slug}`,
    title: copy.title,
    description: copy.description,
  });
}

/** Один блок статьи: заголовок, абзацы и, по месту, список или пример. */
function Block({ block }: { block: BlogBlock }) {
  return (
    <section className="shell">
      <div className="head-wide">
        <h2>{block.h2}</h2>
      </div>
      <div className="post-body">
        {block.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      {block.sample && (
        <div className="error-sample">
          <span>
            <svg>
              <use href="#tx" />
            </svg>
            {block.sample.caption}
          </span>
          <pre>
            <code>{block.sample.body}</code>
          </pre>
        </div>
      )}

      {block.bullets && (
        <ul className="error-causes">
          {block.bullets.map((item) => (
            <li key={item}>
              <svg>
                <use href="#al" />
              </svg>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}

      {block.steps && (
        <ol className="error-fixes">
          {block.steps.map((step) => (
            <li key={step}>
              <svg>
                <use href="#ck" />
              </svg>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function BlogPostPage({ lang, slug }: { lang: Lang; slug: string }) {
  const post = findPost(slug);
  if (!post) return null;
  const copy = post[lang];
  const t = blogPost[lang];
  const minutes = readingMinutes(copy);
  const published = new Intl.DateTimeFormat(dateLocale[lang], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(post.date));

  return (
    <main>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: t.home, path: href(lang, '/') },
            { name: t.blog, path: href(lang, '/blog') },
            { name: copy.h1, path: href(lang, `/blog/${slug}`) },
          ]),
          blogPostingLd({
            headline: copy.h1,
            description: copy.description,
            path: href(lang, `/blog/${slug}`),
            datePublished: post.date,
            section: copy.tag,
          }),
          faqLd(copy.faq),
        ]}
      />

      <section className="shell">
        <div className="head-wide">
          <p className="eyebrow">{copy.tag}</p>
          <h1>{copy.h1}</h1>
          <p className="post-meta">
            <time dateTime={post.date}>{published}</time>
            <span>·</span>
            <span>
              {minutes} {t.minutes}
            </span>
          </p>
          <p className="lede" style={{ marginTop: '18px' }}>
            {copy.lede}
          </p>
        </div>
      </section>

      {copy.blocks.map((block) => (
        <Block key={block.h2} block={block} />
      ))}

      {copy.faq.length > 0 && (
        <section className="shell">
          <div className="head-wide">
            <p className="eyebrow">{t.faqEyebrow}</p>
            <h2>{t.faqTitle}</h2>
          </div>
          <div className="faq">
            <div>
              {copy.faq
                .filter((_, i) => i % 2 === 0)
                .map(([question, answer], i) => (
                  <details key={question} open={i === 0}>
                    <summary>
                      {question}
                      <span className="pm" />
                    </summary>
                    <p>{answer}</p>
                  </details>
                ))}
            </div>
            <div>
              {copy.faq
                .filter((_, i) => i % 2 === 1)
                .map(([question, answer]) => (
                  <details key={question}>
                    <summary>
                      {question}
                      <span className="pm" />
                    </summary>
                    <p>{answer}</p>
                  </details>
                ))}
            </div>
          </div>
        </section>
      )}

      <section className="shell">
        <div className="head-wide">
          <h2>{t.linksTitle}</h2>
        </div>
        <div className="route-links">
          {copy.links.map((link) => (
            <a key={link.path} className="brief-link" href={href(lang, link.path)}>
              {link.label}
              <svg>
                <use href="#ar" />
              </svg>
            </a>
          ))}
        </div>
        <p style={{ marginTop: '24px' }}>
          <a className="brief-link" href={`${href(lang, '/')}#workspace`}>
            {t.cta}
            <svg>
              <use href="#ar" />
            </svg>
          </a>
        </p>
      </section>

      <section className="shell">
        <div className="head-wide">
          <h2>{t.others}</h2>
        </div>
        <div className="bgrid">
          {blogPosts
            .filter((other) => other.slug !== slug)
            .slice(0, 3)
            .map((other) => (
              <a
                key={other.slug}
                className="post"
                href={href(lang, `/blog/${other.slug}`)}
              >
                <div className="cover">
                  <svg className="gl">
                    <use href={`#${other.icon}`} />
                  </svg>
                </div>
                <div className="body">
                  <div className="meta">
                    <span className="tg">{other[lang].tag}</span>
                    <span>
                      {readingMinutes(other[lang])} {t.minutes}
                    </span>
                  </div>
                  <h3>{other[lang].h1}</h3>
                  <p>{other[lang].card}</p>
                </div>
              </a>
            ))}
        </div>
      </section>

      <FinalCta lang={lang} />
    </main>
  );
}
