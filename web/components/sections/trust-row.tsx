export function TrustRow() {
  return (
    <>
      <div className="trust">
        <ul className="shell">
          <li><svg><use href="#ml" /></svg>IMAP → IMAP</li>
          <li><svg><use href="#ck" /></svg>Источник не удаляется</li>
          <li><svg><use href="#ck" /></svg>На базе imapsync</li>
          <li><svg><use href="#ck" /></svg>Бесплатно без регистрации</li>
        </ul>
      </div>
    </>
  );
}
