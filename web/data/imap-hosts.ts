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
 * списываются с чужих обзоров. Основной источник — файл автоконфигурации:
 * либо база Mozilla (autoconfig.thunderbird.net), либо autoconfig-домен
 * самого сервиса. Это то же самое, что читает Thunderbird, когда
 * подставляет настройки сам. У части хостеров такого файла нет — там
 * источником служит их собственная документация, и это помечено полем
 * sourceKind, чтобы страница не ссылалась на автоконфигурацию, которой не
 * существует. Ссылки лежат в sources, дата проверки — в checked.
 *
 * Всё, что нельзя было подтвердить источником, на страницу не попало.
 * Неверный хост в такой таблице — это час чужого времени и обращение в
 * поддержку не по адресу. Так, для i.ua и meta.ua официальная документация
 * описывает только POP3: страниц по ним здесь нет, пока IMAP-хост не
 * подтверждён первоисточником.
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
  /**
   * Каким источником. 'autoconfig' — файл автоконфигурации (по умолчанию),
   * 'docs' — документация самого сервиса: у части хостеров файла нет, и
   * ссылаться на него было бы неправдой.
   */
  sourceKind?: 'autoconfig' | 'docs';
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

  {
    slug: 'ionos',
    name: 'IONOS',
    domains: ['ionos.com', 'ionos.de', '1and1.com'],
    imap: { host: 'imap.ionos.com', port: 993, security: 'SSL/TLS' },
    smtp: { host: 'smtp.ionos.com', port: 465, security: 'SSL/TLS' },
    login: 'email',
    auth: 'password',
    sources: [
      'https://www.ionos.com/help/email/other-email-programs/setting-up-an-ionos-email-account-in-apple-mail/',
      'https://www.ionos.co.uk/help/email/general-topics/ionos-mail-server-details-for-imap-pop3-and-smtp/',
    ],
    checked: '2026-09-15',
    sourceKind: 'docs',
    en: {
      title: 'IONOS IMAP settings — host, port, TLS requirement',
      description:
        'IMAP for an IONOS mailbox: imap.ionos.com, port 993, SSL. Regional hosts, the TLS 1.2 requirement and where the panel shows your exact server.',
      h1: 'IONOS IMAP settings',
      intro:
        'IONOS hosts mail for millions of domains under several brands and in several countries, which is why answers about "the IONOS server" disagree with each other. The documented host is imap.ionos.com; regional accounts can be served under a country domain instead, and the control panel always shows the one that belongs to your mailbox.',
      pitfalls: [
        'Regional hosts exist alongside imap.ionos.com. If authentication fails with a password you are sure about, check the mailbox settings in the IONOS panel for the server it names.',
        'TLS 1.0 and 1.1 are no longer accepted. An old client that cannot do TLS 1.2 fails at the encryption stage, which looks like a connection problem rather than a client problem.',
        'The username is the full address, not the customer number you sign in to the panel with.',
        'A mailbox moved to Microsoft 365 through IONOS is a Microsoft 365 mailbox: its host is outlook.office365.com, and the IONOS hosts will not authenticate it.',
      ],
      faq: [
        [
          'Which host do I use?',
          'imap.ionos.com on port 993 with SSL/TLS, and smtp.ionos.com on 465 for sending. If your account is regional, the panel shows the exact server for your mailbox.',
        ],
        [
          'Why does my old mail program suddenly fail?',
          'Most often because it only supports TLS 1.0 or 1.1, which IONOS has disabled. Updating the program fixes it; changing ports does not.',
        ],
        [
          'What is the username?',
          'The full email address. The customer number is for the IONOS control panel, not for IMAP.',
        ],
        [
          'Can I migrate a whole IONOS mailbox elsewhere?',
          'Yes — messages, folder tree, flags and dates transfer over IMAP, and the IONOS mailbox stays as it is until you delete it yourself.',
        ],
      ],
    },
    ru: {
      title: 'Настройки IMAP для IONOS — хост, порт, требование TLS',
      description:
        'IMAP для ящика IONOS: imap.ionos.com, порт 993, SSL. Региональные хосты, требование TLS 1.2 и где панель показывает ваш точный сервер.',
      h1: 'Настройки IMAP для IONOS',
      intro:
        'IONOS держит почту миллионов доменов под несколькими брендами и в нескольких странах — отсюда и противоречивые ответы про «сервер IONOS». Документированный хост — imap.ionos.com; региональные аккаунты могут обслуживаться на страновом домене, и панель управления всегда показывает тот, который относится к вашему ящику.',
      pitfalls: [
        'Кроме imap.ionos.com существуют региональные хосты. Если авторизация не проходит с паролем, в котором вы уверены, посмотрите в панели IONOS, какой сервер указан для этого ящика.',
        'TLS 1.0 и 1.1 больше не принимаются. Старый клиент, не умеющий TLS 1.2, падает на этапе шифрования — и это выглядит как проблема соединения, а не программы.',
        'Логин — полный адрес почты, а не номер клиента, под которым вы входите в панель.',
        'Ящик, переведённый через IONOS на Microsoft 365, — это ящик Microsoft 365: его хост outlook.office365.com, на хостах IONOS он не авторизуется.',
      ],
      faq: [
        [
          'Какой хост использовать?',
          'imap.ionos.com, порт 993 с SSL/TLS, отправка — smtp.ionos.com на 465. Если аккаунт региональный, точный сервер для вашего ящика показывает панель.',
        ],
        [
          'Почему старая почтовая программа вдруг перестала работать?',
          'Чаще всего потому, что она умеет только TLS 1.0 или 1.1, а IONOS их отключил. Помогает обновление программы, а не смена портов.',
        ],
        [
          'Что указывать логином?',
          'Полный адрес почты. Номер клиента — это для панели IONOS, а не для IMAP.',
        ],
        [
          'Можно ли перенести ящик IONOS целиком?',
          'Да — письма, дерево папок, флаги и даты переносятся по IMAP, а ящик в IONOS остаётся на месте, пока вы сами его не удалите.',
        ],
      ],
    },
    uk: {
      title: 'Налаштування IMAP для IONOS — хост, порт, вимога TLS',
      description:
        'IMAP для скриньки IONOS: imap.ionos.com, порт 993, SSL. Регіональні хости, вимога TLS 1.2 і де панель показує ваш точний сервер.',
      h1: 'Налаштування IMAP для IONOS',
      intro:
        'IONOS тримає пошту мільйонів доменів під кількома брендами та в кількох країнах — звідси й суперечливі відповіді про «сервер IONOS». Документований хост — imap.ionos.com; регіональні акаунти можуть обслуговуватися на країновому домені, і панель керування завжди показує той, що стосується вашої скриньки.',
      pitfalls: [
        'Крім imap.ionos.com існують регіональні хости. Якщо авторизація не проходить із паролем, в якому ви впевнені, подивіться в панелі IONOS, який сервер указано для цієї скриньки.',
        'TLS 1.0 і 1.1 більше не приймаються. Старий клієнт, що не вміє TLS 1.2, падає на етапі шифрування — і це виглядає як проблема з’єднання, а не програми.',
        'Логін — повна адреса пошти, а не номер клієнта, під яким ви входите в панель.',
        'Скринька, переведена через IONOS на Microsoft 365, — це скринька Microsoft 365: її хост outlook.office365.com, на хостах IONOS вона не авторизується.',
      ],
      faq: [
        [
          'Який хост використовувати?',
          'imap.ionos.com, порт 993 із SSL/TLS, надсилання — smtp.ionos.com на 465. Якщо акаунт регіональний, точний сервер для вашої скриньки показує панель.',
        ],
        [
          'Чому стара поштова програма раптом перестала працювати?',
          'Найчастіше тому, що вона вміє лише TLS 1.0 або 1.1, а IONOS їх вимкнув. Допомагає оновлення програми, а не зміна портів.',
        ],
        [
          'Що вказувати логіном?',
          'Повну адресу пошти. Номер клієнта — це для панелі IONOS, а не для IMAP.',
        ],
        [
          'Чи можна перенести скриньку IONOS цілком?',
          'Так — листи, дерево папок, прапорці та дати переносяться за IMAP, а скринька в IONOS лишається на місці, доки ви самі її не видалите.',
        ],
      ],
    },
  },

  {
    slug: 'hostinger',
    name: 'Hostinger',
    domains: ['hostinger.com'],
    imap: { host: 'imap.hostinger.com', port: 993, security: 'SSL/TLS' },
    smtp: { host: 'smtp.hostinger.com', port: 465, security: 'SSL/TLS' },
    login: 'email',
    auth: 'password',
    sources: [
      'https://www.hostinger.com/support/1575756-how-to-get-email-account-configuration-details-for-hostinger-email/',
      'https://www.hostinger.com/support/5966022-how-to-get-email-account-configuration-details-for-titan-email-at-hostinger/',
    ],
    checked: '2026-09-15',
    sourceKind: 'docs',
    en: {
      title: 'Hostinger IMAP settings — Hostinger Email and Titan',
      description:
        'IMAP for Hostinger Email: imap.hostinger.com, port 993, SSL. Titan Email sold through the same panel uses different servers.',
      h1: 'Hostinger IMAP settings',
      intro:
        'Hostinger sells two different mail products through one panel, and half the confusion about its settings comes from that. Hostinger Email answers at imap.hostinger.com; Titan Email is a separate service with its own servers, shown in Titan webmail under the settings for third-party apps. Check which one your domain uses before typing anything.',
      pitfalls: [
        'Hostinger Email and Titan Email are different products with different servers. imap.hostinger.com belongs to the first one only.',
        'For Titan, the exact host comes from Titan webmail → Settings → the section for configuring third-party apps. Do not guess it from a hosting article.',
        'The username is the full mailbox address, not the hPanel account you bought the hosting with.',
        'Only encrypted ports are served: IMAP 993 with SSL, SMTP 465 with SSL.',
      ],
      faq: [
        [
          'How do I tell which mail product I have?',
          'hPanel shows it next to the domain: either Hostinger Email or Titan. The connect-apps page in the panel prints the exact server for that mailbox.',
        ],
        [
          'Which host for Hostinger Email?',
          'imap.hostinger.com on 993 with SSL/TLS, and smtp.hostinger.com on 465. The username is the full address, and the password is the mailbox password.',
        ],
        [
          'Is an app password needed?',
          'No — Hostinger Email takes the mailbox password. The password you use for hPanel is a different one.',
        ],
        [
          'Can I move mail from Hostinger to another host?',
          'Yes. Point the source at the Hostinger mailbox over IMAP and the destination at the new one; folders, flags and dates come across, and nothing is deleted at the source.',
        ],
      ],
    },
    ru: {
      title: 'Настройки IMAP для Hostinger — Hostinger Email и Titan',
      description:
        'IMAP для Hostinger Email: imap.hostinger.com, порт 993, SSL. У Titan Email, который продаётся в той же панели, серверы другие.',
      h1: 'Настройки IMAP для Hostinger',
      intro:
        'Hostinger продаёт через одну панель два разных почтовых продукта, и половина путаницы с настройками именно отсюда. Hostinger Email отвечает на imap.hostinger.com; Titan Email — отдельный сервис со своими серверами, которые показывает веб-почта Titan в разделе настройки сторонних приложений. Прежде чем что-то вводить, посмотрите, какой из двух у вашего домена.',
      pitfalls: [
        'Hostinger Email и Titan Email — разные продукты с разными серверами. imap.hostinger.com относится только к первому.',
        'Для Titan точный хост берётся в веб-почте Titan: «Settings» → раздел настройки сторонних приложений. Не угадывайте его по статье про хостинг.',
        'Логин — полный адрес ящика, а не аккаунт hPanel, на который куплен хостинг.',
        'Обслуживаются только шифрованные порты: IMAP 993 с SSL, SMTP 465 с SSL.',
      ],
      faq: [
        [
          'Как понять, какой у меня почтовый продукт?',
          'hPanel показывает это рядом с доменом: Hostinger Email или Titan. Страница подключения приложений в панели печатает точный сервер для этого ящика.',
        ],
        [
          'Какой хост у Hostinger Email?',
          'imap.hostinger.com, порт 993 с SSL/TLS, отправка — smtp.hostinger.com на 465. Логин — полный адрес, пароль — от ящика.',
        ],
        [
          'Нужен ли пароль приложения?',
          'Нет — Hostinger Email принимает пароль ящика. Пароль от hPanel это другой пароль.',
        ],
        [
          'Можно ли перенести почту с Hostinger на другой хостинг?',
          'Да. Источник — ящик Hostinger по IMAP, назначение — новый ящик; папки, флаги и даты переносятся, в источнике ничего не удаляется.',
        ],
      ],
    },
    uk: {
      title: 'Налаштування IMAP для Hostinger — Hostinger Email і Titan',
      description:
        'IMAP для Hostinger Email: imap.hostinger.com, порт 993, SSL. У Titan Email, який продається в тій самій панелі, сервери інші.',
      h1: 'Налаштування IMAP для Hostinger',
      intro:
        'Hostinger продає через одну панель два різні поштові продукти, і половина плутанини з налаштуваннями саме звідси. Hostinger Email відповідає на imap.hostinger.com; Titan Email — окремий сервіс зі своїми серверами, які показує вебпошта Titan у розділі налаштування сторонніх застосунків. Перш ніж щось вводити, подивіться, який із двох у вашого домену.',
      pitfalls: [
        'Hostinger Email і Titan Email — різні продукти з різними серверами. imap.hostinger.com стосується лише першого.',
        'Для Titan точний хост береться у вебпошті Titan: «Settings» → розділ налаштування сторонніх застосунків. Не вгадуйте його за статтею про хостинг.',
        'Логін — повна адреса скриньки, а не акаунт hPanel, на який куплено хостинг.',
        'Обслуговуються лише шифровані порти: IMAP 993 із SSL, SMTP 465 із SSL.',
      ],
      faq: [
        [
          'Як зрозуміти, який у мене поштовий продукт?',
          'hPanel показує це поруч із доменом: Hostinger Email або Titan. Сторінка підключення застосунків у панелі друкує точний сервер для цієї скриньки.',
        ],
        [
          'Який хост у Hostinger Email?',
          'imap.hostinger.com, порт 993 із SSL/TLS, надсилання — smtp.hostinger.com на 465. Логін — повна адреса, пароль — від скриньки.',
        ],
        [
          'Чи потрібен пароль застосунку?',
          'Ні — Hostinger Email приймає пароль скриньки. Пароль від hPanel це інший пароль.',
        ],
        [
          'Чи можна перенести пошту з Hostinger на інший хостинг?',
          'Так. Джерело — скринька Hostinger за IMAP, призначення — нова скринька; папки, прапорці та дати переносяться, у джерелі нічого не видаляється.',
        ],
      ],
    },
  },

  {
    slug: 'namecheap-private-email',
    name: 'Namecheap Private Email',
    domains: ['privateemail.com'],
    imap: { host: 'mail.privateemail.com', port: 993, security: 'SSL/TLS' },
    smtp: { host: 'mail.privateemail.com', port: 465, security: 'SSL/TLS' },
    login: 'email',
    auth: 'password',
    sources: [
      'https://www.namecheap.com/support/knowledgebase/article.aspx/1179/2175/private-email-contact-details-and-mail-client-setup/',
    ],
    checked: '2026-09-15',
    sourceKind: 'docs',
    en: {
      title: 'Namecheap Private Email IMAP settings — host, port, passwords',
      description:
        'IMAP for Namecheap Private Email: mail.privateemail.com, port 993, SSL. One host for both directions, and app passwords alongside the master one.',
      h1: 'Namecheap Private Email IMAP settings',
      intro:
        'Namecheap Private Email uses a single host for both directions — mail.privateemail.com — which trips people up when a client asks for two different servers and they invent an imap. prefix that does not exist. Only encrypted connections are served, and besides the mailbox password you can issue application passwords.',
      pitfalls: [
        'Incoming and outgoing use the same hostname: mail.privateemail.com. There is no separate imap. host to guess at.',
        'Unencrypted connections are not served at all. Use 993 with SSL or 143 with STARTTLS for IMAP; 465 with SSL or 587 with STARTTLS for SMTP.',
        'Secure Password Authentication must be off in Outlook, and SMTP authentication must be on — the default combination in some clients is exactly the wrong one.',
        'The username is the full mailbox address, not the Namecheap account name.',
      ],
      faq: [
        [
          'What is the server address?',
          'mail.privateemail.com for both IMAP and SMTP. IMAP on 993 with SSL, SMTP on 465 with SSL.',
        ],
        [
          'Master password or application password?',
          'Either works. An application password is worth using for a migration — it is revoked afterwards without touching the mailbox password.',
        ],
        [
          'Why does Outlook keep rejecting the password?',
          'Check that Secure Password Authentication is unticked and that outgoing server authentication is on. With SPA enabled the correct password is refused.',
        ],
        [
          'Can I migrate mail into or out of Private Email?',
          'Both. Over IMAP the messages, folder tree, flags and dates transfer either way, and the source is never modified.',
        ],
      ],
    },
    ru: {
      title: 'Настройки IMAP для Namecheap Private Email — хост, порт, пароли',
      description:
        'IMAP для Namecheap Private Email: mail.privateemail.com, порт 993, SSL. Один хост в обе стороны и пароли приложений помимо основного.',
      h1: 'Настройки IMAP для Namecheap Private Email',
      intro:
        'У Namecheap Private Email один хост в обе стороны — mail.privateemail.com. На этом и спотыкаются: клиент просит два разных сервера, и человек придумывает префикс imap., которого не существует. Обслуживаются только шифрованные соединения, а кроме пароля ящика можно выпускать пароли приложений.',
      pitfalls: [
        'Входящая и исходящая почта — один и тот же хост: mail.privateemail.com. Отдельного сервера с префиксом imap. здесь нет.',
        'Нешифрованные соединения не обслуживаются вовсе. IMAP — 993 с SSL или 143 со STARTTLS; SMTP — 465 с SSL или 587 со STARTTLS.',
        'В Outlook нужно снять «Безопасная проверка пароля» (SPA) и включить авторизацию на SMTP — в некоторых клиентах по умолчанию стоит ровно наоборот.',
        'Логин — полный адрес ящика, а не имя аккаунта Namecheap.',
      ],
      faq: [
        [
          'Какой адрес сервера?',
          'mail.privateemail.com и для IMAP, и для SMTP. IMAP — порт 993 с SSL, SMTP — 465 с SSL.',
        ],
        [
          'Основной пароль или пароль приложения?',
          'Подходит любой. Для переноса удобнее пароль приложения: после окончания его отзывают, не трогая пароль ящика.',
        ],
        [
          'Почему Outlook не принимает верный пароль?',
          'Проверьте, что снята «Безопасная проверка пароля» (SPA) и включена авторизация на исходящем сервере. С включённым SPA верный пароль отвергается.',
        ],
        [
          'Можно ли переносить почту в Private Email и обратно?',
          'И то и другое. По IMAP письма, дерево папок, флаги и даты переносятся в обе стороны, источник при этом не меняется.',
        ],
      ],
    },
    uk: {
      title: 'Налаштування IMAP для Namecheap Private Email — хост, порт, паролі',
      description:
        'IMAP для Namecheap Private Email: mail.privateemail.com, порт 993, SSL. Один хост в обидва боки та паролі застосунків окрім основного.',
      h1: 'Налаштування IMAP для Namecheap Private Email',
      intro:
        'У Namecheap Private Email один хост в обидва боки — mail.privateemail.com. На цьому й спотикаються: клієнт просить два різні сервери, і людина вигадує префікс imap., якого не існує. Обслуговуються лише шифровані з’єднання, а окрім пароля скриньки можна випускати паролі застосунків.',
      pitfalls: [
        'Вхідна та вихідна пошта — той самий хост: mail.privateemail.com. Окремого сервера з префіксом imap. тут немає.',
        'Нешифровані з’єднання не обслуговуються взагалі. IMAP — 993 із SSL або 143 зі STARTTLS; SMTP — 465 із SSL або 587 зі STARTTLS.',
        'В Outlook треба зняти «Безпечну перевірку пароля» (SPA) і увімкнути авторизацію на SMTP — у деяких клієнтах за замовчуванням стоїть рівно навпаки.',
        'Логін — повна адреса скриньки, а не ім’я акаунта Namecheap.',
      ],
      faq: [
        [
          'Яка адреса сервера?',
          'mail.privateemail.com і для IMAP, і для SMTP. IMAP — порт 993 із SSL, SMTP — 465 із SSL.',
        ],
        [
          'Основний пароль чи пароль застосунку?',
          'Підходить будь-який. Для перенесення зручніший пароль застосунку: після завершення його відкликають, не чіпаючи пароль скриньки.',
        ],
        [
          'Чому Outlook не приймає правильний пароль?',
          'Перевірте, що знято «Безпечну перевірку пароля» (SPA) і увімкнено авторизацію на вихідному сервері. З увімкненим SPA правильний пароль відхиляється.',
        ],
        [
          'Чи можна переносити пошту в Private Email і назад?',
          'І те, і те. За IMAP листи, дерево папок, прапорці та дати переносяться в обидва боки, джерело при цьому не змінюється.',
        ],
      ],
    },
  },

  {
    slug: 'rackspace',
    name: 'Rackspace Email',
    domains: ['emailsrvr.com'],
    imap: { host: 'secure.emailsrvr.com', port: 993, security: 'SSL/TLS' },
    smtp: { host: 'secure.emailsrvr.com', port: 465, security: 'SSL/TLS' },
    login: 'email',
    auth: 'password',
    sources: ['https://docs.rackspace.com/docs/rackspace-email-settings'],
    checked: '2026-09-15',
    sourceKind: 'docs',
    en: {
      title: 'Rackspace Email IMAP settings — secure.emailsrvr.com',
      description:
        'IMAP for Rackspace Email: secure.emailsrvr.com, port 993, SSL. The same host handles sending on 465, and the username is the full address.',
      h1: 'Rackspace Email IMAP settings',
      intro:
        'Rackspace hosts mail for other people\'s domains, so the server never carries your own domain name: both directions go to secure.emailsrvr.com. That single fact accounts for most failed setups — the client is pointed at mail.yourcompany.com, which has nothing listening on it.',
      pitfalls: [
        'The host is secure.emailsrvr.com, not anything under your own domain, however the address looks.',
        'The same hostname serves both IMAP on 993 and SMTP on 465, both with SSL.',
        'The username is the full email address; Rackspace mailboxes are not addressed by a short name.',
        'Rackspace Email and Microsoft Exchange sold by Rackspace are different products. An Exchange mailbox does not use these hosts.',
      ],
      faq: [
        [
          'What do I put in the server field?',
          'secure.emailsrvr.com for incoming and outgoing alike: IMAP 993 with SSL, SMTP 465 with SSL.',
        ],
        [
          'Why does mail.mydomain.com not work?',
          'Because nothing answers there. Rackspace serves every customer domain from its own hosts, and secure.emailsrvr.com is the one to use.',
        ],
        [
          'Is an app password needed?',
          'No, the mailbox password is used directly.',
        ],
        [
          'Can I migrate a Rackspace mailbox to Microsoft 365 or Google?',
          'Yes, over IMAP — messages, folders, flags and dates move across, and the Rackspace mailbox is left untouched.',
        ],
      ],
    },
    ru: {
      title: 'Настройки IMAP для Rackspace Email — secure.emailsrvr.com',
      description:
        'IMAP для Rackspace Email: secure.emailsrvr.com, порт 993, SSL. Тот же хост отправляет почту на 465, логин — полный адрес.',
      h1: 'Настройки IMAP для Rackspace Email',
      intro:
        'Rackspace держит почту чужих доменов, поэтому сервер никогда не называется вашим доменом: обе стороны ходят на secure.emailsrvr.com. Из этого одного факта и берётся большинство неудачных настроек — клиент указывают на mail.вашакомпания.com, где просто никто не слушает.',
      pitfalls: [
        'Хост — secure.emailsrvr.com, а не что-либо на вашем домене, как бы ни выглядел адрес почты.',
        'Один и тот же хост обслуживает и IMAP на 993, и SMTP на 465, оба с SSL.',
        'Логин — полный адрес почты; коротким именем ящики Rackspace не адресуются.',
        'Rackspace Email и Microsoft Exchange, который Rackspace тоже продаёт, — разные продукты. Ящик Exchange на этих хостах не работает.',
      ],
      faq: [
        [
          'Что писать в поле сервера?',
          'secure.emailsrvr.com и для входящей, и для исходящей: IMAP — 993 с SSL, SMTP — 465 с SSL.',
        ],
        [
          'Почему не работает mail.мойдомен.com?',
          'Потому что там никто не отвечает. Rackspace обслуживает домены всех клиентов со своих хостов, и нужный — secure.emailsrvr.com.',
        ],
        [
          'Нужен ли пароль приложения?',
          'Нет, используется обычный пароль ящика.',
        ],
        [
          'Можно ли перенести ящик Rackspace в Microsoft 365 или Google?',
          'Да, по IMAP — письма, папки, флаги и даты переезжают, ящик в Rackspace остаётся нетронутым.',
        ],
      ],
    },
    uk: {
      title: 'Налаштування IMAP для Rackspace Email — secure.emailsrvr.com',
      description:
        'IMAP для Rackspace Email: secure.emailsrvr.com, порт 993, SSL. Той самий хост надсилає пошту на 465, логін — повна адреса.',
      h1: 'Налаштування IMAP для Rackspace Email',
      intro:
        'Rackspace тримає пошту чужих доменів, тому сервер ніколи не називається вашим доменом: обидва боки ходять на secure.emailsrvr.com. Із цього одного факту й береться більшість невдалих налаштувань — клієнт спрямовують на mail.вашакомпанія.com, де просто ніхто не слухає.',
      pitfalls: [
        'Хост — secure.emailsrvr.com, а не щось на вашому домені, хоч би як виглядала адреса пошти.',
        'Той самий хост обслуговує і IMAP на 993, і SMTP на 465, обидва із SSL.',
        'Логін — повна адреса пошти; коротким іменем скриньки Rackspace не адресуються.',
        'Rackspace Email і Microsoft Exchange, який Rackspace теж продає, — різні продукти. Скринька Exchange на цих хостах не працює.',
      ],
      faq: [
        [
          'Що писати в полі сервера?',
          'secure.emailsrvr.com і для вхідної, і для вихідної: IMAP — 993 із SSL, SMTP — 465 із SSL.',
        ],
        [
          'Чому не працює mail.мійдомен.com?',
          'Бо там ніхто не відповідає. Rackspace обслуговує домени всіх клієнтів зі своїх хостів, і потрібний — secure.emailsrvr.com.',
        ],
        [
          'Чи потрібен пароль застосунку?',
          'Ні, використовується звичайний пароль скриньки.',
        ],
        [
          'Чи можна перенести скриньку Rackspace у Microsoft 365 або Google?',
          'Так, за IMAP — листи, папки, прапорці та дати переїжджають, скринька в Rackspace лишається недоторканою.',
        ],
      ],
    },
  },

  {
    slug: 'dreamhost',
    name: 'DreamHost',
    domains: ['dreamhost.com'],
    imap: { host: 'imap.dreamhost.com', port: 993, security: 'SSL/TLS' },
    smtp: { host: 'smtp.dreamhost.com', port: 465, security: 'SSL/TLS' },
    login: 'email',
    auth: 'password',
    sources: ['https://autoconfig.dreamhost.com/mail/config-v1.1.xml'],
    checked: '2026-09-15',
    en: {
      title: 'DreamHost IMAP settings — host, port, encryption',
      description:
        'IMAP for a DreamHost mailbox: imap.dreamhost.com, port 993, SSL. The full address is the username, and the shared hosts work for every domain.',
      h1: 'DreamHost IMAP settings',
      intro:
        'DreamHost serves every hosted domain from the same pair of hosts, so the settings do not depend on your domain at all: imap.dreamhost.com in, smtp.dreamhost.com out. The older per-server names still float around in old forum answers, and they are the usual reason a client that worked for years suddenly stops.',
      pitfalls: [
        'Use imap.dreamhost.com, not the machine name of the server your hosting sits on. Old per-machine hostnames from forum posts are the classic cause of a sudden failure.',
        'The username is the full mailbox address, not the DreamHost panel login.',
        'Port 993 with SSL is the one to use; 143 with STARTTLS works too, plain 143 without encryption does not.',
        'A mailbox and a hosting account are different credentials — changing the panel password does not change the mailbox one.',
      ],
      faq: [
        [
          'Which hosts does DreamHost use?',
          'imap.dreamhost.com on 993 with SSL for receiving, smtp.dreamhost.com on 465 with SSL for sending. The same for every hosted domain.',
        ],
        [
          'What is the username?',
          'The full email address of the mailbox.',
        ],
        [
          'Is there an app password?',
          'No. DreamHost takes the mailbox password directly.',
        ],
        [
          'Can I migrate DreamHost mail to another provider?',
          'Yes — over IMAP, with folders, flags and dates preserved and nothing deleted at DreamHost.',
        ],
      ],
    },
    ru: {
      title: 'Настройки IMAP для DreamHost — хост, порт, шифрование',
      description:
        'IMAP для ящика DreamHost: imap.dreamhost.com, порт 993, SSL. Логин — полный адрес, общие хосты работают для любого домена.',
      h1: 'Настройки IMAP для DreamHost',
      intro:
        'DreamHost обслуживает все размещённые домены с одной и той же пары хостов, поэтому настройки вообще не зависят от вашего домена: imap.dreamhost.com на приём, smtp.dreamhost.com на отправку. Старые имена конкретных серверов до сих пор ходят по форумам — и это обычная причина, по которой годами работавший клиент вдруг отваливается.',
      pitfalls: [
        'Указывайте imap.dreamhost.com, а не имя машины, на которой стоит ваш хостинг. Старые имена серверов из форумных ответов — классическая причина внезапного отказа.',
        'Логин — полный адрес ящика, а не логин панели DreamHost.',
        'Рабочий порт — 993 с SSL; 143 со STARTTLS тоже подходит, а вот голый 143 без шифрования — нет.',
        'Ящик и аккаунт хостинга — разные учётные данные: смена пароля в панели не меняет пароль ящика.',
      ],
      faq: [
        [
          'Какие хосты у DreamHost?',
          'imap.dreamhost.com, порт 993 с SSL на приём; smtp.dreamhost.com, порт 465 с SSL на отправку. Одинаково для всех размещённых доменов.',
        ],
        [
          'Что указывать логином?',
          'Полный адрес ящика.',
        ],
        [
          'Есть ли пароль приложения?',
          'Нет. DreamHost принимает пароль ящика напрямую.',
        ],
        [
          'Можно ли перенести почту DreamHost к другому провайдеру?',
          'Да — по IMAP, с сохранением папок, флагов и дат, и ничего не удаляя в DreamHost.',
        ],
      ],
    },
    uk: {
      title: 'Налаштування IMAP для DreamHost — хост, порт, шифрування',
      description:
        'IMAP для скриньки DreamHost: imap.dreamhost.com, порт 993, SSL. Логін — повна адреса, спільні хости працюють для будь-якого домену.',
      h1: 'Налаштування IMAP для DreamHost',
      intro:
        'DreamHost обслуговує всі розміщені домени з однієї й тієї самої пари хостів, тому налаштування взагалі не залежать від вашого домену: imap.dreamhost.com на прийом, smtp.dreamhost.com на надсилання. Старі імена конкретних серверів досі ходять форумами — і це звичайна причина, чому клієнт, що працював роками, раптом відвалюється.',
      pitfalls: [
        'Указуйте imap.dreamhost.com, а не ім’я машини, на якій стоїть ваш хостинг. Старі імена серверів із форумних відповідей — класична причина раптової відмови.',
        'Логін — повна адреса скриньки, а не логін панелі DreamHost.',
        'Робочий порт — 993 із SSL; 143 зі STARTTLS теж підходить, а от голий 143 без шифрування — ні.',
        'Скринька й акаунт хостингу — різні облікові дані: зміна пароля в панелі не змінює пароль скриньки.',
      ],
      faq: [
        [
          'Які хости в DreamHost?',
          'imap.dreamhost.com, порт 993 із SSL на прийом; smtp.dreamhost.com, порт 465 із SSL на надсилання. Однаково для всіх розміщених доменів.',
        ],
        [
          'Що вказувати логіном?',
          'Повну адресу скриньки.',
        ],
        [
          'Чи є пароль застосунку?',
          'Ні. DreamHost приймає пароль скриньки напряму.',
        ],
        [
          'Чи можна перенести пошту DreamHost до іншого провайдера?',
          'Так — за IMAP, зі збереженням папок, прапорців і дат, і нічого не видаляючи в DreamHost.',
        ],
      ],
    },
  },

  {
    slug: 'spectrum',
    name: 'Spectrum',
    domains: ['spectrum.net', 'charter.net', 'bresnan.net', 'roadrunner.com'],
    imap: { host: 'mobile.charter.net', port: 993, security: 'SSL/TLS' },
    smtp: { host: 'mobile.charter.net', port: 587, security: 'SSL/TLS' },
    login: 'email',
    auth: 'password',
    sources: [
      'https://autoconfig.thunderbird.net/v1.1/charter.net',
      'https://www.spectrum.net/support/internet/spectrum-email-server-settings',
    ],
    checked: '2026-09-15',
    en: {
      title: 'Spectrum email IMAP settings — mobile.charter.net',
      description:
        'IMAP for a Spectrum, Charter or Roadrunner mailbox: mobile.charter.net, port 993, SSL. One host for both directions, and the old brand domains all land here.',
      h1: 'Spectrum email IMAP settings',
      intro:
        'Spectrum kept the mailboxes of every brand it absorbed, so charter.net, bresnan.net and old Roadrunner addresses all still work — and all of them connect to the same server, which is named after none of those brands. The host to type is mobile.charter.net, whatever your address ends with.',
      pitfalls: [
        'The host is mobile.charter.net for every Spectrum brand domain. "Mobile" in the name is historical; it serves desktop clients just the same.',
        'Both directions use the same hostname: IMAP on 993, SMTP on 587, authentication required on the outgoing server too.',
        'The username is the full address, including the old brand domain if that is what you have.',
        'A Spectrum mailbox is tied to the internet subscription. Cancel the service and the address goes away — which is the usual reason people migrate this one in a hurry.',
      ],
      faq: [
        [
          'Why does the server have "charter" in it?',
          'Charter is the company behind the Spectrum brand. The mail servers were never renamed, so the host stayed mobile.charter.net for all its domains.',
        ],
        [
          'Which ports?',
          'IMAP 993 and SMTP 587, both encrypted, with authentication switched on for outgoing mail.',
        ],
        [
          'Is an app password needed?',
          'No, the mailbox password is used directly.',
        ],
        [
          'I am leaving Spectrum — can I keep the mail?',
          'Move it before the account closes: point the source at mobile.charter.net and the destination at any new mailbox. Messages, folders and dates come across; nothing is deleted at Spectrum.',
        ],
      ],
    },
    ru: {
      title: 'Настройки IMAP для Spectrum — mobile.charter.net',
      description:
        'IMAP для ящика Spectrum, Charter или Roadrunner: mobile.charter.net, порт 993, SSL. Один хост в обе стороны, старые домены работают там же.',
      h1: 'Настройки IMAP для Spectrum',
      intro:
        'Spectrum сохранил ящики всех поглощённых брендов, поэтому адреса на charter.net, bresnan.net и старые Roadrunner до сих пор работают — и все они подключаются к одному серверу, который не называется ни одним из этих брендов. Хост, который нужно вписать, — mobile.charter.net, чем бы ни оканчивался ваш адрес.',
      pitfalls: [
        'Хост — mobile.charter.net для всех доменов Spectrum. Слово «mobile» в имени историческое: настольные клиенты он обслуживает так же.',
        'Обе стороны ходят на один и тот же хост: IMAP — 993, SMTP — 587, авторизация нужна и на исходящем сервере.',
        'Логин — полный адрес, включая старый доменный бренд, если он у вас именно такой.',
        'Ящик Spectrum привязан к интернет-подписке. Отказались от услуги — адрес пропадает; это и есть обычная причина, по которой такой ящик переносят срочно.',
      ],
      faq: [
        [
          'Почему в имени сервера «charter»?',
          'Charter — компания, которой принадлежит бренд Spectrum. Почтовые серверы не переименовывали, поэтому хост так и остался mobile.charter.net для всех доменов.',
        ],
        [
          'Какие порты?',
          'IMAP — 993, SMTP — 587, оба шифрованные, с включённой авторизацией на отправке.',
        ],
        [
          'Нужен ли пароль приложения?',
          'Нет, используется обычный пароль ящика.',
        ],
        [
          'Ухожу от Spectrum — можно сохранить почту?',
          'Переносите до закрытия аккаунта: источник — mobile.charter.net, назначение — любой новый ящик. Письма, папки и даты переезжают, в Spectrum ничего не удаляется.',
        ],
      ],
    },
    uk: {
      title: 'Налаштування IMAP для Spectrum — mobile.charter.net',
      description:
        'IMAP для скриньки Spectrum, Charter або Roadrunner: mobile.charter.net, порт 993, SSL. Один хост в обидва боки, старі домени працюють там само.',
      h1: 'Налаштування IMAP для Spectrum',
      intro:
        'Spectrum зберіг скриньки всіх поглинутих брендів, тому адреси на charter.net, bresnan.net і старі Roadrunner досі працюють — і всі вони підключаються до одного сервера, який не називається жодним із цих брендів. Хост, який треба вписати, — mobile.charter.net, хоч би чим закінчувалася ваша адреса.',
      pitfalls: [
        'Хост — mobile.charter.net для всіх доменів Spectrum. Слово «mobile» в імені історичне: настільні клієнти він обслуговує так само.',
        'Обидва боки ходять на той самий хост: IMAP — 993, SMTP — 587, авторизація потрібна і на вихідному сервері.',
        'Логін — повна адреса, включно зі старим доменним брендом, якщо він у вас саме такий.',
        'Скринька Spectrum прив’язана до інтернет-передплати. Відмовилися від послуги — адреса зникає; це і є звичайна причина, чому таку скриньку переносять терміново.',
      ],
      faq: [
        [
          'Чому в імені сервера «charter»?',
          'Charter — компанія, якій належить бренд Spectrum. Поштові сервери не перейменовували, тому хост так і лишився mobile.charter.net для всіх доменів.',
        ],
        [
          'Які порти?',
          'IMAP — 993, SMTP — 587, обидва шифровані, з увімкненою авторизацією на надсиланні.',
        ],
        [
          'Чи потрібен пароль застосунку?',
          'Ні, використовується звичайний пароль скриньки.',
        ],
        [
          'Іду від Spectrum — чи можна зберегти пошту?',
          'Переносьте до закриття акаунта: джерело — mobile.charter.net, призначення — будь-яка нова скринька. Листи, папки та дати переїжджають, у Spectrum нічого не видаляється.',
        ],
      ],
    },
  },

  {
    slug: 't-online',
    name: 'T-Online',
    domains: ['t-online.de', 'magenta.de'],
    imap: { host: 'secureimap.t-online.de', port: 993, security: 'SSL/TLS' },
    smtp: { host: 'securesmtp.t-online.de', port: 465, security: 'SSL/TLS' },
    login: 'email',
    auth: 'app-password',
    sources: [
      'https://autoconfig.thunderbird.net/v1.1/t-online.de',
      'https://www.telekom.de/hilfe/apps-dienste/e-mail/programme/passwort-verwalten',
    ],
    checked: '2026-09-15',
    ru: {
      title: 'Настройки IMAP для T-Online — хост, порт, отдельный пароль',
      description:
        'IMAP для ящика T-Online: secureimap.t-online.de, порт 993, SSL. Почтовым программам нужен отдельный пароль, а не пароль от учётной записи Telekom.',
      h1: 'Настройки IMAP для T-Online',
      intro:
        'T-Online — почта немецкого Telekom, и главная её особенность в пароле. Тот пароль, которым вы входите в личный кабинет Telekom, почтовая программа не примет: для IMAP и POP3 заводится отдельный «пароль для почтовых программ», и его нужно сначала создать в настройках самой почты.',
      pitfalls: [
        'Пароль от учётной записи Telekom по IMAP не работает. В почтовом центре создаётся отдельный «Passwort für E-Mail-Programme» — он и вводится в клиенте.',
        'Telekom прямо советует делать этот пароль непохожим на пароль от кабинета: он живёт в почтовых программах, а значит, хранится на устройствах.',
        'Хосты с приставкой secure: secureimap.t-online.de на приём и securesmtp.t-online.de на отправку. Нешифрованных вариантов нет.',
        'Логин — полный адрес, включая @t-online.de или @magenta.de.',
      ],
      faq: [
        [
          'Где создать пароль для почтовых программ?',
          'В почтовом центре T-Online: шестерёнка → «Показать все настройки» → «Данные учётной записи» → раздел паролей → «Пароль для почтовых программ». Если пароля ещё нет, там же он и создаётся.',
        ],
        [
          'Какие порты и шифрование?',
          'IMAP — 993 с SSL/TLS, SMTP — 465 с SSL/TLS (порт 587 со STARTTLS сервис тоже принимает).',
        ],
        [
          'Почему не подходит пароль, с которым я вхожу на сайт?',
          'Так устроено намеренно: доступ внешним программам отделён от входа в личный кабинет, чтобы пароль от кабинета не расходился по устройствам.',
        ],
        [
          'Можно ли перенести почту T-Online на другой сервис?',
          'Да. Укажите secureimap.t-online.de источником и введите пароль для почтовых программ; письма, папки и даты переносятся, в T-Online всё остаётся на месте.',
        ],
      ],
    },
    en: {
      title: 'T-Online IMAP settings — host, port, the separate password',
      description:
        'IMAP for a T-Online mailbox: secureimap.t-online.de, port 993, SSL. Mail clients need the separate email-program password, not the Telekom account one.',
      h1: 'T-Online IMAP settings',
      intro:
        'T-Online is the mail service of German Telekom, and its defining quirk is the password. The one you sign in to your Telekom account with is not accepted over IMAP: external programs need a separate "password for email programs", and it has to be created in the mail settings first.',
      pitfalls: [
        'The Telekom account password does not work over IMAP. A separate "Passwort für E-Mail-Programme" is created in the mail centre, and that is what the client takes.',
        'Telekom explicitly advises making it different from the account password: this one lives inside mail programs, which means it is stored on devices.',
        'The hosts carry the secure prefix: secureimap.t-online.de in, securesmtp.t-online.de out. There are no unencrypted variants.',
        'The username is the full address, @t-online.de or @magenta.de included.',
      ],
      faq: [
        [
          'Where is the email-program password created?',
          'In the T-Online mail centre: the gear icon → show all settings → account details → the passwords section → password for email programs. If none exists yet, you create it there.',
        ],
        [
          'Which ports and encryption?',
          'IMAP 993 with SSL/TLS, SMTP 465 with SSL/TLS (port 587 with STARTTLS is accepted as well).',
        ],
        [
          'Why is my website password refused?',
          'By design: access for external programs is separated from the account login, so the account password does not end up spread across devices.',
        ],
        [
          'Can I migrate a T-Online mailbox elsewhere?',
          'Yes. Use secureimap.t-online.de as the source with the email-program password; messages, folders and dates transfer, and nothing changes at T-Online.',
        ],
      ],
    },
    uk: {
      title: 'Налаштування IMAP для T-Online — хост, порт, окремий пароль',
      description:
        'IMAP для скриньки T-Online: secureimap.t-online.de, порт 993, SSL. Поштовим програмам потрібен окремий пароль, а не пароль від облікового запису Telekom.',
      h1: 'Налаштування IMAP для T-Online',
      intro:
        'T-Online — пошта німецького Telekom, і головна її особливість у паролі. Той пароль, яким ви входите до особистого кабінету Telekom, поштова програма не прийме: для IMAP і POP3 заводиться окремий «пароль для поштових програм», і його спершу треба створити в налаштуваннях самої пошти.',
      pitfalls: [
        'Пароль від облікового запису Telekom за IMAP не працює. У поштовому центрі створюється окремий «Passwort für E-Mail-Programme» — він і вводиться в клієнті.',
        'Telekom прямо радить робити цей пароль несхожим на пароль від кабінету: він живе в поштових програмах, а отже, зберігається на пристроях.',
        'Хости з приставкою secure: secureimap.t-online.de на прийом і securesmtp.t-online.de на надсилання. Нешифрованих варіантів немає.',
        'Логін — повна адреса, включно з @t-online.de або @magenta.de.',
      ],
      faq: [
        [
          'Де створити пароль для поштових програм?',
          'У поштовому центрі T-Online: шестерня → «Показати всі налаштування» → «Дані облікового запису» → розділ паролів → «Пароль для поштових програм». Якщо пароля ще немає, там само він і створюється.',
        ],
        [
          'Які порти та шифрування?',
          'IMAP — 993 із SSL/TLS, SMTP — 465 із SSL/TLS (порт 587 зі STARTTLS сервіс теж приймає).',
        ],
        [
          'Чому не підходить пароль, з яким я входжу на сайт?',
          'Так влаштовано навмисно: доступ зовнішнім програмам відокремлено від входу в особистий кабінет, щоб пароль від кабінету не розходився пристроями.',
        ],
        [
          'Чи можна перенести пошту T-Online на інший сервіс?',
          'Так. Укажіть secureimap.t-online.de джерелом і введіть пароль для поштових програм; листи, папки та дати переносяться, у T-Online усе лишається на місці.',
        ],
      ],
    },
  },

  {
    slug: 'bt-mail',
    name: 'BT Mail',
    domains: ['btinternet.com', 'btopenworld.com', 'talk21.com'],
    imap: { host: 'mail.btinternet.com', port: 993, security: 'SSL/TLS' },
    smtp: { host: 'mail.btinternet.com', port: 465, security: 'SSL/TLS' },
    login: 'email',
    auth: 'password',
    sources: ['https://autoconfig.thunderbird.net/v1.1/btinternet.com'],
    checked: '2026-09-15',
    en: {
      title: 'BT Mail IMAP settings — mail.btinternet.com',
      description:
        'IMAP for a BT Internet mailbox: mail.btinternet.com, port 993, SSL. One host for both directions, and the older BT domains use the same one.',
      h1: 'BT Mail IMAP settings',
      intro:
        'BT serves its mail from a single host for both directions: mail.btinternet.com, port 993 for receiving and 465 for sending. Older BT addresses — btopenworld.com, talk21.com — were never moved anywhere else and connect exactly the same way.',
      pitfalls: [
        'There is no separate imap. or smtp. host. Both directions go to mail.btinternet.com; the port is what differs.',
        'btopenworld.com and talk21.com addresses use the same settings as btinternet.com.',
        'The username is the full address, not the BT ID you sign in to the website with.',
        'A BT mailbox is tied to the broadband account. When the line is cancelled the mailbox goes with it unless you have moved the mail first.',
      ],
      faq: [
        [
          'What is the incoming server for BT?',
          'mail.btinternet.com on port 993 with SSL/TLS, using your full email address as the username.',
        ],
        [
          'And for sending?',
          'The same host, mail.btinternet.com, on port 465 with SSL/TLS and authentication enabled.',
        ],
        [
          'Do I need an app password?',
          'No. BT accepts the mailbox password over IMAP.',
        ],
        [
          'I am switching broadband provider — will I lose the mail?',
          'The address can stop working once the line closes, so copy the mailbox to another provider before that happens. The transfer keeps folders, flags and dates.',
        ],
      ],
    },
    ru: {
      title: 'Настройки IMAP для BT Mail — mail.btinternet.com',
      description:
        'IMAP для ящика BT Internet: mail.btinternet.com, порт 993, SSL. Один хост в обе стороны, старые домены BT подключаются так же.',
      h1: 'Настройки IMAP для BT Mail',
      intro:
        'BT отдаёт почту с одного хоста в обе стороны: mail.btinternet.com, порт 993 на приём и 465 на отправку. Старые адреса BT — btopenworld.com, talk21.com — никуда не переезжали и подключаются ровно так же.',
      pitfalls: [
        'Отдельных хостов с приставками imap. или smtp. не существует. Обе стороны ходят на mail.btinternet.com, отличается только порт.',
        'Адреса btopenworld.com и talk21.com используют те же настройки, что и btinternet.com.',
        'Логин — полный адрес, а не BT ID, под которым вы входите на сайт.',
        'Ящик BT привязан к договору на интернет. Закрыли линию — ящик уходит вместе с ней, если почту не перенесли заранее.',
      ],
      faq: [
        [
          'Какой сервер входящей почты у BT?',
          'mail.btinternet.com, порт 993 с SSL/TLS, логин — полный адрес почты.',
        ],
        [
          'А исходящей?',
          'Тот же хост, mail.btinternet.com, порт 465 с SSL/TLS и включённой авторизацией.',
        ],
        [
          'Нужен ли пароль приложения?',
          'Нет. BT принимает по IMAP обычный пароль ящика.',
        ],
        [
          'Меняю провайдера — потеряю почту?',
          'Адрес может перестать работать после закрытия договора, поэтому копию ящика стоит сделать заранее. Перенос сохраняет папки, флаги и даты.',
        ],
      ],
    },
    uk: {
      title: 'Налаштування IMAP для BT Mail — mail.btinternet.com',
      description:
        'IMAP для скриньки BT Internet: mail.btinternet.com, порт 993, SSL. Один хост в обидва боки, старі домени BT підключаються так само.',
      h1: 'Налаштування IMAP для BT Mail',
      intro:
        'BT віддає пошту з одного хоста в обидва боки: mail.btinternet.com, порт 993 на прийом і 465 на надсилання. Старі адреси BT — btopenworld.com, talk21.com — нікуди не переїжджали і підключаються так само.',
      pitfalls: [
        'Окремих хостів із приставками imap. чи smtp. не існує. Обидва боки ходять на mail.btinternet.com, відрізняється лише порт.',
        'Адреси btopenworld.com і talk21.com використовують ті самі налаштування, що й btinternet.com.',
        'Логін — повна адреса, а не BT ID, під яким ви входите на сайт.',
        'Скринька BT прив’язана до договору на інтернет. Закрили лінію — скринька йде разом із нею, якщо пошту не перенесли заздалегідь.',
      ],
      faq: [
        [
          'Який сервер вхідної пошти у BT?',
          'mail.btinternet.com, порт 993 із SSL/TLS, логін — повна адреса пошти.',
        ],
        [
          'А вихідної?',
          'Той самий хост, mail.btinternet.com, порт 465 із SSL/TLS та увімкненою авторизацією.',
        ],
        [
          'Чи потрібен пароль застосунку?',
          'Ні. BT приймає за IMAP звичайний пароль скриньки.',
        ],
        [
          'Міняю провайдера — чи втрачу пошту?',
          'Адреса може перестати працювати після закриття договору, тому копію скриньки варто зробити заздалегідь. Перенесення зберігає папки, прапорці та дати.',
        ],
      ],
    },
  },

  {
    slug: 'sky-mail',
    name: 'Sky Mail',
    domains: ['sky.com'],
    imap: { host: 'imap.tools.sky.com', port: 993, security: 'SSL/TLS' },
    smtp: { host: 'smtp.tools.sky.com', port: 465, security: 'SSL/TLS' },
    login: 'email',
    auth: 'password',
    sources: ['https://autoconfig.thunderbird.net/v1.1/sky.com'],
    checked: '2026-09-15',
    en: {
      title: 'Sky Mail IMAP settings — imap.tools.sky.com',
      description:
        'IMAP for a Sky mailbox: imap.tools.sky.com, port 993, SSL. The host has an extra tools. level that is easy to miss.',
      h1: 'Sky Mail IMAP settings',
      intro:
        'Sky\'s mail hosts carry an extra level in the name that people routinely drop: it is imap.tools.sky.com, not imap.sky.com. Typing the shorter version gives a connection error rather than a password error, which sends the search in the wrong direction.',
      pitfalls: [
        'The host is imap.tools.sky.com, with tools. in the middle. Without it nothing answers.',
        'Sending goes through smtp.tools.sky.com on 465 with SSL, authentication on.',
        'The username is the full sky.com address.',
        'Sky mail is part of the broadband package: when the contract ends the mailbox does too, so a copy has to be made before that.',
      ],
      faq: [
        [
          'imap.sky.com or imap.tools.sky.com?',
          'imap.tools.sky.com. The short form is not a real host, and a client pointed at it fails to connect at all.',
        ],
        [
          'Which ports?',
          'IMAP 993 and SMTP 465, both with SSL/TLS.',
        ],
        [
          'Is an app password needed?',
          'No, the mailbox password is accepted.',
        ],
        [
          'Can I keep my Sky mail after leaving Sky?',
          'Only as a copy somewhere else, made while the account is still active. The transfer carries messages, folders, flags and dates to the new mailbox.',
        ],
      ],
    },
    ru: {
      title: 'Настройки IMAP для Sky Mail — imap.tools.sky.com',
      description:
        'IMAP для ящика Sky: imap.tools.sky.com, порт 993, SSL. В имени хоста есть лишний уровень tools, который легко пропустить.',
      h1: 'Настройки IMAP для Sky Mail',
      intro:
        'У почтовых хостов Sky в имени есть лишний уровень, который регулярно теряют: это imap.tools.sky.com, а не imap.sky.com. С коротким вариантом клиент выдаёт ошибку соединения, а не ошибку пароля, и поиски уходят не туда.',
      pitfalls: [
        'Хост — imap.tools.sky.com, с tools. посередине. Без него никто не отвечает.',
        'Отправка идёт через smtp.tools.sky.com, порт 465 с SSL и включённой авторизацией.',
        'Логин — полный адрес на sky.com.',
        'Почта Sky входит в пакет с интернетом: закончился договор — закончился и ящик, поэтому копию нужно сделать заранее.',
      ],
      faq: [
        [
          'imap.sky.com или imap.tools.sky.com?',
          'imap.tools.sky.com. Короткого хоста не существует, и клиент, направленный на него, не подключится вовсе.',
        ],
        [
          'Какие порты?',
          'IMAP — 993, SMTP — 465, оба с SSL/TLS.',
        ],
        [
          'Нужен ли пароль приложения?',
          'Нет, принимается обычный пароль ящика.',
        ],
        [
          'Можно ли сохранить почту Sky после ухода от Sky?',
          'Только копией в другом месте, сделанной пока аккаунт ещё жив. Перенос отдаёт в новый ящик письма, папки, флаги и даты.',
        ],
      ],
    },
    uk: {
      title: 'Налаштування IMAP для Sky Mail — imap.tools.sky.com',
      description:
        'IMAP для скриньки Sky: imap.tools.sky.com, порт 993, SSL. В імені хоста є зайвий рівень tools, який легко пропустити.',
      h1: 'Налаштування IMAP для Sky Mail',
      intro:
        'У поштових хостів Sky в імені є зайвий рівень, який регулярно гублять: це imap.tools.sky.com, а не imap.sky.com. З коротким варіантом клієнт видає помилку з’єднання, а не помилку пароля, і пошуки йдуть не туди.',
      pitfalls: [
        'Хост — imap.tools.sky.com, із tools. посередині. Без нього ніхто не відповідає.',
        'Надсилання йде через smtp.tools.sky.com, порт 465 із SSL та увімкненою авторизацією.',
        'Логін — повна адреса на sky.com.',
        'Пошта Sky входить у пакет з інтернетом: скінчився договір — скінчилася і скринька, тому копію треба зробити заздалегідь.',
      ],
      faq: [
        [
          'imap.sky.com чи imap.tools.sky.com?',
          'imap.tools.sky.com. Короткого хоста не існує, і клієнт, спрямований на нього, не підключиться взагалі.',
        ],
        [
          'Які порти?',
          'IMAP — 993, SMTP — 465, обидва із SSL/TLS.',
        ],
        [
          'Чи потрібен пароль застосунку?',
          'Ні, приймається звичайний пароль скриньки.',
        ],
        [
          'Чи можна зберегти пошту Sky після відходу від Sky?',
          'Лише копією в іншому місці, зробленою поки акаунт ще живий. Перенесення віддає в нову скриньку листи, папки, прапорці та дати.',
        ],
      ],
    },
  },

  {
    slug: 'wp-pl',
    name: 'Poczta WP',
    domains: ['wp.pl'],
    imap: { host: 'imap.wp.pl', port: 993, security: 'SSL/TLS' },
    smtp: { host: 'smtp.wp.pl', port: 465, security: 'SSL/TLS' },
    login: 'local',
    auth: 'password',
    sources: ['https://autoconfig.thunderbird.net/v1.1/wp.pl'],
    checked: '2026-09-15',
    ru: {
      title: 'Настройки IMAP для Poczta WP — логин без домена',
      description:
        'IMAP для ящика wp.pl: imap.wp.pl, порт 993, SSL. Логин указывается без @wp.pl — на этом чаще всего и спотыкаются.',
      h1: 'Настройки IMAP для Poczta WP',
      intro:
        'Poczta WP — крупнейшая польская почта, и подключается она просто, кроме одной детали: логином здесь служит не адрес целиком, а только часть до собаки. Полный адрес сервер отклоняет так же, как неверный пароль, поэтому человек проверяет пароль, а дело в поле логина.',
      pitfalls: [
        'Логин — часть адреса до собаки. Для ящика nazwa@wp.pl в поле имени пользователя вводится nazwa.',
        'Хосты без сюрпризов: imap.wp.pl на приём (993, SSL) и smtp.wp.pl на отправку (465, SSL).',
        'Бесплатные ящики WP ограничены по объёму, и при переносе В такой ящик место может кончиться на середине — объём стоит замерить заранее.',
        'Польские имена папок приезжают в кодировке modified UTF-7; мы декодируем их автоматически, в чужих логах они выглядят как набор символов.',
      ],
      faq: [
        [
          'Логин с доменом или без?',
          'Без. Для nazwa@wp.pl логин — nazwa. Это отличает WP от большинства сервисов и даёт ту же ошибку, что неверный пароль.',
        ],
        [
          'Какие хосты и порты?',
          'IMAP — imap.wp.pl, порт 993 с SSL/TLS. SMTP — smtp.wp.pl, порт 465 с SSL/TLS.',
        ],
        [
          'Нужен ли отдельный пароль для программ?',
          'Нет, подходит обычный пароль ящика.',
        ],
        [
          'Можно ли перенести почту с WP на Gmail или Microsoft 365?',
          'Да, по IMAP: источник — imap.wp.pl с логином без домена, назначение — новый ящик. Письма, папки и даты сохраняются.',
        ],
      ],
    },
    en: {
      title: 'Poczta WP IMAP settings — the username has no domain',
      description:
        'IMAP for a wp.pl mailbox: imap.wp.pl, port 993, SSL. The username goes in without @wp.pl, which is where most setups fail.',
      h1: 'Poczta WP IMAP settings',
      intro:
        'Poczta WP is the largest Polish mail service and connects simply enough, apart from one detail: the username is not the whole address but only the part before the @. The full address is rejected exactly like a wrong password, so people re-check the password while the problem sits in the username field.',
      pitfalls: [
        'The username is the part before the @. For nazwa@wp.pl you type nazwa.',
        'The hosts hold no surprises: imap.wp.pl for receiving (993, SSL) and smtp.wp.pl for sending (465, SSL).',
        'Free WP mailboxes have a size cap, so a migration into one can run out of room half-way — measure the size first.',
        'Polish folder names travel in modified UTF-7. We decode them automatically; in other tools\' logs they look like gibberish.',
      ],
      faq: [
        [
          'Username with or without the domain?',
          'Without. For nazwa@wp.pl the username is nazwa. This sets WP apart from most services and produces the same error as a wrong password.',
        ],
        [
          'Which hosts and ports?',
          'IMAP is imap.wp.pl on 993 with SSL/TLS. SMTP is smtp.wp.pl on 465 with SSL/TLS.',
        ],
        [
          'Is a separate app password needed?',
          'No, the mailbox password works.',
        ],
        [
          'Can I migrate from WP to Gmail or Microsoft 365?',
          'Yes, over IMAP: the source is imap.wp.pl with the domain-less username, the destination is the new mailbox. Messages, folders and dates are preserved.',
        ],
      ],
    },
    uk: {
      title: 'Налаштування IMAP для Poczta WP — логін без домену',
      description:
        'IMAP для скриньки wp.pl: imap.wp.pl, порт 993, SSL. Логін вказується без @wp.pl — на цьому найчастіше й спотикаються.',
      h1: 'Налаштування IMAP для Poczta WP',
      intro:
        'Poczta WP — найбільша польська пошта, і підключається вона просто, окрім однієї деталі: логіном тут служить не адреса цілком, а лише частина до равлика. Повну адресу сервер відхиляє так само, як невірний пароль, тому людина перевіряє пароль, а річ у полі логіна.',
      pitfalls: [
        'Логін — частина адреси до равлика. Для скриньки nazwa@wp.pl у полі імені користувача вводиться nazwa.',
        'Хости без сюрпризів: imap.wp.pl на прийом (993, SSL) і smtp.wp.pl на надсилання (465, SSL).',
        'Безкоштовні скриньки WP обмежені за обсягом, і під час перенесення В таку скриньку місце може скінчитися на середині — обсяг варто виміряти заздалегідь.',
        'Польські назви папок приїжджають у кодуванні modified UTF-7; ми декодуємо їх автоматично, у чужих логах вони виглядають як набір символів.',
      ],
      faq: [
        [
          'Логін із доменом чи без?',
          'Без. Для nazwa@wp.pl логін — nazwa. Це відрізняє WP від більшості сервісів і дає ту саму помилку, що й невірний пароль.',
        ],
        [
          'Які хости та порти?',
          'IMAP — imap.wp.pl, порт 993 із SSL/TLS. SMTP — smtp.wp.pl, порт 465 із SSL/TLS.',
        ],
        [
          'Чи потрібен окремий пароль для програм?',
          'Ні, підходить звичайний пароль скриньки.',
        ],
        [
          'Чи можна перенести пошту з WP у Gmail або Microsoft 365?',
          'Так, за IMAP: джерело — imap.wp.pl з логіном без домену, призначення — нова скринька. Листи, папки та дати зберігаються.',
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
