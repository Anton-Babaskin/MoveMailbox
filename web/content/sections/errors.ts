/** Копия блока диагностики. Один файл на секцию — три языка рядом. */

/** Кусок текста внутри абзаца: обычная строка либо inline-<code>. */
export type ErrorPart = string | { readonly code: string };

export type ErrorItem = {
  /** Ответ сервера. Одинаков во всех языках: его ищут дословно. */
  readonly code: string;
  readonly title: string;
  readonly body: readonly ErrorPart[];
  readonly fixLabel: string;
  readonly fix: readonly ErrorPart[];
};

export type ErrorsCopy = {
  readonly eyebrow: string;
  readonly h2a: string;
  readonly h2b: string;
  readonly lede: string;
  readonly items: readonly ErrorItem[];
};

export const errors = {
  ru: {
    eyebrow: 'Диагностика',
    h2a: 'Что означают ошибки, ',
    h2b: 'которые вы увидите в журнале.',
    lede: 'IMAP-серверы отвечают лаконично и почти никогда не объясняют причину. Здесь перевод самых частых ответов на человеческий — и что с каждым делать.',
    items: [
      {
        code: 'NO [AUTHENTICATIONFAILED]',
        title: 'Сервер не принял логин или пароль',
        body: [
          'В девяти случаях из десяти пароль правильный, а проблема в другом: не создан пароль приложения, не включён IMAP в настройках почты, либо логин указан не в том формате. Яндекс требует оба действия сразу и на любое из них отвечает одинаково, из-за чего люди часами проверяют не тот пароль.',
        ],
        fixLabel: 'Что сделать:',
        fix: [
          ' создайте пароль приложения (Gmail, Яндекс, iCloud — обязательно), включите IMAP в настройках ящика, проверьте формат логина: у iCloud только часть до собаки, у cPanel наоборот полный адрес.',
        ],
      },
      {
        code: 'certificate verify failed',
        title: 'Сертификат сервера не проходит проверку',
        body: [
          'Обычная история на shared-хостинге: сертификат выписан на имя сервера вроде ',
          { code: 'srv142.hoster.net' },
          ', а вы подключаетесь по ',
          { code: 'mail.вашдомен.ru' },
          '. Само соединение шифруется нормально, не сходится только имя. Второй вариант — сертификат просрочен или самоподписанный.',
        ],
        fixLabel: 'Что сделать:',
        fix: [
          ' в расширенных настройках включите приём непроверенного сертификата, либо подключитесь по тому имени, на которое сертификат выписан. Проверить можно так: ',
          { code: 'openssl s_client -connect host:993 -servername host' },
          '.',
        ],
      },
      {
        code: 'OVERQUOTA / Quota exceeded',
        title: 'В новом ящике кончилось место',
        body: [
          'Перенос встал на середине, потому что 12 ГБ не помещаются в тариф на 5 ГБ. Худший вариант этой ошибки — когда квота кончается ночью и вы узнаёте об этом утром по наполовину перенесённому ящику.',
        ],
        fixLabel: 'Что сделать:',
        fix: [
          ' замерьте объём до запуска (это первый шаг у нас и он бесплатный), сверьте с квотой назначения, при нехватке исключите Спам и Корзину — обычно это первые несколько гигабайт.',
        ],
      },
      {
        code: 'Too many simultaneous connections',
        title: 'Провайдер режет число сессий',
        body: [
          'У Microsoft 365 лимит около 20 одновременных IMAP-сессий на ящик, у iCloud — заметно меньше. Попытка ускорить перенос параллельными потоками даёт обратный результат: сервер начинает рвать соединения, и повторов становится больше, чем полезной работы.',
        ],
        fixLabel: 'Что сделать:',
        fix: [
          ' уменьшить параллелизм до одного-двух потоков и просто подождать. Мы по умолчанию идём папка за папкой именно поэтому.',
        ],
      },
      {
        code: 'Connection reset by peer',
        title: 'Сервер молча закрыл соединение',
        body: [
          'Классический троттлинг. Провайдер решил, что запросы идут слишком часто, и разорвал сессию без объяснений. У Gmail после особо агрессивной выгрузки IMAP может быть временно заблокирован на несколько часов.',
        ],
        fixLabel: 'Что сделать:',
        fix: [
          ' перезапустить перенос — недостающее докопируется, дубли не появятся. Если обрывы повторяются, сделать паузу на несколько часов и снизить скорость.',
        ],
      },
      {
        code: 'CREATE failed: invalid folder name',
        title: 'Имя папки не принимается назначением',
        body: [
          'Обычно виноват разделитель уровней: Dovecot использует ',
          { code: '/' },
          ', старые Courier-серверы — ',
          { code: '.' },
          '. Из-за этого ',
          { code: 'INBOX.Sent' },
          ' превращается либо в отдельную папку с точкой в имени, либо в подпапку — в зависимости от того, кто как понял.',
        ],
        fixLabel: 'Что сделать:',
        fix: [
          ' включить автоматическое сопоставление имён — мы определяем разделитель на обеих сторонах и переписываем пути. Спецпапки вроде Junk и Спам сопоставляются по назначению, а не по названию.',
        ],
      },
      {
        code: 'message too large',
        title: 'Письмо не влезло в лимит назначения',
        body: [
          'Microsoft 365 по умолчанию принимает письма до 35 МБ, другие провайдеры ставят свои границы. Письмо с крупным вложением просто пропускается — весь остальной перенос при этом идёт нормально.',
        ],
        fixLabel: 'Что сделать:',
        fix: [
          ' ничего страшного не произошло, но такие письма попадают в итоговый отчёт списком. Их переносят вручную или сохраняют вложения отдельно.',
        ],
      },
    ],
  },
  en: {
    eyebrow: 'Diagnostics',
    h2a: 'What those errors mean ',
    h2b: 'when you read the log.',
    lede: 'IMAP servers answer in a few words and almost never say why. Here are the most common replies in plain language, and what to do about each one.',
    items: [
      {
        code: 'NO [AUTHENTICATIONFAILED]',
        title: 'The server rejected the username or password',
        body: [
          'Nine times out of ten the password is fine and something else is wrong: no app password was created, IMAP is switched off in the mail settings, or the username is in the wrong format. Yandex needs both things done and answers the same way to either, which is why people spend hours checking the wrong password.',
        ],
        fixLabel: 'What to do:',
        fix: [
          ' create an app password (required for Gmail, Yandex and iCloud), enable IMAP in the mailbox settings, and check the username format: iCloud wants only the part before the @, cPanel wants the full address instead.',
        ],
      },
      {
        code: 'certificate verify failed',
        title: 'The server certificate fails verification',
        body: [
          'Common on shared hosting: the certificate is issued for a server name like ',
          { code: 'srv142.hoster.net' },
          ', while you connect to ',
          { code: 'mail.yourdomain.com' },
          '. The connection itself is encrypted fine, only the name does not match. The other case is an expired or self-signed certificate.',
        ],
        fixLabel: 'What to do:',
        fix: [
          ' in the advanced settings, allow an unverified certificate, or connect using the name the certificate was issued for. You can check it like this: ',
          { code: 'openssl s_client -connect host:993 -servername host' },
          '.',
        ],
      },
      {
        code: 'OVERQUOTA / Quota exceeded',
        title: 'The new mailbox ran out of space',
        body: [
          'The transfer stopped halfway because 12 GB will not fit into a 5 GB plan. The worst version of this is when the quota runs out overnight and you find out in the morning, looking at a half-migrated mailbox.',
        ],
        fixLabel: 'What to do:',
        fix: [
          ' run a size check before you start (that is our first step, and it is free), compare it against the destination quota, and if space is tight, exclude Spam and Trash — that is usually the first few gigabytes.',
        ],
      },
      {
        code: 'Too many simultaneous connections',
        title: 'The provider is capping the number of sessions',
        body: [
          'Microsoft 365 allows about 20 concurrent IMAP sessions per mailbox, and iCloud noticeably fewer. Trying to speed a transfer up with parallel threads backfires: the server starts dropping connections and you end up with more retries than useful work.',
        ],
        fixLabel: 'What to do:',
        fix: [
          ' drop the concurrency to one or two threads and simply wait. That is exactly why we go folder by folder by default.',
        ],
      },
      {
        code: 'Connection reset by peer',
        title: 'The server closed the connection without a word',
        body: [
          'Classic throttling. The provider decided the requests were coming too fast and cut the session with no explanation. After a particularly aggressive download, Gmail may block IMAP for a few hours.',
        ],
        fixLabel: 'What to do:',
        fix: [
          ' restart the transfer — whatever is missing gets copied and no duplicates appear. If the drops keep happening, pause for a few hours and slow things down.',
        ],
      },
      {
        code: 'CREATE failed: invalid folder name',
        title: 'The destination will not accept the folder name',
        body: [
          'Usually it is the hierarchy separator: Dovecot uses ',
          { code: '/' },
          ', older Courier servers use ',
          { code: '.' },
          '. Because of that, ',
          { code: 'INBOX.Sent' },
          ' turns either into a separate folder with a dot in its name or into a subfolder, depending on who read it how.',
        ],
        fixLabel: 'What to do:',
        fix: [
          ' turn on automatic folder-name mapping — we detect the separator on both sides and rewrite the paths. Special folders such as Junk and Spam are matched by their role, not by their name.',
        ],
      },
      {
        code: 'message too large',
        title: 'The message exceeds the destination limit',
        body: [
          'Microsoft 365 accepts messages up to 35 MB by default, and other providers set their own boundaries. A message with a large attachment is simply skipped — the rest of the transfer runs as usual.',
        ],
        fixLabel: 'What to do:',
        fix: [
          ' nothing is broken, but messages like these are listed in the final report. People move them by hand or save the attachments separately.',
        ],
      },
    ],
  },
  uk: {
    eyebrow: 'Діагностика',
    h2a: 'Що означають помилки, ',
    h2b: 'які ви побачите в журналі.',
    lede: 'IMAP-сервери відповідають лаконічно і майже ніколи не пояснюють причину. Тут переклад найчастіших відповідей людською мовою — і що з кожною робити.',
    items: [
      {
        code: 'NO [AUTHENTICATIONFAILED]',
        title: 'Сервер не прийняв логін або пароль',
        body: [
          'У дев’яти випадках із десяти пароль правильний, а проблема в іншому: не створено пароль застосунку, не увімкнено IMAP у налаштуваннях пошти, або логін вказано не в тому форматі. Яндекс вимагає обидві дії одразу і на будь-яку з них відповідає однаково, через що люди годинами перевіряють не той пароль.',
        ],
        fixLabel: 'Що зробити:',
        fix: [
          ' створіть пароль застосунку (Gmail, Яндекс, iCloud — обов’язково), увімкніть IMAP у налаштуваннях скриньки, перевірте формат логіна: в iCloud лише частина до равлика, у cPanel навпаки повна адреса.',
        ],
      },
      {
        code: 'certificate verify failed',
        title: 'Сертифікат сервера не проходить перевірку',
        body: [
          'Звична історія на shared-хостингу: сертифікат виписано на ім’я сервера на кшталт ',
          { code: 'srv142.hoster.net' },
          ', а ви підключаєтеся за ',
          { code: 'mail.вашдомен.ua' },
          '. Саме з’єднання шифрується нормально, не сходиться лише ім’я. Другий варіант — сертифікат прострочений або самопідписаний.',
        ],
        fixLabel: 'Що зробити:',
        fix: [
          ' у розширених налаштуваннях увімкніть приймання неперевіреного сертифіката, або підключіться за тим іменем, на яке сертифікат виписано. Перевірити можна так: ',
          { code: 'openssl s_client -connect host:993 -servername host' },
          '.',
        ],
      },
      {
        code: 'OVERQUOTA / Quota exceeded',
        title: 'У новій скриньці закінчилося місце',
        body: [
          'Перенесення спинилося посередині, бо 12 ГБ не вміщаються в тариф на 5 ГБ. Найгірший варіант цієї помилки — коли квота закінчується вночі, і ви дізнаєтеся про це вранці з наполовину перенесеної скриньки.',
        ],
        fixLabel: 'Що зробити:',
        fix: [
          ' зробіть замір обсягу до запуску (це перший крок у нас і він безкоштовний), звірте з квотою призначення, за браку місця виключіть Спам і Кошик — зазвичай це перші кілька гігабайтів.',
        ],
      },
      {
        code: 'Too many simultaneous connections',
        title: 'Провайдер обмежує кількість сесій',
        body: [
          'У Microsoft 365 ліміт близько 20 одночасних IMAP-сесій на скриньку, в iCloud — помітно менше. Спроба пришвидшити перенесення паралельними потоками дає зворотний результат: сервер починає рвати з’єднання, і повторів стає більше, ніж корисної роботи.',
        ],
        fixLabel: 'Що зробити:',
        fix: [
          ' зменшити паралелізм до одного-двох потоків і просто зачекати. Ми за замовчуванням ідемо папка за папкою саме тому.',
        ],
      },
      {
        code: 'Connection reset by peer',
        title: 'Сервер мовчки закрив з’єднання',
        body: [
          'Класичний тротлінг. Провайдер вирішив, що запити йдуть надто часто, і розірвав сесію без пояснень. У Gmail після особливо агресивного вивантаження IMAP може бути тимчасово заблокований на кілька годин.',
        ],
        fixLabel: 'Що зробити:',
        fix: [
          ' перезапустити перенесення — те, чого бракує, докопіюється, дублі не з’являться. Якщо обриви повторюються, зробити паузу на кілька годин і знизити швидкість.',
        ],
      },
      {
        code: 'CREATE failed: invalid folder name',
        title: 'Ім’я папки не приймається призначенням',
        body: [
          'Зазвичай винен роздільник рівнів: Dovecot використовує ',
          { code: '/' },
          ', старі Courier-сервери — ',
          { code: '.' },
          '. Через це ',
          { code: 'INBOX.Sent' },
          ' перетворюється або на окрему папку з крапкою в назві, або на підпапку — залежно від того, хто як зрозумів.',
        ],
        fixLabel: 'Що зробити:',
        fix: [
          ' увімкнути автоматичне зіставлення імен — ми визначаємо роздільник з обох боків і переписуємо шляхи. Спецпапки на кшталт Junk і Спам зіставляються за призначенням, а не за назвою.',
        ],
      },
      {
        code: 'message too large',
        title: 'Лист не вліз у ліміт призначення',
        body: [
          'Microsoft 365 за замовчуванням приймає листи до 35 МБ, інші провайдери ставлять свої межі. Лист із великим вкладенням просто пропускається — решта перенесення при цьому йде нормально.',
        ],
        fixLabel: 'Що зробити:',
        fix: [
          ' нічого страшного не сталося, але такі листи потрапляють до підсумкового звіту списком. Їх переносять вручну або зберігають вкладення окремо.',
        ],
      },
    ],
  },
} as const satisfies Record<'ru' | 'en' | 'uk', ErrorsCopy>;
