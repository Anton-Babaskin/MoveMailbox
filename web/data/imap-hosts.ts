/**
 * Настройки IMAP по сервисам: /imap/ukr-net, /imap/gmx и такие же.
 *
 * Зачем отдельный раздел. У маршрутов и страниц провайдеров спрос
 * «перенести почту оттуда-то». Здесь спрос другой и куда более частый:
 * человек ищет «ukr net imap налаштування», «web.de imap einstellungen»,
 * «aol imap settings» — ему нужен хост, порт и почему не подходит обычный
 * пароль. Переносить он, может, ничего и не собирался: он настраивает
 * клиент. Это тот самый запрос, по которому нас находят раньше, чем у
 * человека появляется наша задача.
 *
 * ОТКУДА ЗНАЧЕНИЯ. Хост, порт и шифрование не берутся по памяти и не
 * списываются с чужих обзоров: каждая строка таблицы взята из файла
 * автоконфигурации — либо из базы Mozilla (autoconfig.thunderbird.net),
 * либо с autoconfig-домена самого сервиса. Это то же самое, что читает
 * Thunderbird, когда подставляет настройки сам. Ссылки лежат в поле
 * sources, дата проверки — в checked. Всё, что нельзя было подтвердить
 * источником, на страницу не попало: неверный хост в такой таблице — это
 * час чужого времени и обращение в поддержку не по адресу.
 *
 * Порядок языков: английский и украинский — основные рынки, русский
 * наравне. Тексты пишутся под запросы своего рынка, а не переводятся
 * подстрочником, иначе поисковик склеит три страницы в одну.
 */

export type MailServer = {
  host: string;
  port: number;
  security: 'SSL/TLS' | 'STARTTLS';
};

export type ImapHostCopy = {
  title: string;
  description: string;
  h1: string;
  intro: string;
  /** Что здесь ломается. Не общие слова, а свойство именно этого сервиса. */
  pitfalls: string[];
  faq: Array<[string, string]>;
};

export type ImapHost = {
  /** Слаг внутри /imap/. */
  slug: string;
  name: string;
  /** Домены, по которым сервис узнают. Показываются под заголовком. */
  domains: string[];
  /** null — прямого IMAP у сервиса нет; страница объясняет, что делать. */
  imap: MailServer | null;
  smtp: MailServer | null;
  /** 'email' — логин это полный адрес, 'local' — только часть до собаки. */
  login: 'email' | 'local';
  /**
   * 'password'     — обычный пароль ящика;
   * 'app-password' — отдельный пароль для программ, обычный не принимается;
   * 'bridge'       — прямого доступа нет, нужен локальный мост.
   */
  auth: 'password' | 'app-password' | 'bridge';
  /** Отдельный хост для полной выгрузки, если сервис такой выделяет. */
  exportHost?: string;
  /** Чем подтверждены значения в таблице. */
  sources: string[];
  /** Когда значения проверялись последний раз, ISO. */
  checked: string;
  ru: ImapHostCopy;
  en: ImapHostCopy;
  uk: ImapHostCopy;
};

