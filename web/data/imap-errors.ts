/**
 * Страницы разбора ошибок IMAP.
 *
 * Это самый недооценённый SEO-актив в нише: человек копирует текст ошибки
 * в поиск дословно, конкуренция почти нулевая, а приходит он в момент,
 * когда уже переносит почту руками и застрял.
 */

export type ErrorCopy = {
  title: string;
  description: string;
  h1: string;
  /** Как ошибка выглядит в журнале — идёт в <pre> на странице. */
  sample: string;
  /** Что это значит на самом деле. */
  meaning: string;
  /** Причины по убыванию вероятности. */
  causes: string[];
  /** Что делать, по шагам. */
  fixes: string[];
  faq: Array<[string, string]>;
};

export type ImapError = {
  /** Слаг URL: /docs/errors/<slug> */
  slug: string;
  /** Код в шапке карточки. */
  code: string;
  /** Провайдеры, у которых ошибка встречается чаще всего. */
  providers: string[];
  ru: ErrorCopy;
  en: ErrorCopy;
  uk: ErrorCopy;
};

export const imapErrors: ImapError[] = [
  {
    slug: 'authenticationfailed',
    code: 'NO [AUTHENTICATIONFAILED]',
    providers: ['gmail', 'yandex', 'icloud', 'mailru'],
    ru: {
      title: 'IMAP AUTHENTICATIONFAILED — что делать — MoveMailbox',
      description:
        'Сервер отвечает AUTHENTICATIONFAILED, хотя пароль верный. Разбираем три реальные причины: выключенный IMAP, пароль приложения и формат логина.',
      h1: 'Ошибка IMAP AUTHENTICATIONFAILED: что она значит',
      sample:
        'a1 NO [AUTHENTICATIONFAILED] Invalid credentials (Failure)',
      meaning:
        'Сервер получил логин и пароль, но отказался пускать. Важно: это не всегда неверный пароль — тем же кодом отвечают на выключенный IMAP и на неправильный формат логина.',
      causes: [
        'Используется обычный пароль аккаунта там, где нужен пароль приложения. Так работают Gmail, Яндекс, iCloud, Mail.ru и Yahoo.',
        'IMAP не включён в настройках почтового ящика. У Gmail и Яндекса это отдельный переключатель, и без него доступ закрыт даже с верным паролем.',
        'Неверный формат логина: iCloud принимает только часть до собаки, обычный ящик Яндекса — тоже без домена, а cPanel и Gmail требуют полный адрес.',
        'У Microsoft 365 отключён basic authentication на уровне тенанта — нужен OAuth 2.0, паролем туда попасть уже нельзя.',
        'Администратор организации закрыл доступ сторонним приложениям (Google Workspace, Яндекс 360).',
      ],
      fixes: [
        'Создайте пароль приложения в настройках безопасности аккаунта и вставьте его без пробелов.',
        'Включите IMAP: у Gmail — Настройки → Пересылка и POP/IMAP, у Яндекса — Почта → Настройки → Почтовые программы.',
        'Проверьте формат логина по гайду вашего провайдера — половина случаев именно здесь.',
        'Для Microsoft 365 переключитесь на OAuth 2.0: администратор тенанта даёт согласие один раз.',
        'Проверьте вручную: openssl s_client -connect imap.example.com:993 -crlf, затем a1 LOGIN user pass — увидите ответ сервера без посредников.',
      ],
      faq: [
        [
          'Почему пароль точно верный, а сервер не пускает?',
          'Потому что провайдеры отвечают одним кодом на три разные ситуации: неверный пароль, выключенный IMAP и запрет сторонних приложений. Начните с проверки IMAP — это самая частая причина.',
        ],
        [
          'Как понять, что дело именно в пароле приложения?',
          'Если вход в веб-интерфейс с этим паролем работает, а IMAP — нет, значит нужен отдельный пароль приложения. Обычный пароль аккаунта современные провайдеры по IMAP не принимают.',
        ],
      ],
    },
    en: {
      title: 'IMAP AUTHENTICATIONFAILED — how to fix — MoveMailbox',
      description:
        'The server returns AUTHENTICATIONFAILED even though the password is correct. Three real causes: IMAP disabled, app passwords, and login format.',
      h1: 'IMAP AUTHENTICATIONFAILED: what it actually means',
      sample: 'a1 NO [AUTHENTICATIONFAILED] Invalid credentials (Failure)',
      meaning:
        'The server received your username and password and refused. Note that this is not always a wrong password — the same code covers IMAP being switched off and the login being in the wrong format.',
      causes: [
        'An account password is used where an app password is required. Gmail, Yandex, iCloud, Mail.ru and Yahoo all work this way.',
        'IMAP is not enabled in mailbox settings. Gmail and Yandex have a separate toggle, and access stays closed without it.',
        'Wrong login format: iCloud accepts the local part only, standard Yandex mailboxes too, while cPanel and Gmail want the full address.',
        'Microsoft 365 has basic authentication disabled tenant-wide — OAuth 2.0 is the only way in.',
        'An organisation admin has blocked third-party app access (Google Workspace, Yandex 360).',
      ],
      fixes: [
        'Create an app password in account security settings and paste it without spaces.',
        'Enable IMAP: Gmail → Settings → Forwarding and POP/IMAP; Yandex → Settings → Email clients.',
        'Check the login format against your provider guide — half of all cases are exactly this.',
        'For Microsoft 365 switch to OAuth 2.0; a tenant admin consents once.',
        'Test by hand: openssl s_client -connect imap.example.com:993 -crlf then a1 LOGIN user pass to see the raw server reply.',
      ],
      faq: [
        [
          'Why is a correct password rejected?',
          'Providers return one code for three different situations: wrong password, IMAP disabled, and third-party access blocked. Check IMAP first — it is the most common cause.',
        ],
        [
          'How do I know an app password is needed?',
          'If the password signs you into the web interface but fails over IMAP, you need a separate app password. Modern providers do not accept account passwords over IMAP.',
        ],
      ],
    },
    uk: {
      title: 'IMAP AUTHENTICATIONFAILED — що робити — MoveMailbox',
      description:
        'Сервер відповідає AUTHENTICATIONFAILED, хоча пароль правильний. Розбираємо три справжні причини: вимкнений IMAP, пароль застосунку і формат логіна.',
      h1: 'Помилка IMAP AUTHENTICATIONFAILED: що вона означає',
      sample: 'a1 NO [AUTHENTICATIONFAILED] Invalid credentials (Failure)',
      meaning:
        'Сервер отримав логін і пароль, але відмовив у доступі. Важливо: це не завжди хибний пароль — тим самим кодом відповідають на вимкнений IMAP і на неправильний формат логіна.',
      causes: [
        'Використано звичайний пароль акаунта там, де потрібен пароль застосунку. Так працюють Gmail, Яндекс, iCloud, Mail.ru і Yahoo.',
        'IMAP не увімкнено в налаштуваннях поштової скриньки. У Gmail і Яндекса це окремий перемикач, без нього доступ закритий навіть із правильним паролем.',
        'Хибний формат логіна: iCloud приймає лише частину до собачки, звичайна скринька Яндекса — теж без домену, а cPanel і Gmail вимагають повну адресу.',
        'У Microsoft 365 вимкнено basic authentication на рівні тенанта — потрібен OAuth 2.0, паролем туди вже не зайти.',
        'Адміністратор організації закрив доступ стороннім застосункам (Google Workspace, Яндекс 360).',
      ],
      fixes: [
        'Створіть пароль застосунку в налаштуваннях безпеки акаунта і вставте його без пробілів.',
        'Увімкніть IMAP: у Gmail — Налаштування → Пересилання та POP/IMAP, у Яндекса — Пошта → Налаштування → Поштові програми.',
        'Перевірте формат логіна за інструкцією свого провайдера — половина випадків саме тут.',
        'Для Microsoft 365 перейдіть на OAuth 2.0: адміністратор тенанта дає згоду один раз.',
        'Перевірте вручну: openssl s_client -connect imap.example.com:993 -crlf, потім a1 LOGIN user pass — побачите відповідь сервера без посередників.',
      ],
      faq: [
        [
          'Чому пароль точно правильний, а сервер не пускає?',
          'Бо провайдери відповідають одним кодом на три різні ситуації: хибний пароль, вимкнений IMAP і заборона стороннім застосункам. Почніть з перевірки IMAP — це найчастіша причина.',
        ],
        [
          'Як зрозуміти, що річ саме в паролі застосунку?',
          'Якщо вхід у вебінтерфейс із цим паролем працює, а IMAP — ні, потрібен окремий пароль застосунку. Звичайний пароль акаунта сучасні провайдери через IMAP не приймають.',
        ],
      ],
    },
  },

  {
    slug: 'certificate-verify-failed',
    code: 'certificate verify failed',
    providers: ['cpanel', 'exchange'],
    ru: {
      title: 'IMAP certificate verify failed — как исправить — MoveMailbox',
      description:
        'Ошибка проверки сертификата при подключении по IMAP. Почему она возникает на shared-хостинге и как проверить сертификат через openssl s_client.',
      h1: 'Ошибка certificate verify failed при подключении по IMAP',
      sample:
        'SSL connect attempt failed error:0A000086:SSL routines::certificate verify failed',
      meaning:
        'TLS-соединение установилось, но клиент не смог доверять сертификату сервера. Само шифрование при этом работает — не сходится либо имя, либо цепочка доверия, либо срок.',
      causes: [
        'Классика shared-хостинга: сертификат выписан на имя сервера вроде srv142.hoster.net, а вы подключаетесь по mail.вашдомен.ru. Имена не совпадают.',
        'Самоподписанный сертификат — типично для внутреннего Exchange и собственных серверов Dovecot.',
        'Истёкший сертификат: Let’s Encrypt не продлился, а почтовая служба продолжает отдавать старый.',
        'Неполная цепочка: сервер отдаёт только конечный сертификат без промежуточного.',
      ],
      fixes: [
        'Посмотрите, на какое имя выписан сертификат: openssl s_client -connect host:993 -servername host | openssl x509 -noout -subject -dates',
        'Подключайтесь по тому имени, которое указано в сертификате — это правильное решение, а не обход.',
        'Если это невозможно, включите в расширенных настройках приём непроверенного сертификата. Трафик останется зашифрованным, но подлинность сервера проверяться не будет.',
        'На своём сервере лучше починить причину: продлить сертификат или добавить промежуточный в цепочку.',
      ],
      faq: [
        [
          'Безопасно ли принимать непроверенный сертификат?',
          'Трафик остаётся зашифрованным, но вы теряете защиту от подмены сервера. В контролируемой сети или при переносе с известного вам хостинга риск невелик; в публичной сети лучше сначала разобраться с именем.',
        ],
        [
          'Почему почтовый клиент подключается, а перенос — нет?',
          'Клиенты вроде Thunderbird один раз спрашивают про исключение и запоминают его. Автоматический перенос такого диалога не показывает и падает с ошибкой.',
        ],
      ],
    },
    en: {
      title: 'IMAP certificate verify failed — how to fix — MoveMailbox',
      description:
        'Certificate verification fails when connecting over IMAP. Why it happens on shared hosting and how to inspect the certificate with openssl s_client.',
      h1: 'certificate verify failed when connecting over IMAP',
      sample:
        'SSL connect attempt failed error:0A000086:SSL routines::certificate verify failed',
      meaning:
        'The TLS connection came up but the client could not trust the server certificate. Encryption still works — what fails is the name, the chain of trust, or the expiry date.',
      causes: [
        'The shared hosting classic: the certificate is issued for a server name such as srv142.hoster.net while you connect to mail.yourdomain.com.',
        'A self-signed certificate — typical for internal Exchange and self-run Dovecot servers.',
        'An expired certificate: Let’s Encrypt failed to renew and the mail service still serves the old one.',
        'An incomplete chain: the server sends only the leaf certificate without the intermediate.',
      ],
      fixes: [
        'Check which name the certificate covers: openssl s_client -connect host:993 -servername host | openssl x509 -noout -subject -dates',
        'Connect using the name on the certificate — that is the fix, not a workaround.',
        'If that is impossible, enable accepting unverified certificates in advanced settings. Traffic stays encrypted but server identity is not checked.',
        'On your own server, fix the cause: renew the certificate or add the missing intermediate.',
      ],
      faq: [
        [
          'Is accepting an unverified certificate safe?',
          'Traffic stays encrypted but you lose protection against server impersonation. On a controlled network or a host you own the risk is small; on a public network, resolve the name mismatch first.',
        ],
        [
          'Why does my mail client connect when the migration does not?',
          'Clients like Thunderbird ask once and remember the exception. An automated transfer never sees that dialog and fails instead.',
        ],
      ],
    },
    uk: {
      title: 'IMAP certificate verify failed — як виправити — MoveMailbox',
      description:
        'Помилка перевірки сертифіката при підключенні через IMAP. Чому вона виникає на shared-хостингу і як перевірити сертифікат через openssl s_client.',
      h1: 'Помилка certificate verify failed при підключенні через IMAP',
      sample:
        'SSL connect attempt failed error:0A000086:SSL routines::certificate verify failed',
      meaning:
        'TLS-з’єднання встановилося, але клієнт не зміг довіряти сертифікату сервера. Саме шифрування при цьому працює — не збігається або ім’я, або ланцюжок довіри, або строк дії.',
      causes: [
        'Класика shared-хостингу: сертифікат виписано на ім’я сервера на кшталт srv142.hoster.net, а ви підключаєтеся до mail.вашдомен.ua. Імена не збігаються.',
        'Самопідписаний сертифікат — типово для внутрішнього Exchange і власних серверів Dovecot.',
        'Прострочений сертифікат: Let’s Encrypt не продовжився, а поштова служба далі віддає старий.',
        'Неповний ланцюжок: сервер віддає лише кінцевий сертифікат без проміжного.',
      ],
      fixes: [
        'Подивіться, на яке ім’я виписано сертифікат: openssl s_client -connect host:993 -servername host | openssl x509 -noout -subject -dates',
        'Підключайтеся за тим іменем, яке вказано в сертифікаті — це правильне розв’язання, а не обхід.',
        'Якщо це неможливо, увімкніть у розширених налаштуваннях приймання неперевіреного сертифіката. Трафік лишиться зашифрованим, але справжність сервера не перевірятиметься.',
        'На власному сервері краще усунути причину: продовжити сертифікат або додати проміжний до ланцюжка.',
      ],
      faq: [
        [
          'Чи безпечно приймати неперевірений сертифікат?',
          'Трафік лишається зашифрованим, але ви втрачаєте захист від підміни сервера. У контрольованій мережі або при перенесенні з відомого вам хостингу ризик невеликий; у публічній мережі краще спершу розібратися з іменем.',
        ],
        [
          'Чому поштовий клієнт підключається, а перенесення — ні?',
          'Клієнти на кшталт Thunderbird один раз питають про виняток і запам’ятовують його. Автоматичне перенесення такого діалогу не показує і падає з помилкою.',
        ],
      ],
    },
  },

  {
    slug: 'quota-exceeded',
    code: 'NO [OVERQUOTA] Quota exceeded',
    providers: ['gmail', 'microsoft-365', 'cpanel'],
    ru: {
      title: 'Ошибка Quota exceeded при переносе почты — MoveMailbox',
      description:
        'Перенос встал с ошибкой OVERQUOTA: в ящике назначения кончилось место. Как посчитать объём заранее и что исключить, чтобы влезть.',
      h1: 'OVERQUOTA: в новом ящике кончилось место',
      sample: 'a3 NO [OVERQUOTA] Not enough disk quota (0.001 + 12.400 GB)',
      meaning:
        'Ящик назначения заполнен, и сервер отказывается принимать следующее письмо. Перенос останавливается ровно на этом месте — то, что уже приехало, остаётся.',
      causes: [
        'Объём источника больше квоты назначения. Самый частый случай: 12 ГБ переносят в тариф на 5 ГБ.',
        'У Gmail и Google Workspace квота общая с Диском и Фото — свободного места под почту меньше, чем кажется.',
        'В переносе участвуют Спам и Корзина, которые часто занимают первые гигабайты и не нужны.',
        'На хостинге квота ящика задана отдельно от квоты аккаунта и может быть заметно ниже.',
      ],
      fixes: [
        'Замерьте объём источника до запуска — это отдельный бесплатный шаг, он занимает минуту.',
        'Сверьте цифру с реальной свободной квотой назначения, а не с тарифом на бумаге.',
        'Исключите Спам, Корзину и у Gmail — [Gmail]/All Mail. Часто этого достаточно.',
        'Увеличьте квоту на стороне назначения или разнесите почту по двум ящикам.',
        'После расширения квоты просто запустите перенос снова: повтор докопирует недостающее и не создаст дублей.',
      ],
      faq: [
        [
          'Что происходит с уже перенесёнными письмами?',
          'Они остаются на месте. Повторный запуск сверяет, что уже есть в назначении, и копирует только недостающее — дублей не будет.',
        ],
        [
          'Почему Gmail показывает свободное место, а ошибка есть?',
          'Квота Gmail общая с Google Диском и Фото. Свободное место в интерфейсе почты может относиться к общему объёму, а фактический лимит уже исчерпан другими сервисами.',
        ],
      ],
    },
    en: {
      title: 'IMAP Quota exceeded during email migration — MoveMailbox',
      description:
        'The transfer stopped with OVERQUOTA: the destination mailbox is full. How to size the mailbox in advance and what to exclude so it fits.',
      h1: 'OVERQUOTA: the destination mailbox is out of space',
      sample: 'a3 NO [OVERQUOTA] Not enough disk quota (0.001 + 12.400 GB)',
      meaning:
        'The destination mailbox is full and the server refuses the next message. The transfer stops there; everything already copied stays put.',
      causes: [
        'The source is larger than the destination quota. The classic case: 12 GB moving into a 5 GB plan.',
        'Gmail and Google Workspace share quota with Drive and Photos, so there is less room for mail than it appears.',
        'Spam and Trash are included in the run and often account for the first few gigabytes.',
        'On hosting, per-mailbox quota is set separately from account quota and is often much lower.',
      ],
      fixes: [
        'Measure the source before starting — it is a separate free step and takes a minute.',
        'Compare that figure with actual free quota at the destination, not the plan on paper.',
        'Exclude Spam, Trash and, on Gmail, [Gmail]/All Mail. That is often enough.',
        'Raise the destination quota or split the mail across two mailboxes.',
        'After raising the quota just run the transfer again: the repeat copies only what is missing.',
      ],
      faq: [
        [
          'What happens to already-copied messages?',
          'They stay. A repeat run compares what already exists at the destination and copies only the remainder, so nothing duplicates.',
        ],
        [
          'Gmail shows free space but I still get the error — why?',
          'Gmail quota is shared with Drive and Photos. The free space shown in the mail interface may refer to total storage that other services have already consumed.',
        ],
      ],
    },
    uk: {
      title: 'Помилка Quota exceeded під час перенесення — MoveMailbox',
      description:
        'Перенесення стало з помилкою OVERQUOTA: у скриньці призначення скінчилося місце. Як порахувати обсяг заздалегідь і що виключити, щоб усе вмістилося.',
      h1: 'OVERQUOTA: у новій скриньці скінчилося місце',
      sample: 'a3 NO [OVERQUOTA] Not enough disk quota (0.001 + 12.400 GB)',
      meaning:
        'Скринька призначення заповнена, і сервер відмовляється приймати наступний лист. Перенесення зупиняється саме на цьому місці — те, що вже приїхало, лишається.',
      causes: [
        'Обсяг джерела більший за квоту призначення. Найчастіший випадок: 12 ГБ переносять у тариф на 5 ГБ.',
        'У Gmail і Google Workspace квота спільна з Диском і Фото — вільного місця під пошту менше, ніж здається.',
        'У перенесенні беруть участь Спам і Кошик, які часто займають перші гігабайти і не потрібні.',
        'На хостингу квота скриньки задана окремо від квоти акаунта і може бути помітно нижчою.',
      ],
      fixes: [
        'Заміряйте обсяг джерела до запуску — це окремий безкоштовний крок, він займає хвилину.',
        'Звірте цифру з реальною вільною квотою призначення, а не з тарифом на папері.',
        'Виключіть Спам, Кошик і в Gmail — [Gmail]/All Mail. Часто цього досить.',
        'Збільште квоту на боці призначення або розділіть пошту між двома скриньками.',
        'Після розширення квоти просто запустіть перенесення знову: повтор докопіює те, чого бракує, і не створить дублів.',
      ],
      faq: [
        [
          'Що відбувається з уже перенесеними листами?',
          'Вони лишаються на місці. Повторний запуск звіряє, що вже є в призначенні, і копіює тільки те, чого бракує — дублів не буде.',
        ],
        [
          'Чому Gmail показує вільне місце, а помилка є?',
          'Квота Gmail спільна з Google Диском і Фото. Вільне місце в інтерфейсі пошти може стосуватися загального обсягу, а фактичний ліміт уже вичерпали інші сервіси.',
        ],
      ],
    },
  },

  {
    slug: 'too-many-connections',
    code: 'Too many simultaneous connections',
    providers: ['microsoft-365', 'icloud', 'yandex'],
    ru: {
      title: 'Too many simultaneous connections IMAP — MoveMailbox',
      description:
        'Провайдер режет число одновременных IMAP-сессий. Почему увеличение потоков замедляет перенос и какие лимиты у Microsoft 365 и iCloud.',
      h1: 'Too many simultaneous connections: провайдер режет сессии',
      sample:
        'a2 NO Too many simultaneous connections. (Failure)',
      meaning:
        'Сервер разрешает ограниченное число одновременных IMAP-сессий на один ящик и отказывает в новых. Это защита провайдера, а не поломка переноса.',
      causes: [
        'Слишком высокий параллелизм: попытка ускорить перенос несколькими потоками даёт обратный эффект.',
        'У Microsoft 365 лимит около 20 одновременных сессий на ящик, у iCloud — заметно меньше.',
        'Параллельно с переносом работает почтовый клиент или телефон, которые тоже держат сессии.',
        'Предыдущий оборванный запуск оставил зависшие соединения — они отваливаются по таймауту не сразу.',
      ],
      fixes: [
        'Снизьте параллелизм до одного-двух потоков. На больших ящиках это в итоге быстрее, потому что нет повторов.',
        'Закройте почтовые клиенты, подключённые к тому же ящику, на время переноса.',
        'Подождите 10–15 минут, чтобы зависшие сессии закрылись по таймауту, и запустите снова.',
        'Переносите папка за папкой, а не всё сразу.',
      ],
      faq: [
        [
          'Почему нельзя просто добавить потоков?',
          'Потому что лимит стоит на стороне провайдера. Лишние потоки не ускоряют, а получают отказ, и работа уходит в повторы. Один стабильный поток обгоняет пять рвущихся.',
        ],
      ],
    },
    en: {
      title: 'IMAP Too many simultaneous connections — MoveMailbox',
      description:
        'The provider caps concurrent IMAP sessions. Why adding threads slows a migration down, and what the limits are on Microsoft 365 and iCloud.',
      h1: 'Too many simultaneous connections: the provider is capping sessions',
      sample: 'a2 NO Too many simultaneous connections. (Failure)',
      meaning:
        'The server allows a limited number of concurrent IMAP sessions per mailbox and refuses new ones. This is provider protection, not a broken transfer.',
      causes: [
        'Parallelism set too high — trying to speed things up with threads backfires.',
        'Microsoft 365 caps around 20 concurrent sessions per mailbox; iCloud is noticeably lower.',
        'A mail client or phone is connected to the same mailbox and holding sessions of its own.',
        'A previous aborted run left hanging connections that take time to time out.',
      ],
      fixes: [
        'Drop parallelism to one or two threads. On large mailboxes this is faster overall because nothing is retried.',
        'Disconnect mail clients using the same mailbox for the duration of the transfer.',
        'Wait 10–15 minutes for stale sessions to time out, then start again.',
        'Migrate folder by folder rather than everything at once.',
      ],
      faq: [
        [
          'Why not just add more threads?',
          'The cap is on the provider side. Extra threads are refused rather than served, and the work turns into retries. One steady thread beats five that keep dropping.',
        ],
      ],
    },
    uk: {
      title: 'Забагато з’єднань IMAP: too many connections — MoveMailbox',
      description:
        'Провайдер обмежує кількість одночасних IMAP-сесій. Чому збільшення потоків сповільнює перенесення і які ліміти в Microsoft 365 та iCloud.',
      h1: 'Too many simultaneous connections: провайдер ріже сесії',
      sample: 'a2 NO Too many simultaneous connections. (Failure)',
      meaning:
        'Сервер дозволяє обмежену кількість одночасних IMAP-сесій на одну скриньку і відмовляє в нових. Це захист провайдера, а не поломка перенесення.',
      causes: [
        'Завеликий паралелізм: спроба прискорити перенесення кількома потоками дає зворотний ефект.',
        'У Microsoft 365 ліміт близько 20 одночасних сесій на скриньку, у iCloud — помітно менше.',
        'Паралельно з перенесенням працює поштовий клієнт або телефон, які теж тримають сесії.',
        'Попередній обірваний запуск лишив завислі з’єднання — вони відпадають за тайм-аутом не одразу.',
      ],
      fixes: [
        'Знизьте паралелізм до одного-двох потоків. На великих скриньках це зрештою швидше, бо немає повторів.',
        'Закрийте поштові клієнти, підключені до тієї самої скриньки, на час перенесення.',
        'Зачекайте 10–15 хвилин, щоб завислі сесії закрилися за тайм-аутом, і запустіть знову.',
        'Переносьте папка за папкою, а не все одразу.',
      ],
      faq: [
        [
          'Чому не можна просто додати потоків?',
          'Бо ліміт стоїть на боці провайдера. Зайві потоки не прискорюють, а отримують відмову, і робота йде в повтори. Один стабільний потік обганяє п’ять, що рвуться.',
        ],
      ],
    },
  },

  {
    slug: 'connection-reset',
    code: 'Connection reset by peer',
    providers: ['gmail', 'yandex'],
    ru: {
      title: 'Connection reset by peer при переносе почты — MoveMailbox',
      description:
        'Сервер молча закрывает соединение во время переноса. Это троттлинг провайдера: почему он срабатывает и как безопасно продолжить перенос.',
      h1: 'Connection reset by peer: сервер закрыл соединение молча',
      sample: 'Error reading from socket: Connection reset by peer',
      meaning:
        'Провайдер решил, что запросы идут слишком часто, и разорвал сессию без объяснения причины. Классический троттлинг: ошибка описывает симптом, а не причину.',
      causes: [
        'Слишком высокая интенсивность запросов — провайдер защищает свои серверы.',
        'У Gmail после агрессивной выгрузки IMAP может быть временно заблокирован на несколько часов.',
        'Разрыв сети или таймаут промежуточного оборудования при долгих операциях.',
        'Переполнение памяти на стороне сервера при обработке очень крупного письма.',
      ],
      fixes: [
        'Просто запустите перенос снова: недостающее докопируется, дубли не появятся.',
        'Если обрывы повторяются, сделайте паузу на несколько часов — особенно с Gmail.',
        'Снизьте скорость и число потоков.',
        'Исключите папки с очень крупными вложениями и перенесите их отдельным заходом.',
      ],
      faq: [
        [
          'Не потеряются ли письма при обрыве?',
          'Нет. Перенос сверяет, что уже лежит в назначении, и при повторном запуске копирует только недостающее. Оборванный перенос никогда не означает потерянные письма.',
        ],
      ],
    },
    en: {
      title: 'Connection reset by peer during email migration — MoveMailbox',
      description:
        'The server drops the connection mid-transfer. This is provider throttling: why it triggers and how to resume the migration safely.',
      h1: 'Connection reset by peer: the server closed the session silently',
      sample: 'Error reading from socket: Connection reset by peer',
      meaning:
        'The provider decided the request rate was too high and tore down the session without explanation. Classic throttling — the error describes the symptom, not the cause.',
      causes: [
        'Request intensity too high; the provider is protecting its servers.',
        'Gmail can suspend IMAP for several hours after an aggressive download.',
        'Network interruption or an intermediate device timing out a long operation.',
        'Server-side memory pressure while handling a very large message.',
      ],
      fixes: [
        'Just run the transfer again — the remainder is copied and nothing duplicates.',
        'If it keeps happening, pause for a few hours, especially with Gmail.',
        'Reduce speed and thread count.',
        'Exclude folders with very large attachments and move them in a separate pass.',
      ],
      faq: [
        [
          'Can messages be lost when the connection drops?',
          'No. The transfer compares what already exists at the destination and copies only the remainder on the next run. An interrupted migration never means lost mail.',
        ],
      ],
    },
    uk: {
      title: 'Connection reset by peer при перенесенні — MoveMailbox',
      description:
        'Сервер мовчки закриває з’єднання під час перенесення. Це тротлінг провайдера: чому він спрацьовує і як безпечно продовжити перенесення.',
      h1: 'Connection reset by peer: сервер закрив з’єднання мовчки',
      sample: 'Error reading from socket: Connection reset by peer',
      meaning:
        'Провайдер вирішив, що запити йдуть надто часто, і розірвав сесію без пояснення причини. Класичний тротлінг: помилка описує симптом, а не причину.',
      causes: [
        'Надто висока інтенсивність запитів — провайдер захищає свої сервери.',
        'У Gmail після агресивного вивантаження IMAP може бути тимчасово заблокований на кілька годин.',
        'Розрив мережі або тайм-аут проміжного обладнання під час довгих операцій.',
        'Переповнення пам’яті на боці сервера при обробці дуже великого листа.',
      ],
      fixes: [
        'Просто запустіть перенесення знову: те, чого бракує, докопіюється, дублі не з’являться.',
        'Якщо обриви повторюються, зробіть паузу на кілька годин — особливо з Gmail.',
        'Знизьте швидкість і кількість потоків.',
        'Виключіть папки з дуже великими вкладеннями і перенесіть їх окремим заходом.',
      ],
      faq: [
        [
          'Чи не загубляться листи при обриві?',
          'Ні. Перенесення звіряє, що вже лежить у призначенні, і при повторному запуску копіює лише те, чого бракує. Обірване перенесення ніколи не означає втрачені листи.',
        ],
      ],
    },
  },

  {
    slug: 'invalid-folder-name',
    code: 'CREATE failed: invalid folder name',
    providers: ['cpanel', 'outlook'],
    ru: {
      title: 'CREATE failed invalid folder name IMAP — MoveMailbox',
      description:
        'Назначение не принимает имя папки. Причина почти всегда в разделителе уровней: Dovecot использует слэш, старые Courier-серверы — точку.',
      h1: 'CREATE failed: назначение не принимает имя папки',
      sample: 'a5 NO Mailbox does not exist, or must be subscribed to.',
      meaning:
        'Сервер назначения отказался создать папку с таким именем. Обычно виновата не сама папка, а разделитель уровней вложенности.',
      causes: [
        'Разные разделители: Dovecot использует слэш, старые Courier-серверы — точку. Из-за этого INBOX.Sent превращается в отдельную папку с точкой в имени вместо вложенной.',
        'Запрещённые символы в имени: у некоторых серверов это точка, слэш или обратный слэш.',
        'Кириллические имена в кодировке modified UTF-7 обработаны неправильно сторонним инструментом.',
        'Слишком длинный путь или слишком глубокая вложенность для сервера назначения.',
      ],
      fixes: [
        'Включите автоматическое сопоставление имён — разделитель определяется на обеих сторонах и пути переписываются.',
        'Задайте правило переименования вручную, если структура нестандартная.',
        'Проверьте, какой разделитель отдаёт сервер: команда LIST "" "*" покажет его в ответе.',
        'Спецпапки сопоставляйте по назначению, а не по названию: Junk и Спам — одна и та же папка.',
      ],
      faq: [
        [
          'Как узнать разделитель своего сервера?',
          'Подключитесь через openssl s_client и выполните a1 LIST "" "*". В ответе сервер укажет разделитель — слэш или точку — прямо в списке папок.',
        ],
      ],
    },
    en: {
      title: 'IMAP CREATE failed invalid folder name — MoveMailbox',
      description:
        'The destination rejects a folder name. The cause is almost always the hierarchy separator: Dovecot uses a slash, legacy Courier servers use a dot.',
      h1: 'CREATE failed: the destination rejects the folder name',
      sample: 'a5 NO Mailbox does not exist, or must be subscribed to.',
      meaning:
        'The destination server refused to create a folder with that name. Usually the folder is fine — the hierarchy separator is not.',
      causes: [
        'Different separators: Dovecot uses a slash, legacy Courier uses a dot, so INBOX.Sent becomes a top-level folder with a dot in its name instead of a child folder.',
        'Forbidden characters in the name — on some servers that is a dot, slash or backslash.',
        'Cyrillic names in modified UTF-7 mishandled by a third-party tool.',
        'A path too long or nesting too deep for the destination server.',
      ],
      fixes: [
        'Enable automatic folder mapping — the separator is detected on both sides and paths are rewritten.',
        'Set an explicit rename rule if the structure is unusual.',
        'Check what the server reports: LIST "" "*" shows the separator in its reply.',
        'Map special folders by purpose, not by name: Junk and Spam are the same folder.',
      ],
      faq: [
        [
          'How do I find my server’s separator?',
          'Connect with openssl s_client and run a1 LIST "" "*". The server states the separator — slash or dot — right in the folder listing.',
        ],
      ],
    },
    uk: {
      title: 'CREATE failed: хибне ім’я папки IMAP — MoveMailbox',
      description:
        'Призначення не приймає ім’я папки. Причина майже завжди в роздільнику рівнів: Dovecot використовує слеш, старі сервери Courier — крапку.',
      h1: 'CREATE failed: призначення не приймає ім’я папки',
      sample: 'a5 NO Mailbox does not exist, or must be subscribed to.',
      meaning:
        'Сервер призначення відмовився створити папку з таким іменем. Зазвичай винна не сама папка, а роздільник рівнів вкладеності.',
      causes: [
        'Різні роздільники: Dovecot використовує слеш, старі сервери Courier — крапку. Через це INBOX.Sent перетворюється на окрему папку з крапкою в імені замість вкладеної.',
        'Заборонені символи в імені: у деяких серверів це крапка, слеш або зворотний слеш.',
        'Кириличні імена в кодуванні modified UTF-7 оброблені неправильно стороннім інструментом.',
        'Задовгий шлях або надто глибока вкладеність для сервера призначення.',
      ],
      fixes: [
        'Увімкніть автоматичне зіставлення імен — роздільник визначається з обох боків, а шляхи переписуються.',
        'Задайте правило перейменування вручну, якщо структура нестандартна.',
        'Перевірте, який роздільник віддає сервер: команда LIST "" "*" покаже його у відповіді.',
        'Спецпапки зіставляйте за призначенням, а не за назвою: Junk і Спам — та сама папка.',
      ],
      faq: [
        [
          'Як дізнатися роздільник свого сервера?',
          'Підключіться через openssl s_client і виконайте a1 LIST "" "*". У відповіді сервер вкаже роздільник — слеш або крапку — прямо в списку папок.',
        ],
      ],
    },
  },

  {
    slug: 'message-too-large',
    code: 'message too large',
    providers: ['microsoft-365', 'gmail'],
    ru: {
      title: 'Ошибка message too large при переносе почты — MoveMailbox',
      description:
        'Письмо не влезло в лимит размера на стороне назначения. Какие лимиты у провайдеров и что делать с пропущенными письмами.',
      h1: 'message too large: письмо не влезло в лимит назначения',
      sample: 'a7 NO [LIMIT] The message being appended is too large.',
      meaning:
        'Сервер назначения отказался принять конкретное письмо из-за его размера. Остальной перенос при этом идёт нормально — пропускается только это сообщение.',
      causes: [
        'Microsoft 365 по умолчанию принимает письма до 35 МБ, и это настройка тенанта.',
        'У Gmail предел около 25 МБ на приём, у части хостингов — 10 МБ.',
        'Письмо с несколькими крупными вложениями раздувается ещё и base64-кодированием примерно на треть.',
      ],
      fixes: [
        'Ничего страшного не произошло: такие письма попадают в итоговый отчёт списком.',
        'Поднимите лимит на стороне назначения, если у вас есть админский доступ, и запустите повторный проход.',
        'Крупные письма перенесите вручную или сохраните вложения отдельно.',
      ],
      faq: [
        [
          'Сколько таких писем обычно бывает?',
          'В типичном рабочем ящике — единицы. Это письма с презентациями, видео или архивами. В отчёте они перечислены поимённо, так что решить, что с ними делать, можно после переноса.',
        ],
      ],
    },
    en: {
      title: 'IMAP message too large during migration — MoveMailbox',
      description:
        'A message exceeds the destination size limit. Provider limits explained and what to do about the messages that get skipped.',
      h1: 'message too large: the destination rejected one message',
      sample: 'a7 NO [LIMIT] The message being appended is too large.',
      meaning:
        'The destination server refused one specific message because of its size. The rest of the transfer continues normally — only that message is skipped.',
      causes: [
        'Microsoft 365 accepts messages up to 35 MB by default, and this is a tenant setting.',
        'Gmail caps inbound at around 25 MB; some hosting providers stop at 10 MB.',
        'A message with several large attachments grows by roughly a third again due to base64 encoding.',
      ],
      fixes: [
        'Nothing is broken: skipped messages are listed individually in the final report.',
        'Raise the limit at the destination if you have admin access, then run a second pass.',
        'Move oversized messages manually or save their attachments separately.',
      ],
      faq: [
        [
          'How many messages are usually affected?',
          'A handful in a typical working mailbox — presentations, video, archives. They are named in the report, so you can decide what to do with them after the migration.',
        ],
      ],
    },
    uk: {
      title: 'Помилка message too large при перенесенні — MoveMailbox',
      description:
        'Лист не вмістився в ліміт розміру на боці призначення. Які ліміти в провайдерів і що робити з пропущеними листами.',
      h1: 'message too large: лист не вмістився в ліміт призначення',
      sample: 'a7 NO [LIMIT] The message being appended is too large.',
      meaning:
        'Сервер призначення відмовився прийняти конкретний лист через його розмір. Решта перенесення при цьому йде нормально — пропускається лише це повідомлення.',
      causes: [
        'Microsoft 365 за замовчуванням приймає листи до 35 МБ, і це налаштування тенанта.',
        'У Gmail межа близько 25 МБ на приймання, у частини хостингів — 10 МБ.',
        'Лист із кількома великими вкладеннями роздувається ще й base64-кодуванням приблизно на третину.',
      ],
      fixes: [
        'Нічого страшного не сталося: такі листи потрапляють до підсумкового звіту списком.',
        'Підніміть ліміт на боці призначення, якщо у вас є адмінський доступ, і запустіть повторний прохід.',
        'Великі листи перенесіть вручну або збережіть вкладення окремо.',
      ],
      faq: [
        [
          'Скільки таких листів зазвичай буває?',
          'У типовій робочій скриньці — одиниці. Це листи з презентаціями, відео чи архівами. У звіті вони перелічені поіменно, тож вирішити, що з ними робити, можна після перенесення.',
        ],
      ],
    },
  },
];

export const imapErrorSlugs = imapErrors.map((e) => e.slug);

export function findError(slug: string): ImapError | undefined {
  return imapErrors.find((e) => e.slug === slug);
}
