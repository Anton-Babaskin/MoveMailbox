import { blog } from '@/content/sections/blog';
import { blogPosts, readingMinutes } from '@/data/blog-posts';
import { blogPost } from '@/content/blog-post';
import { href, type Lang } from '@/i18n/config';

export function Blog({ lang, pageTitle = false }: { lang: Lang; pageTitle?: boolean }) {
  const t = blog[lang];
  const labels = blogPost[lang];
  const Heading = pageTitle ? 'h1' : 'h2';

  return (
    <>
      <section className="shell" id="blog">
        <div className="head-wide">
          <p className="eyebrow">{t.eyebrow}</p>
          <Heading style={{ fontSize: 'clamp(1.75rem,3.4vw,2.75rem)' }}>
            {t.h2a}
            <span className="ital">{t.h2b}</span>
          </Heading>
          <p className="lede" style={{ marginTop: '16px' }}>
            {t.lede}
          </p>
        </div>
        <div className="bgrid">
          {blogPosts.map((post) => {
            const copy = post[lang];
            return (
              <a
                key={post.slug}
                className="post"
                href={href(lang, `/blog/${post.slug}`)}
              >
                <div className="cover">
                  <svg className="gl">
                    <use href={`#${post.icon}`} />
                  </svg>
                </div>
                <div className="body">
                  <div className="meta">
                    <span className="tg">{copy.tag}</span>
                    <span>
                      {readingMinutes(copy)} {labels.minutes}
                    </span>
                  </div>
                  <h3>{copy.h1}</h3>
                  <p>{copy.card}</p>
                  <span className="rd">
                    {t.read}
                    <svg>
                      <use href="#ar" />
                    </svg>
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      </section>
    </>
  );
}