export const imapHosts: ImapHost[] = [
  {
    slug: 'ukr-net',
    name: '@UKR.NET',
    domains: ['ukr.net'],
    imap: { host: 'imap.ukr.net', port: 993, security: 'SSL/TLS' },
    smtp: { host: 'smtp.ukr.net', port: 465, security: 'SSL/TLS' },
    login: 'email',
    auth: 'app-password',
    sources: ['https://autoconfig.ukr.net/mail/config-v1.1.xml', 'https://wiki.ukr.net/ManageIMAPAccess'],
    checked: '2026-09-15',
    uk: {
      title: 'Налаштування IMAP для @UKR.NET — хост, порт, пароль',
      description:
        'IMAP-доступ до скриньки @UKR.NET: imap.ukr.net, порт 993, SSL. Чому основний пароль не підходить і де взяти пароль для зовнішніх програм.',
      h1: 'Налаштування IMAP для @UKR.NET',
      intro:
        'Скринька @UKR.NET віддає пошту зовнішнім програмам, але не тим паролем, яким ви заходите на сайт. З лютого 2020 року основний пароль для IMAP не приймається зовсім, а сам доступ для зовнішніх програм вимкнений, доки ви його не увімкнете. Через це найчастіша скарга виглядає як «пароль правильний, а пошта не підключається» — і це справді так: пароль правильний, просто не той.',
      pitfalls: [
        'Доступ для зовнішніх програм вимкнений за замовчуванням. Його вмикають у налаштуваннях скриньки, у розділі «Керування IMAP-доступом», — до цього жоден клієнт не підключиться.',
        'Основний пароль від акаунта IMAP не приймає з 18 лютого 2020 року. Потрібен окремий пароль, який @UKR.NET генерує сам, коли ви даєте програмі назву.',
        'Логін — повна адреса разом із доменом: name@ukr.net, а не name.',
        'Пароль видається окремо на кожну програму. Це зручно: після перенесення пошти достатньо прибрати один пароль, а не міняти основний.',
      ],
      faq: [
        [
          'Де взяти пароль для зовнішніх програм?',
          'У налаштуваннях скриньки @UKR.NET: «Керування IMAP-доступом» → увімкнути перемикач → підтвердити основним паролем → вказати назву програми → «Створити пароль». Пароль показується один раз, тому скопіюйте його одразу.',
        ],
        [
          'Який порт і шифрування?',
          'IMAP — 993 із SSL/TLS, SMTP — 465 із SSL/TLS. Порт 143 без шифрування використовувати не варто: логін і пароль підуть відкритим текстом.',
        ],
        [
          'Чи залишиться пошта в @UKR.NET після перенесення?',
          'Так. Базовий режим лише копіює і нічого не видаляє у джерелі. Видалення можливе тільки в режимі суворого дзеркала, тільки у скриньці призначення та після двох підтверджень.',
        ],
        [
          'Пароль для програм видно комусь, крім мене?',
          'Ні. Він створюється у вашій скриньці й вами ж відкликається. MoveMailbox шифрує облікові дані перед постановкою завдання в чергу і не зберігає відкритий пароль.',
        ],
      ],
    },
    ru: {
      title: 'Настройки IMAP для @UKR.NET — хост, порт, пароль',
      description:
        'IMAP-доступ к ящику @UKR.NET: imap.ukr.net, порт 993, SSL. Почему обычный пароль не подходит и где взять пароль для внешних программ.',
      h1: 'Настройки IMAP для @UKR.NET',
      intro:
        'Ящик @UKR.NET отдаёт почту внешним программам, но не тем паролем, которым вы заходите на сайт. С февраля 2020 года основной пароль для IMAP не принимается вовсе, а сам доступ для внешних программ выключен, пока вы его не включите. Отсюда самая частая жалоба: «пароль верный, а почта не подключается» — так и есть, пароль верный, просто не тот.',
      pitfalls: [
        'Доступ для внешних программ выключен по умолчанию. Его включают в настройках ящика, в разделе «Керування IMAP-доступом», — до этого не подключится ни один клиент.',
        'Основной пароль от аккаунта IMAP не принимает с 18 февраля 2020 года. Нужен отдельный пароль, который @UKR.NET генерирует сам, когда вы даёте программе имя.',
        'Логин — полный адрес вместе с доменом: name@ukr.net, а не name.',
        'Пароль выдаётся отдельно на каждую программу. Это удобно: после переноса достаточно убрать один пароль, а не менять основной.',
      ],
      faq: [
        [
          'Где взять пароль для внешних программ?',
          'В настройках ящика @UKR.NET: «Керування IMAP-доступом» → включить переключатель → подтвердить основным паролем → указать имя программы → «Створити пароль». Пароль показывается один раз, скопируйте его сразу.',
        ],
        [
          'Какой порт и шифрование?',
          'IMAP — 993 с SSL/TLS, SMTP — 465 с SSL/TLS. Порт 143 без шифрования использовать не стоит: логин и пароль уйдут открытым текстом.',
        ],
        [
          'Останется ли почта в @UKR.NET после переноса?',
          'Да. Базовый режим только копирует и ничего не удаляет в источнике. Удаление возможно лишь в строгом зеркале, только в ящике назначения и после двух подтверждений.',
        ],
        [
          'Виден ли пароль для программ кому-то, кроме меня?',
          'Нет. Он создаётся в вашем ящике и вами же отзывается. MoveMailbox шифрует учётные данные перед постановкой задания в очередь и не хранит открытый пароль.',
        ],
      ],
    },
    en: {
      title: 'UKR.NET IMAP settings — host, port, app password',
      description:
        'IMAP access for a @UKR.NET mailbox: imap.ukr.net, port 993, SSL. Why the account password is rejected and where the app password comes from.',
      h1: 'UKR.NET IMAP settings',
      intro:
        'A @UKR.NET mailbox will talk to an external client, but not with the password you use on the website. Since February 2020 the account password is refused over IMAP outright, and external access is switched off until you turn it on yourself. Hence the usual complaint — "the password is correct and it still will not connect" — which is accurate: the password is correct, it is simply the wrong one.',
      pitfalls: [
        'External program access is off by default. You enable it in the mailbox settings under "Керування IMAP-доступом"; until then no client connects at all.',
        'The account password has been rejected over IMAP since 18 February 2020. You need the separate password @UKR.NET generates once you name the program.',
        'The username is the full address with the domain — name@ukr.net, not name.',
        'Each program gets its own password. That is convenient: when the migration is done you revoke one password instead of changing the main one.',
      ],
      faq: [
        [
          'Where do I get the app password?',
          'In the @UKR.NET mailbox settings: "Керування IMAP-доступом" → turn the switch on → confirm with the account password → name the program → create the password. It is shown once, so copy it right away.',
        ],
        [
          'Which port and encryption?',
          'IMAP is 993 with SSL/TLS, SMTP is 465 with SSL/TLS. Avoid plain port 143: the login and password would travel in the clear.',
        ],
        [
          'Does the mail stay in @UKR.NET after a migration?',
          'Yes. The default mode only copies and never deletes anything at the source. Deletion happens only in strict mirror mode, only on the destination, and only after two explicit confirmations.',
        ],
        [
          'Can anyone but me see that app password?',
          'No. It is created in your own mailbox and revoked by you. MoveMailbox encrypts credentials before the job is queued and never stores the plaintext password.',
        ],
      ],
    },
  },

  {
    slug: 'gmx',
    name: 'GMX',
    domains: ['gmx.net', 'gmx.de', 'gmx.com', 'gmx.at', 'gmx.ch'],
    imap: { host: 'imap.gmx.net', port: 993, security: 'SSL/TLS' },
    smtp: { host: 'mail.gmx.net', port: 465, security: 'SSL/TLS' },
    login: 'email',
    auth: 'password',
    sources: ['https://autoconfig.thunderbird.net/v1.1/gmx.net', 'https://support.gmx.com/pop-imap/toggle.html'],
    checked: '2026-09-15',
    ru: {
      title: 'Настройки IMAP для GMX — хост, порт, включение доступа',
      description:
        'IMAP для ящика GMX: imap.gmx.net, порт 993, SSL. Почему доступ выключен по умолчанию и чем отличается хост для домена gmx.com.',
      h1: 'Настройки IMAP для GMX',
      intro:
        'GMX — почта немецкого оператора 1&1, и у неё есть особенность, на которой спотыкаются почти все: доступ по POP3 и IMAP выключен, пока его не включат в настройках самого ящика. Клиент при этом не говорит «доступ запрещён», он говорит «не удалось подключиться», и человек идёт проверять хост и порт, хотя с ними всё в порядке.',
      pitfalls: [
        'Доступ по POP3 и IMAP выключен по умолчанию. Включается в веб-интерфейсе: «Настройки → POP3 и IMAP → разрешить доступ внешним программам».',
        'Хост зависит от домена ящика: для gmx.net, gmx.de, gmx.at и gmx.ch — imap.gmx.net, для gmx.com — imap.gmx.com. Перепутанный хост даёт ошибку авторизации, а не ошибку соединения, и уводит поиски не туда.',
        'Старые версии TLS отключены. Клиент, умеющий только TLS 1.0 или 1.1, не подключится в принципе — обновляйте программу, а не настройки.',
        'Логин — полный адрес вместе с доменом.',
      ],
      faq: [
        [
          'Где включается IMAP в GMX?',
          'В веб-интерфейсе: «Настройки» (Einstellungen) → «POP3 и IMAP» → отметить разрешение на доступ внешних программ и сохранить. Изменение вступает в силу сразу.',
        ],
        [
          'imap.gmx.net или imap.gmx.com?',
          'По домену вашего адреса: ящик на gmx.com подключается к imap.gmx.com, ящики на gmx.net, gmx.de, gmx.at и gmx.ch — к imap.gmx.net. Порт в обоих случаях 993, шифрование SSL/TLS.',
        ],
        [
          'Подойдёт ли обычный пароль от ящика?',
          'Да, GMX принимает по IMAP обычный пароль — отдельный пароль для программ здесь не нужен. Достаточно включить сам доступ.',
        ],
        [
          'Как перенести почту из GMX на другой сервер?',
          'Включите IMAP-доступ, укажите imap.gmx.net (или imap.gmx.com) как источник, второй ящик — как назначение, и запустите перенос. Письма в GMX остаются на месте: базовый режим только копирует.',
        ],
      ],
    },
    en: {
      title: 'GMX IMAP settings — host, port, enabling access',
      description:
        'IMAP for a GMX mailbox: imap.gmx.net, port 993, SSL. Why access is off by default and when the host is imap.gmx.com instead.',
      h1: 'GMX IMAP settings',
      intro:
        'GMX is the mail service of the German provider 1&1, and it has one quirk almost everyone trips over: POP3 and IMAP access is switched off until you enable it inside the mailbox itself. The client does not say "access denied", it says "could not connect", so people go and re-check the host and the port — which were fine all along.',
      pitfalls: [
        'POP3 and IMAP access is off by default. Turn it on in the web interface: Settings → POP3 & IMAP → allow access from external programs.',
        'The host depends on your domain: gmx.net, gmx.de, gmx.at and gmx.ch use imap.gmx.net, while gmx.com uses imap.gmx.com. The wrong one fails as an authentication error rather than a connection error, which sends the search in the wrong direction.',
        'Old TLS versions are disabled. A client that only speaks TLS 1.0 or 1.1 will never connect — update the program, not the settings.',
        'The username is the full address including the domain.',
      ],
      faq: [
        [
          'Where is IMAP enabled in GMX?',
          'In the web interface: Settings (Einstellungen) → POP3 & IMAP → tick the box that allows access from external programs and save. It takes effect immediately.',
        ],
        [
          'imap.gmx.net or imap.gmx.com?',
          'It follows your address: a gmx.com mailbox connects to imap.gmx.com, while gmx.net, gmx.de, gmx.at and gmx.ch mailboxes use imap.gmx.net. Either way the port is 993 over SSL/TLS.',
        ],
        [
          'Does the normal mailbox password work?',
          'Yes. GMX accepts the regular password over IMAP — no separate app password is needed here. You only have to enable the access itself.',
        ],
        [
          'How do I migrate mail out of GMX?',
          'Enable IMAP access, use imap.gmx.net (or imap.gmx.com) as the source, point the destination at the new mailbox and start the transfer. Nothing leaves GMX: the default mode only copies.',
        ],
      ],
    },
    uk: {
      title: 'Налаштування IMAP для GMX — хост, порт, увімкнення доступу',
      description:
        'IMAP для скриньки GMX: imap.gmx.net, порт 993, SSL. Чому доступ вимкнений за замовчуванням і коли хост інший — imap.gmx.com.',
      h1: 'Налаштування IMAP для GMX',
      intro:
        'GMX — пошта німецького оператора 1&1, і в неї є особливість, на якій спотикаються майже всі: доступ за POP3 та IMAP вимкнений, доки його не увімкнути в налаштуваннях самої скриньки. Клієнт при цьому каже не «доступ заборонено», а «не вдалося підключитися», і людина йде перевіряти хост із портом, хоча з ними все гаразд.',
      pitfalls: [
        'Доступ за POP3 та IMAP вимкнений за замовчуванням. Вмикається у вебінтерфейсі: «Налаштування → POP3 та IMAP → дозволити доступ зовнішнім програмам».',
        'Хост залежить від домену скриньки: для gmx.net, gmx.de, gmx.at і gmx.ch — imap.gmx.net, для gmx.com — imap.gmx.com. Переплутаний хост дає помилку авторизації, а не помилку з’єднання, і збиває пошуки.',
        'Старі версії TLS вимкнені. Програма, що вміє тільки TLS 1.0 або 1.1, не підключиться взагалі — оновлюйте клієнт, а не налаштування.',
        'Логін — повна адреса разом із доменом.',
      ],
      faq: [
        [
          'Де вмикається IMAP у GMX?',
          'У вебінтерфейсі: «Налаштування» (Einstellungen) → «POP3 та IMAP» → позначити дозвіл на доступ зовнішніх програм і зберегти. Діє одразу.',
        ],
        [
          'imap.gmx.net чи imap.gmx.com?',
          'За доменом вашої адреси: скринька на gmx.com підключається до imap.gmx.com, скриньки на gmx.net, gmx.de, gmx.at і gmx.ch — до imap.gmx.net. Порт в обох випадках 993, шифрування SSL/TLS.',
        ],
        [
          'Чи підійде звичайний пароль від скриньки?',
          'Так, GMX приймає за IMAP звичайний пароль — окремий пароль для програм тут не потрібен. Достатньо увімкнути сам доступ.',
        ],
        [
          'Як перенести пошту з GMX на інший сервер?',
          'Увімкніть IMAP-доступ, вкажіть imap.gmx.net (або imap.gmx.com) як джерело, другу скриньку — як призначення, і запустіть перенесення. Листи в GMX залишаються на місці: базовий режим лише копіює.',
        ],
      ],
    },
  },

  {
    slug: 'web-de',
    name: 'WEB.DE',
    domains: ['web.de'],
    imap: { host: 'imap.web.de', port: 993, security: 'SSL/TLS' },
    smtp: { host: 'smtp.web.de', port: 587, security: 'STARTTLS' },
    login: 'local',
    auth: 'password',
    sources: ['https://autoconfig.thunderbird.net/v1.1/web.de', 'https://hilfe.web.de/pop-imap/einschalten.html'],
    checked: '2026-09-15',
    ru: {
      title: 'Настройки IMAP для WEB.DE — хост, порт, логин без домена',
      description:
        'IMAP для ящика WEB.DE: imap.web.de, порт 993, SSL. Доступ включается вручную, а логин указывается без @web.de.',
      h1: 'Настройки IMAP для WEB.DE',
      intro:
        'WEB.DE — вторая почта того же немецкого оператора, что и GMX, и ведёт себя так же: доступ внешним программам выключен, пока его не включат в настройках ящика. Но есть и своя особенность, которая ломает подключение уже после включения доступа: логин здесь указывается без домена.',
      pitfalls: [
        'Доступ по POP3 и IMAP выключен по умолчанию. Включается в почте: значок с инициалами → «Настройки почты» → раздел «POP3/IMAP» → переключатель, а затем проверка, где два значка нужно совместить перетаскиванием.',
        'Логин — часть адреса до собаки. Для ящика name@web.de в поле имени пользователя вводится name. Полный адрес сервер не примет, и это выглядит как неверный пароль.',
        'Отправка идёт через smtp.web.de на порту 587 со STARTTLS. Порт 465 с SSL тоже принимается, но 587 — тот, который сервис называет основным.',
        'POP3 здесь по умолчанию удаляет письма с сервера после получения. Для переноса всегда выбирайте IMAP, иначе половина архива останется только в старом клиенте.',
      ],
      faq: [
        [
          'Логин с доменом или без?',
          'Без. Для ящика name@web.de логин — name. Это отличает WEB.DE от большинства сервисов и даёт ту же ошибку, что неверный пароль.',
        ],
        [
          'Где включить IMAP?',
          'В веб-интерфейсе WEB.DE: значок с вашими инициалами в верхней панели → «Настройки почты» (E-Mail-Einstellungen) → «POP3/IMAP» → разрешить доступ и пройти проверку.',
        ],
        [
          'Какие порты?',
          'IMAP — 993 с SSL/TLS (или 143 со STARTTLS), SMTP — 587 со STARTTLS. Без шифрования сервис не работает вовсе.',
        ],
        [
          'Можно ли перенести почту с WEB.DE, не удаляя её там?',
          'Да, это режим по умолчанию: перенос только копирует. В WEB.DE всё остаётся как было, пока вы сами не удалите ящик.',
        ],
      ],
    },
    en: {
      title: 'WEB.DE IMAP settings — host, port, username without domain',
      description:
        'IMAP for a WEB.DE mailbox: imap.web.de, port 993, SSL. Access has to be enabled by hand, and the username goes in without @web.de.',
      h1: 'WEB.DE IMAP settings',
      intro:
        'WEB.DE is the second mail service of the same German operator as GMX and behaves the same way: external access is off until you enable it in the mailbox settings. It also has a quirk of its own that breaks the connection after you have enabled access — the username here goes in without the domain.',
      pitfalls: [
        'POP3 and IMAP access is off by default. Enable it in the mailbox: the initials icon → Email settings → POP3/IMAP → the toggle, followed by a check where you drag two symbols onto each other.',
        'The username is the part before the @. For name@web.de you type name. The full address is refused, and it looks exactly like a wrong password.',
        'Sending goes through smtp.web.de on port 587 with STARTTLS. Port 465 over SSL is accepted too, but 587 is the one the service documents.',
        'POP3 here deletes messages from the server once fetched. For a migration always pick IMAP, or half the archive ends up only in the old client.',
      ],
      faq: [
        [
          'Username with or without the domain?',
          'Without. For name@web.de the username is name. This sets WEB.DE apart from most services and produces the same error as a wrong password.',
        ],
        [
          'Where do I enable IMAP?',
          'In the WEB.DE web interface: the icon with your initials in the top bar → Email settings (E-Mail-Einstellungen) → POP3/IMAP → allow access and pass the check.',
        ],
        [
          'Which ports?',
          'IMAP is 993 with SSL/TLS (or 143 with STARTTLS), SMTP is 587 with STARTTLS. Unencrypted connections are not served at all.',
        ],
        [
          'Can I migrate away from WEB.DE without deleting anything there?',
          'Yes, that is the default: the transfer only copies. Everything stays in WEB.DE until you close the mailbox yourself.',
        ],
      ],
    },
    uk: {
      title: 'Налаштування IMAP для WEB.DE — хост, порт, логін без домену',
      description:
        'IMAP для скриньки WEB.DE: imap.web.de, порт 993, SSL. Доступ вмикається вручну, а логін вказується без @web.de.',
      h1: 'Налаштування IMAP для WEB.DE',
      intro:
        'WEB.DE — друга пошта того самого німецького оператора, що й GMX, і поводиться так само: доступ зовнішнім програмам вимкнений, доки його не увімкнути в налаштуваннях скриньки. Але є й власна особливість, яка ламає підключення вже після ввімкнення доступу: логін тут вказується без домену.',
      pitfalls: [
        'Доступ за POP3 та IMAP вимкнений за замовчуванням. Вмикається у пошті: значок з ініціалами → «Налаштування пошти» → розділ «POP3/IMAP» → перемикач, а далі перевірка, де два значки треба сумістити перетягуванням.',
        'Логін — частина адреси до равлика. Для скриньки name@web.de у полі імені користувача вводиться name. Повну адресу сервер не прийме, і це виглядає як невірний пароль.',
        'Надсилання йде через smtp.web.de на порту 587 зі STARTTLS. Порт 465 із SSL теж приймається, але 587 — той, який сервіс називає основним.',
        'POP3 тут за замовчуванням видаляє листи з сервера після отримання. Для перенесення завжди обирайте IMAP, інакше половина архіву залишиться лише у старому клієнті.',
      ],
      faq: [
        [
          'Логін із доменом чи без?',
          'Без. Для скриньки name@web.de логін — name. Це відрізняє WEB.DE від більшості сервісів і дає ту саму помилку, що й невірний пароль.',
        ],
        [
          'Де увімкнути IMAP?',
          'У вебінтерфейсі WEB.DE: значок з вашими ініціалами у верхній панелі → «Налаштування пошти» (E-Mail-Einstellungen) → «POP3/IMAP» → дозволити доступ і пройти перевірку.',
        ],
        [
          'Які порти?',
          'IMAP — 993 із SSL/TLS (або 143 зі STARTTLS), SMTP — 587 зі STARTTLS. Без шифрування сервіс не працює взагалі.',
        ],
        [
          'Чи можна перенести пошту з WEB.DE, не видаляючи її там?',
          'Так, це режим за замовчуванням: перенесення лише копіює. У WEB.DE все залишається як було, доки ви самі не видалите скриньку.',
        ],
      ],
    },
  },

  {
    slug: 'aol',
    name: 'AOL Mail',
    domains: ['aol.com', 'verizon.net'],
    imap: { host: 'imap.aol.com', port: 993, security: 'SSL/TLS' },
    smtp: { host: 'smtp.aol.com', port: 465, security: 'SSL/TLS' },
    login: 'email',
    auth: 'app-password',
    exportHost: 'export.imap.aol.com',
    sources: [
      'https://autoconfig.thunderbird.net/v1.1/aol.com',
      'https://help.aol.com/articles/Create-and-manage-app-password',
    ],
    checked: '2026-09-15',
    en: {
      title: 'AOL Mail IMAP settings — host, port, app password',
      description:
        'IMAP for AOL Mail: imap.aol.com, port 993, SSL. Why the account password is refused, and the separate export host for downloading a whole mailbox.',
      h1: 'AOL Mail IMAP settings',
      intro:
        'AOL stopped accepting account passwords from third-party clients in 2019: any mail program now needs an app password generated in the account security page. Verizon mailboxes live on the same servers — verizon.net addresses connect to the AOL hosts, not to anything at Verizon.',
      pitfalls: [
        'The account password is refused over IMAP. Generate an app password in AOL Account Security and paste that instead — it is a 16-character string tied to one program.',
        'For downloading an entire mailbox AOL points at a separate host: export.imap.aol.com, also port 993 over SSL. It is meant for bulk export rather than day-to-day sync.',
        'verizon.net addresses are AOL mailboxes. Their settings are the AOL ones; there is no Verizon IMAP server to look for.',
        'The username is the full address, including @aol.com or @verizon.net.',
      ],
      faq: [
        [
          'Where do I create the app password?',
          'Sign in at AOL Account Security, choose "Generate app password", name the app and copy the 16 characters. Revoke it from the same page when the migration is finished.',
        ],
        [
          'imap.aol.com or export.imap.aol.com?',
          'Both are AOL hosts on port 993 with SSL. The plain one is the normal mail host; the export one is what AOL documents for pulling a full mailbox, which is exactly what a migration does.',
        ],
        [
          'My address is @verizon.net — which settings do I use?',
          'The AOL ones. Verizon mail moved onto AOL infrastructure, so imap.aol.com with an AOL app password is the right answer.',
        ],
        [
          'Does AOL keep my mail after a migration?',
          'Yes. The default mode copies only and changes nothing at the source; deletion happens solely in strict mirror mode, on the destination, after two confirmations.',
        ],
      ],
    },
    ru: {
      title: 'Настройки IMAP для AOL Mail — хост, порт, пароль приложения',
      description:
        'IMAP для AOL Mail: imap.aol.com, порт 993, SSL. Почему обычный пароль не принимается и зачем отдельный хост для полной выгрузки.',
      h1: 'Настройки IMAP для AOL Mail',
      intro:
        'AOL перестал принимать обычные пароли от сторонних программ ещё в 2019 году: любому почтовому клиенту теперь нужен пароль приложения, созданный в настройках безопасности аккаунта. Ящики Verizon живут на тех же серверах — адреса verizon.net подключаются к хостам AOL, а не к чему-то у Verizon.',
      pitfalls: [
        'Обычный пароль аккаунта по IMAP не принимается. Создайте пароль приложения в разделе безопасности AOL и вводите его — это 16 символов, привязанных к одной программе.',
        'Для выгрузки ящика целиком AOL указывает отдельный хост: export.imap.aol.com, тоже порт 993 с SSL. Он и предназначен для массовой выгрузки, а не для повседневной синхронизации.',
        'Адреса verizon.net — это ящики AOL. Настройки у них AOL-овские, искать отдельный IMAP-сервер Verizon бессмысленно.',
        'Логин — полный адрес, вместе с @aol.com или @verizon.net.',
      ],
      faq: [
        [
          'Где создать пароль приложения?',
          'В настройках безопасности аккаунта AOL: «Generate app password», указать имя программы и скопировать 16 символов. Там же пароль отзывается, когда перенос закончен.',
        ],
        [
          'imap.aol.com или export.imap.aol.com?',
          'Оба — хосты AOL на порту 993 с SSL. Первый обычный почтовый, второй AOL называет для выгрузки ящика целиком, а перенос как раз этим и занимается.',
        ],
        [
          'У меня адрес @verizon.net — какие настройки?',
          'AOL-овские. Почта Verizon переехала на инфраструктуру AOL, поэтому верный ответ — imap.aol.com и пароль приложения AOL.',
        ],
        [
          'Останется ли почта в AOL после переноса?',
          'Да. Базовый режим только копирует и в источнике ничего не меняет; удаление бывает лишь в строгом зеркале, в ящике назначения и после двух подтверждений.',
        ],
      ],
    },
    uk: {
      title: 'Налаштування IMAP для AOL Mail — хост, порт, пароль застосунку',
      description:
        'IMAP для AOL Mail: imap.aol.com, порт 993, SSL. Чому звичайний пароль не приймається і навіщо окремий хост для повного вивантаження.',
      h1: 'Налаштування IMAP для AOL Mail',
      intro:
        'AOL перестав приймати звичайні паролі від сторонніх програм ще у 2019 році: будь-якому поштовому клієнту тепер потрібен пароль застосунку, створений у налаштуваннях безпеки акаунта. Скриньки Verizon живуть на тих самих серверах — адреси verizon.net підключаються до хостів AOL, а не до чогось у Verizon.',
      pitfalls: [
        'Звичайний пароль акаунта за IMAP не приймається. Створіть пароль застосунку в розділі безпеки AOL і вводьте його — це 16 символів, прив’язаних до однієї програми.',
        'Для вивантаження скриньки цілком AOL указує окремий хост: export.imap.aol.com, теж порт 993 із SSL. Він і призначений для масового експорту, а не для щоденної синхронізації.',
        'Адреси verizon.net — це скриньки AOL. Налаштування в них AOL-івські, шукати окремий IMAP-сервер Verizon немає сенсу.',
        'Логін — повна адреса, разом із @aol.com або @verizon.net.',
      ],
      faq: [
        [
          'Де створити пароль застосунку?',
          'У налаштуваннях безпеки акаунта AOL: «Generate app password», вказати назву програми та скопіювати 16 символів. Там само пароль відкликається, коли перенесення завершено.',
        ],
        [
          'imap.aol.com чи export.imap.aol.com?',
          'Обидва — хости AOL на порту 993 із SSL. Перший звичайний поштовий, другий AOL називає для вивантаження скриньки цілком, а перенесення саме цим і займається.',
        ],
        [
          'У мене адреса @verizon.net — які налаштування?',
          'AOL-івські. Пошта Verizon переїхала на інфраструктуру AOL, тому правильна відповідь — imap.aol.com і пароль застосунку AOL.',
        ],
        [
          'Чи залишиться пошта в AOL після перенесення?',
          'Так. Базовий режим лише копіює і в джерелі нічого не змінює; видалення буває тільки в суворому дзеркалі, у скриньці призначення та після двох підтверджень.',
        ],
      ],
    },
  },

  {
    slug: 'fastmail',
    name: 'Fastmail',
    domains: ['fastmail.com', 'fastmail.fm'],
    imap: { host: 'imap.fastmail.com', port: 993, security: 'SSL/TLS' },
    smtp: { host: 'smtp.fastmail.com', port: 465, security: 'SSL/TLS' },
    login: 'email',
    auth: 'app-password',
    sources: [
      'https://autoconfig.fastmail.com/mail/config-v1.1.xml',
      'https://www.fastmail.help/hc/en-us/articles/360058752854-App-passwords',
    ],
    checked: '2026-09-15',
    en: {
      title: 'Fastmail IMAP settings — host, port, app password',
      description:
        'IMAP for Fastmail: imap.fastmail.com, port 993, SSL. Every client needs its own app password, and the Basic plan has no IMAP at all.',
      h1: 'Fastmail IMAP settings',
      intro:
        'Fastmail is strict about external access in a way that catches people out twice. Every program gets its own app password — the account password and the two-step password both fail — and on the Basic plan IMAP is not included at all, so no password of any kind will help.',
      pitfalls: [
        'The account password does not work over IMAP. Create an app password under Settings → Privacy & Security → App Passwords, one per program.',
        'The Basic plan has no IMAP, POP, CalDAV or CardDAV. If the plan is Basic, an external client cannot connect no matter what you enter — that is a billing question, not a settings one.',
        'The two-step verification password is not an app password either. Using it gives the same password error.',
        'The username is the full address; for a custom domain hosted at Fastmail it is that address, not the fastmail.com one.',
      ],
      faq: [
        [
          'Where are app passwords created?',
          'Fastmail Settings → Privacy & Security → App Passwords. Give the password a name, copy it once, and delete it from the same screen when it is no longer needed.',
        ],
        [
          'Why does my correct password keep failing?',
          'Because Fastmail refuses the account password on IMAP by design. Only an app password is accepted — or the plan does not include IMAP at all.',
        ],
        [
          'Does a custom domain change the host?',
          'No. Mailboxes on your own domain hosted at Fastmail still use imap.fastmail.com on port 993 with SSL.',
        ],
        [
          'Can I migrate away from Fastmail without losing anything?',
          'Yes. The transfer copies messages, folders, flags and dates; the Fastmail mailbox is left exactly as it was.',
        ],
      ],
    },
    ru: {
      title: 'Настройки IMAP для Fastmail — хост, порт, пароль приложения',
      description:
        'IMAP для Fastmail: imap.fastmail.com, порт 993, SSL. Каждой программе нужен свой пароль приложения, а на тарифе Basic IMAP нет вовсе.',
      h1: 'Настройки IMAP для Fastmail',
      intro:
        'Fastmail строг к внешнему доступу, и подводных камня здесь два. Каждой программе нужен собственный пароль приложения — ни пароль аккаунта, ни пароль двухшаговой проверки не подойдут, — а на тарифе Basic IMAP не входит в тариф вообще, так что не поможет никакой пароль.',
      pitfalls: [
        'Пароль аккаунта по IMAP не работает. Пароль приложения создаётся в «Settings → Privacy & Security → App Passwords», по одному на программу.',
        'Тариф Basic не включает IMAP, POP, CalDAV и CardDAV. Если тариф Basic, внешний клиент не подключится, что бы вы ни вводили: это вопрос тарифа, а не настроек.',
        'Пароль двухшаговой проверки — это не пароль приложения. С ним будет та же ошибка авторизации.',
        'Логин — полный адрес; для своего домена на Fastmail это адрес на вашем домене, а не на fastmail.com.',
      ],
      faq: [
        [
          'Где создаются пароли приложений?',
          'Fastmail: «Settings → Privacy & Security → App Passwords». Дайте паролю имя, скопируйте его сразу и удалите там же, когда он больше не нужен.',
        ],
        [
          'Почему верный пароль не принимается?',
          'Потому что Fastmail намеренно не принимает по IMAP пароль аккаунта. Подходит только пароль приложения — либо на вашем тарифе IMAP не включён совсем.',
        ],
        [
          'Меняется ли хост для своего домена?',
          'Нет. Ящики на собственном домене, размещённые в Fastmail, подключаются к imap.fastmail.com на порту 993 с SSL.',
        ],
        [
          'Можно ли уйти с Fastmail, ничего не потеряв?',
          'Да. Перенос копирует письма, папки, флаги и даты; ящик в Fastmail остаётся ровно таким, каким был.',
        ],
      ],
    },
    uk: {
      title: 'Налаштування IMAP для Fastmail — хост, порт, пароль застосунку',
      description:
        'IMAP для Fastmail: imap.fastmail.com, порт 993, SSL. Кожній програмі потрібен свій пароль застосунку, а на тарифі Basic IMAP немає взагалі.',
      h1: 'Налаштування IMAP для Fastmail',
      intro:
        'Fastmail суворий до зовнішнього доступу, і підводних каменів тут два. Кожній програмі потрібен власний пароль застосунку — ані пароль акаунта, ані пароль двокрокової перевірки не підійдуть, — а на тарифі Basic IMAP не входить у тариф узагалі, тож не допоможе жоден пароль.',
      pitfalls: [
        'Пароль акаунта за IMAP не працює. Пароль застосунку створюється в «Settings → Privacy & Security → App Passwords», по одному на програму.',
        'Тариф Basic не включає IMAP, POP, CalDAV і CardDAV. Якщо тариф Basic, зовнішній клієнт не підключиться, хоч би що ви вводили: це питання тарифу, а не налаштувань.',
        'Пароль двокрокової перевірки — це не пароль застосунку. З ним буде та сама помилка авторизації.',
        'Логін — повна адреса; для власного домену на Fastmail це адреса на вашому домені, а не на fastmail.com.',
      ],
      faq: [
        [
          'Де створюються паролі застосунків?',
          'Fastmail: «Settings → Privacy & Security → App Passwords». Дайте паролю назву, скопіюйте одразу та видаліть там само, коли він більше не потрібен.',
        ],
        [
          'Чому правильний пароль не приймається?',
          'Бо Fastmail навмисно не приймає за IMAP пароль акаунта. Підходить лише пароль застосунку — або на вашому тарифі IMAP не увімкнений зовсім.',
        ],
        [
          'Чи змінюється хост для власного домену?',
          'Ні. Скриньки на власному домені, розміщені у Fastmail, підключаються до imap.fastmail.com на порту 993 із SSL.',
        ],
        [
          'Чи можна піти з Fastmail, нічого не втративши?',
          'Так. Перенесення копіює листи, папки, прапорці та дати; скринька у Fastmail лишається рівно такою, якою була.',
        ],
      ],
    },
  },

  {
    slug: 'proton-mail',
    name: 'Proton Mail',
    domains: ['proton.me', 'protonmail.com'],
    imap: { host: '127.0.0.1', port: 1143, security: 'STARTTLS' },
    smtp: { host: '127.0.0.1', port: 1025, security: 'STARTTLS' },
    login: 'email',
    auth: 'bridge',
    sources: ['https://autoconfig.protonmail.com/mail/config-v1.1.xml'],
    checked: '2026-09-15',
    en: {
      title: 'Proton Mail IMAP settings — why there is no server to connect to',
      description:
        'Proton Mail has no public IMAP host. Access goes through Proton Mail Bridge on 127.0.0.1:1143, which needs a paid plan and a running desktop app.',
      h1: 'Proton Mail IMAP settings',
      intro:
        'Proton Mail has no IMAP server you can connect to from the outside, and that is not an oversight: mail is stored encrypted, and only your own device holds the key. Access for mail clients goes through Proton Mail Bridge — a desktop application that decrypts locally and serves IMAP at 127.0.0.1, on your own machine. Which is why an online migration service cannot reach a Proton mailbox at all, ours included.',
      pitfalls: [
        'There is no public hostname. The address a client connects to is 127.0.0.1 — your own computer — port 1143 with STARTTLS, served by Bridge.',
        'Bridge requires a paid Proton plan. On the free plan no mail client can connect, and nothing in the settings changes that.',
        'Bridge has to be running during the whole migration. Close it and the connection dies mid-transfer.',
        'The password is the one Bridge shows you, not your Proton account password.',
      ],
      faq: [
        [
          'Can MoveMailbox migrate a Proton mailbox online?',
          'No, and neither can any other hosted service. Bridge listens on 127.0.0.1, which only your own machine can reach. Use the desktop client on the same computer where Bridge runs — that works.',
        ],
        [
          'Which port does Bridge use?',
          'IMAP on 1143 and SMTP on 1025, both with STARTTLS, both on 127.0.0.1. Bridge shows the exact values, including the generated password.',
        ],
        [
          'Is there any way without a paid plan?',
          'Not over IMAP. The free plan has no Bridge, so a mail client cannot connect at all; exporting through the web interface is the remaining route.',
        ],
        [
          'Can I migrate into Proton instead?',
          'Same rule in reverse: the destination has to be reachable, so it works with Bridge running locally and our desktop client on that machine.',
        ],
      ],
    },
    ru: {
      title: 'Настройки IMAP для Proton Mail — почему сервера нет',
      description:
        'У Proton Mail нет публичного IMAP-хоста. Доступ идёт через Proton Mail Bridge на 127.0.0.1:1143 — нужен платный тариф и запущенное приложение.',
      h1: 'Настройки IMAP для Proton Mail',
      intro:
        'У Proton Mail нет IMAP-сервера, к которому можно подключиться снаружи, и это не упущение: почта хранится зашифрованной, а ключ есть только на вашем устройстве. Доступ для почтовых программ идёт через Proton Mail Bridge — настольное приложение, которое расшифровывает письма локально и отдаёт IMAP на 127.0.0.1, то есть на вашей же машине. Поэтому онлайн-сервис переноса до ящика Proton не дотянется в принципе — наш в том числе.',
      pitfalls: [
        'Публичного хоста не существует. Адрес, к которому подключается клиент, — 127.0.0.1, ваш собственный компьютер, порт 1143 со STARTTLS, и отдаёт его Bridge.',
        'Bridge доступен только на платном тарифе Proton. На бесплатном ни один почтовый клиент не подключится, и настройками это не обходится.',
        'Bridge должен быть запущен всё время переноса. Закрыли — соединение обрывается на середине.',
        'Пароль — тот, который показывает Bridge, а не пароль от аккаунта Proton.',
      ],
      faq: [
        [
          'Может ли MoveMailbox перенести ящик Proton онлайн?',
          'Нет, как и любой другой облачный сервис. Bridge слушает 127.0.0.1, куда есть доступ только у вашей машины. Рабочий путь — настольный клиент на том же компьютере, где запущен Bridge.',
        ],
        [
          'Какие порты у Bridge?',
          'IMAP — 1143, SMTP — 1025, оба со STARTTLS и оба на 127.0.0.1. Точные значения и сгенерированный пароль Bridge показывает у себя в окне.',
        ],
        [
          'Есть ли способ без платного тарифа?',
          'По IMAP — нет. На бесплатном тарифе Bridge недоступен, и почтовый клиент не подключится вовсе; остаётся выгрузка через веб-интерфейс.',
        ],
        [
          'А перенести почту в Proton?',
          'То же правило наоборот: сторона назначения должна быть доступна, поэтому работает связка «запущенный Bridge и наш настольный клиент на этой же машине».',
        ],
      ],
    },
    uk: {
      title: 'Налаштування IMAP для Proton Mail — чому сервера немає',
      description:
        'У Proton Mail немає публічного IMAP-хоста. Доступ іде через Proton Mail Bridge на 127.0.0.1:1143 — потрібен платний тариф і запущений застосунок.',
      h1: 'Налаштування IMAP для Proton Mail',
      intro:
        'У Proton Mail немає IMAP-сервера, до якого можна підключитися ззовні, і це не недогляд: пошта зберігається зашифрованою, а ключ є лише на вашому пристрої. Доступ для поштових програм іде через Proton Mail Bridge — настільний застосунок, який розшифровує листи локально й віддає IMAP на 127.0.0.1, тобто на вашій же машині. Тому онлайн-сервіс перенесення до скриньки Proton не дотягнеться в принципі — наш зокрема.',
      pitfalls: [
        'Публічного хоста не існує. Адреса, до якої підключається клієнт, — 127.0.0.1, ваш власний комп’ютер, порт 1143 зі STARTTLS, і віддає його Bridge.',
        'Bridge доступний лише на платному тарифі Proton. На безкоштовному жоден поштовий клієнт не підключиться, і налаштуваннями це не обходиться.',
        'Bridge має бути запущений увесь час перенесення. Закрили — з’єднання обривається на середині.',
        'Пароль — той, який показує Bridge, а не пароль від акаунта Proton.',
      ],
      faq: [
        [
          'Чи може MoveMailbox перенести скриньку Proton онлайн?',
          'Ні, як і будь-який інший хмарний сервіс. Bridge слухає 127.0.0.1, куди має доступ лише ваша машина. Робочий шлях — настільний клієнт на тому самому комп’ютері, де запущено Bridge.',
        ],
        [
          'Які порти у Bridge?',
          'IMAP — 1143, SMTP — 1025, обидва зі STARTTLS і обидва на 127.0.0.1. Точні значення та згенерований пароль Bridge показує у своєму вікні.',
        ],
        [
          'Чи є спосіб без платного тарифу?',
          'За IMAP — ні. На безкоштовному тарифі Bridge недоступний, і поштовий клієнт не підключиться взагалі; лишається вивантаження через вебінтерфейс.',
        ],
        [
          'А перенести пошту в Proton?',
          'Те саме правило навпаки: сторона призначення має бути доступною, тому працює зв’язка «запущений Bridge і наш настільний клієнт на цій же машині».',
        ],
      ],
    },
  },

  {
    slug: 'comcast-xfinity',
    name: 'Comcast Xfinity',
    domains: ['comcast.net'],
    imap: { host: 'imap.comcast.net', port: 993, security: 'SSL/TLS' },
    smtp: { host: 'smtp.comcast.net', port: 587, security: 'STARTTLS' },
    login: 'email',
    auth: 'password',
    sources: [
      'https://autoconfig.thunderbird.net/v1.1/comcast.net',
      'https://www.xfinity.com/support/articles/third-party-email-access',
    ],
    checked: '2026-09-15',
    en: {
      title: 'Comcast Xfinity IMAP settings — host, port, third-party access',
      description:
        'IMAP for a comcast.net mailbox: imap.comcast.net, port 993, SSL. Why every client fails until you tick one box in Xfinity Email security.',
      h1: 'Comcast Xfinity IMAP settings',
      intro:
        'Comcast blocks mail clients outright until you allow them yourself. The setting is a single checkbox buried in Xfinity Email security, and while it is off, every client fails with what looks like a password problem — the password is fine, the account simply refuses anything that is not the web interface.',
      pitfalls: [
        'Third-party access is off by default. Turn it on at connect.xfinity.com → the gear icon → Email Settings → Security → the box under Third Party Access Security.',
        'Until that box is ticked no client connects, no matter how right the host, port and password are. The error looks like bad credentials, which is why people spend an evening re-typing their password.',
        'The username is the full address, including @comcast.net.',
        'Outgoing mail goes through smtp.comcast.net on port 587 with STARTTLS; the encrypted IMAP port is 993.',
      ],
      faq: [
        [
          'Where is the third-party access setting?',
          'Sign in to Xfinity Email at connect.xfinity.com, open the gear icon → Email Settings → Security, and tick the box under Third Party Access Security. It takes effect right away.',
        ],
        [
          'Do I need an app password?',
          'No. Comcast takes the account password over IMAP once third-party access is allowed — the checkbox is the gate here, not a separate password.',
        ],
        [
          'Which ports does Comcast use?',
          'IMAP 993 with SSL/TLS (or 143 with STARTTLS), SMTP 587 with STARTTLS or 465 with SSL.',
        ],
        [
          'Can I move a comcast.net mailbox to Gmail or Microsoft 365?',
          'Yes. Allow third-party access, use imap.comcast.net as the source and the new mailbox as the destination. Nothing is deleted at Comcast: the default mode only copies.',
        ],
      ],
    },
    ru: {
      title: 'Настройки IMAP для Comcast Xfinity — хост, порт, доступ программам',
      description:
        'IMAP для ящика comcast.net: imap.comcast.net, порт 993, SSL. Почему клиент не подключается, пока в настройках Xfinity не разрешить доступ.',
      h1: 'Настройки IMAP для Comcast Xfinity',
      intro:
        'Comcast блокирует почтовые программы, пока вы сами их не разрешите. Настройка — одна галочка в разделе безопасности Xfinity Email, и пока она снята, любой клиент падает с тем, что выглядит как неверный пароль. Пароль при этом верный: аккаунт просто не пускает никого, кроме веб-интерфейса.',
      pitfalls: [
        'Доступ сторонним программам выключен по умолчанию. Включается на connect.xfinity.com: шестерёнка → «Email Settings» → «Security» → галочка в разделе Third Party Access Security.',
        'Пока галочка снята, не подключится ни один клиент, каким бы верным ни были хост, порт и пароль. Ошибка выглядит как неверные учётные данные — отсюда вечер, потраченный на перенабор пароля.',
        'Логин — полный адрес, вместе с @comcast.net.',
        'Отправка идёт через smtp.comcast.net на порту 587 со STARTTLS; шифрованный порт IMAP — 993.',
      ],
      faq: [
        [
          'Где находится разрешение для сторонних программ?',
          'Войдите в Xfinity Email на connect.xfinity.com, откройте шестерёнку → «Email Settings» → «Security» и поставьте галочку в разделе Third Party Access Security. Действует сразу.',
        ],
        [
          'Нужен ли пароль приложения?',
          'Нет. Comcast принимает по IMAP обычный пароль аккаунта, когда доступ сторонним программам разрешён: здесь пропуском служит галочка, а не отдельный пароль.',
        ],
        [
          'Какие порты у Comcast?',
          'IMAP — 993 с SSL/TLS (или 143 со STARTTLS), SMTP — 587 со STARTTLS либо 465 с SSL.',
        ],
        [
          'Можно ли перенести ящик comcast.net в Gmail или Microsoft 365?',
          'Да. Разрешите доступ сторонним программам, укажите imap.comcast.net источником, новый ящик — назначением. В Comcast ничего не удаляется: базовый режим только копирует.',
        ],
      ],
    },
    uk: {
      title: 'Налаштування IMAP для Comcast Xfinity — хост, порт, доступ програмам',
      description:
        'IMAP для скриньки comcast.net: imap.comcast.net, порт 993, SSL. Чому клієнт не підключається, доки в налаштуваннях Xfinity не дозволити доступ.',
      h1: 'Налаштування IMAP для Comcast Xfinity',
      intro:
        'Comcast блокує поштові програми, доки ви самі їх не дозволите. Налаштування — одна позначка в розділі безпеки Xfinity Email, і доки вона знята, будь-який клієнт падає з тим, що виглядає як невірний пароль. Пароль при цьому правильний: акаунт просто не пускає нікого, крім вебінтерфейсу.',
      pitfalls: [
        'Доступ стороннім програмам вимкнений за замовчуванням. Вмикається на connect.xfinity.com: шестерня → «Email Settings» → «Security» → позначка в розділі Third Party Access Security.',
        'Доки позначку знято, не підключиться жоден клієнт, хоч би якими правильними були хост, порт і пароль. Помилка виглядає як невірні облікові дані — звідси вечір, витрачений на перенабирання пароля.',
        'Логін — повна адреса, разом із @comcast.net.',
        'Надсилання йде через smtp.comcast.net на порту 587 зі STARTTLS; шифрований порт IMAP — 993.',
      ],
      faq: [
        [
          'Де знаходиться дозвіл для сторонніх програм?',
          'Увійдіть у Xfinity Email на connect.xfinity.com, відкрийте шестерню → «Email Settings» → «Security» і поставте позначку в розділі Third Party Access Security. Діє одразу.',
        ],
        [
          'Чи потрібен пароль застосунку?',
          'Ні. Comcast приймає за IMAP звичайний пароль акаунта, коли доступ стороннім програмам дозволено: тут перепусткою служить позначка, а не окремий пароль.',
        ],
        [
          'Які порти у Comcast?',
          'IMAP — 993 із SSL/TLS (або 143 зі STARTTLS), SMTP — 587 зі STARTTLS чи 465 із SSL.',
        ],
        [
          'Чи можна перенести скриньку comcast.net у Gmail або Microsoft 365?',
          'Так. Дозвольте доступ стороннім програмам, укажіть imap.comcast.net джерелом, нову скриньку — призначенням. У Comcast нічого не видаляється: базовий режим лише копіює.',
        ],
      ],
    },
  },

  {
    slug: 'att',
    name: 'AT&T Mail',
    domains: ['att.net', 'sbcglobal.net', 'bellsouth.net'],
    imap: { host: 'imap.mail.att.net', port: 993, security: 'SSL/TLS' },
    smtp: { host: 'smtp.mail.att.net', port: 465, security: 'SSL/TLS' },
    login: 'email',
    auth: 'app-password',
    sources: [
      'https://autoconfig.thunderbird.net/v1.1/att.net',
      'https://www.att.com/support/article/email-support/KM1240308/',
    ],
    checked: '2026-09-15',
    en: {
      title: 'AT&T Mail IMAP settings — host, port, secure mail key',
      description:
        'IMAP for att.net, sbcglobal.net and bellsouth.net: imap.mail.att.net, port 993, SSL. The account password is replaced by a secure mail key.',
      h1: 'AT&T Mail IMAP settings',
      intro:
        'AT&T does not take your account password from a mail client. Since 2019 every third-party program needs a secure mail key — a code generated in your AT&T profile that goes into the password field instead. Old sbcglobal.net and bellsouth.net addresses live on the same servers and follow the same rule.',
      pitfalls: [
        'The account password is refused. Generate a secure mail key in your AT&T profile and paste it into both the IMAP and the SMTP password fields.',
        'The key is per program, and each device you set up gets its own. Revoking one does not lock the others out — convenient when a migration is over.',
        'sbcglobal.net and bellsouth.net are AT&T mailboxes. Their settings are the AT&T ones; there is no separate server left under those names.',
        'The username is the full address, whichever of the three domains it ends with.',
      ],
      faq: [
        [
          'What is a secure mail key?',
          'A code generated in your AT&T profile that replaces the account password in mail clients. It does not change the password you use on AT&T websites.',
        ],
        [
          'Where do I create one?',
          'In the myAT&T profile, under the secure mail key section: create the key, name it after the program, and copy it — it goes into the password field of the client.',
        ],
        [
          'My address is @sbcglobal.net — what do I use?',
          'The AT&T settings: imap.mail.att.net on 993 with SSL, and a secure mail key as the password.',
        ],
        [
          'Will anything be deleted at AT&T when I migrate?',
          'No. The default mode copies messages and folders and leaves the source untouched.',
        ],
      ],
    },
    ru: {
      title: 'Настройки IMAP для AT&T Mail — хост, порт, secure mail key',
      description:
        'IMAP для att.net, sbcglobal.net и bellsouth.net: imap.mail.att.net, порт 993, SSL. Вместо пароля аккаунта используется secure mail key.',
      h1: 'Настройки IMAP для AT&T Mail',
      intro:
        'AT&T не принимает пароль аккаунта от почтовой программы. С 2019 года любой сторонней программе нужен secure mail key — код, который создаётся в профиле AT&T и вводится вместо пароля. Старые адреса sbcglobal.net и bellsouth.net живут на тех же серверах и подчиняются тому же правилу.',
      pitfalls: [
        'Пароль аккаунта не принимается. Создайте secure mail key в профиле AT&T и вводите его и в поле пароля IMAP, и в поле пароля SMTP.',
        'Ключ выдаётся на программу, и у каждого настроенного устройства он свой. Отзыв одного не отключает остальные — удобно, когда перенос закончен.',
        'sbcglobal.net и bellsouth.net — это ящики AT&T. Настройки у них AT&T-овские, отдельных серверов под этими именами не осталось.',
        'Логин — полный адрес, на каком бы из трёх доменов он ни был.',
      ],
      faq: [
        [
          'Что такое secure mail key?',
          'Код, который создаётся в профиле AT&T и заменяет пароль аккаунта в почтовых программах. Пароль для сайтов AT&T он не меняет.',
        ],
        [
          'Где его создать?',
          'В профиле myAT&T, в разделе secure mail key: создать ключ, назвать по имени программы и скопировать — он и пойдёт в поле пароля клиента.',
        ],
        [
          'У меня адрес @sbcglobal.net — какие настройки?',
          'AT&T-овские: imap.mail.att.net, порт 993 с SSL, паролем — secure mail key.',
        ],
        [
          'Удалится ли что-нибудь в AT&T при переносе?',
          'Нет. Базовый режим копирует письма и папки, источник остаётся нетронутым.',
        ],
      ],
    },
    uk: {
      title: 'Налаштування IMAP для AT&T Mail — хост, порт, secure mail key',
      description:
        'IMAP для att.net, sbcglobal.net і bellsouth.net: imap.mail.att.net, порт 993, SSL. Замість пароля акаунта використовується secure mail key.',
      h1: 'Налаштування IMAP для AT&T Mail',
      intro:
        'AT&T не приймає пароль акаунта від поштової програми. З 2019 року будь-якій сторонній програмі потрібен secure mail key — код, який створюється у профілі AT&T і вводиться замість пароля. Старі адреси sbcglobal.net і bellsouth.net живуть на тих самих серверах і підпорядковані тому ж правилу.',
      pitfalls: [
        'Пароль акаунта не приймається. Створіть secure mail key у профілі AT&T і вводьте його і в поле пароля IMAP, і в поле пароля SMTP.',
        'Ключ видається на програму, і в кожного налаштованого пристрою він свій. Відкликання одного не вимикає інші — зручно, коли перенесення завершено.',
        'sbcglobal.net і bellsouth.net — це скриньки AT&T. Налаштування в них AT&T-івські, окремих серверів під цими іменами не лишилося.',
        'Логін — повна адреса, на якому б із трьох доменів вона не була.',
      ],
      faq: [
        [
          'Що таке secure mail key?',
          'Код, який створюється у профілі AT&T і замінює пароль акаунта в поштових програмах. Пароль для сайтів AT&T він не змінює.',
        ],
        [
          'Де його створити?',
          'У профілі myAT&T, у розділі secure mail key: створити ключ, назвати за іменем програми та скопіювати — він і піде в поле пароля клієнта.',
        ],
        [
          'У мене адреса @sbcglobal.net — які налаштування?',
          'AT&T-івські: imap.mail.att.net, порт 993 із SSL, паролем — secure mail key.',
        ],
        [
          'Чи видалиться щось в AT&T під час перенесення?',
          'Ні. Базовий режим копіює листи й папки, джерело залишається недоторканим.',
        ],
      ],
    },
  },

  {
    slug: 'cox',
    name: 'Cox Email',
    domains: ['cox.net'],
    imap: { host: 'imap.mail.yahoo.com', port: 993, security: 'SSL/TLS' },
    smtp: { host: 'smtp.mail.yahoo.com', port: 465, security: 'SSL/TLS' },
    login: 'email',
    auth: 'app-password',
    sources: [
      'https://autoconfig.thunderbird.net/v1.1/cox.net',
      'https://help.yahoo.com/kb/SLN36637.html',
    ],
    checked: '2026-09-15',
    en: {
      title: 'Cox email IMAP settings — cox.net runs on Yahoo now',
      description:
        'cox.net mailboxes moved to Yahoo in 2024. The IMAP host is imap.mail.yahoo.com, port 993, SSL, and a Yahoo app password is required.',
      h1: 'Cox email IMAP settings',
      intro:
        'There is no Cox mail server left to point a client at. Cox finished moving residential cox.net mailboxes to Yahoo in 2024: the address stayed the same, the servers behind it did not. Anything still configured with an old cox.net host will simply stop connecting, and the settings to use are Yahoo\'s.',
      pitfalls: [
        'The host is imap.mail.yahoo.com, not anything at cox.net. Old settings kept from before the move are the usual reason a client suddenly stopped working.',
        'A Yahoo app password is required. The password you use to sign in is refused by third-party clients.',
        'The username stays your full cox.net address — the mailbox moved, the address did not.',
        'Yahoo also offers export.imap.mail.yahoo.com for pulling a whole mailbox; that is the host meant for bulk reads such as a migration.',
      ],
      faq: [
        [
          'Why did my Cox email stop working in Outlook?',
          'Because the mailbox moved to Yahoo and the old Cox server no longer answers. Replace the host with imap.mail.yahoo.com and the password with a Yahoo app password.',
        ],
        [
          'Where do I generate the app password?',
          'In Yahoo Account Security, under app passwords. Sign in with the cox.net address — the account is a Yahoo account now.',
        ],
        [
          'Can I move my cox.net mail somewhere else entirely?',
          'Yes, and many people do after a move like this. Use imap.mail.yahoo.com as the source with an app password; messages, folders and dates come across.',
        ],
        [
          'Is my old mail still there?',
          'Messages, folders and other eligible data moved with the account. Whatever is visible in the web interface is what a client sees over IMAP.',
        ],
      ],
    },
    ru: {
      title: 'Настройки IMAP для Cox — cox.net теперь на серверах Yahoo',
      description:
        'Ящики cox.net переехали на Yahoo в 2024 году. Хост IMAP — imap.mail.yahoo.com, порт 993, SSL, и нужен пароль приложения Yahoo.',
      h1: 'Настройки IMAP для Cox',
      intro:
        'Почтового сервера Cox больше не существует. В 2024 году Cox завершил перевод домашних ящиков cox.net на Yahoo: адрес остался прежним, а серверы за ним — нет. Клиент, настроенный на старый хост cox.net, просто перестанет подключаться, и верные настройки здесь — Yahoo-вские.',
      pitfalls: [
        'Хост — imap.mail.yahoo.com, а не что-либо на cox.net. Старые настройки, оставшиеся с прежних времён, и есть обычная причина, по которой почта вдруг отвалилась.',
        'Нужен пароль приложения Yahoo. Пароль, которым вы входите в почту, сторонние клиенты не принимают.',
        'Логин остаётся вашим полным адресом на cox.net — переехал ящик, а не адрес.',
        'У Yahoo есть и отдельный хост для полной выгрузки — export.imap.mail.yahoo.com. Он предназначен как раз для массового чтения, то есть для переноса.',
      ],
      faq: [
        [
          'Почему почта Cox перестала работать в Outlook?',
          'Потому что ящик переехал на Yahoo, а старый сервер Cox больше не отвечает. Замените хост на imap.mail.yahoo.com, а пароль — на пароль приложения Yahoo.',
        ],
        [
          'Где создать пароль приложения?',
          'В настройках безопасности аккаунта Yahoo, в разделе app passwords. Входить нужно под адресом на cox.net — это теперь аккаунт Yahoo.',
        ],
        [
          'Можно ли уйти с cox.net совсем?',
          'Да, после такого переезда так делают часто. Источник — imap.mail.yahoo.com с паролем приложения; письма, папки и даты переносятся.',
        ],
        [
          'Старая почта на месте?',
          'Письма, папки и прочие подходящие данные переехали вместе с аккаунтом. Что видно в веб-интерфейсе, то клиент и увидит по IMAP.',
        ],
      ],
    },
    uk: {
      title: 'Налаштування IMAP для Cox — cox.net тепер на серверах Yahoo',
      description:
        'Скриньки cox.net переїхали на Yahoo у 2024 році. Хост IMAP — imap.mail.yahoo.com, порт 993, SSL, і потрібен пароль застосунку Yahoo.',
      h1: 'Налаштування IMAP для Cox',
      intro:
        'Поштового сервера Cox більше не існує. У 2024 році Cox завершив переведення домашніх скриньок cox.net на Yahoo: адреса лишилася та сама, а сервери за нею — ні. Клієнт, налаштований на старий хост cox.net, просто перестане підключатися, і правильні налаштування тут — Yahoo-івські.',
      pitfalls: [
        'Хост — imap.mail.yahoo.com, а не щось на cox.net. Старі налаштування, що лишилися з колишніх часів, і є звичайна причина, чому пошта раптом відвалилася.',
        'Потрібен пароль застосунку Yahoo. Пароль, яким ви входите в пошту, сторонні клієнти не приймають.',
        'Логін лишається вашою повною адресою на cox.net — переїхала скринька, а не адреса.',
        'У Yahoo є й окремий хост для повного вивантаження — export.imap.mail.yahoo.com. Він призначений саме для масового читання, тобто для перенесення.',
      ],
      faq: [
        [
          'Чому пошта Cox перестала працювати в Outlook?',
          'Бо скринька переїхала на Yahoo, а старий сервер Cox більше не відповідає. Замініть хост на imap.mail.yahoo.com, а пароль — на пароль застосунку Yahoo.',
        ],
        [
          'Де створити пароль застосунку?',
          'У налаштуваннях безпеки акаунта Yahoo, у розділі app passwords. Входити треба під адресою на cox.net — це тепер акаунт Yahoo.',
        ],
        [
          'Чи можна піти з cox.net зовсім?',
          'Так, після такого переїзду так роблять часто. Джерело — imap.mail.yahoo.com із паролем застосунку; листи, папки та дати переносяться.',
        ],
        [
          'Чи стара пошта на місці?',
          'Листи, папки та інші придатні дані переїхали разом з акаунтом. Що видно у вебінтерфейсі, те клієнт і побачить за IMAP.',
        ],
      ],
    },
  },

  {
    slug: 'godaddy',
    name: 'GoDaddy Workspace Email',
    domains: ['secureserver.net'],
    imap: { host: 'imap.secureserver.net', port: 993, security: 'SSL/TLS' },
    smtp: { host: 'smtpout.secureserver.net', port: 465, security: 'SSL/TLS' },
    login: 'email',
    auth: 'password',
    sources: [
      'https://autoconfig.thunderbird.net/v1.1/secureserver.net',
      'https://gdhelp.godaddy.com/help/my-workspace-email-is-moving-to-microsoft-365-32394',
    ],
    checked: '2026-09-15',
    en: {
      title: 'GoDaddy email IMAP settings — Workspace and Microsoft 365',
      description:
        'IMAP for GoDaddy mail: imap.secureserver.net, port 993, SSL for legacy Workspace Email — and outlook.office365.com once the account has moved.',
      h1: 'GoDaddy email IMAP settings',
      intro:
        'GoDaddy has two different mail products behind one bill, and the settings depend on which one your mailbox is on. Legacy Workspace Email answers at secureserver.net; GoDaddy is retiring it and moving accounts to Microsoft 365, and a migrated mailbox no longer lives at those hosts at all. Checking which one you are on takes a minute and saves an hour.',
      pitfalls: [
        'Workspace Email uses imap.secureserver.net on 993 with SSL. If your account has already been moved to Microsoft 365, the host is outlook.office365.com instead — the secureserver hosts will not authenticate you.',
        'Workspace Email is being retired. A migration to another provider is easier to run before that transition than after, when the mailbox has to be treated as Microsoft 365.',
        'On Microsoft 365 basic authentication is mostly disabled, so an IMAP migration from a moved mailbox needs OAuth rather than a plain password.',
        'The username is the full address; sending goes through smtpout.secureserver.net on 465.',
      ],
      faq: [
        [
          'How do I tell which product my mailbox is on?',
          'Look at where webmail signs you in: a Workspace mailbox uses GoDaddy\'s own webmail, a migrated one lands in Outlook on the web. The IMAP host follows from that.',
        ],
        [
          'Which host for legacy Workspace Email?',
          'imap.secureserver.net, port 993, SSL/TLS, with the full address as the username and the mailbox password.',
        ],
        [
          'And after the move to Microsoft 365?',
          'outlook.office365.com on 993. Microsoft 365 usually needs OAuth rather than a password — our Microsoft 365 guide covers that path.',
        ],
        [
          'Can I migrate away from GoDaddy without losing folders?',
          'Yes. Messages, the folder tree, flags and original dates come across; the source mailbox is left as it was.',
        ],
      ],
    },
    ru: {
      title: 'Настройки IMAP для почты GoDaddy — Workspace и Microsoft 365',
      description:
        'IMAP для почты GoDaddy: imap.secureserver.net, порт 993, SSL для старого Workspace Email — и outlook.office365.com, если ящик уже переехал.',
      h1: 'Настройки IMAP для почты GoDaddy',
      intro:
        'У GoDaddy за одним счётом стоят два разных почтовых продукта, и настройки зависят от того, на каком из них ваш ящик. Старый Workspace Email отвечает на secureserver.net; GoDaddy его сворачивает и переводит аккаунты на Microsoft 365, а переехавший ящик на этих хостах уже не живёт. Проверить, где вы, — минута, а экономит час.',
      pitfalls: [
        'Workspace Email — это imap.secureserver.net, порт 993 с SSL. Если аккаунт уже переведён на Microsoft 365, хост другой: outlook.office365.com, а secureserver вас просто не авторизует.',
        'Workspace Email сворачивается. Перенос к другому провайдеру проще сделать до этого перевода, чем после, когда ящик придётся считать ящиком Microsoft 365.',
        'В Microsoft 365 базовая авторизация в основном отключена, поэтому перенос из переехавшего ящика требует OAuth, а не обычного пароля.',
        'Логин — полный адрес; отправка идёт через smtpout.secureserver.net на порту 465.',
      ],
      faq: [
        [
          'Как понять, на каком продукте мой ящик?',
          'По тому, куда пускает веб-почта: ящик Workspace открывается в собственной почте GoDaddy, переехавший — в Outlook в браузере. Хост IMAP следует отсюда.',
        ],
        [
          'Какой хост у старого Workspace Email?',
          'imap.secureserver.net, порт 993, SSL/TLS, логин — полный адрес, пароль — от ящика.',
        ],
        [
          'А после перевода на Microsoft 365?',
          'outlook.office365.com, порт 993. Microsoft 365 обычно требует OAuth вместо пароля — этот путь разобран в нашем гайде по Microsoft 365.',
        ],
        [
          'Можно ли уйти от GoDaddy, не потеряв папки?',
          'Да. Письма, дерево папок, флаги и исходные даты переносятся; исходный ящик остаётся таким, каким был.',
        ],
      ],
    },
    uk: {
      title: 'Налаштування IMAP для пошти GoDaddy — Workspace і Microsoft 365',
      description:
        'IMAP для пошти GoDaddy: imap.secureserver.net, порт 993, SSL для старого Workspace Email — і outlook.office365.com, якщо скринька вже переїхала.',
      h1: 'Налаштування IMAP для пошти GoDaddy',
      intro:
        'У GoDaddy за одним рахунком стоять два різні поштові продукти, і налаштування залежать від того, на якому з них ваша скринька. Старий Workspace Email відповідає на secureserver.net; GoDaddy його згортає й переводить акаунти на Microsoft 365, а скринька, що переїхала, на цих хостах уже не живе. Перевірити, де ви, — хвилина, а економить годину.',
      pitfalls: [
        'Workspace Email — це imap.secureserver.net, порт 993 із SSL. Якщо акаунт уже переведено на Microsoft 365, хост інший: outlook.office365.com, а secureserver вас просто не авторизує.',
        'Workspace Email згортається. Перенесення до іншого провайдера простіше зробити до цього переведення, ніж після, коли скриньку доведеться вважати скринькою Microsoft 365.',
        'У Microsoft 365 базова авторизація здебільшого вимкнена, тому перенесення зі скриньки, що переїхала, потребує OAuth, а не звичайного пароля.',
        'Логін — повна адреса; надсилання йде через smtpout.secureserver.net на порту 465.',
      ],
      faq: [
        [
          'Як зрозуміти, на якому продукті моя скринька?',
          'За тим, куди пускає вебпошта: скринька Workspace відкривається у власній пошті GoDaddy, та, що переїхала, — в Outlook у браузері. Хост IMAP випливає звідси.',
        ],
        [
          'Який хост у старого Workspace Email?',
          'imap.secureserver.net, порт 993, SSL/TLS, логін — повна адреса, пароль — від скриньки.',
        ],
        [
          'А після переведення на Microsoft 365?',
          'outlook.office365.com, порт 993. Microsoft 365 зазвичай вимагає OAuth замість пароля — цей шлях розібрано в нашому гайді за Microsoft 365.',
        ],
        [
          'Чи можна піти від GoDaddy, не втративши папки?',
          'Так. Листи, дерево папок, прапорці та початкові дати переносяться; вихідна скринька лишається такою, якою була.',
        ],
      ],
    },
  },

  {
    slug: 'mail-com',
    name: 'mail.com',
    domains: ['mail.com', 'email.com', 'usa.com'],
    imap: { host: 'imap.mail.com', port: 993, security: 'SSL/TLS' },
    smtp: { host: 'smtp.mail.com', port: 465, security: 'SSL/TLS' },
    login: 'email',
    auth: 'password',
    sources: ['https://autoconfig.thunderbird.net/v1.1/mail.com'],
    checked: '2026-09-15',
    en: {
      title: 'mail.com IMAP settings — host, port, enabling access',
      description:
        'IMAP for a mail.com mailbox: imap.mail.com, port 993, SSL. Access for external programs is a setting in the mailbox, not a default.',
      h1: 'mail.com IMAP settings',
      intro:
        'mail.com belongs to the same operator as GMX and WEB.DE and inherits the family habit: access for external programs is something you switch on in the mailbox, not something that is already there. The hosts are its own, and the alias domains — email.com, usa.com and the rest — all connect to the same server.',
      pitfalls: [
        'Access for external programs is a mailbox setting. Until it is on, a client gets an authentication failure with a perfectly good password.',
        'All the alias domains use imap.mail.com. The address can end in email.com or usa.com; the host does not change.',
        'The username is the full address, alias domain included.',
        'Free mailboxes are dormancy-checked: an account left unused long enough can stop answering at all, which is worth knowing before you plan a migration out of one.',
      ],
      faq: [
        [
          'Where is IMAP switched on?',
          'In the mail.com web interface, in the settings section for POP3/IMAP access. The change applies immediately.',
        ],
        [
          'Does an email.com address use a different server?',
          'No. Every mail.com alias domain connects to imap.mail.com on port 993 with SSL/TLS.',
        ],
        [
          'Is an app password needed?',
          'No, the mailbox password is accepted once external access is enabled.',
        ],
        [
          'Can I keep the mail.com address after migrating?',
          'Yes — a migration copies the mail to another mailbox and changes nothing about the old address, which keeps working until you close it.',
        ],
      ],
    },
    ru: {
      title: 'Настройки IMAP для mail.com — хост, порт, включение доступа',
      description:
        'IMAP для ящика mail.com: imap.mail.com, порт 993, SSL. Доступ внешним программам включается в настройках ящика, а не работает сразу.',
      h1: 'Настройки IMAP для mail.com',
      intro:
        'mail.com принадлежит тому же оператору, что GMX и WEB.DE, и наследует семейную привычку: доступ внешним программам здесь включают в настройках ящика, а не получают по умолчанию. Хосты у сервиса свои, а все домены-синонимы — email.com, usa.com и прочие — подключаются к тому же серверу.',
      pitfalls: [
        'Доступ внешним программам — настройка ящика. Пока она выключена, клиент получает ошибку авторизации при совершенно верном пароле.',
        'Все домены-синонимы работают через imap.mail.com. Адрес может оканчиваться на email.com или usa.com — хост от этого не меняется.',
        'Логин — полный адрес, вместе с доменом-синонимом.',
        'Бесплатные ящики проверяются на заброшенность: аккаунт, которым долго не пользовались, может перестать отвечать вовсе. Это стоит учесть, планируя перенос именно из такого ящика.',
      ],
      faq: [
        [
          'Где включается IMAP?',
          'В веб-интерфейсе mail.com, в разделе настроек доступа по POP3/IMAP. Изменение действует сразу.',
        ],
        [
          'У адреса на email.com другой сервер?',
          'Нет. Все домены-синонимы mail.com подключаются к imap.mail.com на порту 993 с SSL/TLS.',
        ],
        [
          'Нужен ли пароль приложения?',
          'Нет, при включённом внешнем доступе принимается обычный пароль ящика.',
        ],
        [
          'Можно ли сохранить адрес на mail.com после переноса?',
          'Да — перенос копирует почту в другой ящик и ничего не меняет в старом адресе: он работает, пока вы сами его не закроете.',
        ],
      ],
    },
    uk: {
      title: 'Налаштування IMAP для mail.com — хост, порт, увімкнення доступу',
      description:
        'IMAP для скриньки mail.com: imap.mail.com, порт 993, SSL. Доступ зовнішнім програмам вмикається в налаштуваннях скриньки, а не працює одразу.',
      h1: 'Налаштування IMAP для mail.com',
      intro:
        'mail.com належить тому самому оператору, що GMX і WEB.DE, і успадковує родинну звичку: доступ зовнішнім програмам тут вмикають у налаштуваннях скриньки, а не отримують за замовчуванням. Хости в сервісу свої, а всі домени-синоніми — email.com, usa.com та інші — підключаються до того самого сервера.',
      pitfalls: [
        'Доступ зовнішнім програмам — налаштування скриньки. Доки воно вимкнене, клієнт отримує помилку авторизації за цілком правильного пароля.',
        'Усі домени-синоніми працюють через imap.mail.com. Адреса може закінчуватися на email.com чи usa.com — хост від цього не змінюється.',
        'Логін — повна адреса, разом із доменом-синонімом.',
        'Безкоштовні скриньки перевіряються на занедбаність: акаунт, яким довго не користувалися, може перестати відповідати взагалі. Це варто врахувати, плануючи перенесення саме з такої скриньки.',
      ],
      faq: [
        [
          'Де вмикається IMAP?',
          'У вебінтерфейсі mail.com, у розділі налаштувань доступу за POP3/IMAP. Зміна діє одразу.',
        ],
        [
          'У адреси на email.com інший сервер?',
          'Ні. Усі домени-синоніми mail.com підключаються до imap.mail.com на порту 993 із SSL/TLS.',
        ],
        [
          'Чи потрібен пароль застосунку?',
          'Ні, за увімкненого зовнішнього доступу приймається звичайний пароль скриньки.',
        ],
        [
          'Чи можна зберегти адресу на mail.com після перенесення?',
          'Так — перенесення копіює пошту в іншу скриньку і нічого не змінює у старій адресі: вона працює, доки ви самі її не закриєте.',
        ],
      ],
    },
  },
];

export const imapHostSlugs = imapHosts.map((host) => host.slug);

export function findImapHost(slug: string): ImapHost | undefined {
  return imapHosts.find((host) => host.slug === slug);
}

export function isImapHostSlug(slug: string): boolean {
  return imapHostSlugs.includes(slug);
}
