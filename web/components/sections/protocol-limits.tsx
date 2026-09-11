export function ProtocolLimits() {
  return (
    <>
      <section className="shell alt">
        <div className="head-wide">
          <p className="eyebrow">Границы протокола</p>
          <h2>Что переезжает вместе с почтой, <span className="ital">а что придётся перенести руками.</span></h2>
          <p className="lede" style={{ marginTop: '16px' }}>IMAP — протокол про письма и папки, и только про них. Всё остальное живёт вне его, и честнее сказать об этом до переноса, чем услышать вопрос после.</p>
        </div>
        <div className="tx-cols">
          <div className="tx-col tx-yes">
            <h3><span className="badge-sm">Переносится</span></h3>
            <p>Полностью, байт в байт, без переупаковки</p>
            <ul className="tx-list">
              <li><span className="m"><svg><use href="#ck" /></svg></span><div><b>Письма целиком</b><span>Исходный RFC 822 объект: заголовки, тело, все вложения</span></div></li>
              <li><span className="m"><svg><use href="#ck" /></svg></span><div><b>Даты получения</b><span>Порядок в ящике не сбивается, письма не становятся «сегодняшними»</span></div></li>
              <li><span className="m"><svg><use href="#ck" /></svg></span><div><b>Флаги</b><span>Прочитано, отвечено, помечено, черновик</span></div></li>
              <li><span className="m"><svg><use href="#ck" /></svg></span><div><b>Структура папок</b><span>Вложенность любой глубины, кириллические имена в UTF-7</span></div></li>
              <li><span className="m"><svg><use href="#ck" /></svg></span><div><b>Отправленные и черновики</b><span>Обычные IMAP-папки, переносятся наравне с входящими</span></div></li>
            </ul>
          </div>
          <div className="tx-col tx-no">
            <h3><span className="badge-sm">Не переносится</span></h3>
            <p>Это не IMAP — данные лежат в других системах провайдера</p>
            <ul className="tx-list">
              <li><span className="m"><svg><use href="#ar" /></svg></span><div><b>Контакты и календари</b><span>Живут в CardDAV и CalDAV — выгружаются отдельно, в vCard и ICS</span></div></li>
              <li><span className="m"><svg><use href="#ar" /></svg></span><div><b>Фильтры и правила</b><span>Sieve или правила Outlook — пересоздаются в новом ящике вручную</span></div></li>
              <li><span className="m"><svg><use href="#ar" /></svg></span><div><b>Автоответчик и подписи</b><span>Настройки веб-интерфейса, к письмам отношения не имеют</span></div></li>
              <li><span className="m"><svg><use href="#ar" /></svg></span><div><b>Алиасы и пересылки</b><span>Конфигурация домена — переносится вместе с DNS и MX</span></div></li>
              <li><span className="m"><svg><use href="#ar" /></svg></span><div><b>In-Place Archive у Microsoft</b><span>Отдельное хранилище, по IMAP не видно вообще</span></div></li>
            </ul>
          </div>
        </div>
        <p className="tx-foot"><b>Что с этим делать:</b> контакты и календарь выгрузите из старого веб-интерфейса в vCard и ICS до отключения ящика — это пять минут, но только пока доступ ещё есть. Фильтры проще переписать заново: за годы их обычно накапливается больше, чем нужно.</p>
      </section>
    </>
  );
}
