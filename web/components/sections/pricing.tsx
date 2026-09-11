export function Pricing() {
  return (
    <>
      <section className="shell" id="pricing">
        <p className="keep">Планируемые тарифы. Продажи и онлайн-перенос ещё не открыты; цены могут измениться до запуска.</p>
        <div className="head-wide">
          <p className="eyebrow">Простая цена за один полный ящик</p>
          <h2>Сначала узнаём объём. <span className="ital">Потом запускаем.</span></h2>
          <p className="lede" style={{ marginTop: '16px' }}>Один платёж за ящик, не подписка. Объём измеряется до запуска и бесплатно: если ящик укладывается в 5 ГБ, он переезжает целиком и даром.</p>
        </div>
        <div className="pgrid">
          <article className="pl">
            <div className="pl-t"><strong>Free</strong><span>Для знакомства</span></div>
            <div className="amt">$0</div><span className="lim">до 5 ГБ</span><small className="nt">Один полный ящик</small>
            <ul><li><svg><use href="#ck" /></svg>Проверка двух подключений</li><li><svg><use href="#ck" /></svg>Стандартная очередь</li><li><svg><use href="#ck" /></svg>Отчёт о переносе</li></ul>
          </article>
          <article className="pl on">
            <div className="pl-t"><strong>Standard</strong><span>Популярный</span></div>
            <div className="amt">$5.90 <em>/ ящик</em></div><span className="lim">до 25 ГБ</span><small className="nt">Разовый платёж</small>
            <ul><li><svg><use href="#ck" /></svg>Приоритет над Free</li><li><svg><use href="#ck" /></svg>Повторный запуск</li><li><svg><use href="#ck" /></svg>Email-уведомление</li></ul>
          </article>
          <article className="pl">
            <div className="pl-t"><strong>Large</strong><span>Большой ящик</span></div>
            <div className="amt">$11.90 <em>/ ящик</em></div><span className="lim">до 100 ГБ</span><small className="nt">Разовый платёж</small>
            <ul><li><svg><use href="#ck" /></svg>Большие ящики</li><li><svg><use href="#ck" /></svg>Увеличенное время worker</li><li><svg><use href="#ck" /></svg>Расширенный отчёт</li></ul>
          </article>
          <article className="pl">
            <div className="pl-t"><strong>Business</strong><span>B2B</span></div>
            <div className="amt">По запросу</div><span className="lim">пакет ящиков</span><small className="nt">Для IT-команд</small>
            <ul><li><svg><use href="#ck" /></svg>CSV-пакеты</li><li><svg><use href="#ck" /></svg>Общий отчёт</li><li><svg><use href="#ck" /></svg>Приоритетная очередь</li></ul>
          </article>
        </div>
      </section>
    </>
  );
}
