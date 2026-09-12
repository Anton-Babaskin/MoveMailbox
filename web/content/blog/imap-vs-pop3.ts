import type { BlogPost } from '@/data/blog-posts';

export const imapVsPop3: BlogPost = {
  slug: 'imap-vs-pop3',
  date: '2026-09-12',
  icon: 'cl',
  ru: {
    title: 'IMAP или POP3 при переносе почты — MoveMailbox',
    description:
      'Почему перенос почты делается только по IMAP: что POP3 не умеет, чем это грозит архиву и как быть, если старый сервер отдаёт только POP3.',
    h1: 'IMAP против POP3: почему перенос делается только по IMAP',
    tag: 'Протоколы',
    card: 'POP3 не знает папок, не хранит статусы и по умолчанию удаляет письма с сервера. Что это значит для переезда и что делать, если IMAP недоступен.',
    lede: 'Вопрос звучит как выбор из двух вариантов, но выбора нет. POP3 придуман, чтобы забрать почту на один компьютер и освободить сервер; IMAP — чтобы работать с ящиком целиком. Переносят ящик целиком.',
    blocks: [
      {
        h2: 'Что POP3 не умеет',
        paragraphs: [
          'POP3 знает ровно одну папку — входящие. Ни отправленных, ни черновиков, ни ваших пользовательских папок в нём не существует: протокол их просто не показывает.',
          'Он не хранит статус письма на сервере. Прочитано, отвечено, помечено флагом — всё это остаётся в клиенте, а не в ящике, и при переносе теряется вместе с клиентом.',
          'И главное: классическое поведение POP3 — забрать письмо и удалить его с сервера. Большинство клиентов сегодня просят оставлять копию, но это настройка, а не свойство протокола.',
        ],
        bullets: [
          'Только «Входящие», без отправленных, черновиков и пользовательских папок.',
          'Статусы прочитано и отвечено не переносятся: они не живут на сервере.',
          'Даты могут поехать: часть клиентов ставит дату загрузки вместо даты получения.',
          'По умолчанию письма удаляются с сервера после скачивания.',
        ],
      },
      {
        h2: 'Что даёт IMAP',
        paragraphs: [
          'IMAP показывает ящик таким, какой он есть: полное дерево папок, флаги, даты, вложения, служебные заголовки. Перенос по нему — это копирование структуры, а не выгрузка потока писем.',
          'Именно поэтому повторный запуск умеет не создавать дублей: в IMAP у письма есть устойчивые признаки, по которым его можно узнать на приёмнике. В POP3 такого сравнения нет.',
        ],
        sample: {
          caption: 'Разница видна прямо в протоколе',
          body: 'IMAP:  a1 LIST "" "*"   →  INBOX, Sent, Drafts, Клиенты/2025\nPOP3:  LIST          →  1 3402, 2 15233, 3 88110',
        },
      },
      {
        h2: 'Если старый сервер отдаёт только POP3',
        paragraphs: [
          'Такое встречается у очень старых хостингов и у корпоративных шлюзов, где IMAP выключен политикой. Порядок действий тогда такой.',
        ],
        steps: [
          'Проверьте, действительно ли IMAP выключен: часто он просто не включён в настройках ящика и включается одним переключателем.',
          'Спросите хостера. Иногда IMAP работает, но на нестандартном порту или только из определённой сети.',
          'Если IMAP включить нельзя — заберите почту POP3-клиентом на компьютер, а затем загрузите её на новый сервер уже по IMAP из локального ящика.',
          'Проверяйте настройку «оставлять копии на сервере» до того, как начнёте: без неё POP3 очистит исходный ящик.',
        ],
      },
      {
        h2: 'Короткий ответ',
        paragraphs: [
          'Для переезда нужен IMAP на обеих сторонах. На отдающей — чтобы увидеть всё, что есть; на принимающей — чтобы положить письма в те же папки и сохранить статусы.',
          'Если где-то из двух IMAP недоступен, перенос всё ещё возможен, но он перестаёт быть точной копией ящика и превращается в перенос входящих. Это стоит понимать заранее, а не обнаружить после.',
        ],
      },
    ],
    faq: [
      [
        'Можно ли перенести почту по POP3?',
        'Технически можно забрать входящие, но папки, статусы и часто даты будут потеряны. Для переезда ящика это не подходит.',
      ],
      [
        'POP3 удалит письма со старого сервера?',
        'По умолчанию да. Клиенты обычно предлагают оставлять копии, и эту настройку нужно проверить до первого запуска.',
      ],
      [
        'Что быстрее, IMAP или POP3?',
        'На практике скорость упирается в лимиты провайдера, а не в протокол. Выигрыш POP3 в накладных расходах несопоставим с потерей структуры.',
      ],
      [
        'Нужно ли выключать POP3 после переезда?',
        'Не обязательно, но полезно: лишний включённый протокол — лишняя точка входа в ящик.',
      ],
    ],
    links: [
      { path: '/guides', label: 'Настройки IMAP по провайдерам' },
      { path: '/docs/errors', label: 'Разборы ошибок IMAP' },
      { path: '/routes', label: 'Все маршруты переноса' },
    ],
  },
  en: {
    title: 'IMAP or POP3 for a mail migration — MoveMailbox',
    description:
      'Why migrations run over IMAP only: what POP3 cannot do, what that costs your archive, and what to do when the old server offers POP3 alone.',
    h1: 'IMAP versus POP3: why migrations only use IMAP',
    tag: 'Protocols',
    card: 'POP3 has no folders, keeps no message state and deletes from the server by default. What that means for a move, and the workaround when IMAP is off.',
    lede: 'It sounds like a choice between two options, but there is no choice. POP3 exists to pull mail onto one computer and free the server; IMAP exists to work with the whole mailbox. A migration moves the whole mailbox.',
    blocks: [
      {
        h2: 'What POP3 cannot do',
        paragraphs: [
          'POP3 knows exactly one folder: the inbox. Sent, Drafts and your own folders do not exist as far as the protocol is concerned — it simply never shows them.',
          'It keeps no per-message state on the server. Read, answered, flagged: all of that lives in the client, not in the mailbox, and disappears with the client.',
          'And the big one: classic POP3 behaviour is to fetch a message and delete it from the server. Most clients now ask to keep a copy, but that is a setting, not a property of the protocol.',
        ],
        bullets: [
          'Inbox only — no Sent, no Drafts, no folders of your own.',
          'Read and answered flags do not travel: they never lived on the server.',
          'Dates can shift: some clients stamp the download time instead of the receive time.',
          'By default, messages are removed from the server once downloaded.',
        ],
      },
      {
        h2: 'What IMAP gives you',
        paragraphs: [
          'IMAP shows the mailbox as it is: the full folder tree, flags, dates, attachments, headers. A migration over it copies structure rather than draining a stream of messages.',
          'That is also why a repeat run avoids duplicates: in IMAP a message carries stable traits that let the tool recognise it on the destination. POP3 offers nothing to compare.',
        ],
        sample: {
          caption: 'The difference is visible in the protocol itself',
          body: 'IMAP:  a1 LIST "" "*"   →  INBOX, Sent, Drafts, Clients/2025\nPOP3:  LIST          →  1 3402, 2 15233, 3 88110',
        },
      },
      {
        h2: 'When the old server only offers POP3',
        paragraphs: [
          'This still happens on very old hosting and on corporate gateways where IMAP is disabled by policy. The order of work is then this.',
        ],
        steps: [
          'Check whether IMAP is really off: it is often just not enabled in the mailbox settings, one switch away.',
          'Ask the host. Sometimes IMAP runs on a non-standard port or is limited to a particular network.',
          'If IMAP truly cannot be enabled, pull the mail down with a POP3 client and then upload it to the new server over IMAP from the local mailbox.',
          'Verify the leave-messages-on-server setting before you start, or POP3 will empty the source mailbox.',
        ],
      },
      {
        h2: 'The short answer',
        paragraphs: [
          'A move needs IMAP on both sides: on the source to see everything there is, on the destination to place messages into the same folders and keep their state.',
          'If one side lacks IMAP, a migration is still possible, but it stops being an exact copy of the mailbox and becomes a transfer of the inbox. Better to know that beforehand than to discover it afterwards.',
        ],
      },
    ],
    faq: [
      [
        'Can mail be migrated over POP3?',
        'You can fetch the inbox, but folders, flags and often dates are lost. That is not a mailbox move.',
      ],
      [
        'Will POP3 delete mail from the old server?',
        'By default yes. Clients usually offer to keep copies, and that setting has to be checked before the first run.',
      ],
      [
        'Which is faster, IMAP or POP3?',
        'In practice provider limits set the speed, not the protocol. Whatever POP3 saves in overhead is dwarfed by the loss of structure.',
      ],
      [
        'Should POP3 be switched off after the move?',
        'Not mandatory, but sensible: one more enabled protocol is one more way into the mailbox.',
      ],
    ],
    links: [
      { path: '/guides', label: 'IMAP settings by provider' },
      { path: '/docs/errors', label: 'IMAP error write-ups' },
      { path: '/routes', label: 'All migration routes' },
    ],
  },
  uk: {
    title: 'IMAP чи POP3 при перенесенні пошти — MoveMailbox',
    description:
      'Чому перенесення пошти робиться лише по IMAP: чого не вміє POP3, чим це загрожує архіву і що робити, якщо старий сервер віддає тільки POP3.',
    h1: 'IMAP проти POP3: чому перенесення робиться лише по IMAP',
    tag: 'Протоколи',
    card: 'POP3 не знає папок, не зберігає статуси й за замовчуванням видаляє листи із сервера. Що це означає для переїзду і що робити, якщо IMAP недоступний.',
    lede: 'Питання звучить як вибір із двох варіантів, але вибору немає. POP3 придумали, щоб забрати пошту на один комп’ютер і звільнити сервер; IMAP — щоб працювати зі скринькою повністю. Переносять скриньку повністю.',
    blocks: [
      {
        h2: 'Чого не вміє POP3',
        paragraphs: [
          'POP3 знає рівно одну папку — вхідні. Ні надісланих, ні чернеток, ні ваших власних папок у ньому не існує: протокол їх просто не показує.',
          'Він не зберігає статус листа на сервері. Прочитано, відповідано, позначено прапорцем — усе це лишається в клієнті, а не у скриньці.',
          'І головне: класична поведінка POP3 — забрати лист і видалити його із сервера. Більшість клієнтів сьогодні просять лишати копію, але це налаштування, а не властивість протоколу.',
        ],
        bullets: [
          'Лише «Вхідні», без надісланих, чернеток і власних папок.',
          'Статуси прочитано й відповідано не переносяться.',
          'Дати можуть зміститися: частина клієнтів ставить дату завантаження.',
          'За замовчуванням листи видаляються із сервера після завантаження.',
        ],
      },
      {
        h2: 'Що дає IMAP',
        paragraphs: [
          'IMAP показує скриньку такою, якою вона є: повне дерево папок, прапорці, дати, вкладення, службові заголовки.',
          'Саме тому повторний запуск уміє не створювати дублів: в IMAP у листа є стійкі ознаки, за якими його можна впізнати на приймачі. У POP3 такого порівняння немає.',
        ],
        sample: {
          caption: 'Різниця видно просто в протоколі',
          body: 'IMAP:  a1 LIST "" "*"   →  INBOX, Sent, Drafts, Клієнти/2025\nPOP3:  LIST          →  1 3402, 2 15233, 3 88110',
        },
      },
      {
        h2: 'Якщо старий сервер віддає лише POP3',
        paragraphs: [
          'Таке трапляється в дуже старих хостингів і корпоративних шлюзів, де IMAP вимкнено політикою.',
        ],
        steps: [
          'Перевірте, чи справді IMAP вимкнено: часто він просто не ввімкнений у налаштуваннях скриньки.',
          'Запитайте хостера. Інколи IMAP працює, але на нестандартному порту.',
          'Якщо IMAP увімкнути не можна — заберіть пошту POP3-клієнтом на комп’ютер, а потім завантажте її на новий сервер уже по IMAP.',
          'Перевіряйте налаштування «лишати копії на сервері» до того, як почнете.',
        ],
      },
      {
        h2: 'Коротка відповідь',
        paragraphs: [
          'Для переїзду потрібен IMAP з обох боків: на віддавальному — щоб побачити все, що є; на приймальному — щоб покласти листи в ті самі папки.',
          'Якщо десь із двох IMAP недоступний, перенесення все ще можливе, але воно перестає бути точною копією скриньки.',
        ],
      },
    ],
    faq: [
      [
        'Чи можна перенести пошту по POP3?',
        'Технічно можна забрати вхідні, але папки, статуси й часто дати буде втрачено.',
      ],
      [
        'Чи видалить POP3 листи зі старого сервера?',
        'За замовчуванням так. Цю настройку треба перевірити до першого запуску.',
      ],
      [
        'Що швидше, IMAP чи POP3?',
        'На практиці швидкість упирається в ліміти провайдера, а не в протокол.',
      ],
      [
        'Чи треба вимикати POP3 після переїзду?',
        'Не обов’язково, але корисно: зайвий увімкнений протокол — зайва точка входу у скриньку.',
      ],
    ],
    links: [
      { path: '/guides', label: 'Налаштування IMAP за провайдерами' },
      { path: '/docs/errors', label: 'Розбори помилок IMAP' },
      { path: '/routes', label: 'Усі маршрути перенесення' },
    ],
  },
};
