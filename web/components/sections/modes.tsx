export function Modes({ pageTitle = false }: { pageTitle?: boolean } = {}) {
  const Heading = pageTitle ? 'h1' : 'h2';
  return (
    <>
      <section className="shell" id="modes">
        <div className="head-wide">
          <p className="eyebrow">Один продукт · два способа переноса</p>
          <Heading style={{ fontSize: "clamp(1.75rem,3.4vw,2.75rem)" }}>Запустите в облаке или <span className="ital">заберите контроль себе.</span></Heading>
          <p className="lede" style={{ marginTop: '16px' }}>Онлайн-версия удобна для разового переноса и продолжает работу после закрытия браузера. Windows-клиент использует ресурсы вашего компьютера и не расходует облачный лимит.</p>
        </div>
        <div className="grid3">
          <article className="card lead">
            <div className="ctop"><span className="ico"><svg><use href="#cl" /></svg></span><span className="tagr hot">Облако</span></div>
            <h3 className="big">Перенос онлайн</h3>
            <p className="t">Ничего устанавливать не нужно. Подключите два ящика, узнайте объём и оставьте задачу нашему серверу.</p>
            <ul className="ticks">
              <li><svg><use href="#ck" /></svg>Один полный ящик до 5 ГБ бесплатно</li>
              <li><svg><use href="#ck" /></svg>Без аккаунта и регистрации MoveMailbox</li>
              <li><svg><use href="#ck" /></svg>Миграция продолжается после закрытия вкладки</li>
              <li><svg><use href="#ck" /></svg>Очередь, статус и итоговый отчёт</li>
            </ul>
            <a className="go" href="#workspace">Попробовать интерфейс<svg><use href="#ar" /></svg></a>
          </article>
          <article className="card">
            <div className="ctop"><span className="ico"><svg><use href="#lp" /></svg></span><span className="tagr">Windows · Linux · macOS</span></div>
            <h3 className="big">Настольный клиент</h3>
            <p className="t">Интерфейс и управление запускаются локально. Почтовый трафик не расходует ресурсы MoveMailbox Cloud.</p>
            <ul className="ticks">
              <li><svg><use href="#ck" /></svg>Без коммерческого лимита на объём</li>
              <li><svg><use href="#ck" /></svg>Локальная история и технический журнал</li>
              <li><svg><use href="#ck" /></svg>Работает поверх imapsync — проверенного движка</li>
            </ul>
            <div className="os-row">
              <a className="os" href="https://github.com/Anton-Babaskin/MoveMailbox/releases/tag/v0.4.0-preview" target="_blank" rel="noreferrer"><svg><use href="#win" /></svg>Windows<small>Скачать</small></a>
              <a className="os" href="https://github.com/Anton-Babaskin/MoveMailbox/releases/tag/v0.4.0-preview" target="_blank" rel="noreferrer"><svg><use href="#lnx" /></svg>Linux<small>Binary</small></a>
              <span className="os soon"><svg><use href="#mac" /></svg>macOS<small>Скоро</small></span>
            </div>
          </article>
          <article className="card">
            <div className="ctop"><span className="ico"><svg><use href="#dkr" /></svg></span><span className="tagr">Self-hosted</span></div>
            <h3 className="big">Свой сервер</h3>
            <p className="t">Один <code>docker compose up</code> — и веб-интерфейс поднимается у вас. Почта проходит через ваш сервер, без инфраструктуры MoveMailbox.</p>
            <ul className="ticks">
              <li><svg><use href="#ck" /></svg>Никаких лимитов по объёму и числу ящиков</li>
              <li><svg><use href="#ck" /></svg>SQLite-история без открытых паролей</li>
              <li><svg><use href="#ck" /></svg>Пароли уходят в процесс imapsync и не сохраняются</li>
            </ul>
            <a className="go" href="https://github.com/Anton-Babaskin/MoveMailbox" target="_blank" rel="noreferrer">Docker и systemd<svg><use href="#ar" /></svg></a>
          </article>
        </div>
      </section>
    </>
  );
}
