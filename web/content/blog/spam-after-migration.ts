import type { BlogPost } from '@/data/blog-posts';

export const spamAfterMigration: BlogPost = {
  slug: 'spam-after-migration',
  date: '2026-09-12',
  icon: 'sh',
  ru: {
    title: 'Почта уходит в спам после переезда — MoveMailbox',
    description:
      'После смены сервера письма попадают в спам: почему это не связано с переносом архива и как настроить SPF, DKIM и DMARC для нового отправителя.',
    h1: 'Почта после переезда уходит в спам: SPF, DKIM и DMARC',
    tag: 'Доставляемость',
    card: 'Перенос копирует входящую почту, а в спам уходит исходящая. Три записи в DNS, которые надо настроить, и порядок их проверки.',
    lede: 'Частая жалоба после переезда: архив на месте, почта приходит, а собственные письма клиенты находят в спаме. Перенос тут ни при чём — сменился сервер, который отправляет, и получатели об этом ещё не знают.',
    blocks: [
      {
        h2: 'Почему это происходит',
        paragraphs: [
          'Принимающие серверы решают судьбу письма по трём вопросам: имел ли право этот сервер отправлять от вашего домена, не менялось ли письмо в пути и что делать, если ответ на первые два — нет.',
          'Пока домен жил на старом хостинге, в DNS стояли записи, отвечающие на эти вопросы про старый сервер. После переезда отправляет новый, а записи остались прежними — формально письма шлёт самозванец.',
          'Второй фактор — репутация. У нового сервера её ещё нет, и первые дни повышенной подозрительности неизбежны даже при идеально настроенных записях.',
        ],
      },
      {
        h2: 'Три записи, которые нужно настроить',
        paragraphs: [
          'Все три живут в DNS домена и настраиваются один раз. Значения даёт новый почтовый провайдер — их не нужно придумывать.',
        ],
        bullets: [
          'SPF — список серверов, которым разрешено отправлять от вашего домена. Запись должна быть ровно одна: две записи SPF ломают проверку целиком.',
          'DKIM — подпись, которой новый сервер подписывает исходящие письма, и открытый ключ в DNS, которым получатель её проверяет.',
          'DMARC — политика на случай, если SPF и DKIM не сошлись: пропустить, положить в спам или отклонить. Начинать стоит с мягкой политики и отчётов.',
          'PTR для своего сервера — если почту отправляет собственный сервер, а не провайдер: обратная запись должна совпадать с именем в приветствии SMTP.',
        ],
      },
      {
        h2: 'Порядок действий',
        paragraphs: [
          'Чинится за один подход, но требует терпения: изменения в DNS расходятся не мгновенно.',
        ],
        steps: [
          'Возьмите у нового провайдера значения SPF и DKIM для вашего домена.',
          'Замените старую запись SPF новой, а не добавляйте вторую.',
          'Добавьте открытый ключ DKIM и включите подпись на стороне провайдера.',
          'Поставьте DMARC в мягком режиме с адресом для отчётов, а через пару недель ужесточите.',
          'Отправьте письма на пару ящиков у крупных провайдеров и посмотрите в заголовках результаты проверок.',
          'Если письма всё ещё в спаме — проверьте домен по публичным чёрным спискам: старый хостинг мог оставить наследство.',
        ],
      },
      {
        h2: 'Что не поможет',
        paragraphs: [
          'Просить получателей добавить вас в белый список — лечение симптома у одного человека, а не проблемы.',
          'Массовая рассылка «мы переехали» с нового сервера в первый же день — верный способ испортить репутацию, которая ещё не сложилась. Первые дни лучше отправлять обычный рабочий объём.',
          'И отдельно: к переносу архива всё это отношения не имеет. Перенесённые письма уже лежат в папках и никуда не денутся, даже если исходящая почта пока фильтруется.',
        ],
      },
    ],
    faq: [
      [
        'Перенос почты влияет на доставляемость?',
        'Нет. Перенос копирует входящий архив, а в спам попадает исходящая почта — это разные вещи и настраиваются они отдельно.',
      ],
      [
        'Сколько ждать после настройки записей?',
        'Обычно от нескольких часов до суток: столько живёт кеш DNS у получателей. Репутация нового сервера набирается дольше — недели.',
      ],
      [
        'Можно ли оставить две записи SPF?',
        'Нет. Две записи SPF считаются ошибкой и обнуляют проверку. Все разрешённые серверы перечисляются в одной.',
      ],
      [
        'Нужен ли DMARC, если SPF и DKIM настроены?',
        'Он не обязателен технически, но крупные получатели относятся к домену с DMARC заметно лучше, а отчёты показывают, кто ещё шлёт письма от вашего имени.',
      ],
    ],
    links: [
      { path: '/migrate/cpanel-to-gmail', label: 'Перенос с хостинга на Gmail' },
      { path: '/docs/errors/certificate-verify-failed', label: 'Ошибка проверки сертификата: разбор' },
      { path: '/routes', label: 'Все маршруты переноса' },
    ],
  },
  en: {
    title: 'Mail goes to spam after a move — MoveMailbox',
    description:
      'Outgoing mail lands in spam after a server change: why the archive migration is not to blame and how to set SPF, DKIM and DMARC for the new sender.',
    h1: 'Mail lands in spam after the move: SPF, DKIM and DMARC',
    tag: 'Deliverability',
    card: 'A migration copies incoming mail; what lands in spam is outgoing. The three DNS records to set and the order to verify them in.',
    lede: 'A common complaint after a move: the archive is there, mail arrives, and your own messages turn up in the recipients spam folder. The migration has nothing to do with it — the sending server changed, and recipients do not know that yet.',
    blocks: [
      {
        h2: 'Why it happens',
        paragraphs: [
          'Receiving servers decide the fate of a message from three questions: was this server allowed to send for your domain, was the message altered in transit, and what to do when the first two answers are no.',
          'While the domain lived on the old host, the DNS records answered those questions about the old server. After the move the new server sends and the records still describe the old one — formally, an impostor is sending your mail.',
          'The second factor is reputation. A new server has none yet, so a few days of extra suspicion are unavoidable even with perfect records.',
        ],
      },
      {
        h2: 'The three records to set',
        paragraphs: [
          'All three live in the domain DNS and are configured once. The values come from the new mail provider — there is nothing to invent.',
        ],
        bullets: [
          'SPF — the list of servers allowed to send for your domain. There must be exactly one record: two SPF records break the check entirely.',
          'DKIM — the signature the new server adds to outgoing mail, plus the public key in DNS that recipients verify it with.',
          'DMARC — the policy for when SPF and DKIM do not line up: accept, quarantine or reject. Start permissive, with reports switched on.',
          'PTR for your own server, if you send from your own rather than a provider: the reverse record must match the name used in the SMTP greeting.',
        ],
      },
      {
        h2: 'The order of work',
        paragraphs: ['One sitting to fix, but it needs patience: DNS changes do not propagate instantly.'],
        steps: [
          'Get the SPF and DKIM values for your domain from the new provider.',
          'Replace the old SPF record rather than adding a second one.',
          'Publish the DKIM public key and enable signing on the provider side.',
          'Set DMARC to a permissive policy with a reporting address, then tighten it after a couple of weeks.',
          'Send test messages to mailboxes at a few large providers and read the check results in the headers.',
          'If mail still lands in spam, check the domain against public blocklists: the old host may have left a legacy.',
        ],
      },
      {
        h2: 'What will not help',
        paragraphs: [
          'Asking recipients to whitelist you treats the symptom for one person, not the problem.',
          'A mass we-have-moved announcement from the new server on day one is a reliable way to damage a reputation that has not formed yet. Keep to normal volume for the first few days.',
          'And separately: none of this has anything to do with the archive migration. Migrated messages already sit in their folders and are not going anywhere, even while outgoing mail is still being filtered.',
        ],
      },
    ],
    faq: [
      [
        'Does the migration itself affect deliverability?',
        'No. A migration copies the incoming archive; spam filtering applies to outgoing mail. Different things, configured separately.',
      ],
      [
        'How long after setting the records?',
        'Usually hours to a day, the lifetime of DNS caches. Reputation for a new server takes weeks.',
      ],
      [
        'Can I keep two SPF records?',
        'No. Two SPF records count as an error and void the check. List every allowed server in one record.',
      ],
      [
        'Is DMARC needed if SPF and DKIM are set?',
        'Not technically required, but large receivers treat domains with DMARC noticeably better, and the reports show who else sends mail in your name.',
      ],
    ],
    links: [
      { path: '/migrate/cpanel-to-gmail', label: 'Move from hosting to Gmail' },
      { path: '/docs/errors/certificate-verify-failed', label: 'Certificate verify failed explained' },
      { path: '/routes', label: 'All migration routes' },
    ],
  },
  uk: {
    title: 'Пошта йде у спам після переїзду — MoveMailbox',
    description:
      'Після зміни сервера листи потрапляють у спам: чому це не пов’язано з перенесенням архіву і як налаштувати SPF, DKIM та DMARC для нового відправника.',
    h1: 'Пошта після переїзду йде у спам: SPF, DKIM і DMARC',
    tag: 'Доставність',
    card: 'Перенесення копіює вхідну пошту, а у спам іде вихідна. Три записи в DNS, які треба налаштувати, і порядок їх перевірки.',
    lede: 'Часта скарга після переїзду: архів на місці, пошта надходить, а власні листи клієнти знаходять у спамі. Перенесення тут ні до чого — змінився сервер, який відправляє, і отримувачі про це ще не знають.',
    blocks: [
      {
        h2: 'Чому це відбувається',
        paragraphs: [
          'Приймальні сервери вирішують долю листа за трьома питаннями: чи мав право цей сервер відправляти від вашого домену, чи не змінювався лист у дорозі і що робити, якщо відповідь на перші два — ні.',
          'Доки домен жив на старому хостингу, у DNS стояли записи про старий сервер. Після переїзду відправляє новий, а записи лишилися колишніми.',
          'Другий чинник — репутація. У нового сервера її ще немає, і перші дні підвищеної підозрілості неминучі.',
        ],
      },
      {
        h2: 'Три записи, які треба налаштувати',
        paragraphs: [
          'Усі три живуть у DNS домену й налаштовуються один раз. Значення дає новий поштовий провайдер.',
        ],
        bullets: [
          'SPF — список серверів, яким дозволено відправляти від вашого домену. Запис має бути рівно один.',
          'DKIM — підпис, яким новий сервер підписує вихідні листи, і відкритий ключ у DNS.',
          'DMARC — політика на випадок, якщо SPF і DKIM не зійшлися. Починати варто з м’якої політики та звітів.',
          'PTR для власного сервера — якщо пошту відправляє власний сервер, а не провайдер.',
        ],
      },
      {
        h2: 'Порядок дій',
        paragraphs: ['Лагодиться за один підхід, але потребує терпіння: зміни в DNS розходяться не миттєво.'],
        steps: [
          'Візьміть у нового провайдера значення SPF і DKIM для вашого домену.',
          'Замініть старий запис SPF новим, а не додавайте другий.',
          'Додайте відкритий ключ DKIM і ввімкніть підпис на боці провайдера.',
          'Поставте DMARC у м’якому режимі з адресою для звітів, а за пару тижнів посильте.',
          'Надішліть листи на кілька скриньок у великих провайдерів і подивіться в заголовках результати перевірок.',
          'Якщо листи все ще у спамі — перевірте домен за публічними чорними списками.',
        ],
      },
      {
        h2: 'Що не допоможе',
        paragraphs: [
          'Просити отримувачів додати вас у білий список — лікування симптому в однієї людини, а не проблеми.',
          'Масова розсилка «ми переїхали» з нового сервера першого ж дня — надійний спосіб зіпсувати репутацію, яка ще не склалася.',
          'І окремо: до перенесення архіву все це стосунку не має. Перенесені листи вже лежать у папках і нікуди не подінуться.',
        ],
      },
    ],
    faq: [
      [
        'Чи впливає перенесення пошти на доставність?',
        'Ні. Перенесення копіює вхідний архів, а у спам потрапляє вихідна пошта.',
      ],
      [
        'Скільки чекати після налаштування записів?',
        'Зазвичай від кількох годин до доби. Репутація нового сервера набирається довше — тижні.',
      ],
      [
        'Чи можна лишити два записи SPF?',
        'Ні. Два записи SPF вважаються помилкою й обнуляють перевірку.',
      ],
      [
        'Чи потрібен DMARC, якщо SPF і DKIM налаштовані?',
        'Технічно не обов’язковий, але великі отримувачі ставляться до домену з DMARC помітно краще.',
      ],
    ],
    links: [
      { path: '/migrate/cpanel-to-gmail', label: 'Перенесення з хостингу на Gmail' },
      { path: '/docs/errors/certificate-verify-failed', label: 'Помилка перевірки сертифіката: розбір' },
      { path: '/routes', label: 'Усі маршрути перенесення' },
    ],
  },
};
