import Link from 'next/link';
import { siteFooter } from '@/content/site-footer';
import { href, type Lang } from '@/i18n/config';

export function SiteFooter({ lang }: { lang: Lang }) {
  const t = siteFooter[lang];
  return (
    <footer>
      <div className="shell fgrid">
        <Link className="logo" href={href(lang, '/')} style={{ fontSize: '.98rem' }}>
          <span className="mark" style={{ width: 28, height: 28, borderRadius: 8 }}>
            <svg style={{ width: 20, height: 20 }}>
              <use href="#ml" />
            </svg>
          </span>
          <span className="wordmark">
            <b>Move</b>Mailbox
          </span>
        </Link>
        <span>{t.tagline}</span>
        <nav>
          <Link href={href(lang, '/privacy')}>{t.privacy}</Link>
          <Link href={href(lang, '/terms')}>{t.terms}</Link>
          <Link href={href(lang, '/security')}>{t.security}</Link>
          <Link href={href(lang, '/docs/errors')}>{t.errors}</Link>
          <a
            href="https://github.com/Anton-Babaskin/MoveMailbox"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </nav>
      </div>
      <div className="shell" style={{ marginTop: 16, fontSize: '.8rem' }}>
        © {new Date().getFullYear()} MoveMailbox · {t.credit}
      </div>
    </footer>
  );
}
