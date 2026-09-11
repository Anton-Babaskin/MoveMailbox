export function DesktopApp() {
  return (
    <>
      <section className="shell" id="windows">
        <div className="win">
          <div className="frame" aria-hidden="true">
            <div className="frame-t"><i></i><i></i><i></i><small>MoveMailbox</small></div>
            <div className="frame-b">
              <span className="ico"><svg style={{ width: '26px', height: '26px' }}><use href="#lp" /></svg></span>
              <strong>LOCAL MODE</strong>
              <span>IMAP → IMAP</span>
              <div className="bars"><i></i><i></i><i></i><i></i><i></i></div>
            </div>
          </div>
          <div>
            <p className="eyebrow">Бесплатный локальный режим</p>
            <h2>Большой ящик? <span className="ital">Перенесите его у себя.</span></h2>
            <p className="lede" style={{ marginTop: '16px' }}>Настольный клиент бесплатен и не зависит от облачного лимита 5 ГБ. Копирование идёт напрямую между вашими серверами, минуя нашу инфраструктуру.</p>
            <ul className="ticks" style={{ marginTop: '22px' }}>
              <li><svg><use href="#ck" /></svg>Без оплаты за объём или количество писем</li>
              <li><svg><use href="#ck" /></svg>Почтовый трафик идёт через ваш компьютер</li>
              <li><svg><use href="#ck" /></svg>Пробный прогон без копирования писем</li>
              <li><svg><use href="#ck" /></svg>Живой прогресс, отмена и журнал</li>
            </ul>
            <div className="keep local" style={{ marginTop: '22px' }}>
              <svg><use href="#al" /></svg>
              <p><b>Локальный режим — окно должно оставаться открытым.</b> Копирование идёт с вашего компьютера, поэтому закрытие клиента или уход машины в спящий режим прервёт перенос. Прерванный перенос не теряется: повторный запуск докопирует недостающее.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '26px' }}>
              <a className="btn btn-p" href="https://github.com/Anton-Babaskin/MoveMailbox/releases/tag/v0.4.0-preview" target="_blank" rel="noreferrer">Скачать для Windows<svg style={{ width: '16px', height: '16px' }}><use href="#dl" /></svg></a>
              <a className="btn btn-g" href="https://github.com/Anton-Babaskin/MoveMailbox#readme">Что входит в клиент</a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
