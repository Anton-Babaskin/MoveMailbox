export function PopularRoutes() {
  return (
    <>
      <section className="shell">
        <div className="head-wide">
          <p className="eyebrow">Популярные направления</p>
          <h2>Понятные инструкции <span className="ital">для частых переездов.</span></h2>
          <p className="lede" style={{ marginTop: '16px' }}>Выберите готовый маршрут — «перенести из … в …» — или подключите любые два совместимых IMAP-сервера вручную.</p>
        </div>
        <div className="rgrid">
          <a className="rt" href="/routes/" aria-label="Перенести почту из Gmail в Outlook"><span>Gmail</span><svg className="a"><use href="#ar" /></svg><span>Outlook</span><span className="go">Гайд</span></a>
          <a className="rt" href="/routes/" aria-label="Перенести почту из Outlook в Gmail"><span>Outlook</span><svg className="a"><use href="#ar" /></svg><span>Gmail</span><span className="go">Гайд</span></a>
          <a className="rt" href="/routes/" aria-label="Перенести почту из Yahoo Mail в Gmail"><span>Yahoo Mail</span><svg className="a"><use href="#ar" /></svg><span>Gmail</span><span className="go">Гайд</span></a>
          <a className="rt" href="/routes/" aria-label="Перенести почту из iCloud Mail в Gmail"><span>iCloud Mail</span><svg className="a"><use href="#ar" /></svg><span>Gmail</span><span className="go">Гайд</span></a>
          <a className="rt" href="/routes/" aria-label="Перенести почту из cPanel в Microsoft 365"><span>cPanel</span><svg className="a"><use href="#ar" /></svg><span>Microsoft 365</span><span className="go">Гайд</span></a>
          <a className="rt" href="/routes/" aria-label="Перенести почту из Яндекс в Zoho"><span>Яндекс</span><svg className="a"><use href="#ar" /></svg><span>Zoho</span><span className="go">Гайд</span></a>
          <a className="rt" href="/routes/" aria-label="Перенести почту из Старый хостинг в Новый хостинг"><span>Старый хостинг</span><svg className="a"><use href="#ar" /></svg><span>Новый хостинг</span><span className="go">Гайд</span></a>
          <a className="rt" href="#workspace"><span>Любой</span><svg className="a"><use href="#ar" /></svg><span>Любой</span><span className="go">Вручную</span></a>
        </div>
      </section>
    </>
  );
}
