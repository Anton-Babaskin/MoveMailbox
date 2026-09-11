export function Security({ pageTitle = false }: { pageTitle?: boolean } = {}) {
  const Heading = pageTitle ? 'h1' : 'h2';
  return (
    <>
      <section className="band" id="security">
        <div className="shell band-g">
          <div>
            <p className="eyebrow">Безопасность</p>
            <Heading style={{ fontSize: "clamp(1.75rem,3.4vw,2.75rem)", color: 'var(--term-hi)' }}>Как мы защищаем <span className="ital">ваши данные.</span></Heading>
            <p className="lede" style={{ marginTop: '18px' }}>Для онлайн-переноса воркеру нужен доступ к обоим ящикам — иначе копировать письма нечем. Поэтому важно не обещание «мы серьёзно относимся к безопасности», а точное описание того, что происходит с учётными данными на каждом шаге.</p>
            <a className="go" href="https://github.com/Anton-Babaskin/MoveMailbox/blob/main/SECURITY.md">Модель безопасности и сообщение об уязвимости<svg><use href="#ar" /></svg></a>
          </div>

          <div className="board">
            <header>
              <span className="live"><i></i>Онлайн-сервис готовится</span>
              <span className="upd">предварительная версия</span>
            </header>
            <ul>
              <li>
                <span className="tag">TTL</span>
                <div>
                  <strong>Отдельный ключ на каждое задание</strong>
                  <p>Соединение с сайтом защищено HTTPS. Перед постановкой задания в очередь учётные данные дополнительно шифруются для воркера: в хранилище попадает зашифрованный пакет, открытый пароль не сохраняется и не пишется в журналы. Пакет и ключ помечаются на удаление при завершении задания или по таймауту.</p>
                </div>
                <i className="dot" aria-hidden="true"></i>
              </li>
              <li>
                <span className="tag">IN-MEMORY</span>
                <div>
                  <strong>Расшифровка в памяти воркера</strong>
                  <p>Пакет расшифровывается в памяти воркера в момент запуска и живёт там до конца переноса. Сам перенос выполняется отдельным процессом imapsync под управлением воркера — учётные данные передаются процессу через окружение и не попадают в аргументы команды.</p>
                </div>
                <i className="dot" aria-hidden="true"></i>
              </li>
              <li>
                <span className="tag">NO-STORE</span>
                <div>
                  <strong>Письма не задерживаются</strong>
                  <p>Сообщения передаются потоком со старого сервера на новый. Мы не храним содержимое писем: MoveMailbox не становится копией вашей переписки.</p>
                </div>
                <i className="dot" aria-hidden="true"></i>
              </li>
              <li>
                <span className="tag">SELF-HOSTED</span>
                <div>
                  <strong>Или не отдавайте пароль вовсе</strong>
                  <p>Настольный клиент и Docker-сборка работают целиком у вас: почта идёт напрямую между вашими серверами, наша инфраструктура не участвует. Это самый строгий вариант, и он бесплатный.</p>
                </div>
                <i className="dot" aria-hidden="true"></i>
              </li>
            </ul>
            <footer>
              <span>Код на GitHub · ядро и клиенты на GitHub</span>
              <a href="https://github.com/Anton-Babaskin/MoveMailbox" target="_blank" rel="noreferrer">Посмотреть код<svg><use href="#ar" /></svg></a>
            </footer>
          </div>
        </div>
      </section>
    </>
  );
}
