import type { BlogPost } from '@/data/blog-posts';

export const folderSeparators: BlogPost = {
  slug: 'folder-separators',
  date: '2026-09-12',
  icon: 'ht',
  ru: {
    title: 'Разделители папок IMAP: / и . — MoveMailbox',
    description:
      'Dovecot использует слэш, Courier — точку. Почему после переноса вложенные папки схлопываются в одну и как это чинится автоматическим сопоставлением.',
    h1: 'Разделители папок: Dovecot / против Courier .',
    tag: 'Протоколы',
    card: 'Почему «Клиенты/2025» превращается в папку с точкой в имени, откуда берутся плоские списки вместо дерева и что с этим делает автосопоставление.',
    lede: 'Симптом узнаваемый: на старом сервере было аккуратное дерево папок, на новом — плоский список с точками или слэшами прямо в названиях. Виноват один символ, о котором в протоколе договориться забыли.',
    blocks: [
      {
        h2: 'Откуда берётся проблема',
        paragraphs: [
          'В IMAP вложенность папок передаётся не структурой, а строкой: «Клиенты/2025» — это папка «2025» внутри папки «Клиенты». Какой символ служит разделителем, решает сервер, и протокол это разрешает.',
          'Dovecot и большинство современных серверов используют слэш. Courier исторически использует точку. Старые сборки Cyrus — тоже точку. Встречается и обратный слэш у Exchange-шлюзов.',
          'Клиент обязан спросить разделитель у сервера командой LIST и дальше использовать именно его. Если этого не сделать — а так ведут себя простые скрипты и часть самописных инструментов, — имя папки уезжает на другой сервер как есть, и там оно означает уже не то.',
        ],
        sample: {
          caption: 'Сервер сам сообщает свой разделитель',
          body: 'Dovecot:  * LIST (\\HasChildren) "/" "Клиенты"\nCourier:  * LIST (\\HasChildren) "." "INBOX.Клиенты"',
        },
      },
      {
        h2: 'Как выглядит поломка',
        paragraphs: [
          'Три типичные картины, по которым диагноз ставится сразу.',
        ],
        bullets: [
          'Вместо дерева — плоский список, а разделитель виден прямо в имени: «Клиенты.2025».',
          'Все папки оказались внутри INBOX: у Courier пользовательские папки живут именно там, и при переносе на Dovecot это надо снимать.',
          'Папка с точкой в названии — например «ООО Ромашка. Договоры» — разъехалась на две вложенные.',
          'Папка со слэшем в имени вообще не приехала: при переносе в Microsoft 365 такие папки документированно пропускаются — их нужно переименовать до старта.',
        ],
      },
      {
        h2: 'Что с этим делает автосопоставление',
        paragraphs: [
          'Правильный инструмент спрашивает разделитель у обеих сторон и переписывает имена при переносе: слэш на точку, точку на слэш, и заодно снимает или добавляет префикс INBOX там, где он нужен.',
          'Это и есть режим автоматического сопоставления папок. В подавляющем большинстве переносов он делает ровно то, что нужно, и вмешательства не требует.',
          'Ручное правило имеет смысл ровно в одном случае: когда в названии папки есть символ, служащий разделителем на принимающей стороне. Тогда его заменяют явно — например, точку в «ООО Ромашка. Договоры» на дефис, — иначе любое автоматическое правило создаст вложенность там, где её не было.',
        ],
      },
      {
        h2: 'Что проверить до переноса',
        paragraphs: [
          'Минута на список папок избавляет от разбора завалов после.',
        ],
        steps: [
          'Посмотрите список папок с обеих сторон до старта: разделитель виден сразу.',
          'Найдите папки, в названии которых встречается точка или слэш, и решите, что с ними делать.',
          'Оставьте автосопоставление включённым, если нет причины его выключать.',
          'После переноса сверьте не только число писем, но и глубину дерева: совпадение счётчиков при схлопнутой структуре — не успех.',
        ],
      },
    ],
    faq: [
      [
        'Почему все папки оказались внутри «Входящих»?',
        'Так устроен Courier: пользовательские папки лежат под INBOX. При переносе на Dovecot этот префикс нужно снимать — это делает автосопоставление.',
      ],
      [
        'Можно ли переименовать папки прямо при переносе?',
        'Да, правилом замены. Это же способ обойти точку или слэш внутри названия папки.',
      ],
      [
        'Потеряются ли письма из-за неправильного разделителя?',
        'Нет, письма доезжают. Ломается структура: они оказываются не в тех папках, а имена выглядят странно.',
      ],
      [
        'Как узнать разделитель своего сервера?',
        'Он виден в ответе на команду LIST — второе поле в кавычках. Инструмент переноса показывает его в списке папок.',
      ],
    ],
    links: [
      { path: '/routes', label: 'Все маршруты переноса' },
      { path: '/docs/errors', label: 'Разборы ошибок IMAP' },
      { path: '/guides', label: 'Настройки IMAP по провайдерам' },
    ],
  },
  en: {
    title: 'IMAP folder separators: / and . — MoveMailbox',
    description:
      'Dovecot uses a slash, Courier a dot. Why nested folders collapse after a migration and how automatic folder mapping fixes it.',
    h1: 'Folder separators: Dovecot / versus Courier .',
    tag: 'Protocols',
    card: 'Why Clients/2025 turns into a folder with a dot in its name, where flat lists come from, and what automatic mapping does about it.',
    lede: 'The symptom is easy to recognise: a tidy folder tree on the old server, a flat list with dots or slashes in the names on the new one. One character is to blame — the one the protocol never standardised.',
    blocks: [
      {
        h2: 'Where the problem comes from',
        paragraphs: [
          'In IMAP, nesting is carried by a string rather than a structure: Clients/2025 is the folder 2025 inside the folder Clients. Which character separates them is the server decision, and the protocol allows that.',
          'Dovecot and most modern servers use a slash. Courier has always used a dot. Older Cyrus builds use a dot as well, and Exchange gateways sometimes present a backslash.',
          'A client is supposed to ask the server for the separator with LIST and use that one. Skip it — as simple scripts and some in-house tools do — and the folder name travels to the other server unchanged, where it now means something else.',
        ],
        sample: {
          caption: 'The server announces its own separator',
          body: 'Dovecot:  * LIST (\\HasChildren) "/" "Clients"\nCourier:  * LIST (\\HasChildren) "." "INBOX.Clients"',
        },
      },
      {
        h2: 'What the breakage looks like',
        paragraphs: ['Three typical pictures that give the diagnosis away immediately.'],
        bullets: [
          'A flat list instead of a tree, with the separator visible in the name: Clients.2025.',
          'Every folder ended up inside INBOX: on Courier that is where user folders live, and moving to Dovecot has to strip that prefix.',
          'A folder whose name contains a dot — Acme Ltd. Contracts — split into two nested folders.',
          'A folder with a slash in its name did not arrive at all: migrating into Microsoft 365 skips those by documented design, so rename them before you start.',
        ],
      },
      {
        h2: 'What automatic mapping does',
        paragraphs: [
          'A proper tool asks both sides for their separator and rewrites names as it copies: slash to dot, dot to slash, adding or stripping the INBOX prefix where it belongs.',
          'That is what folder auto-mapping means. In the overwhelming majority of migrations it does exactly the right thing with no intervention.',
          'A manual rule is worth it in exactly one case: when a folder name contains the character that serves as the separator on the receiving side. Then you replace it explicitly — the dot in Acme Ltd. Contracts with a hyphen, say — because otherwise any automatic rule will create nesting that was never there.',
        ],
      },
      {
        h2: 'What to check before the migration',
        paragraphs: ['A minute spent on the folder list saves an evening of cleanup after.'],
        steps: [
          'Look at the folder list on both sides before starting: the separator is immediately visible.',
          'Find folders whose names contain a dot or a slash and decide what to do with them.',
          'Leave auto-mapping on unless you have a reason not to.',
          'After the migration compare tree depth as well as message counts: matching counts with a collapsed structure is not success.',
        ],
      },
    ],
    faq: [
      [
        'Why did every folder land inside the Inbox?',
        'That is how Courier works: user folders live under INBOX. Moving to Dovecot has to strip the prefix, which auto-mapping does.',
      ],
      [
        'Can folders be renamed during the migration?',
        'Yes, with a replacement rule. That is also how you work around a dot or slash inside a folder name.',
      ],
      [
        'Can a wrong separator lose messages?',
        'No, the messages arrive. What breaks is the structure: they land in the wrong folders and the names look odd.',
      ],
      [
        'How do I find out my server separator?',
        'It is the quoted second field in the LIST response. The migration tool shows it in the folder list.',
      ],
    ],
    links: [
      { path: '/routes', label: 'All migration routes' },
      { path: '/docs/errors', label: 'IMAP error write-ups' },
      { path: '/guides', label: 'IMAP settings by provider' },
    ],
  },
  uk: {
    title: 'Роздільники папок IMAP: / і . — MoveMailbox',
    description:
      'Dovecot використовує скісну риску, Courier — крапку. Чому після перенесення вкладені папки схлопуються і як це лагодить автоматичне зіставлення.',
    h1: 'Роздільники папок: Dovecot / проти Courier .',
    tag: 'Протоколи',
    card: 'Чому «Клієнти/2025» перетворюється на папку з крапкою в імені, звідки беруться плоскі списки замість дерева і що з цим робить автозіставлення.',
    lede: 'Симптом упізнаваний: на старому сервері було охайне дерево папок, на новому — плоский список із крапками або скісними рисками просто в назвах. Винен один символ, про який у протоколі забули домовитися.',
    blocks: [
      {
        h2: 'Звідки береться проблема',
        paragraphs: [
          'В IMAP вкладеність папок передається не структурою, а рядком: «Клієнти/2025» — це папка «2025» всередині папки «Клієнти». Який символ є роздільником, вирішує сервер.',
          'Dovecot і більшість сучасних серверів використовують скісну риску. Courier історично використовує крапку. Старі збірки Cyrus — теж крапку.',
          'Клієнт зобов’язаний запитати роздільник у сервера командою LIST і далі використовувати саме його. Якщо цього не зробити, ім’я папки їде на інший сервер як є, і там воно означає вже не те.',
        ],
        sample: {
          caption: 'Сервер сам повідомляє свій роздільник',
          body: 'Dovecot:  * LIST (\\HasChildren) "/" "Клієнти"\nCourier:  * LIST (\\HasChildren) "." "INBOX.Клієнти"',
        },
      },
      {
        h2: 'Який вигляд має поломка',
        paragraphs: ['Три типові картини, за якими діагноз ставиться одразу.'],
        bullets: [
          'Замість дерева — плоский список, а роздільник видно просто в імені: «Клієнти.2025».',
          'Усі папки опинилися всередині INBOX: у Courier користувацькі папки живуть саме там.',
          'Папка з крапкою в назві — наприклад «ТОВ Ромашка. Договори» — роз’їхалася на дві вкладені.',
          'Папка зі скісною рискою в імені взагалі не приїхала: під час перенесення в Microsoft 365 такі папки задокументовано пропускаються — їх треба перейменувати до старту.',
        ],
      },
      {
        h2: 'Що з цим робить автозіставлення',
        paragraphs: [
          'Правильний інструмент запитує роздільник в обох сторін і переписує імена під час перенесення, а заодно знімає або додає префікс INBOX там, де він потрібен.',
          'Це і є режим автоматичного зіставлення папок. У переважній більшості перенесень він робить саме те, що треба.',
          'Ручне правило має сенс рівно в одному випадку: коли в назві папки є символ, що є роздільником на приймальному боці.',
        ],
      },
      {
        h2: 'Що перевірити до перенесення',
        paragraphs: ['Хвилина на список папок рятує від розбору завалів після.'],
        steps: [
          'Подивіться список папок з обох боків до старту: роздільник видно одразу.',
          'Знайдіть папки, у назві яких є крапка або скісна риска, і вирішіть, що з ними робити.',
          'Лишіть автозіставлення ввімкненим, якщо немає причини його вимикати.',
          'Після перенесення звірте не лише кількість листів, а й глибину дерева.',
        ],
      },
    ],
    faq: [
      [
        'Чому всі папки опинилися всередині «Вхідних»?',
        'Так влаштований Courier: користувацькі папки лежать під INBOX. Під час перенесення на Dovecot цей префікс треба знімати.',
      ],
      [
        'Чи можна перейменувати папки просто під час перенесення?',
        'Так, правилом заміни.',
      ],
      [
        'Чи втратяться листи через неправильний роздільник?',
        'Ні, листи доїжджають. Ламається структура.',
      ],
      [
        'Як дізнатися роздільник свого сервера?',
        'Він видно у відповіді на команду LIST — друге поле в лапках.',
      ],
    ],
    links: [
      { path: '/routes', label: 'Усі маршрути перенесення' },
      { path: '/docs/errors', label: 'Розбори помилок IMAP' },
      { path: '/guides', label: 'Налаштування IMAP за провайдерами' },
    ],
  },
};
