import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer>
      <div className="shell fgrid">
        <Link className="logo" href="/" style={{ fontSize: '.98rem' }}>
          <span className="mark" style={{ width: 28, height: 28, borderRadius: 8 }}>
            <svg style={{ width: 20, height: 20 }}>
              <use href="#ml" />
            </svg>
          </span>
          <span className="wordmark">
            <b>Move</b>Mailbox
          </span>
        </Link>
        <span>Онлайн до 5 ГБ бесплатно. Настольный клиент без облачного лимита.</span>
        <nav>
          <Link href="/privacy/">Конфиденциальность</Link>
          <Link href="/terms/">Условия</Link>
          <Link href="/security/">Безопасность</Link>
          <Link href="/docs/errors/">Ошибки IMAP</Link>
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
        © {new Date().getFullYear()} MoveMailbox · на базе imapsync (NLPL)
      </div>
    </footer>
  );
}
