import type { BlogPost } from '@/data/blog-posts';

export const howLongMigrationTakes: BlogPost = {
  slug: 'how-long-migration-takes',
  date: '2026-09-12',
  icon: 'cal',
  ru: {
    title: 'Сколько времени займёт перенос почты — MoveMailbox',
    description:
      'Почему длительность переноса определяет провайдер, а не инструмент: лимиты Gmail, Exchange и iCloud, как посчитать срок и что можно ускорить.',
    h1: 'Сколько времени займёт перенос почты',
    tag: 'Планирование',
    card: 'Скорость упирается в лимиты отдающей и принимающей стороны, а не в программу. Как прикинуть срок заранее и что делать с ящиком на десятки гигабайт.',
    lede: 'Ответ, который редко нравится: срок задаёт не инструмент, а два почтовых сервера. Любой перенос по IMAP — это скачивание письма с одной стороны и загрузка на другую, и обе стороны считают, сколько вы у них берёте.',
    blocks: [
      {
        h2: 'От чего зависит скорость',
        paragraphs: [
          'Объём в гигабайтах важен меньше, чем число писем. Тысяча писем по мегабайту переносится заметно быстрее, чем десять тысяч по сто килобайт: на каждое письмо тратится отдельный обмен командами, и накладные расходы на штуку почти не зависят от размера.',
          'Второй множитель — сколько параллельных подключений разрешает провайдер. Отсюда берётся правило: считать надо по самой медленной из двух сторон, ускорить перенос быстрым каналом нельзя.',
        ],
        bullets: [
          'Число писем и папок — главный множитель, а не гигабайты.',
          'Лимит одновременных IMAP-сессий на стороне провайдера.',
          'Суточные квоты на выгрузку, которые у крупных провайдеров считаются на аккаунт.',
          'Скорость принимающей стороны: она обычно медленнее отдающей.',
        ],
      },
      {
        h2: 'Что провайдеры пишут в документации',
        paragraphs: [
          'Публичных цифр мало, но у Google они есть, и они жёстче, чем кажется. Gmail ограничивает синхронизацию по IMAP двумя порогами в сутки на аккаунт: 2500 МБ на скачивание и всего 500 МБ на загрузку. При достижении порога доступ приостанавливается — обычно на час, в худшем случае до суток.',
          'Из этого следует неочевидное: перенос ИЗ Gmail идёт примерно впятеро быстрее, чем В Gmail. Ящик на десять гигабайт уедет из Gmail за четверо суток, а приедет в Gmail за три недели — и с этим ничего нельзя сделать, кроме как заложить срок заранее.',
          'Microsoft свои пороги для Exchange Online не публикует, поэтому обещать цифру было бы враньём. Зато документированы два ограничения переноса: письма больше 35 МБ не переносятся, и папки со слэшем в названии — тоже. Apple лимитов на IMAP-сессии не публикует; документирован только предельный размер письма в 20 МБ.',
          'Практический вывод: ящик на пять гигабайт обычно переезжает за ночь, ящик на пятьдесят — за несколько суток, и это нормально. Плохой сценарий не «долго», а «оборвалось и непонятно, что переехало».',
        ],
        bullets: [
          'Gmail: 2500 МБ в сутки на скачивание, 500 МБ в сутки на загрузку (Google Workspace Admin Help).',
          'Microsoft 365: письма больше 35 МБ и папки со слэшем в имени при IMAP-переносе пропускаются (Microsoft Learn).',
          'iCloud: предельный размер письма 20 МБ (Apple Support).',
          'Всё остальное, что вам расскажут о скорости провайдеров, — наблюдения, а не обязательства.',
        ],
      },
      {
        h2: 'Как посчитать свой случай',
        paragraphs: [
          'Перед запуском имеет смысл потратить пять минут на оценку — она избавляет от главного разочарования, когда перенос ставят на вечер пятницы в расчёте на час.',
        ],
        steps: [
          'Посмотрите объём ящика и число писем в настройках почты или через режим подсчёта размеров папок.',
          'Разделите объём на суточный лимит отдающей стороны — получите нижнюю границу.',
          'Добавьте запас на папки с тысячами мелких писем: на них время считается по штукам, а не по гигабайтам.',
          'Запланируйте первый проход заранее, а перед самым переключением сделайте второй — он догонит только новое и займёт минуты.',
        ],
      },
      {
        h2: 'Что реально ускоряет, а что нет',
        paragraphs: [
          'Ускоряет: исключение папок, которые не нужны на новом месте, — корзины, спама и архивных ярлыков, дублирующих остальную почту. На Gmail это часто половина объёма.',
          'Не ускоряет: более быстрый интернет, платный тариф инструмента переноса, запуск нескольких копий одновременно. Последнее обычно даёт обратный эффект — провайдер начинает отвечать отказом по числу подключений, и перенос идёт медленнее, чем в один поток.',
        ],
      },
    ],
    faq: [
      [
        'Можно ли пользоваться почтой во время переноса?',
        'Да. Чтение и отправка не мешают копированию. Письма, пришедшие после запуска, догоняются вторым проходом.',
      ],
      [
        'Что будет, если закрыть браузер?',
        'Локальный клиент продолжает работу, пока запущен сам клиент. Онлайн-перенос выполняется на сервере и не зависит от вкладки.',
      ],
      [
        'Почему первые папки идут быстро, а потом всё замедляется?',
        'Обычно это суточная квота провайдера или папка с большим числом мелких писем. Первое лечится ожиданием, второе — терпением.',
      ],
      [
        'Ускорится ли перенос, если купить более дорогой тариф?',
        'Нет. Тариф меняет допустимый объём, а не скорость: её задают лимиты почтовых серверов.',
      ],
    ],
    links: [
      { path: '/pricing', label: 'Тарифы и объёмы' },
      { path: '/docs/errors/quota-exceeded', label: 'Ошибка QUOTA EXCEEDED: разбор' },
      { path: '/routes', label: 'Все маршруты переноса' },
    ],
  },
  en: {
    title: 'How long an email migration takes — MoveMailbox',
    description:
      'Why the provider sets the duration, not the tool: Gmail, Exchange and iCloud limits, how to estimate your own case and what actually speeds things up.',
    h1: 'How long does moving a mailbox take',
    tag: 'Planning',
    card: 'Speed is capped by the two mail servers, not by the software. How to estimate the time in advance and what to expect from a mailbox of tens of gigabytes.',
    lede: 'The honest answer is rarely the popular one: the schedule belongs to the two mail servers, not to the tool. Every IMAP migration downloads a message from one side and uploads it to the other, and both sides count what you take.',
    blocks: [
      {
        h2: 'What the speed depends on',
        paragraphs: [
          'The size in gigabytes matters less than the number of messages. A thousand one-megabyte messages move noticeably faster than ten thousand hundred-kilobyte ones: each message costs its own round trip, and that overhead barely depends on size.',
          'The second factor is how many parallel connections the provider allows. Hence the rule: estimate from the slower of the two sides, because a fast connection of your own cannot help.',
        ],
        bullets: [
          'Message and folder counts, not gigabytes, are the main multiplier.',
          'The limit on simultaneous IMAP sessions on the provider side.',
          'Daily export quotas, counted per account by the large providers.',
          'The receiving side, which is usually slower than the sending one.',
        ],
      },
      {
        h2: 'What the providers actually document',
        paragraphs: [
          'Published figures are rare, but Google has them, and they are stricter than people expect. Gmail caps IMAP sync with two daily thresholds per account: 2500 MB of download and only 500 MB of upload. Hit one and access is suspended — usually for an hour, at worst for a day.',
          'That leads somewhere non-obvious: moving out of Gmail runs about five times faster than moving into it. A ten-gigabyte mailbox leaves Gmail in four days and arrives in Gmail in three weeks, and nothing can change that except planning for it.',
          'Microsoft does not publish its Exchange Online thresholds, so quoting a number would be inventing one. Two migration limits are documented though: messages over 35 MB are not migrated, and neither are folders with a forward slash in the name. Apple publishes no IMAP session limits either; the documented figure is a 20 MB message size cap.',
          'The practical takeaway: a five-gigabyte mailbox usually moves overnight, a fifty-gigabyte one takes a few days, and that is normal. The bad outcome is not slow — it is stopping halfway with no idea what made it across.',
        ],
        bullets: [
          'Gmail: 2500 MB per day down, 500 MB per day up (Google Workspace Admin Help).',
          'Microsoft 365: messages over 35 MB and folders with a slash in the name are skipped by IMAP migration (Microsoft Learn).',
          'iCloud: 20 MB maximum message size (Apple Support).',
          'Everything else you hear about provider speed is observation, not commitment.',
        ],
      },
      {
        h2: 'Estimating your own case',
        paragraphs: [
          'Five minutes of estimation before you start saves the classic disappointment of scheduling a migration for Friday evening and expecting an hour.',
        ],
        steps: [
          'Look up the mailbox size and message count in mail settings, or run a folder-size pass.',
          'Divide the size by the sending side daily limit to get the lower bound.',
          'Add headroom for folders with thousands of small messages: their cost is counted per message, not per gigabyte.',
          'Run the first pass well in advance, then a second pass right before the switch — it only catches up the new mail and takes minutes.',
        ],
      },
      {
        h2: 'What speeds it up, and what does not',
        paragraphs: [
          'It helps to exclude folders you do not want on the new side: trash, spam and archive labels that duplicate the rest of the mail. On Gmail that is often half the volume.',
          'It does not help to buy faster internet, pay for a higher plan, or run several copies at once. The last one usually backfires: the provider starts refusing connections, and the whole thing runs slower than a single stream would.',
        ],
      },
    ],
    faq: [
      [
        'Can I use my mail while it is being migrated?',
        'Yes. Reading and sending do not interfere with copying, and anything that arrives after the start is caught up by a second pass.',
      ],
      [
        'What happens if I close the browser?',
        'A local client keeps working as long as the client is running. An online migration runs on the server and does not depend on the tab.',
      ],
      [
        'Why do the first folders fly and then everything slows down?',
        'Usually a daily provider quota, or a folder with a huge number of small messages. The first needs waiting, the second needs patience.',
      ],
      [
        'Will a more expensive plan make it faster?',
        'No. A plan changes the allowed volume, not the speed: the mail servers set that.',
      ],
    ],
    links: [
      { path: '/pricing', label: 'Plans and volumes' },
      { path: '/docs/errors/quota-exceeded', label: 'QUOTA EXCEEDED explained' },
      { path: '/routes', label: 'All migration routes' },
    ],
  },
  uk: {
    title: 'Скільки триває перенесення пошти — MoveMailbox',
    description:
      'Чому тривалість визначає провайдер, а не інструмент: ліміти Gmail, Exchange та iCloud, як порахувати строк і що справді пришвидшує перенесення.',
    h1: 'Скільки часу займе перенесення пошти',
    tag: 'Планування',
    card: 'Швидкість упирається в ліміти обох сторін, а не в програму. Як прикинути строк заздалегідь і що робити зі скринькою на десятки гігабайтів.',
    lede: 'Відповідь, яка рідко подобається: строк задає не інструмент, а два поштові сервери. Будь-яке перенесення по IMAP — це завантаження листа з одного боку й вивантаження на інший, і обидві сторони рахують, скільки ви в них берете.',
    blocks: [
      {
        h2: 'Від чого залежить швидкість',
        paragraphs: [
          'Обсяг у гігабайтах важить менше, ніж кількість листів. Тисяча листів по мегабайту переноситься помітно швидше, ніж десять тисяч по сто кілобайтів: на кожен лист витрачається окремий обмін командами, і накладні витрати на штуку майже не залежать від розміру.',
          'Другий множник — скільки паралельних підключень дозволяє провайдер. Звідси правило: рахувати треба за найповільнішою зі сторін, пришвидшити перенесення швидким каналом не вийде.',
        ],
        bullets: [
          'Кількість листів і папок — головний множник, а не гігабайти.',
          'Ліміт одночасних IMAP-сесій на боці провайдера.',
          'Добові квоти на вивантаження, які великі провайдери рахують на акаунт.',
          'Швидкість приймальної сторони: вона зазвичай повільніша за віддавальну.',
        ],
      },
      {
        h2: 'Що провайдери пишуть у документації',
        paragraphs: [
          'Публічних цифр мало, але в Google вони є, і вони жорсткіші, ніж здається. Gmail обмежує синхронізацію по IMAP двома порогами на добу на акаунт: 2500 МБ на завантаження до себе і лише 500 МБ на вивантаження в скриньку. Після досягнення порогу доступ призупиняється — зазвичай на годину, у гіршому разі до доби.',
          'Із цього випливає неочевидне: перенесення З Gmail іде приблизно вп’ятеро швидше, ніж У Gmail. Скринька на десять гігабайтів поїде з Gmail за четверо діб, а приїде в Gmail за три тижні — і з цим нічого не вдієш, окрім як закласти строк заздалегідь.',
          'Microsoft своїх порогів для Exchange Online не публікує, тож обіцяти цифру було б неправдою. Зате задокументовані два обмеження перенесення: листи понад 35 МБ не переносяться, і папки зі скісною рискою в назві — теж. Apple лімітів на IMAP-сесії не публікує; задокументований лише граничний розмір листа у 20 МБ.',
          'Практичний висновок: скринька на п’ять гігабайтів зазвичай переїжджає за ніч, на п’ятдесят — за кілька діб, і це нормально. Поганий сценарій не «довго», а «обірвалося й незрозуміло, що переїхало».',
        ],
        bullets: [
          'Gmail: 2500 МБ на добу на завантаження, 500 МБ на добу на вивантаження (Google Workspace Admin Help).',
          'Microsoft 365: листи понад 35 МБ і папки зі скісною рискою в імені під час IMAP-перенесення пропускаються (Microsoft Learn).',
          'iCloud: граничний розмір листа 20 МБ (Apple Support).',
          'Усе інше, що вам розкажуть про швидкість провайдерів, — спостереження, а не зобов’язання.',
        ],
      },
      {
        h2: 'Як порахувати свій випадок',
        paragraphs: [
          'П’ять хвилин оцінки перед запуском рятують від головного розчарування, коли перенесення ставлять на вечір п’ятниці з розрахунку на годину.',
        ],
        steps: [
          'Подивіться обсяг скриньки та кількість листів у налаштуваннях пошти або через режим підрахунку розмірів папок.',
          'Поділіть обсяг на добовий ліміт віддавальної сторони — отримаєте нижню межу.',
          'Додайте запас на папки з тисячами дрібних листів: там час рахується поштучно, а не по гігабайтах.',
          'Заплануйте перший прохід заздалегідь, а перед самим перемиканням зробіть другий — він дожене лише нове й триватиме хвилини.',
        ],
      },
      {
        h2: 'Що справді пришвидшує, а що ні',
        paragraphs: [
          'Пришвидшує виключення папок, які не потрібні на новому місці: кошика, спаму й архівних ярликів, що дублюють решту пошти. На Gmail це часто половина обсягу.',
          'Не пришвидшує швидший інтернет, дорожчий тариф інструмента чи запуск кількох копій водночас. Останнє зазвичай дає зворотний ефект: провайдер починає відмовляти за кількістю підключень, і перенесення йде повільніше, ніж в один потік.',
        ],
      },
    ],
    faq: [
      [
        'Чи можна користуватися поштою під час перенесення?',
        'Так. Читання й надсилання не заважають копіюванню, а листи, що надійшли після запуску, доганяються другим проходом.',
      ],
      [
        'Що буде, якщо закрити браузер?',
        'Локальний клієнт працює, доки запущений сам клієнт. Онлайн-перенесення виконується на сервері й не залежить від вкладки.',
      ],
      [
        'Чому перші папки йдуть швидко, а потім усе сповільнюється?',
        'Зазвичай це добова квота провайдера або папка з великою кількістю дрібних листів.',
      ],
      [
        'Чи пришвидшиться перенесення на дорожчому тарифі?',
        'Ні. Тариф змінює дозволений обсяг, а не швидкість: її задають ліміти поштових серверів.',
      ],
    ],
    links: [
      { path: '/pricing', label: 'Тарифи та обсяги' },
      { path: '/docs/errors/quota-exceeded', label: 'Помилка QUOTA EXCEEDED: розбір' },
      { path: '/routes', label: 'Усі маршрути перенесення' },
    ],
  },
};
