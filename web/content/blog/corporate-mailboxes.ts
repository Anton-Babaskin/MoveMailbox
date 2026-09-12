import type { BlogPost } from '@/data/blog-posts';

export const corporateMailboxes: BlogPost = {
  slug: 'corporate-mailboxes',
  date: '2026-09-12',
  icon: 'bs',
  ru: {
    title: 'Перенос корпоративной почты — MoveMailbox',
    description:
      'Как перенести десять и больше ящиков компании: порядок, список ящиков, сверка счётчиков, что сказать сотрудникам и когда переключать MX.',
    h1: 'Перенос корпоративной почты на 10+ ящиков',
    tag: 'Бизнес',
    card: 'Отличие корпоративного переезда от личного — не объём, а координация. Порядок работы, список, сверка и письмо сотрудникам.',
    lede: 'Перенос одного ящика — техническая задача на вечер. Перенос сорока — организационная задача на неделю, в которой техническая часть занимает меньше всего времени.',
    blocks: [
      {
        h2: 'Что ломается на масштабе',
        paragraphs: [
          'Одиночный перенос прощает импровизацию: не туда нажали, перезапустили, забыли. На четырёх десятках ящиков каждая мелочь умножается на сорок, и вместо технической ошибки получается организационная.',
          'Три типичные проблемы: никто не знает точного списка ящиков, часть паролей неизвестна, а сотрудники узнают о переезде в момент, когда почта перестала работать.',
        ],
        bullets: [
          'Ящики-призраки: адреса, о которых знает только бухгалтерия или старый админ.',
          'Псевдонимы и общие ящики, которые выглядят как обычные адреса, но ящиками не являются.',
          'Ящики уволенных сотрудников: переносить их обычно нужно, читать — нет.',
          'Разные пароли и разная политика второго фактора у каждого пользователя.',
        ],
      },
      {
        h2: 'Порядок работы',
        paragraphs: [
          'Сценарий, который стабильно работает на десятках ящиков. Первые два шага занимают больше времени, чем сам перенос, и экономят больше всего.',
        ],
        steps: [
          'Соберите точный список: адрес, объём, владелец, нужен ли ящик вообще. Псевдонимы отметьте отдельно — они не переносятся, а настраиваются на новом месте.',
          'Заведите ящики на новом сервере с теми же адресами и выдайте пароли приложений или временные пароли.',
          'Начните с одного ящика средней величины: он показывает реальную скорость и вылавливает ошибки настройки до того, как они умножатся.',
          'Переносите остальные пакетами, а не все разом: провайдер ограничивает число одновременных подключений на аккаунт или на IP.',
          'Сверьте счётчики писем по папкам для каждого ящика и зафиксируйте результат в таблице.',
          'Переключите MX и через сутки сделайте второй проход по всем ящикам.',
        ],
      },
      {
        h2: 'Что сказать сотрудникам',
        paragraphs: [
          'Письмо за день до переключения снимает большую часть звонков. В нём должно быть четыре вещи: когда меняется, что делать в почтовом клиенте, что вся старая почта уже на месте и куда писать, если что-то не так.',
          'Отдельно стоит предупредить о двух нормальных эффектах переезда: письма могут перестроиться по дате получения на новом сервере, а мобильные клиенты попросят заново ввести пароль.',
        ],
      },
      {
        h2: 'Кому это можно поручить',
        paragraphs: [
          'Корпоративный перенос не обязан быть облачным. Если политика компании не разрешает передавать почтовые пароли наружу, локальный клиент делает ровно то же самое на вашей машине: данные и учётки не покидают периметр.',
          'Это же снимает вопрос объёма: у локального переноса нет лимита в гигабайтах, а сорок ящиков по десять гигабайт — обычное дело.',
        ],
      },
    ],
    faq: [
      [
        'Можно ли перенести все ящики одновременно?',
        'Технически да, практически не стоит: провайдеры ограничивают число одновременных IMAP-сессий, и пакет из трёх-пяти ящиков обычно идёт быстрее, чем все сразу.',
      ],
      [
        'Нужны ли пароли сотрудников?',
        'Нужен доступ по IMAP к каждому ящику. Обычно это пароли приложений, которые администратор выпускает сам или просит выпустить сотрудников.',
      ],
      [
        'Что делать с ящиками уволенных?',
        'Перенести как архив и оставить закрытыми на новом сервере. Так письма остаются доступными компании, но ящик никем не читается.',
      ],
      [
        'Сколько это займёт по времени?',
        'Считайте по самому большому ящику плюс запас на пакеты. Ориентиры по скорости провайдеров — в отдельной статье.',
      ],
    ],
    links: [
      { path: '/pricing', label: 'Тарифы для нескольких ящиков' },
      { path: '/migrate/gmail-to-microsoft-365', label: 'Перенос с Gmail на Microsoft 365' },
      { path: '/docs/errors/authenticationfailed', label: 'Ошибка AUTHENTICATIONFAILED: разбор' },
    ],
  },
  en: {
    title: 'Migrating company mailboxes — MoveMailbox',
    description:
      'How to move ten or more company mailboxes: the order of work, the inventory, counter checks, what to tell staff and when to switch MX.',
    h1: 'Migrating company mail: ten mailboxes and up',
    tag: 'Business',
    card: 'What makes a company move different is coordination, not volume. The working order, the inventory, the checks and the note to your colleagues.',
    lede: 'Moving one mailbox is an evening of technical work. Moving forty is a week of coordination in which the technical part takes the least time of all.',
    blocks: [
      {
        h2: 'What breaks at scale',
        paragraphs: [
          'A single migration forgives improvisation: wrong click, restart, forget. Across forty mailboxes every small thing is multiplied by forty, and a technical slip turns into an organisational one.',
          'Three problems show up every time: nobody has the exact list of mailboxes, some passwords are unknown, and staff learn about the move at the moment their mail stops working.',
        ],
        bullets: [
          'Ghost mailboxes: addresses only accounting or the previous admin knows about.',
          'Aliases and shared mailboxes that look like ordinary addresses but are not mailboxes.',
          'Mailboxes of people who have left: usually worth migrating, not worth reading.',
          'Different passwords and different two-factor policies per user.',
        ],
      },
      {
        h2: 'The working order',
        paragraphs: [
          'A sequence that holds up across dozens of mailboxes. The first two steps take longer than the migration itself and save the most.',
        ],
        steps: [
          'Build the exact inventory: address, size, owner, and whether the mailbox is needed at all. Mark aliases separately — they are not migrated, they are recreated.',
          'Create the mailboxes on the new server with the same addresses and issue app passwords or temporary ones.',
          'Start with one mid-sized mailbox: it reveals the real speed and catches configuration mistakes before they multiply.',
          'Migrate the rest in batches rather than all at once: providers cap simultaneous connections per account or per address.',
          'Compare per-folder message counts for each mailbox and record the result in the inventory.',
          'Switch MX, then run a second pass over every mailbox a day later.',
        ],
      },
      {
        h2: 'What to tell your colleagues',
        paragraphs: [
          'A note the day before the switch removes most of the support calls. It needs four things: when it happens, what to do in their mail client, that the old mail is already there, and where to write if something looks wrong.',
          'Two normal side effects are worth mentioning up front: messages may re-sort by the date the new server received them, and mobile clients will ask for the password again.',
        ],
      },
      {
        h2: 'Who can run it',
        paragraphs: [
          'A company migration does not have to be a cloud one. If policy forbids sending mailbox passwords outside, a local client does exactly the same work on your own machine: credentials and mail never leave the perimeter.',
          'That also answers the volume question: a local migration has no gigabyte cap, and forty mailboxes of ten gigabytes each is an ordinary case.',
        ],
      },
    ],
    faq: [
      [
        'Can all mailboxes be migrated at once?',
        'Technically yes, practically no: providers cap simultaneous IMAP sessions, and batches of three to five usually finish sooner than everything at once.',
      ],
      [
        'Do I need the staff passwords?',
        'You need IMAP access to each mailbox. In practice that means app passwords, issued by the administrator or by each user.',
      ],
      [
        'What about mailboxes of former employees?',
        'Migrate them as an archive and leave them closed on the new server: the mail stays available to the company and nobody reads the mailbox.',
      ],
      [
        'How long does it take?',
        'Estimate from the largest mailbox and add headroom for batching. Provider speed figures are in a separate article.',
      ],
    ],
    links: [
      { path: '/pricing', label: 'Plans for multiple mailboxes' },
      { path: '/migrate/gmail-to-microsoft-365', label: 'Move from Gmail to Microsoft 365' },
      { path: '/docs/errors/authenticationfailed', label: 'AUTHENTICATIONFAILED explained' },
    ],
  },
  uk: {
    title: 'Перенесення корпоративної пошти — MoveMailbox',
    description:
      'Як перенести десять і більше скриньок компанії: порядок, список скриньок, звірка лічильників, що сказати співробітникам і коли перемикати MX.',
    h1: 'Перенесення корпоративної пошти на 10+ скриньок',
    tag: 'Бізнес',
    card: 'Відмінність корпоративного переїзду від особистого — не обсяг, а координація. Порядок роботи, список, звірка й лист співробітникам.',
    lede: 'Перенесення однієї скриньки — технічна задача на вечір. Перенесення сорока — організаційна задача на тиждень, у якій технічна частина забирає найменше часу.',
    blocks: [
      {
        h2: 'Що ламається на масштабі',
        paragraphs: [
          'Одиночне перенесення пробачає імпровізацію: не туди натиснули, перезапустили, забули. На чотирьох десятках скриньок кожна дрібниця множиться на сорок.',
          'Три типові проблеми: ніхто не знає точного списку скриньок, частина паролів невідома, а співробітники дізнаються про переїзд у момент, коли пошта перестала працювати.',
        ],
        bullets: [
          'Скриньки-привиди: адреси, про які знає лише бухгалтерія або старий адміністратор.',
          'Псевдоніми та спільні скриньки, що мають вигляд звичайних адрес, але скриньками не є.',
          'Скриньки звільнених співробітників: переносити їх зазвичай треба, читати — ні.',
          'Різні паролі й різна політика другого фактора в кожного користувача.',
        ],
      },
      {
        h2: 'Порядок роботи',
        paragraphs: [
          'Сценарій, який стабільно працює на десятках скриньок. Перші два кроки забирають більше часу, ніж саме перенесення, і заощаджують найбільше.',
        ],
        steps: [
          'Зберіть точний список: адреса, обсяг, власник, чи потрібна скринька взагалі. Псевдоніми позначте окремо — вони не переносяться, а налаштовуються на новому місці.',
          'Створіть скриньки на новому сервері з тими самими адресами й видайте паролі застосунків або тимчасові паролі.',
          'Почніть з однієї скриньки середнього розміру: вона показує реальну швидкість і виловлює помилки налаштування.',
          'Переносьте решту пакетами, а не всі разом: провайдер обмежує кількість одночасних підключень.',
          'Звірте лічильники листів за папками для кожної скриньки й зафіксуйте результат у таблиці.',
          'Перемкніть MX і через добу зробіть другий прохід по всіх скриньках.',
        ],
      },
      {
        h2: 'Що сказати співробітникам',
        paragraphs: [
          'Лист за добу до перемикання знімає більшу частину дзвінків. У ньому має бути чотири речі: коли змінюється, що зробити в поштовому клієнті, що вся стара пошта вже на місці й куди писати, якщо щось не так.',
          'Окремо варто попередити про два нормальні ефекти переїзду: листи можуть перебудуватися за датою отримання на новому сервері, а мобільні клієнти попросять знову ввести пароль.',
        ],
      },
      {
        h2: 'Кому це можна доручити',
        paragraphs: [
          'Корпоративне перенесення не зобов’язане бути хмарним. Якщо політика компанії не дозволяє передавати поштові паролі назовні, локальний клієнт робить те саме на вашій машині: дані й облікові записи не залишають периметр.',
          'Це ж знімає питання обсягу: у локального перенесення немає ліміту в гігабайтах.',
        ],
      },
    ],
    faq: [
      [
        'Чи можна перенести всі скриньки одночасно?',
        'Технічно так, практично не варто: провайдери обмежують кількість одночасних IMAP-сесій, і пакет із трьох-п’яти скриньок зазвичай іде швидше.',
      ],
      [
        'Чи потрібні паролі співробітників?',
        'Потрібен доступ по IMAP до кожної скриньки. Зазвичай це паролі застосунків.',
      ],
      [
        'Що робити зі скриньками звільнених?',
        'Перенести як архів і лишити закритими на новому сервері.',
      ],
      [
        'Скільки це триватиме?',
        'Рахуйте за найбільшою скринькою плюс запас на пакети. Орієнтири швидкості провайдерів — в окремій статті.',
      ],
    ],
    links: [
      { path: '/pricing', label: 'Тарифи для кількох скриньок' },
      { path: '/migrate/gmail-to-microsoft-365', label: 'Перенесення з Gmail на Microsoft 365' },
      { path: '/docs/errors/authenticationfailed', label: 'Помилка AUTHENTICATIONFAILED: розбір' },
    ],
  },
};
