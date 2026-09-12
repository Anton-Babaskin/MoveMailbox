import type { BlogPost } from '@/data/blog-posts';

export const imapsyncWithoutCommandLine: BlogPost = {
  slug: 'imapsync-without-command-line',
  date: '2026-09-12',
  icon: 'win',
  ru: {
    title: 'imapsync без командной строки — MoveMailbox',
    description:
      'imapsync — рабочий инструмент, но требует Perl и терминала. Как получить то же самое в окне с двумя формами и что при этом остаётся под капотом.',
    h1: 'imapsync без командной строки',
    tag: 'Инструменты',
    card: 'Тот же imapsync, только без Perl, зависимостей и сборки под Windows. Что он делает, чего не делает и как выглядит его команда целиком.',
    lede: 'Скажем сразу: мы не писали свой движок переноса. Под капотом imapsync — тот самый, которому два десятка лет и который перенёс больше почты, чем любая коммерческая альтернатива. Мы сделали ему интерфейс.',
    blocks: [
      {
        h2: 'Почему imapsync и почему это неудобно',
        paragraphs: [
          'imapsync решает ровно одну задачу и решает её хорошо: синхронизирует два IMAP-ящика, сверяя, что уже есть на приёмнике, и копируя только недостающее. Отсюда его главное свойство — повторный запуск не создаёт дублей и стоит дёшево.',
          'Неудобство начинается с установки. Это скрипт на Perl с десятками зависимостей; под Linux он ставится пакетным менеджером, под macOS уже с оговорками, а под Windows у него исторически всё плохо: официальной сборки нет, а те, что есть, собраны кем-то и неизвестно из чего.',
          'Вторая часть неудобства — сама команда. Ключей у imapsync больше сотни, и типичный перенос — это строка на восемь переносов, в которой легко перепутать источник с приёмником.',
        ],
        sample: {
          caption: 'Обычная команда imapsync',
          body: 'imapsync \\\n  --host1 imap.old.com --port1 993 --ssl1 \\\n  --user1 anna@old.com --passfile1 /run/secrets/p1 \\\n  --host2 imap.new.com --port2 993 --ssl2 \\\n  --user2 anna@new.com --passfile2 /run/secrets/p2 \\\n  --exclude "^\\[Gmail\\]/All Mail$" --automap --skipcrossduplicates',
        },
      },
      {
        h2: 'Что даёт интерфейс',
        paragraphs: [
          'Ровно то же самое, но параметры вводятся в два поля, а не собираются в строку. Разница не косметическая: большая часть неудачных переносов — это не сбой программы, а опечатка в ключе.',
        ],
        bullets: [
          'Проверка обоих подключений до начала копирования, а не на середине.',
          'Список папок с обеих сторон: видно, что именно поедет, и можно исключить лишнее галочкой.',
          'Прогресс по папкам и письмам вместо потока строк в терминале.',
          'Понятная расшифровка ошибок сервера вместо кода протокола.',
          'Под Windows — обычный исполняемый файл, без Perl и без сборки.',
        ],
      },
      {
        h2: 'Чего интерфейс не меняет',
        paragraphs: [
          'Скорость. Она определяется лимитами провайдеров, и никакая обёртка их не обходит.',
          'Возможности протокола. Если IMAP чего-то не умеет — например, переносить календари и контакты, — не умеет и imapsync, и мы.',
          'Ответственность за исключения. Решение, переносить ли «Всю почту» Gmail, остаётся за человеком: инструмент может подсказать, но не может знать, нужен вам архив или структура.',
        ],
      },
      {
        h2: 'Локально или онлайн',
        paragraphs: [
          'Локальный клиент — это тот же imapsync и интерфейс к нему на вашей машине. Ни письма, ни пароли никуда не уходят, ограничений по объёму нет. Это вариант по умолчанию для корпоративной почты и для ящиков на десятки гигабайт.',
          'Онлайн-перенос имеет смысл, когда ставить что-то на рабочую машину нельзя или не хочется. Тогда почта идёт через наш сервер, и это осознанный размен удобства на доверие — поэтому мы прямо пишем, что с учётными данными происходит.',
        ],
      },
    ],
    faq: [
      [
        'Это правда тот же imapsync?',
        'Да. Мы не переписывали движок и не делаем вид, что написали свой: это обёртка с интерфейсом, проверками и понятными ошибками.',
      ],
      [
        'Можно ли увидеть команду, которая выполняется?',
        'Да, параметры переноса видны целиком. Это же помогает, если потом захочется повторить то же самое из терминала.',
      ],
      [
        'Нужен ли Perl под Windows?',
        'Нет. Клиент под Windows — самостоятельный исполняемый файл, зависимости в него уже включены.',
      ],
      [
        'Переносятся ли календари и контакты?',
        'Нет. IMAP — протокол про почту; календари и контакты живут в CalDAV и CardDAV и переносятся отдельными инструментами.',
      ],
    ],
    links: [
      { path: '/download', label: 'Скачать локальный клиент' },
      { path: '/security', label: 'Что происходит с паролями' },
      { path: '/docs/errors/authenticationfailed', label: 'Ошибка AUTHENTICATIONFAILED: разбор' },
    ],
  },
  en: {
    title: 'imapsync without the command line — MoveMailbox',
    description:
      'imapsync works, but it wants Perl and a terminal. How to get the same result in a window with two forms, and what stays under the hood.',
    h1: 'imapsync without the command line',
    tag: 'Tooling',
    card: 'The same imapsync, minus Perl, dependencies and Windows build roulette. What it does, what it does not, and the full command it runs.',
    lede: 'Let us be blunt: we did not write our own migration engine. Underneath is imapsync — the same one that has been around for two decades and has moved more mail than any commercial alternative. We gave it an interface.',
    blocks: [
      {
        h2: 'Why imapsync, and why it is awkward',
        paragraphs: [
          'imapsync solves exactly one problem and solves it well: it synchronises two IMAP mailboxes, checking what the destination already has and copying only what is missing. Hence its best property — a repeat run creates no duplicates and costs almost nothing.',
          'The awkwardness starts at installation. It is a Perl script with dozens of dependencies; on Linux a package manager handles it, on macOS with caveats, and on Windows it has always been rough: there is no official build, and the ones floating around were assembled by someone from something.',
          'The second half is the command itself. imapsync has well over a hundred options, and a typical migration is an eight-line invocation in which source and destination are easy to swap by accident.',
        ],
        sample: {
          caption: 'An ordinary imapsync command',
          body: 'imapsync \\\n  --host1 imap.old.com --port1 993 --ssl1 \\\n  --user1 anna@old.com --passfile1 /run/secrets/p1 \\\n  --host2 imap.new.com --port2 993 --ssl2 \\\n  --user2 anna@new.com --passfile2 /run/secrets/p2 \\\n  --exclude "^\\[Gmail\\]/All Mail$" --automap --skipcrossduplicates',
        },
      },
      {
        h2: 'What the interface adds',
        paragraphs: [
          'Exactly the same run, with the parameters typed into two forms instead of assembled into a string. The difference is not cosmetic: most failed migrations are not software faults, they are a typo in a flag.',
        ],
        bullets: [
          'Both connections are tested before any copying starts, not halfway through.',
          'Folder lists from both sides, so you can see what will move and untick what should not.',
          'Progress per folder and per message instead of a stream of log lines.',
          'Server errors explained in words rather than protocol codes.',
          'On Windows, a plain executable — no Perl, no build.',
        ],
      },
      {
        h2: 'What it does not change',
        paragraphs: [
          'Speed. Provider limits set it, and no wrapper gets around them.',
          'Protocol capability. If IMAP cannot do something — calendars and contacts, for instance — neither can imapsync, and neither can we.',
          'Responsibility for exclusions. Whether to migrate Gmail All Mail stays a human decision: the tool can hint, but it cannot know whether you want the archive or the structure.',
        ],
      },
      {
        h2: 'Local or online',
        paragraphs: [
          'The local client is that same imapsync with an interface, running on your machine. Neither messages nor passwords go anywhere, and there is no size cap. It is the default choice for company mail and for mailboxes of tens of gigabytes.',
          'An online migration makes sense when installing anything on the work machine is not an option. Then the mail passes through our server, which is a deliberate trade of convenience for trust — so we state plainly what happens to the credentials.',
        ],
      },
    ],
    faq: [
      [
        'Is it really the same imapsync?',
        'Yes. We did not rewrite the engine and do not pretend otherwise: this is a wrapper with an interface, pre-flight checks and readable errors.',
      ],
      [
        'Can I see the command being run?',
        'Yes, the parameters are visible in full — handy if you later want to repeat the same run from a terminal.',
      ],
      [
        'Do I need Perl on Windows?',
        'No. The Windows client is a self-contained executable with its dependencies already inside.',
      ],
      [
        'Does it move calendars and contacts?',
        'No. IMAP is a mail protocol; calendars and contacts live in CalDAV and CardDAV and need separate tools.',
      ],
    ],
    links: [
      { path: '/download', label: 'Download the local client' },
      { path: '/security', label: 'What happens to your passwords' },
      { path: '/docs/errors/authenticationfailed', label: 'AUTHENTICATIONFAILED explained' },
    ],
  },
  uk: {
    title: 'imapsync без командного рядка — MoveMailbox',
    description:
      'imapsync — робочий інструмент, але вимагає Perl і термінала. Як отримати те саме у вікні з двома формами і що лишається під капотом.',
    h1: 'imapsync без командного рядка',
    tag: 'Інструменти',
    card: 'Той самий imapsync, лише без Perl, залежностей і збірки під Windows. Що він робить, чого не робить і як має вигляд його команда повністю.',
    lede: 'Скажемо одразу: ми не писали власного рушія перенесення. Під капотом imapsync — той самий, якому два десятки років і який переніс більше пошти, ніж будь-яка комерційна альтернатива. Ми зробили йому інтерфейс.',
    blocks: [
      {
        h2: 'Чому imapsync і чому це незручно',
        paragraphs: [
          'imapsync розв’язує рівно одну задачу і робить це добре: синхронізує дві IMAP-скриньки, звіряючи, що вже є на приймачі, і копіюючи лише те, чого бракує. Звідси його головна властивість — повторний запуск не створює дублів.',
          'Незручність починається зі встановлення. Це скрипт на Perl із десятками залежностей; під Linux він ставиться пакетним менеджером, під macOS уже із застереженнями, а під Windows історично все погано: офіційної збірки немає.',
          'Друга частина незручності — сама команда. Ключів у imapsync понад сотню, і типове перенесення — це рядок на вісім переносів, у якому легко переплутати джерело з приймачем.',
        ],
        sample: {
          caption: 'Звичайна команда imapsync',
          body: 'imapsync \\\n  --host1 imap.old.com --port1 993 --ssl1 \\\n  --user1 anna@old.com --passfile1 /run/secrets/p1 \\\n  --host2 imap.new.com --port2 993 --ssl2 \\\n  --user2 anna@new.com --passfile2 /run/secrets/p2 \\\n  --exclude "^\\[Gmail\\]/All Mail$" --automap --skipcrossduplicates',
        },
      },
      {
        h2: 'Що дає інтерфейс',
        paragraphs: [
          'Рівно те саме, але параметри вводяться у два поля, а не збираються в рядок. Різниця не косметична: більшість невдалих перенесень — це не збій програми, а одрук у ключі.',
        ],
        bullets: [
          'Перевірка обох підключень до початку копіювання, а не посередині.',
          'Список папок з обох боків: видно, що саме поїде, і можна виключити зайве.',
          'Прогрес за папками й листами замість потоку рядків у терміналі.',
          'Зрозуміле пояснення помилок сервера замість коду протоколу.',
          'Під Windows — звичайний виконуваний файл, без Perl і без збірки.',
        ],
      },
      {
        h2: 'Чого інтерфейс не змінює',
        paragraphs: [
          'Швидкість. Її визначають ліміти провайдерів, і жодна обгортка їх не обходить.',
          'Можливості протоколу. Якщо IMAP чогось не вміє — наприклад, переносити календарі й контакти, — не вміє й imapsync, і ми.',
          'Відповідальність за виключення. Рішення, чи переносити «Усю пошту» Gmail, лишається за людиною.',
        ],
      },
      {
        h2: 'Локально чи онлайн',
        paragraphs: [
          'Локальний клієнт — це той самий imapsync та інтерфейс до нього на вашій машині. Ні листи, ні паролі нікуди не йдуть, обмежень за обсягом немає.',
          'Онлайн-перенесення має сенс, коли ставити щось на робочу машину не можна. Тоді пошта йде через наш сервер, і це свідомий обмін зручності на довіру.',
        ],
      },
    ],
    faq: [
      [
        'Це справді той самий imapsync?',
        'Так. Ми не переписували рушій і не вдаємо, що написали свій: це обгортка з інтерфейсом, перевірками та зрозумілими помилками.',
      ],
      [
        'Чи можна побачити команду, яка виконується?',
        'Так, параметри перенесення видно повністю.',
      ],
      [
        'Чи потрібен Perl під Windows?',
        'Ні. Клієнт під Windows — самостійний виконуваний файл.',
      ],
      [
        'Чи переносяться календарі й контакти?',
        'Ні. IMAP — протокол про пошту; календарі й контакти живуть у CalDAV і CardDAV.',
      ],
    ],
    links: [
      { path: '/download', label: 'Завантажити локальний клієнт' },
      { path: '/security', label: 'Що відбувається з паролями' },
      { path: '/docs/errors/authenticationfailed', label: 'Помилка AUTHENTICATIONFAILED: розбір' },
    ],
  },
};
