export function Errors({ pageTitle = false }: { pageTitle?: boolean } = {}) {
  const Heading = pageTitle ? 'h1' : 'h2';
  return (
    <>
      <section className="shell" id="errors">
        <div className="head-wide">
          <p className="eyebrow">Диагностика</p>
          <Heading style={{ fontSize: "clamp(1.75rem,3.4vw,2.75rem)" }}>Что означают ошибки, <span className="ital">которые вы увидите в журнале.</span></Heading>
          <p className="lede" style={{ marginTop: '16px' }}>IMAP-серверы отвечают лаконично и почти никогда не объясняют причину. Здесь перевод самых частых ответов на человеческий — и что с каждым делать.</p>
        </div>
        <div className="errs">
          <details className="err" open>
            <summary><code className="e">NO [AUTHENTICATIONFAILED]</code><b>Сервер не принял логин или пароль</b><svg className="chev"><use href="#cv" /></svg></summary>
            <div className="err-in">
              <p>В девяти случаях из десяти пароль правильный, а проблема в другом: не создан пароль приложения, не включён IMAP в настройках почты, либо логин указан не в том формате. Яндекс требует оба действия сразу и на любое из них отвечает одинаково, из-за чего люди часами проверяют не тот пароль.</p>
              <div className="fix"><svg><use href="#ck" /></svg><span><b>Что сделать:</b> создайте пароль приложения (Gmail, Яндекс, iCloud — обязательно), включите IMAP в настройках ящика, проверьте формат логина: у iCloud только часть до собаки, у cPanel наоборот полный адрес.</span></div>
            </div>
          </details>
          <details className="err">
            <summary><code className="e">certificate verify failed</code><b>Сертификат сервера не проходит проверку</b><svg className="chev"><use href="#cv" /></svg></summary>
            <div className="err-in">
              <p>Обычная история на shared-хостинге: сертификат выписан на имя сервера вроде <code>srv142.hoster.net</code>, а вы подключаетесь по <code>mail.вашдомен.ru</code>. Само соединение шифруется нормально, не сходится только имя. Второй вариант — сертификат просрочен или самоподписанный.</p>
              <div className="fix"><svg><use href="#ck" /></svg><span><b>Что сделать:</b> в расширенных настройках включите приём непроверенного сертификата, либо подключитесь по тому имени, на которое сертификат выписан. Проверить можно так: <code>openssl s_client -connect host:993 -servername host</code>.</span></div>
            </div>
          </details>
          <details className="err">
            <summary><code className="e">OVERQUOTA / Quota exceeded</code><b>В новом ящике кончилось место</b><svg className="chev"><use href="#cv" /></svg></summary>
            <div className="err-in">
              <p>Перенос встал на середине, потому что 12 ГБ не помещаются в тариф на 5 ГБ. Худший вариант этой ошибки — когда квота кончается ночью и вы узнаёте об этом утром по наполовину перенесённому ящику.</p>
              <div className="fix"><svg><use href="#ck" /></svg><span><b>Что сделать:</b> замерьте объём до запуска (это первый шаг у нас и он бесплатный), сверьте с квотой назначения, при нехватке исключите Спам и Корзину — обычно это первые несколько гигабайт.</span></div>
            </div>
          </details>
          <details className="err">
            <summary><code className="e">Too many simultaneous connections</code><b>Провайдер режет число сессий</b><svg className="chev"><use href="#cv" /></svg></summary>
            <div className="err-in">
              <p>У Microsoft 365 лимит около 20 одновременных IMAP-сессий на ящик, у iCloud — заметно меньше. Попытка ускорить перенос параллельными потоками даёт обратный результат: сервер начинает рвать соединения, и повторов становится больше, чем полезной работы.</p>
              <div className="fix"><svg><use href="#ck" /></svg><span><b>Что сделать:</b> уменьшить параллелизм до одного-двух потоков и просто подождать. Мы по умолчанию идём папка за папкой именно поэтому.</span></div>
            </div>
          </details>
          <details className="err">
            <summary><code className="e">Connection reset by peer</code><b>Сервер молча закрыл соединение</b><svg className="chev"><use href="#cv" /></svg></summary>
            <div className="err-in">
              <p>Классический троттлинг. Провайдер решил, что запросы идут слишком часто, и разорвал сессию без объяснений. У Gmail после особо агрессивной выгрузки IMAP может быть временно заблокирован на несколько часов.</p>
              <div className="fix"><svg><use href="#ck" /></svg><span><b>Что сделать:</b> перезапустить перенос — недостающее докопируется, дубли не появятся. Если обрывы повторяются, сделать паузу на несколько часов и снизить скорость.</span></div>
            </div>
          </details>
          <details className="err">
            <summary><code className="e">CREATE failed: invalid folder name</code><b>Имя папки не принимается назначением</b><svg className="chev"><use href="#cv" /></svg></summary>
            <div className="err-in">
              <p>Обычно виноват разделитель уровней: Dovecot использует <code>/</code>, старые Courier-серверы — <code>.</code>. Из-за этого <code>INBOX.Sent</code> превращается либо в отдельную папку с точкой в имени, либо в подпапку — в зависимости от того, кто как понял.</p>
              <div className="fix"><svg><use href="#ck" /></svg><span><b>Что сделать:</b> включить автоматическое сопоставление имён — мы определяем разделитель на обеих сторонах и переписываем пути. Спецпапки вроде Junk и Спам сопоставляются по назначению, а не по названию.</span></div>
            </div>
          </details>
          <details className="err">
            <summary><code className="e">message too large</code><b>Письмо не влезло в лимит назначения</b><svg className="chev"><use href="#cv" /></svg></summary>
            <div className="err-in">
              <p>Microsoft 365 по умолчанию принимает письма до 35 МБ, другие провайдеры ставят свои границы. Письмо с крупным вложением просто пропускается — весь остальной перенос при этом идёт нормально.</p>
              <div className="fix"><svg><use href="#ck" /></svg><span><b>Что сделать:</b> ничего страшного не произошло, но такие письма попадают в итоговый отчёт списком. Их переносят вручную или сохраняют вложения отдельно.</span></div>
            </div>
          </details>
        </div>
      </section>
    </>
  );
}
