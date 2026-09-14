/**
 * Отдельные гайды в /guides/<слаг>.
 *
 * Отличаются и от страниц провайдеров, и от маршрутов: здесь разбирается одна
 * техническая тема, по которой приходят запросом «как», а не «откуда куда».
 * Тексты сверены с тем, как ведёт себя наш собственный перенос: и проверка
 * подключения (internal/migrator/connection.go), и imapsync сверяют сертификат
 * с тем именем, которое человек ввёл в поле сервера.
 */

export type GuideSection = {
  h: string;
  /** Абзацы. Первый обычно отвечает на вопрос, остальные объясняют. */
  p: string[];
  /** Необязательный список: шаги или перечень значений. */
  list?: string[];
};

export type GuideCopy = {
  title: string;
  description: string;
  h1: string;
  intro: string;
  sections: GuideSection[];
  faq: Array<[string, string]>;
};

export type GuideArticle = {
  slug: string;
  ru: GuideCopy;
  en: GuideCopy;
  uk: GuideCopy;
};

export const guideArticles: GuideArticle[] = [
  {
    slug: 'migrate-mailbox-by-ip',
    ru: {
      title: 'Перенос ящика, пока домен переезжает — MoveMailbox',
      description:
        'Как подключиться к почте, когда DNS ещё показывает на старый сервер: имя хостинга вместо своего, когда работает IP и почему проверку сертификата нельзя выключать.',
      h1: 'Перенос почты, пока домен ещё не переехал',
      intro:
        'Классическая ситуация переезда: ящик на новом сервере уже создан, домен ещё указывает на старый, и mail.вашдомен открывает не то, что нужно. Подключиться к обоим ящикам можно и так — но не через IP, как советуют в половине инструкций. Ниже разбор, почему IP чаще всего не сработает и что использовать вместо него.',
      sections: [
        {
          h: 'Почему имя сервера ведёт не туда',
          p: [
            'Адрес mail.вашдомен — это обычная DNS-запись вашего домена. Пока вы не переключили её на нового провайдера, она указывает на старый сервер, и любой клиент, включая наш, попадёт именно туда. Это не ошибка настройки, а нормальная работа DNS.',
            'Из этого следует практическое правило: во время переезда нельзя пользоваться одним и тем же именем для обеих сторон. Нужны два разных адреса — тот, что ведёт на старый сервер, и тот, что ведёт на новый.',
          ],
        },
        {
          h: 'Что использовать вместо IP',
          p: [
            'У каждого хостинга есть собственное имя почтового сервера, не зависящее от вашего домена: что-то вроде mail.хостер.tld, imap.хостер.tld или srv12.хостер.tld. Оно указано в панели управления, в разделе настройки почтового клиента, и в письме, которым провайдер подтверждал создание ящика.',
            'Это имя и нужно вводить в поле сервера для новой стороны, а своё mail.вашдомен оставить для старой — пока запись ещё ведёт на неё. Обе стороны доступны одновременно, и перенос идёт как обычно.',
          ],
          list: [
            'Старый ящик: mail.вашдомен — пока DNS показывает на старый сервер.',
            'Новый ящик: собственное имя хостинга из панели управления.',
            'После переключения DNS обе стороны снова доступны по вашему домену, и повторный запуск доберёт письма, пришедшие за время переезда.',
          ],
        },
        {
          h: 'Когда IP всё-таки работает',
          p: [
            'Поле сервера принимает IP-адрес, но соединение состоится, только если TLS-сертификат сервера выписан на этот IP. Такие сертификаты бывают — у части хостингов и в корпоративных сетях с внутренним удостоверяющим центром, — но это редкость: почти все сертификаты выписываются на имя.',
            'Мы сверяем сертификат ровно с тем, что введено в поле, и не даём отключить проверку. Это не придирчивость: переключателя «не проверять» достаточно, чтобы пароль от почты ушёл на чужой сервер, который представился вашим. Если сертификат не сходится, в журнале будет видно, какое имя ожидалось, — по этой строке и находится правильный адрес.',
          ],
        },
        {
          h: 'Порядок переезда без потери писем',
          p: [
            'Перенос не требует останавливать почту и не меняет источник, поэтому его делают до переключения домена, а не после.',
          ],
          list: [
            'Создать ящики у нового провайдера и убедиться, что места хватает.',
            'Перенести почту, пока домен ещё работает по-старому: пользователи ничего не замечают.',
            'Переключить MX-записи домена на нового провайдера.',
            'Через сутки запустить перенос повторно: он доберёт письма, которые за время переключения успели прийти на старый сервер. Дубликатов не будет — уже перенесённые письма пропускаются.',
          ],
        },
      ],
      faq: [
        [
          'Можно ли вообще указать IP в поле сервера?',
          'Можно, поле его принимает. Но подключение пройдёт только если сертификат сервера выписан на этот IP, а это редкость. Проверку сертификата мы не отключаем ни ключом, ни галочкой.',
        ],
        [
          'Где взять имя почтового сервера хостинга?',
          'В панели управления, раздел «Почта → Настройка почтового клиента». Там же обычно указаны порты. Если панели нет, имя есть в письме от провайдера при создании ящика.',
        ],
        [
          'Что делать, если сертификат сервера самоподписанный?',
          'Выпустить нормальный: Let’s Encrypt бесплатен и настраивается за несколько минут. Это правильнее, чем искать способ обойти проверку, — и полезно не только для переноса.',
        ],
        [
          'Повторный запуск создаст дубликаты?',
          'Нет. Уже перенесённые письма пропускаются, в журнале они видны как skipped. Именно поэтому повторный запуск после переключения домена безопасен.',
        ],
      ],
    },
    en: {
      title: 'Migrating a mailbox while the domain is moving — MoveMailbox',
      description:
        'How to connect while DNS still points at the old server: use the hosting provider’s own hostname, when an IP actually works, and why certificate checks stay on.',
      h1: 'Migrating mail while the domain has not moved yet',
      intro:
        'The classic transfer situation: the mailbox on the new server exists, the domain still points at the old one, and mail.yourdomain opens the wrong server. You can reach both mailboxes anyway — but not through an IP address, which is what half the instructions on the internet suggest. Here is why an IP usually fails and what to use instead.',
      sections: [
        {
          h: 'Why the server name leads to the wrong place',
          p: [
            'mail.yourdomain is an ordinary DNS record of your domain. Until you repoint it at the new provider it resolves to the old server, and every client — ours included — lands there. That is DNS working correctly, not a misconfiguration.',
            'The practical rule follows: during a transfer you cannot use the same name for both sides. You need two different addresses — one that reaches the old server and one that reaches the new one.',
          ],
        },
        {
          h: 'What to use instead of an IP',
          p: [
            'Every hosting provider has its own mail hostname that does not depend on your domain: something like mail.hoster.tld, imap.hoster.tld or srv12.hoster.tld. It is printed in the control panel under mail client configuration, and in the message the provider sent when the mailbox was created.',
            'That is the name to enter for the new side, while your own mail.yourdomain stays on the old side for as long as the record still points there. Both sides are reachable at once and the transfer runs normally.',
          ],
          list: [
            'Old mailbox: mail.yourdomain — while DNS still points at the old server.',
            'New mailbox: the hosting provider’s own hostname from the control panel.',
            'After the DNS switch both sides answer on your domain again, and a second run picks up whatever arrived during the move.',
          ],
        },
        {
          h: 'When an IP does work',
          p: [
            'The server field accepts an IP address, but the connection succeeds only if the server’s TLS certificate covers that IP. Such certificates exist — some hosts issue them, and corporate networks with an internal CA do — but they are rare: nearly every certificate is issued for a name.',
            'We verify the certificate against exactly what you typed and offer no way to turn that off. This is not fussiness: a "do not verify" switch is all it takes for a mailbox password to land on a server that merely claims to be yours. When a certificate does not match, the log shows which name was expected — and that line is usually where the correct address comes from.',
          ],
        },
        {
          h: 'The order that loses no mail',
          p: [
            'A migration needs no downtime and never modifies the source, so it happens before the domain switch, not after.',
          ],
          list: [
            'Create the mailboxes at the new provider and check there is room for the whole volume.',
            'Migrate while the domain still works the old way: users notice nothing.',
            'Repoint the domain’s MX records at the new provider.',
            'A day later, run the migration again: it picks up the mail that reached the old server during the switch. No duplicates — messages already transferred are skipped.',
          ],
        },
      ],
      faq: [
        [
          'Can I put an IP in the server field at all?',
          'You can, the field accepts it. But the connection only succeeds when the server certificate covers that IP, which is rare. We do not disable certificate verification — not with a flag, not with a checkbox.',
        ],
        [
          'Where do I find the hosting provider’s mail hostname?',
          'In the control panel, under "Mail → mail client configuration", usually next to the ports. With no panel, it is in the message the provider sent when the mailbox was created.',
        ],
        [
          'What if the server uses a self-signed certificate?',
          'Issue a real one: Let’s Encrypt is free and takes minutes. That is the right fix, rather than looking for a way around the check — and it helps far beyond this migration.',
        ],
        [
          'Will a second run create duplicates?',
          'No. Messages already transferred are skipped and show up in the log as skipped. That is exactly why re-running after the DNS switch is safe.',
        ],
      ],
    },
    uk: {
      title: 'Перенесення скриньки, поки домен переїжджає — MoveMailbox',
      description:
        'Як підключитися, доки DNS ще вказує на старий сервер: ім’я хостингу замість власного, коли працює IP і чому перевірку сертифіката не вимикають.',
      h1: 'Перенесення пошти, поки домен ще не переїхав',
      intro:
        'Класична ситуація переїзду: скринька на новому сервері вже створена, домен ще вказує на старий, і mail.вашдомен відкриває не те, що потрібно. Підключитися до обох скриньок можна й так — але не через IP, як радить половина інструкцій. Нижче розбір, чому IP найчастіше не спрацює і що використовувати замість нього.',
      sections: [
        {
          h: 'Чому ім’я сервера веде не туди',
          p: [
            'Адреса mail.вашдомен — це звичайний DNS-запис вашого домену. Доки ви не перемкнули його на нового провайдера, він указує на старий сервер, і будь-який клієнт, зокрема наш, потрапить саме туди. Це не помилка налаштування, а нормальна робота DNS.',
            'Звідси практичне правило: під час переїзду не можна користуватися одним і тим самим ім’ям для обох боків. Потрібні дві різні адреси — та, що веде на старий сервер, і та, що веде на новий.',
          ],
        },
        {
          h: 'Що використовувати замість IP',
          p: [
            'У кожного хостингу є власне ім’я поштового сервера, яке не залежить від вашого домену: щось на кшталт mail.хостер.tld, imap.хостер.tld або srv12.хостер.tld. Воно вказане в панелі керування, у розділі налаштування поштового клієнта, і в листі, яким провайдер підтверджував створення скриньки.',
            'Саме це ім’я потрібно вводити для нового боку, а власне mail.вашдомен залишити для старого — доки запис ще веде на нього. Обидва боки доступні одночасно, і перенесення йде як зазвичай.',
          ],
          list: [
            'Стара скринька: mail.вашдомен — доки DNS показує на старий сервер.',
            'Нова скринька: власне ім’я хостингу з панелі керування.',
            'Після перемикання DNS обидва боки знову доступні за вашим доменом, а повторний запуск добере листи, що надійшли під час переїзду.',
          ],
        },
        {
          h: 'Коли IP усе ж працює',
          p: [
            'Поле сервера приймає IP-адресу, але з’єднання відбудеться лише якщо TLS-сертифікат сервера виписано на цю IP. Такі сертифікати трапляються — у частини хостингів і в корпоративних мережах із внутрішнім центром сертифікації, — але це рідкість: майже всі сертифікати виписують на ім’я.',
            'Ми звіряємо сертифікат саме з тим, що введено в полі, і не даємо вимкнути перевірку. Це не прискіпливість: перемикача «не перевіряти» достатньо, щоб пароль від пошти пішов на чужий сервер, який відрекомендувався вашим. Якщо сертифікат не збігається, у журналі видно, яке ім’я очікувалося, — саме за цим рядком і знаходять правильну адресу.',
          ],
        },
        {
          h: 'Порядок переїзду без втрати листів',
          p: [
            'Перенесення не потребує зупиняти пошту й не змінює джерело, тому його роблять до перемикання домену, а не після.',
          ],
          list: [
            'Створити скриньки в нового провайдера і переконатися, що місця вистачає.',
            'Перенести пошту, доки домен ще працює по-старому: користувачі нічого не помічають.',
            'Перемкнути MX-записи домену на нового провайдера.',
            'Через добу запустити перенесення повторно: воно добере листи, які за час перемикання встигли надійти на старий сервер. Дублікатів не буде — уже перенесені листи пропускаються.',
          ],
        },
      ],
      faq: [
        [
          'Чи можна взагалі вказати IP у полі сервера?',
          'Можна, поле її приймає. Але підключення пройде лише якщо сертифікат сервера виписано на цю IP, а це рідкість. Перевірку сертифіката ми не вимикаємо ні ключем, ні позначкою.',
        ],
        [
          'Де взяти ім’я поштового сервера хостингу?',
          'У панелі керування, розділ «Пошта → Налаштування поштового клієнта». Там само зазвичай указані порти. Якщо панелі немає, ім’я є в листі від провайдера під час створення скриньки.',
        ],
        [
          'Що робити, якщо сертифікат сервера самопідписаний?',
          'Випустити нормальний: Let’s Encrypt безкоштовний і налаштовується за кілька хвилин. Це правильніше, ніж шукати спосіб обійти перевірку, — і корисно не лише для перенесення.',
        ],
        [
          'Чи створить повторний запуск дублікати?',
          'Ні. Уже перенесені листи пропускаються, у журналі вони видні як skipped. Саме тому повторний запуск після перемикання домену безпечний.',
        ],
      ],
    },
  },

  {
    slug: 'imap-ports-and-encryption',
    ru: {
      title: 'Порты IMAP и шифрование: 993, 143, SSL/TLS и STARTTLS — MoveMailbox',
      description:
        'Какой порт выбрать для IMAP, чем SSL/TLS отличается от STARTTLS, почему 143 без шифрования недопустим и что означают типичные ошибки подключения.',
      h1: 'Порты IMAP и шифрование',
      intro:
        'Два порта, два способа шифрования и одна распространённая ошибка — выбрать несовместимую пару и получить обрыв соединения без внятного объяснения. Разберём, что стоит за 993 и 143, когда какой нужен и как читать ответ сервера, если подключение не проходит.',
      sections: [
        {
          h: 'Что означают 993 и 143',
          p: [
            'Порт 993 — это IMAPS: шифрование поднимается сразу, ещё до того как клиент скажет серверу хоть слово. Такой режим называют implicit TLS или просто SSL/TLS.',
            'Порт 143 — обычный IMAP, где соединение начинается открытым и переходит в шифрованное командой STARTTLS. Сам по себе 143 не означает «без шифрования», но означает, что первые байты идут в открытую.',
            'Практический выбор: если сервер поддерживает 993 — берите 993. STARTTLS на 143 оставляют для серверов, где 993 не открыт, — такое встречается на корпоративных почтовиках и у части хостингов.',
          ],
          list: [
            '993 + SSL/TLS — основной вариант, подходит почти везде.',
            '143 + STARTTLS — когда 993 закрыт.',
            '143 без шифрования — не поддерживается: пароль ушёл бы по сети открытым текстом.',
          ],
        },
        {
          h: 'Почему мы не подключаемся без шифрования',
          p: [
            'IMAP без TLS передаёт логин и пароль открытым текстом. Любой узел по пути — от вайфая в кафе до транзитного провайдера — видит их целиком. Поэтому режима «без шифрования» в форме нет вообще, и это осознанное ограничение, а не недоделка.',
            'По той же причине нет и переключателя «не проверять сертификат». Сертификат сверяется с тем именем, которое вы ввели в поле сервера: если сервер представился чужим именем, соединение прекращается, а причина попадает в журнал.',
          ],
        },
        {
          h: 'Как читать ошибки подключения',
          p: [
            'Ответ сервера почти всегда точно указывает, где ошибка, — если знать, что искать.',
          ],
          list: [
            'Соединение закрывается сразу после приветствия — обычно выбран STARTTLS на порту 993 или SSL/TLS на 143. Порт и режим должны совпадать.',
            'Таймаут без ответа — порт закрыт фаерволом или у провайдера, либо служба IMAP не запущена (частый случай на Exchange).',
            'Ошибка проверки сертификата — имя в сертификате не совпадает с введённым. В журнале видно ожидаемое имя; обычно это и есть правильный адрес сервера.',
            'AUTHENTICATIONFAILED при верном пароле — не относится к портам: либо нужен пароль приложения, либо логин без домена, либо IMAP отключён в настройках ящика.',
          ],
        },
      ],
      faq: [
        [
          'Что выбрать, если провайдер предлагает и 993, и 143?',
          'Берите 993 с SSL/TLS. Разницы в скорости нет, а шифрование поднимается сразу, без промежуточного открытого этапа.',
        ],
        [
          'Наш сервер поддерживает только 143. Это безопасно?',
          'Да, если включён STARTTLS: соединение переходит в шифрованное до передачи пароля. Без STARTTLS мы подключение не выполним.',
        ],
        [
          'Можно ли указать нестандартный порт?',
          'Да, в расширенных настройках подключения есть ручной ввод порта. Требование к шифрованию при этом сохраняется.',
        ],
        [
          'Почему соединение рвётся сразу после начала?',
          'Чаще всего порт и режим шифрования не совпадают: 993 ждёт TLS с первого байта, а 143 — команду STARTTLS. Поменяйте режим и повторите проверку.',
        ],
      ],
    },
    en: {
      title: 'IMAP ports and encryption: 993, 143, SSL/TLS and STARTTLS — MoveMailbox',
      description:
        'Which IMAP port to pick, how SSL/TLS differs from STARTTLS, why plain 143 is not an option, and what the usual connection errors actually mean.',
      h1: 'IMAP ports and encryption',
      intro:
        'Two ports, two ways of encrypting and one very common mistake — pairing them wrongly and getting a dropped connection with no clear explanation. Here is what 993 and 143 stand for, when each is needed, and how to read the server’s answer when a connection fails.',
      sections: [
        {
          h: 'What 993 and 143 mean',
          p: [
            'Port 993 is IMAPS: encryption starts immediately, before the client says a single word to the server. This mode is called implicit TLS, or simply SSL/TLS.',
            'Port 143 is plain IMAP, where the session opens unencrypted and upgrades with the STARTTLS command. On its own 143 does not mean "no encryption", but it does mean the first bytes travel in the clear.',
            'The practical choice: if the server offers 993, take 993. STARTTLS on 143 is for servers where 993 is not open — which happens on corporate mail servers and at some hosting providers.',
          ],
          list: [
            '993 + SSL/TLS — the default, works almost everywhere.',
            '143 + STARTTLS — when 993 is closed.',
            '143 with no encryption — not supported: the password would cross the network in plain text.',
          ],
        },
        {
          h: 'Why we never connect unencrypted',
          p: [
            'IMAP without TLS sends the login and the password as plain text. Every hop along the way — from café Wi-Fi to a transit provider — sees them in full. That is why there is no "no encryption" option in the form at all: a deliberate limit, not an unfinished feature.',
            'For the same reason there is no "skip certificate check" switch. The certificate is verified against the name you typed into the server field: if the server presents a different name, the connection stops and the reason goes into the log.',
          ],
        },
        {
          h: 'How to read connection errors',
          p: [
            'The server’s answer almost always points at the exact problem — if you know what to look for.',
          ],
          list: [
            'The connection closes right after the greeting — usually STARTTLS selected on port 993, or SSL/TLS on 143. The port and the mode have to match.',
            'A timeout with no answer — the port is blocked by a firewall or the provider, or the IMAP service is not running (common on Exchange).',
            'A certificate verification error — the name in the certificate does not match what you typed. The log shows the expected name, and that is usually the correct server address.',
            'AUTHENTICATIONFAILED with a correct password — unrelated to ports: either an app password is required, or the login has no domain, or IMAP is disabled in the mailbox settings.',
          ],
        },
      ],
      faq: [
        [
          'Which one if the provider offers both 993 and 143?',
          'Take 993 with SSL/TLS. There is no speed difference, and encryption starts immediately with no plaintext stage in between.',
        ],
        [
          'Our server only supports 143. Is that safe?',
          'Yes, when STARTTLS is available: the session upgrades to encryption before the password is sent. Without STARTTLS we will not connect at all.',
        ],
        [
          'Can I use a non-standard port?',
          'Yes — the advanced connection settings accept a manual port. The encryption requirement still applies.',
        ],
        [
          'Why does the connection drop immediately?',
          'Most often the port and the encryption mode disagree: 993 expects TLS from the first byte, 143 expects a STARTTLS command. Switch the mode and check again.',
        ],
      ],
    },
    uk: {
      title: 'Порти IMAP і шифрування: 993, 143, SSL/TLS та STARTTLS — MoveMailbox',
      description:
        'Який порт обрати для IMAP, чим SSL/TLS відрізняється від STARTTLS, чому 143 без шифрування неприпустимий і що означають типові помилки підключення.',
      h1: 'Порти IMAP і шифрування',
      intro:
        'Два порти, два способи шифрування і одна поширена помилка — обрати несумісну пару й отримати обрив з’єднання без зрозумілого пояснення. Розберемо, що стоїть за 993 і 143, коли який потрібен і як читати відповідь сервера, якщо підключення не проходить.',
      sections: [
        {
          h: 'Що означають 993 і 143',
          p: [
            'Порт 993 — це IMAPS: шифрування піднімається одразу, ще до того як клієнт скаже серверу бодай слово. Такий режим називають implicit TLS або просто SSL/TLS.',
            'Порт 143 — звичайний IMAP, де з’єднання починається відкритим і переходить у шифроване командою STARTTLS. Сам по собі 143 не означає «без шифрування», але означає, що перші байти йдуть відкрито.',
            'Практичний вибір: якщо сервер підтримує 993 — беріть 993. STARTTLS на 143 залишають для серверів, де 993 не відкрито, — таке трапляється на корпоративних поштовиках і в частини хостингів.',
          ],
          list: [
            '993 + SSL/TLS — основний варіант, підходить майже всюди.',
            '143 + STARTTLS — коли 993 закрито.',
            '143 без шифрування — не підтримується: пароль ішов би мережею відкритим текстом.',
          ],
        },
        {
          h: 'Чому ми не підключаємось без шифрування',
          p: [
            'IMAP без TLS передає логін і пароль відкритим текстом. Будь-який вузол на шляху — від вайфаю в кафе до транзитного провайдера — бачить їх повністю. Тому режиму «без шифрування» у формі немає взагалі, і це свідоме обмеження, а не недоробка.',
            'З тієї ж причини немає й перемикача «не перевіряти сертифікат». Сертифікат звіряють з тим ім’ям, яке ви ввели в полі сервера: якщо сервер відрекомендувався чужим ім’ям, з’єднання припиняється, а причина потрапляє в журнал.',
          ],
        },
        {
          h: 'Як читати помилки підключення',
          p: [
            'Відповідь сервера майже завжди точно вказує, де помилка, — якщо знати, що шукати.',
          ],
          list: [
            'З’єднання закривається одразу після привітання — зазвичай обрано STARTTLS на порту 993 або SSL/TLS на 143. Порт і режим мають збігатися.',
            'Таймаут без відповіді — порт закрито фаєрволом чи провайдером, або служба IMAP не запущена (частий випадок на Exchange).',
            'Помилка перевірки сертифіката — ім’я в сертифікаті не збігається з уведеним. У журналі видно очікуване ім’я; зазвичай це і є правильна адреса сервера.',
            'AUTHENTICATIONFAILED за правильного пароля — не стосується портів: або потрібен пароль застосунку, або логін без домену, або IMAP вимкнено в налаштуваннях скриньки.',
          ],
        },
      ],
      faq: [
        [
          'Що обрати, якщо провайдер пропонує і 993, і 143?',
          'Беріть 993 із SSL/TLS. Різниці у швидкості немає, а шифрування піднімається одразу, без проміжного відкритого етапу.',
        ],
        [
          'Наш сервер підтримує лише 143. Це безпечно?',
          'Так, якщо увімкнено STARTTLS: з’єднання переходить у шифроване до передавання пароля. Без STARTTLS ми підключення не виконаємо.',
        ],
        [
          'Чи можна вказати нестандартний порт?',
          'Так, у розширених налаштуваннях підключення є ручне введення порту. Вимога до шифрування при цьому зберігається.',
        ],
        [
          'Чому з’єднання рветься одразу після початку?',
          'Найчастіше порт і режим шифрування не збігаються: 993 чекає TLS з першого байта, а 143 — команду STARTTLS. Змініть режим і повторіть перевірку.',
        ],
      ],
    },
  },
  {
    slug: 'hosting-change-mail-migration',
    ru: {
      title: 'Смена хостинга: перенос почты и переключение MX — MoveMailbox',
      description:
        'Порядок переезда почты при смене хостинга: где взять настройки IMAP в cPanel, Plesk и DirectAdmin, когда переключать MX и что не переносится по IMAP.',
      h1: 'Смена хостинга: как перенести почту',
      intro:
        'При переезде сайта на новый хостинг почта — самая болезненная часть: файлы можно перелить ночью и никто не заметит, а письма приходят круглосуточно, и любая пауза означает потерянное письмо клиента. Правильный порядок снимает проблему полностью: почта переносится ДО переключения домена, пока оба сервера работают, а после переключения запускается повторно и добирает хвост.',
      sections: [
        {
          h: 'Что собрать до начала',
          p: [
            'Перенос идёт по каждому ящику отдельно, поэтому сначала нужен список: адреса, объёмы и доступы. Пароли со старого хостинга не «переезжают» — ящики на новом создаются заново, и пароль там будет свой.',
          ],
          list: [
            'Список всех ящиков домена и их объём — в панели старого хостинга, раздел почты.',
            'Место на новом тарифе: суммарный объём ящиков должен помещаться с запасом.',
            'Ящики, созданные на новом хостинге заранее, с паролями, которые вы знаете.',
            'Текущее значение TTL у MX-записей: от него зависит, сколько будет длиться переключение.',
          ],
        },
        {
          h: 'Где взять настройки IMAP в панелях',
          p: [
            'Адрес сервера и порт панель показывает сама — угадывать не нужно. Пути по трём самым частым панелям:',
          ],
          list: [
            'cPanel: «Email → Set Up Mail Client» (кнопка «Connect Devices» в списке почтовых аккаунтов).',
            'Plesk: «Сайты и домены → нужный домен → Почтовые аккаунты → Настройка почтового клиента». По умолчанию IMAP на 143, защищённый — на 993 с SSL, логин — полный адрес.',
            'DirectAdmin: сервер mail.вашдомен, IMAP 993 по SSL, логин — полный адрес почты.',
            'Остальные панели: ищите раздел с названием вроде «настройка почтового клиента» — он есть почти везде.',
          ],
        },
        {
          h: 'Порядок, при котором ничего не теряется',
          p: [
            'Ключевой момент: перенос не трогает источник и не требует остановки почты, поэтому его делают заранее, а не в ночь переключения.',
          ],
          list: [
            'За сутки-двое до переезда уменьшите TTL у MX-записей — переключение пройдёт быстрее.',
            'Перенесите почту на новый хостинг, пока домен ещё работает по-старому. Пользователи продолжают работать в старых ящиках.',
            'Переключите MX на нового провайдера.',
            'Через сутки запустите перенос повторно: он заберёт письма, пришедшие на старый сервер за время смены DNS. Уже перенесённое пропускается, дубликатов не будет.',
            'Старый хостинг не отключайте ещё неделю: письма могут приходить туда по кэшированным записям.',
          ],
        },
        {
          h: 'Что IMAP не переносит',
          p: [
            'Протокол работает с письмами и папками. Всё остальное настраивается на новом хостинге руками — и лучше знать об этом заранее, а не в день переезда.',
          ],
          list: [
            'Пароли ящиков, автоответчики, правила фильтрации и пересылки.',
            'Catch-all и почтовые алиасы.',
            'Контакты и календари — это не почта и по IMAP не передаются.',
            'Настройки спам-фильтра и его обучение.',
          ],
        },
      ],
      faq: [
        [
          'Сколько ящиков можно перенести за раз?',
          'Сейчас перенос идёт по одному ящику за задание: указываете источник и назначение и запускаете. Для домена на десяток ящиков это десяток запусков — не быстро, но предсказуемо. Массовый перенос списком в планах.',
        ],
        [
          'Пользователи заметят переезд?',
          'Нет, если переносить заранее. Источник не изменяется, старые ящики работают как работали. Заметным станет только момент, когда вы смените пароли и настройки в их почтовых программах.',
        ],
        [
          'Что делать, если на новом хостинге ящик уже с письмами?',
          'Ничего страшного: одинаковые письма пропускаются, а не дублируются. Именно поэтому повторный запуск после смены MX безопасен.',
        ],
        [
          'Нужно ли что-то просить у старого хостера?',
          'Обычно нет — достаточно паролей от ящиков. Если IMAP на тарифе отключён или закрыт фаерволом, это единственное, о чём придётся просить в поддержке.',
        ],
      ],
    },
    en: {
      title: 'Changing hosting: migrating mail and switching MX — MoveMailbox',
      description:
        'The order of a mail migration during a hosting change: where cPanel, Plesk and DirectAdmin show IMAP settings, when to switch MX, and what IMAP does not carry over.',
      h1: 'Changing hosting: how to migrate the mail',
      intro:
        'When a site moves to a new host, mail is the painful part: files can be copied overnight and nobody notices, but messages arrive around the clock and every pause means a lost customer email. The right order removes the problem entirely: mail is migrated BEFORE the domain is switched, while both servers still work, and a second run after the switch collects the tail.',
      sections: [
        {
          h: 'What to collect first',
          p: [
            'Migration runs per mailbox, so start with a list: addresses, volumes, credentials. Passwords do not travel from the old host — mailboxes on the new one are created from scratch with passwords of their own.',
          ],
          list: [
            'Every mailbox on the domain and its size — from the old host’s mail section.',
            'Free space on the new plan: the total volume has to fit with room to spare.',
            'Mailboxes created on the new host in advance, with passwords you know.',
            'The current TTL on the MX records: it decides how long the switch will take.',
          ],
        },
        {
          h: 'Where the panels show IMAP settings',
          p: [
            'The panel tells you the server name and port — there is nothing to guess. Paths for the three most common ones:',
          ],
          list: [
            'cPanel: Email → Set Up Mail Client (the "Connect Devices" button in the email account list).',
            'Plesk: Websites & Domains → the domain → Mail Accounts → Mail Client Setup. IMAP is 143 by default and 993 with SSL; the username is the full email address.',
            'DirectAdmin: server mail.yourdomain, IMAP 993 over SSL, username is the full email address.',
            'Other panels: look for a section named something like "mail client configuration" — nearly all of them have one.',
          ],
        },
        {
          h: 'The order that loses nothing',
          p: [
            'The key point: a migration never modifies the source and needs no downtime, so it happens ahead of time, not on the night of the switch.',
          ],
          list: [
            'A day or two before the move, lower the TTL on the MX records so the switch propagates faster.',
            'Migrate the mail to the new host while the domain still works the old way. People keep using the old mailboxes.',
            'Switch the MX records to the new provider.',
            'A day later, run the migration again: it collects whatever reached the old server while DNS was changing. Already transferred messages are skipped, so no duplicates.',
            'Keep the old hosting alive for another week: mail can still arrive there through cached records.',
          ],
        },
        {
          h: 'What IMAP does not carry over',
          p: [
            'The protocol deals with messages and folders. Everything else is set up on the new host by hand — better known in advance than on moving day.',
          ],
          list: [
            'Mailbox passwords, auto-responders, filtering and forwarding rules.',
            'Catch-all addresses and mail aliases.',
            'Contacts and calendars — not mail, not carried by IMAP.',
            'Spam filter settings and everything it has learned.',
          ],
        },
      ],
      faq: [
        [
          'How many mailboxes can be migrated at once?',
          'Today one mailbox per job: you enter the source and the destination and start it. A domain with ten mailboxes means ten runs — not fast, but predictable. Bulk migration from a list is planned.',
        ],
        [
          'Will users notice the move?',
          'Not if you migrate ahead of time. The source is never modified and the old mailboxes keep working. The only visible moment is when you hand out new passwords and settings for their mail clients.',
        ],
        [
          'What if the mailbox on the new host already has mail in it?',
          'Not a problem: identical messages are skipped rather than duplicated. That is exactly why re-running after the MX switch is safe.',
        ],
        [
          'Do I need anything from the old host?',
          'Usually just the mailbox passwords. If IMAP is disabled on the plan or blocked by a firewall, that is the one thing worth asking support about.',
        ],
      ],
    },
    uk: {
      title: 'Зміна хостингу: перенесення пошти та перемикання MX — MoveMailbox',
      description:
        'Порядок переїзду пошти під час зміни хостингу: де взяти налаштування IMAP у cPanel, Plesk і DirectAdmin, коли перемикати MX і що не переноситься за IMAP.',
      h1: 'Зміна хостингу: як перенести пошту',
      intro:
        'Під час переїзду сайту на новий хостинг пошта — найболючіша частина: файли можна перелити вночі і ніхто не помітить, а листи надходять цілодобово, і будь-яка пауза означає загублений лист клієнта. Правильний порядок знімає проблему повністю: пошта переноситься ДО перемикання домену, поки обидва сервери працюють, а після перемикання запускається повторно і добирає хвіст.',
      sections: [
        {
          h: 'Що зібрати до початку',
          p: [
            'Перенесення йде для кожної скриньки окремо, тому спершу потрібен список: адреси, обсяги та доступи. Паролі зі старого хостингу не «переїжджають» — скриньки на новому створюються заново, і пароль там буде свій.',
          ],
          list: [
            'Список усіх скриньок домену та їхній обсяг — у панелі старого хостингу, розділ пошти.',
            'Місце на новому тарифі: сумарний обсяг скриньок має вміщатися із запасом.',
            'Скриньки, створені на новому хостингу заздалегідь, із паролями, які ви знаєте.',
            'Поточне значення TTL у MX-записів: від нього залежить, скільки триватиме перемикання.',
          ],
        },
        {
          h: 'Де взяти налаштування IMAP у панелях',
          p: [
            'Адресу сервера й порт панель показує сама — угадувати не треба. Шляхи для трьох найчастіших панелей:',
          ],
          list: [
            'cPanel: «Email → Set Up Mail Client» (кнопка «Connect Devices» у списку поштових акаунтів).',
            'Plesk: «Сайти та домени → потрібний домен → Поштові акаунти → Налаштування поштового клієнта». За замовчуванням IMAP на 143, захищений — на 993 із SSL, логін — повна адреса.',
            'DirectAdmin: сервер mail.вашдомен, IMAP 993 за SSL, логін — повна адреса пошти.',
            'Інші панелі: шукайте розділ на кшталт «налаштування поштового клієнта» — він є майже скрізь.',
          ],
        },
        {
          h: 'Порядок, за якого нічого не губиться',
          p: [
            'Ключовий момент: перенесення не чіпає джерело й не потребує зупиняти пошту, тому його роблять заздалегідь, а не в ніч перемикання.',
          ],
          list: [
            'За добу-дві до переїзду зменште TTL у MX-записів — перемикання пройде швидше.',
            'Перенесіть пошту на новий хостинг, поки домен ще працює по-старому. Користувачі продовжують працювати у старих скриньках.',
            'Перемкніть MX на нового провайдера.',
            'Через добу запустіть перенесення повторно: воно забере листи, що надійшли на старий сервер за час зміни DNS. Уже перенесене пропускається, дублікатів не буде.',
            'Старий хостинг не вимикайте ще тиждень: листи можуть надходити туди за кешованими записами.',
          ],
        },
        {
          h: 'Що IMAP не переносить',
          p: [
            'Протокол працює з листами й теками. Усе інше налаштовується на новому хостингу руками — і краще знати про це заздалегідь, а не в день переїзду.',
          ],
          list: [
            'Паролі скриньок, автовідповідачі, правила фільтрації та пересилання.',
            'Catch-all і поштові аліаси.',
            'Контакти й календарі — це не пошта і за IMAP не передаються.',
            'Налаштування спам-фільтра та його навчання.',
          ],
        },
      ],
      faq: [
        [
          'Скільки скриньок можна перенести за раз?',
          'Зараз перенесення йде по одній скриньці за завдання: вказуєте джерело й призначення та запускаєте. Для домену з десятком скриньок це десяток запусків — не швидко, але передбачувано. Масове перенесення списком у планах.',
        ],
        [
          'Чи помітять користувачі переїзд?',
          'Ні, якщо переносити заздалегідь. Джерело не змінюється, старі скриньки працюють як працювали. Помітним стане лише момент, коли ви зміните паролі та налаштування в їхніх поштових програмах.',
        ],
        [
          'Що робити, якщо на новому хостингу скринька вже з листами?',
          'Нічого страшного: однакові листи пропускаються, а не дублюються. Саме тому повторний запуск після зміни MX безпечний.',
        ],
        [
          'Чи треба щось просити у старого хостера?',
          'Зазвичай ні — достатньо паролів від скриньок. Якщо IMAP на тарифі вимкнено або закрито фаєрволом, це єдине, про що доведеться просити підтримку.',
        ],
      ],
    },
  },

  {
    slug: 'corporate-mail-migration',
    ru: {
      title: 'Корпоративный переезд почты: план миграции — MoveMailbox',
      description:
        'Как перевести почту компании на другой сервер: инвентаризация ящиков, пилот, доступы в Microsoft 365 и Google Workspace, волны переноса и сверка.',
      h1: 'Корпоративный переезд почты',
      intro:
        'Переезд почты компании отличается от переноса одного ящика не технически, а организационно: тридцать ящиков — это тридцать паролей, тридцать владельцев и один вечер, когда всё должно заработать. Ниже план, который снимает главные риски: пилот до массового запуска, волны вместо «все сразу» и сверка, по которой видно, что ничего не потерялось.',
      sections: [
        {
          h: 'Инвентаризация: без неё план не строится',
          p: [
            'Первое, что нужно, — таблица ящиков. Не «примерно сорок», а точный список с объёмами: от него зависят и сроки, и тариф на новой стороне.',
          ],
          list: [
            'Адрес, владелец, объём и число писем по каждому ящику.',
            'Общие и функциональные ящики (info@, sales@) — у них отдельные доступы и часто отдельный владелец.',
            'Ящики уволившихся: обычно их переносят в архив, а не на новую платформу.',
            'Суммарный объём — по нему считается время переноса и место на новом тарифе.',
          ],
        },
        {
          h: 'Доступы: где обычно застревает подготовка',
          p: [
            'В облачных сервисах обычный пароль по IMAP чаще всего не работает, и это выясняется в самый неподходящий момент.',
          ],
          list: [
            'Microsoft 365: базовая аутентификация для IMAP по умолчанию отключена. Рабочий путь — пароли приложений при включённой многофакторной проверке; если политика арендатора их запрещает, доступ открывает администратор.',
            'Google Workspace: IMAP включается в настройках, пароль приложения выдаётся только при включённой двухэтапной аутентификации.',
            'Свой сервер или хостинг: обычно достаточно паролей от ящиков, но стоит заранее проверить, что IMAP не закрыт фаерволом.',
            'Пароли на время переноса лучше выдавать одноразовые и отзывать сразу после — пароль приложения отзывается одним нажатием.',
          ],
        },
        {
          h: 'Пилот, потом волны',
          p: [
            'Массовый запуск без пилота — самая дорогая ошибка: если что-то не так с доступами или папками, вы узнаете это тридцать раз подряд.',
          ],
          list: [
            'Возьмите один средний ящик и перенесите его целиком. Замерьте время — по нему масштабируется весь план.',
            'Сверьте результат по папкам: счётчики писем с обеих сторон должны совпасть.',
            'Разбейте остальные ящики на волны по 5–10 и переносите волнами, а не все сразу: провайдеры ограничивают число одновременных IMAP-сессий.',
            'Первыми переносите ящики, которые меньше всего используются, последними — руководство и продажи.',
          ],
        },
        {
          h: 'Переключение и сверка',
          p: [
            'Перенос не требует останавливать почту, поэтому переключение MX происходит после того, как основной объём уже на новой стороне.',
          ],
          list: [
            'Переключите MX, когда все волны прошли.',
            'Через сутки запустите перенос повторно по всем ящикам: он доберёт письма, пришедшие за время переключения, и не создаст дубликатов.',
            'Сверьте счётчики по папкам ещё раз и только потом отключайте старые ящики.',
            'Старую систему держите доступной хотя бы неделю — это дешевле, чем восстанавливать одно потерянное письмо.',
          ],
        },
        {
          h: 'Что переносом по IMAP не решается',
          p: [
            'Об этом стоит сказать руководству заранее, чтобы не выяснять в день переезда.',
          ],
          list: [
            'Календари, контакты и задачи — переносятся средствами самой платформы.',
            'Права делегирования («секретарь видит календарь директора») настраиваются заново.',
            'Публичные папки Exchange — отдельное хранилище, IMAP их не видит.',
            'Правила Outlook, подписи и автоответы — настраиваются на новой стороне.',
          ],
        },
      ],
      faq: [
        [
          'Сколько времени занимает переезд компании на 30 ящиков?',
          'Считайте по объёму, а не по числу ящиков: узкое место — скорость выгрузки у провайдера. Пилотный ящик покажет реальную скорость, дальше время масштабируется линейно. Ориентир для Microsoft 365 по нашим замерам — около половины гигабайта в час на ящик.',
        ],
        [
          'Можно ли переносить, пока люди работают?',
          'Да. Источник не изменяется, письма только читаются. Единственное, что нужно согласовать, — момент смены настроек в почтовых программах.',
        ],
        [
          'Что делать с ящиками уволившихся сотрудников?',
          'Обычно их переносят в отдельный архивный ящик на новой стороне, а не заводят лицензии. По IMAP это такой же перенос, только назначение — архив.',
        ],
        [
          'Нужен ли доступ администратора?',
          'Не всегда. Если у каждого ящика есть пароль (или пароль приложения), администратор не нужен. Он потребуется там, где политика арендатора запрещает пароли приложений.',
        ],
      ],
    },
    en: {
      title: 'Corporate email migration plan — MoveMailbox',
      description:
        'How to move a company’s mail to another server: mailbox inventory, a pilot run, access in Microsoft 365 and Google Workspace, migration waves and reconciliation.',
      h1: 'Corporate email migration',
      intro:
        'Moving a company’s mail differs from moving one mailbox organisationally, not technically: thirty mailboxes mean thirty passwords, thirty owners and one evening when everything has to work. Below is the plan that removes the main risks: a pilot before the bulk, waves instead of "all at once", and a reconciliation that proves nothing was lost.',
      sections: [
        {
          h: 'Inventory: no plan without it',
          p: [
            'The first thing you need is a table of mailboxes. Not "about forty" — an exact list with volumes, because both the schedule and the plan on the receiving side depend on it.',
          ],
          list: [
            'Address, owner, size and message count for every mailbox.',
            'Shared and functional mailboxes (info@, sales@) — separate credentials, often a separate owner.',
            'Mailboxes of people who left: usually archived rather than moved onto the new platform.',
            'The total volume — it decides the migration time and the space needed on the new plan.',
          ],
        },
        {
          h: 'Access: where preparation usually stalls',
          p: [
            'In cloud services the ordinary password rarely works over IMAP, and that tends to surface at the worst possible moment.',
          ],
          list: [
            'Microsoft 365: basic authentication for IMAP is off by default. The working route is app passwords with MFA enabled; if tenant policy forbids them, an administrator opens access.',
            'Google Workspace: IMAP is enabled in the settings, and app passwords are issued only when 2-step verification is on.',
            'Own server or hosting: mailbox passwords are usually enough, but check in advance that IMAP is not blocked by a firewall.',
            'Issue single-purpose passwords for the migration and revoke them right after — an app password is revoked in one click.',
          ],
        },
        {
          h: 'A pilot, then waves',
          p: [
            'Going bulk without a pilot is the expensive mistake: if something is wrong with access or folders, you will learn it thirty times in a row.',
          ],
          list: [
            'Take one average mailbox and migrate it end to end. Measure the time — the whole plan scales from it.',
            'Reconcile by folder: message counts on both sides have to match.',
            'Split the rest into waves of five to ten rather than all at once: providers cap concurrent IMAP sessions.',
            'Migrate the least active mailboxes first and management and sales last.',
          ],
        },
        {
          h: 'Cutover and reconciliation',
          p: [
            'A migration needs no downtime, so the MX switch happens after the bulk is already on the new side.',
          ],
          list: [
            'Switch MX once every wave is done.',
            'A day later, re-run the migration across all mailboxes: it collects what arrived during the switch and creates no duplicates.',
            'Reconcile folder counts once more, and only then retire the old mailboxes.',
            'Keep the old system reachable for at least a week — cheaper than recovering a single lost message.',
          ],
        },
        {
          h: 'What an IMAP migration does not solve',
          p: [
            'Worth telling management up front rather than discovering on moving day.',
          ],
          list: [
            'Calendars, contacts and tasks — moved with the platform’s own tools.',
            'Delegation rights ("the assistant sees the director’s calendar") are configured again.',
            'Exchange public folders — a separate store that IMAP cannot see.',
            'Outlook rules, signatures and auto-replies — set up on the new side.',
          ],
        },
      ],
      faq: [
        [
          'How long does a 30-mailbox company migration take?',
          'Count by volume, not by mailbox count: the bottleneck is the provider’s export speed. The pilot mailbox shows the real rate and the rest scales linearly from it. For Microsoft 365 our measurements land around half a gigabyte per hour per mailbox.',
        ],
        [
          'Can we migrate while people are working?',
          'Yes. The source is never modified, messages are only read. The only thing to schedule is the moment their mail clients get the new settings.',
        ],
        [
          'What about mailboxes of former employees?',
          'They usually go into a single archive mailbox on the new side instead of consuming licences. Over IMAP it is the same migration, only the destination is the archive.',
        ],
        [
          'Do we need administrator access?',
          'Not always. If every mailbox has a password (or an app password), no administrator is involved. One is needed where tenant policy forbids app passwords.',
        ],
      ],
    },
    uk: {
      title: 'Корпоративний переїзд пошти: план міграції — MoveMailbox',
      description:
        'Як перевести пошту компанії на інший сервер: інвентаризація скриньок, пілот, доступи в Microsoft 365 і Google Workspace, хвилі перенесення та звірка.',
      h1: 'Корпоративний переїзд пошти',
      intro:
        'Переїзд пошти компанії відрізняється від перенесення однієї скриньки не технічно, а організаційно: тридцять скриньок — це тридцять паролів, тридцять власників і один вечір, коли все має запрацювати. Нижче план, який знімає головні ризики: пілот до масового запуску, хвилі замість «усі одразу» і звірка, за якою видно, що нічого не загубилося.',
      sections: [
        {
          h: 'Інвентаризація: без неї план не будується',
          p: [
            'Перше, що потрібно, — таблиця скриньок. Не «приблизно сорок», а точний список з обсягами: від нього залежать і строки, і тариф на новому боці.',
          ],
          list: [
            'Адреса, власник, обсяг і кількість листів для кожної скриньки.',
            'Спільні та функційні скриньки (info@, sales@) — окремі доступи й часто окремий власник.',
            'Скриньки звільнених: зазвичай їх переносять в архів, а не на нову платформу.',
            'Сумарний обсяг — за ним рахується час перенесення й місце на новому тарифі.',
          ],
        },
        {
          h: 'Доступи: де зазвичай застрягає підготовка',
          p: [
            'У хмарних сервісах звичайний пароль за IMAP найчастіше не працює, і це з’ясовується в найменш слушний момент.',
          ],
          list: [
            'Microsoft 365: базову автентифікацію для IMAP за замовчуванням вимкнено. Робочий шлях — паролі застосунків за увімкненої багатофакторної перевірки; якщо політика орендаря їх забороняє, доступ відкриває адміністратор.',
            'Google Workspace: IMAP вмикається в налаштуваннях, пароль застосунку видають лише за увімкненої двоетапної перевірки.',
            'Власний сервер або хостинг: зазвичай достатньо паролів від скриньок, але варто заздалегідь перевірити, що IMAP не закрито фаєрволом.',
            'Паролі на час перенесення краще видавати одноразові й відкликати одразу після — пароль застосунку відкликається одним натисканням.',
          ],
        },
        {
          h: 'Пілот, потім хвилі',
          p: [
            'Масовий запуск без пілота — найдорожча помилка: якщо щось не так із доступами чи теками, ви дізнаєтеся про це тридцять разів поспіль.',
          ],
          list: [
            'Візьміть одну середню скриньку й перенесіть її повністю. Заміряйте час — за ним масштабується весь план.',
            'Звірте результат за теками: лічильники листів з обох боків мають збігтися.',
            'Розбийте решту скриньок на хвилі по 5–10 і переносьте хвилями, а не всі одразу: провайдери обмежують кількість одночасних IMAP-сесій.',
            'Першими переносьте скриньки, які найменше використовуються, останніми — керівництво та продажі.',
          ],
        },
        {
          h: 'Перемикання і звірка',
          p: [
            'Перенесення не потребує зупиняти пошту, тому перемикання MX відбувається після того, як основний обсяг уже на новому боці.',
          ],
          list: [
            'Перемкніть MX, коли всі хвилі пройшли.',
            'Через добу запустіть перенесення повторно для всіх скриньок: воно добере листи, що надійшли за час перемикання, і не створить дублікатів.',
            'Звірте лічильники за теками ще раз і лише потім вимикайте старі скриньки.',
            'Стару систему тримайте доступною щонайменше тиждень — це дешевше, ніж відновлювати один загублений лист.',
          ],
        },
        {
          h: 'Що перенесенням за IMAP не вирішується',
          p: [
            'Про це варто сказати керівництву заздалегідь, щоб не з’ясовувати в день переїзду.',
          ],
          list: [
            'Календарі, контакти та завдання — переносяться засобами самої платформи.',
            'Права делегування («секретар бачить календар директора») налаштовуються заново.',
            'Публічні теки Exchange — окреме сховище, IMAP їх не бачить.',
            'Правила Outlook, підписи та автовідповіді — налаштовуються на новому боці.',
          ],
        },
      ],
      faq: [
        [
          'Скільки часу займає переїзд компанії на 30 скриньок?',
          'Рахуйте за обсягом, а не за кількістю скриньок: вузьке місце — швидкість вивантаження у провайдера. Пілотна скринька покаже реальну швидкість, далі час масштабується лінійно. Орієнтир для Microsoft 365 за нашими замірами — близько половини гігабайта на годину на скриньку.',
        ],
        [
          'Чи можна переносити, поки люди працюють?',
          'Так. Джерело не змінюється, листи лише читаються. Єдине, що треба узгодити, — момент зміни налаштувань у поштових програмах.',
        ],
        [
          'Що робити зі скриньками звільнених працівників?',
          'Зазвичай їх переносять в окрему архівну скриньку на новому боці, а не заводять ліцензії. За IMAP це таке саме перенесення, лише призначення — архів.',
        ],
        [
          'Чи потрібен доступ адміністратора?',
          'Не завжди. Якщо в кожної скриньки є пароль (або пароль застосунку), адміністратор не потрібен. Він знадобиться там, де політика орендаря забороняє паролі застосунків.',
        ],
      ],
    },
  },
];

export const guideArticleSlugs = guideArticles.map((guide) => guide.slug);

export function findGuideArticle(slug: string): GuideArticle | undefined {
  return guideArticles.find((guide) => guide.slug === slug);
}

export function isGuideArticleSlug(slug: string): boolean {
  return guideArticleSlugs.includes(slug);
}
