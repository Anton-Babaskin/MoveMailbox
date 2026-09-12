'use client';


export function Workspace() {
  // Public Pages is preview only. Never initialize the API client.

  return (
    <>
      <section className="wide-shell" id="workspace" style={{ paddingTop: '0' }}>
        <p className="keep" role="status" style={{ padding: '18px', display: 'block' }}>
          Онлайн-перенос готовится к запуску. Здесь показан интерфейс: ввод данных
          и отправка запросов отключены. Для переноса сейчас используйте{' '}
          <a href="/download/">локальный клиент</a>.
        </p>
        <fieldset disabled aria-label="Предпросмотр переноса — онлайн-сервис ещё не открыт" style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>

        <div className="ws">
          <div className="ws-bar">
            <span className="dots"><i></i><i></i><i></i></span>
            <h2>Рабочая область переноса</h2>
            <span className="tail"><span className="chip">IMAP → IMAP</span></span>
          </div>

          <div className="panes">
            <div className="mbx">
              <div className="mbx-head">
                <span className="mbx-n">01</span>
                <div><small>Откуда</small><h3>Источник</h3></div>
                <span className="st" data-st="src"><i></i>Не проверено</span>
              </div>
              <label className="f"><span>IMAP-сервер или IP-адрес</span>
                <input placeholder="imap.old-company.com / 203.0.113.10" spellCheck="false" autoCapitalize="none" /></label>
              <label className="f"><span>Логин почтового ящика</span>
                <input placeholder="Например: name@example.com" spellCheck="false" autoCapitalize="none" /></label>
              <label className="f"><span>Пароль или пароль приложения</span>
                <span className="pw"><input type="password" placeholder="Введите пароль" />
                  <button type="button" data-pw aria-label="Показать пароль"><svg><use href="#ey" /></svg></button></span></label>
              <details className="adv">
                <summary><svg className="gear"><use href="#gr" /></svg><span>Настройки подключения</span><small>Автоматически — рекомендуется</small><svg className="chev"><use href="#cv" /></svg></summary>
                <div className="adv-in">
                  <label>Безопасность<select data-sec><option value="tls">SSL / TLS</option><option value="starttls">STARTTLS</option></select></label>
                  <label>Порт<select data-port><option value="auto">Автоматически · 993</option><option value="manual">Указать вручную</option></select><input data-port-num type="number" min="1" max="65535" placeholder="993" inputMode="numeric" hidden /></label>
                </div>
              </details>
            </div>

            <div className="mid">
              <canvas id="flow" aria-hidden="true"></canvas>
              <div className="mid-in">
                <button className="knob" type="button" id="swap" title="Поменять ящики местами" aria-label="Поменять ящики местами"><svg><use href="#sw" /></svg></button>
                <button className="btn btn-g mid-check" type="button" id="checkBoth">
                  <svg style={{ width: '15px', height: '15px' }}><use href="#ck" /></svg>Проверить оба
                </button>
                <div className="mid-links">
                  <a href="/guides/">Настройки провайдеров</a>
                  <a href="/docs/errors/">Ошибки IMAP</a>
                </div>
              </div>
            </div>

            <div className="mbx">
              <div className="mbx-head">
                <span className="mbx-n">02</span>
                <div><small>Куда</small><h3>Назначение</h3></div>
                <span className="st" data-st="dst"><i></i>Не проверено</span>
              </div>
              <label className="f"><span>IMAP-сервер или IP-адрес</span>
                <input placeholder="imap.new-company.com / 203.0.113.20" spellCheck="false" autoCapitalize="none" /></label>
              <label className="f"><span>Логин почтового ящика</span>
                <input placeholder="Например: name@example.com" spellCheck="false" autoCapitalize="none" /></label>
              <label className="f"><span>Пароль или пароль приложения</span>
                <span className="pw"><input type="password" placeholder="Введите пароль" />
                  <button type="button" data-pw aria-label="Показать пароль"><svg><use href="#ey" /></svg></button></span></label>
              <details className="adv">
                <summary><svg className="gear"><use href="#gr" /></svg><span>Настройки подключения</span><small>Автоматически — рекомендуется</small><svg className="chev"><use href="#cv" /></svg></summary>
                <div className="adv-in">
                  <label>Безопасность<select data-sec><option value="tls">SSL / TLS</option><option value="starttls">STARTTLS</option></select></label>
                  <label>Порт<select data-port><option value="auto">Автоматически · 993</option><option value="manual">Указать вручную</option></select><input data-port-num type="number" min="1" max="65535" placeholder="993" inputMode="numeric" hidden /></label>
                            <label style={{ gridColumn: '1/-1' }}>Подпапка назначения — необязательно
                    <input type="text" placeholder="Например: Архив/Старый ящик" spellCheck="false" /></label>
      </div>
              </details>
            </div>
          </div>

          <div className="launch">
            <div className="assure">
              <span><svg><use href="#ky" /></svg>Источник не удаляется</span>
              <span><svg><use href="#sv" /></svg>Объём считается до запуска</span>
            </div>
            <div className="acts">
              <button className="btn btn-p btn-lg" id="start"><svg style={{ width: '17px', height: '17px' }}><use href="#pl" /></svg>Запустить перенос</button>
              <button className="btn btn-g" id="stop" disabled><svg style={{ width: '15px', height: '15px' }}><use href="#sq" /></svg>Остановить</button>
            </div>
            <p id="modeHint" style={{ display: 'none', width: '100%', margin: '0', fontFamily: 'var(--mono)', fontSize: '11.5px', color: 'var(--amb)' }}></p>
          </div>

          <div className="opts">
            <details className="drop">
              <summary><span className="sn">03</span><b>Папки для переноса</b><span className="sum" id="fsum">Все папки · 41 208 писем · 12.4 ГБ</span><svg className="chev"><use href="#cv" /></svg></summary>
              <div className="drop-in" id="flist">
              <div className="frow"><span className="bx"><svg><use href="#ck" /></svg></span><span className="nm">INBOX</span><span className="c" data-c="18442">18 442</span><span className="s">5.9 ГБ</span></div>
              <div className="frow"><span className="bx"><svg><use href="#ck" /></svg></span><span className="nm">INBOX.Sent</span><span className="c" data-c="9117">9 117</span><span className="s">3.1 ГБ</span></div>
              <div className="frow"><span className="bx"><svg><use href="#ck" /></svg></span><span className="nm">INBOX.Archive.2019-2024</span><span className="c" data-c="11863">11 863</span><span className="s">2.9 ГБ</span></div>
              <div className="frow"><span className="bx"><svg><use href="#ck" /></svg></span><span className="nm">INBOX.Clients.Invoices</span><span className="c" data-c="1604">1 604</span><span className="s">412 МБ</span></div>
              <div className="frow"><span className="bx off"><svg><use href="#ck" /></svg></span><span className="nm">INBOX.Junk</span><span className="c" data-c="7330">7 330</span><span className="s">88 МБ</span></div>
              </div>
            </details>
            <details className="drop">
              <summary><span className="sn">04</span><b>Расширенные настройки</b><span className="sum">Режимы запуска · строгое зеркало</span><svg className="chev"><use href="#cv" /></svg></summary>
              <div className="adv-modes">
                <label className="mode-ck"><input type="checkbox" data-mode="verbose" /><span className="bx off"><svg><use href="#ck" /></svg></span>
                  <span><b>Только подробный вывод</b>Пройти весь сценарий и показать журнал, ничего не копируя. Аналог <code>--dry</code>.</span></label>
                <label className="mode-ck"><input type="checkbox" data-mode="creds" /><span className="bx off"><svg><use href="#ck" /></svg></span>
                  <span><b>Только проверить доступы</b>Подключиться, проверить TLS и авторизацию на обеих сторонах и выйти.</span></label>
                <label className="mode-ck"><input type="checkbox" data-mode="sizes" /><span className="bx off"><svg><use href="#ck" /></svg></span>
                  <span><b>Только показать размеры папок</b>Посчитать дерево папок, письма и объём — чтобы узнать цену до запуска.</span></label>
                <label className="mode-ck"><input type="checkbox" data-mode="folders" /><span className="bx off"><svg><use href="#ck" /></svg></span>
                  <span><b>Только создать папки</b>Создать структуру папок в назначении, не перенося письма. Аналог <code>--justfolders</code>.</span></label>
              </div>
              <div className="strict">
                <svg><use href="#al" /></svg>
                <div><strong>Строгое зеркало — разрушающая опция</strong>
                  <p>Удаляет в назначении письма, которых нет в источнике. По умолчанию выключено: базовый режим только копирует.</p></div>
                <button type="button" id="strict">Включить</button>
              </div>
            </details>
          </div>

          <div style={{ padding: '2px 24px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="keep" id="keepNote">
              <svg><use href="#sh" /></svg>
              <p><b>Источник не изменяется: базовый режим только копирует.</b> Учётные данные шифруются перед постановкой в очередь, открытый пароль не сохраняется. Не хотите отдавать пароль вообще — настольный клиент и Docker работают без нашей инфраструктуры. <a href="/download/">Забрать клиент →</a></p>
            </div>
            <p className="note" style={{ padding: '0' }}>Бесплатно переносится один целый ящик объёмом до 5 ГБ. Для большего объёма тариф выбирается после замера.</p>
          </div>

          <div className="mon">
            <div className="mon-h">
              <svg><use href="#tx" /></svg>
              <span><strong>Журнал переноса</strong><small>Папка за папкой, в реальном времени</small></span>
              <span className="stt" id="stt"><i></i>Ожидание</span>
            </div>
            <div className="mon-s">
              <div><small>Прогресс</small><strong id="mp">0%</strong></div>
              <div><small>Осталось</small><strong id="me">--:--</strong></div>
              <div><small>Скорость</small><strong id="mv">— <span style={{ fontSize: '.7em', color: '#5E7284' }}>пис/с</span></strong></div>
            </div>
            <div className="track"><i id="mbar"></i></div>
            <div className="log" id="log" aria-live="polite">
              <div><time>00:00</time><b>Подключите оба ящика и нажмите «Проверить оба».</b></div>
            </div>
            <p className="log-foot">Каждая папка, счётчики с обеих сторон и причина по каждому пропущенному письму.</p>
          </div>
        </div>
        </fieldset>
      </section>
    </>
  );
}
