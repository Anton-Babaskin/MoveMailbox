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
];

export const guideArticleSlugs = guideArticles.map((guide) => guide.slug);

export function findGuideArticle(slug: string): GuideArticle | undefined {
  return guideArticles.find((guide) => guide.slug === slug);
}

export function isGuideArticleSlug(slug: string): boolean {
  return guideArticleSlugs.includes(slug);
}
