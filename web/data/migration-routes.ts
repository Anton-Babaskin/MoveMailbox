import type { ProviderKey } from './providers';

/**
 * Маршруты переноса A → B.
 *
 * ВАЖНО для SEO: description и intro у каждого маршрута РАЗНЫЕ.
 * Шаблон с подстановкой имён провайдеров даёт одинаковые сниппеты,
 * Google склеивает такие страницы и показывает в выдаче одну.
 * Каждый текст ниже написан под конкретную пару, а не сгенерирован.
 */

export type Language = 'ru' | 'en' | 'uk';

export type RouteCopy = {
  /** До 60 символов вместе с брендом. */
  title: string;
  /** До 155 символов. Уникальный. */
  description: string;
  h1: string;
  /** Ядро запроса в первых 100 символах, дальше — суть маршрута. */
  intro: string;
  /** Подводные камни именно этой пары. Идут в текст страницы. */
  pitfalls: string[];
  /** Уходит в FAQPage JSON-LD. */
  faq: Array<[string, string]>;
};

export type MigrationRoute = {
  slug: string;
  source: ProviderKey;
  destination: ProviderKey;
  /** Приоритет в sitemap: 1 — основной трафик, 2 — второй эшелон. */
  tier: 1 | 2;
  ru: RouteCopy;
  en: RouteCopy;
  /** Украинский: полный блок копии. */
  uk: RouteCopy;
};

export const migrationRoutes: MigrationRoute[] = [
  {
    slug: 'gmail-to-outlook',
    source: 'gmail',
    destination: 'outlook',
    tier: 1,
    ru: {
      title: 'Перенос почты с Gmail на Outlook — MoveMailbox',
      description:
        'Перенесём письма, папки и вложения из Gmail в Outlook.com по IMAP. Пароль приложения, ловушка «Вся почта», лимит 2.5 ГБ в сутки — разбираем всё.',
      h1: 'Перенос почты с Gmail на Outlook',
      intro:
        'Перенос почты с Gmail на Outlook упирается в две вещи: пароль приложения вместо обычного и ярлык «Вся почта», который дублирует каждое письмо. Разберёмся с обоими до запуска, иначе объём удвоится, а половина писем приедет дважды.',
      pitfalls: [
        'Gmail хранит ярлыки, а не папки: письмо из «Входящие» лежит ещё и в [Gmail]/All Mail. Не исключите — получите дубли и вдвое больший объём.',
        'Обычный пароль аккаунта IMAP не примет. Нужна двухэтапная аутентификация и созданный пароль приложения из 16 символов.',
        'IMAP в Gmail выключен по умолчанию: Настройки → Пересылка и POP/IMAP → Включить IMAP.',
        'Gmail отдаёт около 2.5 ГБ в сутки. Архив на 20 ГБ поедет неделю — это лимит провайдера, а не скорость переноса.',
      ],
      faq: [
        [
          'Сколько занимает перенос с Gmail на Outlook?',
          'Скорость ограничена Gmail: примерно 2.5 ГБ в сутки на ящик. Ящик на 5 ГБ переедет за двое суток, на 20 ГБ — примерно за неделю. Перенос идёт на сервере, компьютер держать включённым не нужно.',
        ],
        [
          'Сохранятся ли ярлыки Gmail?',
          'Ярлыки станут обычными папками в Outlook — это ограничение IMAP, а не переноса. Письмо с тремя ярлыками попадёт в ту папку, которую вы выберете, без дублей, если исключить «Вся почта».',
        ],
        [
          'Останутся ли письма в Gmail?',
          'Да. Перенос односторонний и ничего не удаляет в источнике. Старый ящик стоит отключать только после сверки счётчиков папок.',
        ],
      ],
    },
    en: {
      title: 'Migrate Gmail to Outlook — MoveMailbox',
      description:
        'Move messages, folders and attachments from Gmail to Outlook.com over IMAP. App passwords, the All Mail trap and the 2.5 GB daily cap, explained.',
      h1: 'Migrate email from Gmail to Outlook',
      intro:
        'Migrating Gmail to Outlook trips on two things: Gmail needs an app password rather than your account password, and the All Mail label holds a copy of every message. Handle both before you start, or the transfer doubles in size and arrives duplicated.',
      pitfalls: [
        'Gmail stores labels, not folders — every message also lives in [Gmail]/All Mail. Leave it in and you copy everything twice.',
        'Your normal account password will be rejected. Turn on 2-step verification, then create a 16-character app password.',
        'IMAP is off by default: Settings → Forwarding and POP/IMAP → Enable IMAP.',
        'Gmail serves roughly 2.5 GB per day per mailbox. A 20 GB archive takes about a week — that is Google throttling, not slow tooling.',
      ],
      faq: [
        [
          'How long does a Gmail to Outlook migration take?',
          'Gmail caps IMAP downloads at roughly 2.5 GB per day. A 5 GB mailbox lands in about two days, 20 GB in about a week. The job runs on our worker, so your machine can be off.',
        ],
        [
          'Do Gmail labels survive the move?',
          'Labels become ordinary folders in Outlook — an IMAP limitation, not ours. A message with three labels lands once, in the folder you pick, provided All Mail is excluded.',
        ],
        [
          'Does anything get deleted from Gmail?',
          'No. The transfer is one-way and never touches the source. Retire the old mailbox only after comparing folder counts yourself.',
        ],
      ],
    },
    uk: {
      title: 'Перенесення пошти з Gmail до Outlook — MoveMailbox',
      description:
        'Перенесемо листи, папки та вкладення з Gmail до Outlook.com через IMAP. Пароль застосунку, пастка «Вся пошта» та ліміт 2.5 ГБ на добу.',
      h1: 'Перенесення пошти з Gmail до Outlook',
      intro:
        'Перенесення пошти з Gmail до Outlook впирається у дві речі: пароль застосунку замість звичайного та ярлик «Вся пошта», який дублює кожен лист. Розберіться з обома до запуску.',
      pitfalls: [
        'Gmail зберігає ярлики, а не папки: лист із «Вхідних» лежить ще й у [Gmail]/All Mail. Не виключите — отримаєте дублікати та вдвічі більший обсяг.',
        'Звичайний пароль облікового запису IMAP не прийме. Потрібна двоетапна автентифікація та створений пароль застосунку з 16 символів.',
        'IMAP у Gmail вимкнений за замовчуванням: Налаштування → Пересилання і POP/IMAP → Увімкнути IMAP.',
        'Gmail віддає близько 2.5 ГБ на добу. Архів на 20 ГБ їхатиме тиждень — це ліміт провайдера, а не швидкість перенесення.',
      ],
      faq: [
        [
          'Скільки триває перенесення з Gmail до Outlook?',
          'Швидкість обмежує Gmail: приблизно 2.5 ГБ на добу на скриньку. Скринька на 5 ГБ переїде за дві доби, на 20 ГБ — приблизно за тиждень. Перенесення йде на сервері, тримати комп’ютер увімкненим не потрібно.',
        ],
        [
          'Чи збережуться ярлики Gmail?',
          'Ярлики стануть звичайними папками в Outlook — це обмеження IMAP, а не перенесення. Лист із трьома ярликами потрапить до тієї папки, яку ви оберете, без дублікатів, якщо виключити «Вся пошта».',
        ],
        [
          'Чи залишаться листи в Gmail?',
          'Так. Перенесення одностороннє й нічого не видаляє в джерелі. Стару скриньку варто вимикати лише після звірки лічильників папок.',
        ],
      ],
    },
  },

  {
    slug: 'outlook-to-gmail',
    source: 'outlook',
    destination: 'gmail',
    tier: 1,
    ru: {
      title: 'Перенос почты с Outlook на Gmail — MoveMailbox',
      description:
        'Переносим письма из Outlook.com в Gmail по IMAP с сохранением дат, флагов и вложенных папок. Пароль приложения Microsoft и папка Junk вместо Спам.',
      h1: 'Перенос почты с Outlook на Gmail',
      intro:
        'Перенос почты с Outlook на Gmail проще обратного: у Microsoft нет ярлыков, поэтому дубли не возникают. Основных сложностей две — пароль приложения при включённой двухшаговой проверке и разные названия служебных папок.',
      pitfalls: [
        'Папка «Нежелательная почта» у Microsoft называется Junk, а у Gmail — [Gmail]/Spam. Без сопоставления имён создастся лишняя папка.',
        'При включённой двухшаговой проверке нужен пароль приложения из «Дополнительных параметров безопасности» учётной записи Microsoft.',
        'Gmail считает объём вместе с Google Диском. Если места мало, перенос встанет на середине — проверьте квоту заранее.',
        'Старые ящики Hotmail и Live иногда требуют однократного входа через веб-интерфейс, прежде чем IMAP начнёт отвечать.',
      ],
      faq: [
        [
          'Станут ли папки Outlook ярлыками Gmail?',
          'Да, Gmail показывает IMAP-папки как ярлыки — вложенность при этом сохраняется. Визуально это выглядит как обычное дерево папок.',
        ],
        [
          'Что с квотой Gmail?',
          'Gmail считает почту вместе с Google Диском и Фото. Перед переносом 15 ГБ убедитесь, что свободного места хватает, иначе получите ошибку quota exceeded.',
        ],
      ],
    },
    en: {
      title: 'Migrate Outlook to Gmail — MoveMailbox',
      description:
        'Move Outlook.com email into Gmail over IMAP with dates, flags and nested folders intact. Microsoft app passwords and the Junk vs Spam mismatch covered.',
      h1: 'Migrate email from Outlook to Gmail',
      intro:
        'Migrating Outlook to Gmail is the easier direction: Microsoft has no labels, so nothing duplicates. Two things still need attention — an app password when 2-step verification is on, and the different names Microsoft and Google use for junk mail.',
      pitfalls: [
        'Microsoft calls it Junk, Gmail calls it [Gmail]/Spam. Without folder mapping you end up with a stray extra folder.',
        'With two-step verification enabled you need an app password from Microsoft account security settings.',
        'Gmail storage is shared with Google Drive and Photos. Check free space before moving 15 GB or the run stops with quota exceeded.',
        'Legacy Hotmail and Live mailboxes sometimes need one web sign-in before IMAP starts responding.',
      ],
      faq: [
        [
          'Do Outlook folders become Gmail labels?',
          'Yes — Gmail presents IMAP folders as labels, and nesting is preserved. It looks like an ordinary folder tree in the interface.',
        ],
        [
          'Will Gmail have enough space?',
          'Gmail storage is shared with Drive and Photos. Confirm free space before a large move, otherwise the transfer halts with a quota error partway through.',
        ],
      ],
    },
    uk: {
      title: 'Перенесення пошти з Outlook до Gmail — MoveMailbox',
      description:
        'Переносимо листи з Outlook.com до Gmail через IMAP зі збереженням дат, прапорців і вкладених папок. Пароль застосунку Microsoft і папка Junk.',
      h1: 'Перенесення пошти з Outlook до Gmail',
      intro:
        'Перенесення пошти з Outlook до Gmail простіше за зворотне: у Microsoft немає ярликів, тож дублі не виникають. Основні складнощі — пароль застосунку та різні назви службових папок.',
      pitfalls: [
        'Папка небажаної пошти в Microsoft називається Junk, а в Gmail — [Gmail]/Spam. Без зіставлення назв створиться зайва папка.',
        'За увімкненої двоетапної перевірки потрібен пароль застосунку з додаткових параметрів безпеки облікового запису Microsoft.',
        'Gmail рахує обсяг разом із Google Диском. Якщо місця мало, перенесення стане на середині — перевірте квоту заздалегідь.',
        'Старі скриньки Hotmail і Live іноді вимагають одноразового входу через вебінтерфейс, перш ніж IMAP почне відповідати.',
      ],
      faq: [
        [
          'Чи стануть папки Outlook ярликами Gmail?',
          'Так, Gmail показує IMAP-папки як ярлики — вкладеність при цьому зберігається. Візуально це виглядає як звичайне дерево папок.',
        ],
        [
          'Що з квотою Gmail?',
          'Gmail рахує пошту разом із Google Диском і Фото. Перед перенесенням 15 ГБ переконайтеся, що вільного місця вистачає, інакше отримаєте помилку quota exceeded.',
        ],
      ],
    },
  },

  {
    slug: 'gmail-to-microsoft-365',
    source: 'gmail',
    destination: 'microsoft-365',
    tier: 1,
    ru: {
      title: 'Миграция с Google Workspace на Microsoft 365 — MoveMailbox',
      description:
        'Перенос корпоративной почты с Google Workspace на Microsoft 365 по IMAP. Basic auth отключён — нужен OAuth 2.0, разбираем согласие администратора.',
      h1: 'Миграция с Google Workspace на Microsoft 365',
      intro:
        'Миграция с Google Workspace на Microsoft 365 — самый частый корпоративный переезд и самый требовательный технически. Microsoft отключил basic authentication для Exchange Online, поэтому пара «логин и пароль» на стороне назначения больше не проходит: нужен OAuth 2.0.',
      pitfalls: [
        'На стороне Microsoft 365 обычный пароль не работает — только OAuth 2.0 (XOAUTH2). Администратор тенанта один раз даёт согласие приложению с правом IMAP.AccessAsUser.All.',
        'IMAP у пользователя может быть выключен: Exchange admin center → Получатели → Управление email-приложениями.',
        'Exchange Online режет скорость при активной записи. Наращивать потоки бесполезно: лимит 20 одновременных сессий на ящик, дальше сервер рвёт соединения.',
        'Личный архив In-Place Archive через IMAP не виден вообще — это отдельное хранилище, для него нужен другой инструмент.',
        'Письма больше 35 МБ Microsoft по умолчанию не примет. Такие попадут в отчёт списком.',
      ],
      faq: [
        [
          'Можно ли перенести 40 ящиков сразу?',
          'Да, для этого есть пакетный режим: список ящиков загружается CSV-файлом, каждый идёт своей задачей, а в конце формируется сводный отчёт по всем пользователям.',
        ],
        [
          'Переедут ли календари и контакты?',
          'Нет. IMAP работает только с письмами и папками. Календари и контакты выгружаются из Google в ICS и vCard и импортируются в Microsoft 365 отдельно.',
        ],
        [
          'Что делать со сменой MX?',
          'Перенесите основную массу почты до переключения MX, а после переключения запустите второй проход — он докопирует только новые письма, дублей не будет.',
        ],
      ],
    },
    en: {
      title: 'Google Workspace to Microsoft 365 migration — MoveMailbox',
      description:
        'Migrate corporate mail from Google Workspace to Microsoft 365 over IMAP. Basic auth is disabled, so OAuth 2.0 and tenant admin consent are required.',
      h1: 'Migrate Google Workspace to Microsoft 365',
      intro:
        'Google Workspace to Microsoft 365 is the most common corporate move and the most demanding one. Microsoft disabled basic authentication for Exchange Online, so a plain username and password no longer authenticates on the destination — OAuth 2.0 is mandatory.',
      pitfalls: [
        'Microsoft 365 accepts OAuth 2.0 (XOAUTH2) only. A tenant admin grants consent once for the IMAP.AccessAsUser.All scope.',
        'IMAP may be disabled per user: Exchange admin center → Recipients → Manage email apps.',
        'Exchange Online throttles heavy writes. Adding threads backfires — the cap is 20 concurrent sessions per mailbox before connections drop.',
        'In-Place Archive is invisible over IMAP. It is separate storage and needs a different tool entirely.',
        'Messages above 35 MB are rejected by default and are listed in the final report.',
      ],
      faq: [
        [
          'Can I migrate 40 mailboxes at once?',
          'Yes — batch mode takes a CSV list of mailboxes, runs each as its own job and produces one consolidated report across all users.',
        ],
        [
          'Do calendars and contacts move?',
          'No. IMAP carries messages and folders only. Export calendars and contacts from Google as ICS and vCard, then import them into Microsoft 365 separately.',
        ],
        [
          'How do I handle the MX cutover?',
          'Move the bulk of the mail before switching MX, then run a second pass afterwards — it copies only what is new, with no duplicates.',
        ],
      ],
    },
    uk: {
      title: 'Міграція з Google Workspace на Microsoft 365 — MoveMailbox',
      description:
        'Перенесення корпоративної пошти з Google Workspace на Microsoft 365 через IMAP. Basic auth вимкнено — потрібен OAuth 2.0 і згода адміністратора.',
      h1: 'Міграція з Google Workspace на Microsoft 365',
      intro:
        'Міграція з Google Workspace на Microsoft 365 — найчастіший корпоративний переїзд і найвимогливіший технічно. Microsoft вимкнув basic authentication, тож потрібен OAuth 2.0.',
      pitfalls: [
        'На боці Microsoft 365 звичайний пароль не працює — лише OAuth 2.0 (XOAUTH2). Адміністратор тенанта один раз надає згоду застосунку з правом IMAP.AccessAsUser.All.',
        'IMAP у користувача може бути вимкнений: Exchange admin center → Отримувачі → Керування поштовими застосунками.',
        'Exchange Online ріже швидкість під час активного запису. Нарощувати потоки марно: ліміт 20 одночасних сесій на скриньку, далі сервер рве з’єднання.',
        'Особистий архів In-Place Archive через IMAP не видно взагалі — це окреме сховище, для нього потрібен інший інструмент.',
        'Листи понад 35 МБ Microsoft за замовчуванням не прийме. Такі потраплять до звіту списком.',
      ],
      faq: [
        [
          'Чи можна перенести 40 скриньок одразу?',
          'Так, для цього є пакетний режим: список скриньок завантажується CSV-файлом, кожна йде окремим завданням, а наприкінці формується зведений звіт за всіма користувачами.',
        ],
        [
          'Чи переїдуть календарі та контакти?',
          'Ні. IMAP працює лише з листами й папками. Календарі та контакти вивантажуються з Google у ICS і vCard та імпортуються в Microsoft 365 окремо.',
        ],
        [
          'Що робити зі зміною MX?',
          'Перенесіть основну масу пошти до перемикання MX, а після перемикання запустіть другий прохід — він докопіює лише нові листи, дублікатів не буде.',
        ],
      ],
    },
  },

  {
    slug: 'microsoft-365-to-gmail',
    source: 'microsoft-365',
    destination: 'gmail',
    tier: 2,
    ru: {
      title: 'Перенос почты с Microsoft 365 на Gmail — MoveMailbox',
      description:
        'Переносим корпоративную почту с Microsoft 365 в Google Workspace по IMAP. OAuth на стороне источника, троттлинг Exchange и лимит квоты Google.',
      h1: 'Перенос почты с Microsoft 365 на Gmail',
      intro:
        'Перенос почты с Microsoft 365 на Gmail требует OAuth на стороне источника: Exchange Online больше не принимает обычный пароль. На стороне Google нужен пароль приложения или тоже OAuth — и запас места в квоте.',
      pitfalls: [
        'Источник Microsoft 365 требует OAuth 2.0. Пароль приложения доступен не во всех тенантах и Microsoft постепенно его сворачивает.',
        'Exchange Online душит чтение при больших объёмах — реальная скорость около 0.5 ГБ в час, и это не настраивается.',
        'Квота Google Workspace общая на почту, Диск и Фото. При переносе 30 ГБ проверьте, что тариф это выдержит.',
        'Conversation History и Notes переносятся как обычные папки, но в Gmail будут выглядеть иначе, чем в Outlook.',
      ],
      faq: [
        [
          'Нужен ли доступ администратора тенанта?',
          'Для одного ящика достаточно прав самого пользователя. Для пакетной миграции нескольких ящиков администратор даёт согласие приложению один раз на весь тенант.',
        ],
        [
          'Сохранятся ли категории Outlook?',
          'Нет. Категории — это свойство Exchange, а не IMAP. Флаги «прочитано» и «отвечено» переносятся, цветные категории — нет.',
        ],
      ],
    },
    en: {
      title: 'Migrate Microsoft 365 to Gmail — MoveMailbox',
      description:
        'Move corporate mail from Microsoft 365 to Google Workspace over IMAP. Source-side OAuth, Exchange throttling and Google storage quota, covered.',
      h1: 'Migrate email from Microsoft 365 to Gmail',
      intro:
        'Migrating Microsoft 365 to Gmail needs OAuth on the source side, because Exchange Online no longer accepts a plain password. On the Google side you need an app password or OAuth as well — plus enough storage quota to land in.',
      pitfalls: [
        'Microsoft 365 as a source requires OAuth 2.0. App passwords exist in some tenants but Microsoft is phasing them out.',
        'Exchange Online throttles bulk reads to roughly 0.5 GB per hour. This is not configurable.',
        'Google Workspace quota is shared across Mail, Drive and Photos. Confirm the plan can hold 30 GB before you start.',
        'Conversation History and Notes move as ordinary folders but will look different in Gmail than they did in Outlook.',
      ],
      faq: [
        [
          'Do I need tenant admin access?',
          'For a single mailbox the user’s own permissions are enough. For a batch migration an admin grants consent once for the whole tenant.',
        ],
        [
          'Do Outlook categories survive?',
          'No. Categories are an Exchange property, not an IMAP one. Read and answered flags transfer; coloured categories do not.',
        ],
      ],
    },
    uk: {
      title: 'Перенесення пошти з Microsoft 365 до Gmail — MoveMailbox',
      description:
        'Переносимо корпоративну пошту з Microsoft 365 до Google Workspace через IMAP. OAuth на джерелі, тротлінг Exchange і квота Google.',
      h1: 'Перенесення пошти з Microsoft 365 до Gmail',
      intro:
        'Перенесення пошти з Microsoft 365 до Gmail потребує OAuth на боці джерела: Exchange Online більше не приймає звичайний пароль.',
      pitfalls: [
        'Джерело Microsoft 365 вимагає OAuth 2.0. Пароль застосунку доступний не в усіх тенантах, і Microsoft поступово його згортає.',
        'Exchange Online душить читання на великих обсягах — реальна швидкість близько 0.5 ГБ на годину, і це не налаштовується.',
        'Квота Google Workspace спільна для пошти, Диска та Фото. Під час перенесення 30 ГБ перевірте, що тариф це витримає.',
        'Conversation History і Notes переносяться як звичайні папки, але в Gmail виглядатимуть інакше, ніж в Outlook.',
      ],
      faq: [
        [
          'Чи потрібен доступ адміністратора тенанта?',
          'Для однієї скриньки достатньо прав самого користувача. Для пакетної міграції кількох скриньок адміністратор один раз надає згоду застосунку на весь тенант.',
        ],
        [
          'Чи збережуться категорії Outlook?',
          'Ні. Категорії — це властивість Exchange, а не IMAP. Прапорці «прочитано» та «відповіли» переносяться, кольорові категорії — ні.',
        ],
      ],
    },
  },

  {
    slug: 'yandex-to-gmail',
    source: 'yandex',
    destination: 'gmail',
    tier: 1,
    ru: {
      title: 'Перенос почты с Яндекса на Gmail — MoveMailbox',
      description:
        'Как перенести письма с Яндекс.Почты на Gmail через IMAP. Пароль приложения в Яндекс ID, включение IMAP и ограничение частоты запросов.',
      h1: 'Перенос почты с Яндекса на Gmail',
      intro:
        'Перенос почты с Яндекса на Gmail требует двух отдельных действий на стороне Яндекса, и пропуск любого из них даёт одну и ту же ошибку авторизации. Именно поэтому люди часами проверяют пароль, хотя дело в выключенном IMAP.',
      pitfalls: [
        'Нужно и включить IMAP (Почта → Настройки → Почтовые программы), и создать пароль приложения (Яндекс ID → Безопасность). Без любого из них — AUTHENTICATIONFAILED.',
        'Логин для обычного ящика — без домена: для anna@yandex.ru это просто anna. Для Яндекс 360 на своём домене — полный адрес.',
        'Яндекс закрывает соединение при частых запросах. Один поток с паузами работает стабильнее пяти параллельных.',
        'Папка «Удалённые» очищается по расписанию сервера — переносить её обычно бессмысленно.',
      ],
      faq: [
        [
          'Почему Яндекс пишет «неверный пароль», хотя пароль верный?',
          'В девяти случаях из десяти не включён IMAP в настройках почты либо используется пароль от аккаунта вместо пароля приложения. Яндекс на обе причины отвечает одинаково.',
        ],
        [
          'Перенесутся ли письма из папки «Спам»?',
          'Только если вы её выберете. По умолчанию спам и корзину имеет смысл исключить — это обычно первые гигабайты объёма и они вам не нужны.',
        ],
      ],
    },
    en: {
      title: 'Migrate Yandex Mail to Gmail — MoveMailbox',
      description:
        'Move email from Yandex Mail to Gmail over IMAP. Yandex ID app passwords, enabling IMAP access and the rate limiting that breaks fast transfers.',
      h1: 'Migrate email from Yandex Mail to Gmail',
      intro:
        'Migrating Yandex Mail to Gmail needs two separate steps on the Yandex side, and skipping either produces the same authentication error. That is why people spend hours re-checking a password when the real problem is that IMAP was never switched on.',
      pitfalls: [
        'You must both enable IMAP in mail settings and create an app password in Yandex ID. Missing either gives AUTHENTICATIONFAILED.',
        'For a standard mailbox the login is the local part only — anna, not anna@yandex.ru. Yandex 360 custom domains use the full address.',
        'Yandex drops connections under frequent requests. One thread with pauses beats five parallel ones.',
        'The Deleted folder is purged on a server schedule, so copying it is usually pointless.',
      ],
      faq: [
        [
          'Why does Yandex reject a correct password?',
          'Nine times out of ten IMAP is not enabled in mail settings, or the account password is being used instead of an app password. Yandex returns the same error for both.',
        ],
        [
          'Does spam move too?',
          'Only if you select it. Excluding Spam and Deleted is usually the right call — they are often the first few gigabytes and you do not need them.',
        ],
      ],
    },
    uk: {
      title: 'Перенесення пошти з Яндекса до Gmail — MoveMailbox',
      description:
        'Як перенести листи з Яндекс.Пошти до Gmail через IMAP. Пароль застосунку в Яндекс ID, увімкнення IMAP та обмеження частоти запитів.',
      h1: 'Перенесення пошти з Яндекса до Gmail',
      intro:
        'Перенесення пошти з Яндекса до Gmail потребує двох окремих дій на боці Яндекса, і пропуск будь-якої з них дає ту саму помилку авторизації.',
      pitfalls: [
        'Потрібно і увімкнути IMAP (Пошта → Налаштування → Поштові програми), і створити пароль застосунку (Яндекс ID → Безпека). Без будь-чого з цього — AUTHENTICATIONFAILED.',
        'Логін для звичайної скриньки — без домену: для anna@yandex.ru це просто anna. Для Яндекс 360 на власному домені — повна адреса.',
        'Яндекс закриває з’єднання за частих запитів. Один потік із паузами працює стабільніше за п’ять паралельних.',
        'Папка «Видалені» очищується за розкладом сервера — переносити її зазвичай немає сенсу.',
      ],
      faq: [
        [
          'Чому Яндекс пише «невірний пароль», хоча пароль правильний?',
          'У дев’яти випадках із десяти не увімкнений IMAP у налаштуваннях пошти або використовується пароль від облікового запису замість пароля застосунку. Яндекс на обидві причини відповідає однаково.',
        ],
        [
          'Чи перенесуться листи з папки «Спам»?',
          'Лише якщо ви її оберете. За замовчуванням спам і кошик має сенс виключити — це зазвичай перші гігабайти обсягу, і вони вам не потрібні.',
        ],
      ],
    },
  },

  {
    slug: 'mailru-to-yandex',
    source: 'mailru',
    destination: 'yandex',
    tier: 2,
    ru: {
      title: 'Перенос почты с Mail.ru на Яндекс — MoveMailbox',
      description:
        'Переносим письма с Mail.ru на Яндекс.Почту по IMAP. Пароль для внешних приложений на обеих сторонах и разные форматы логина.',
      h1: 'Перенос почты с Mail.ru на Яндекс',
      intro:
        'Перенос почты с Mail.ru на Яндекс — маршрут, где пароль приложения нужен с обеих сторон, и форматы логина у провайдеров разные. Это единственная реальная сложность: технически оба сервера ведут себя предсказуемо.',
      pitfalls: [
        'Mail.ru требует «пароль для внешнего приложения» — создаётся в настройках безопасности аккаунта, обычный пароль не подойдёт.',
        'Логин Mail.ru — полный адрес, логин Яндекса для обычного ящика — без домена. Частая причина ошибки авторизации.',
        'У Яндекса нужно отдельно включить IMAP в разделе «Почтовые программы», иначе доступ закрыт даже с верным паролем.',
        'Оба сервиса ограничивают частоту запросов. Перенос идёт папка за папкой, торопить его нельзя.',
      ],
      faq: [
        [
          'Останется ли почта на Mail.ru?',
          'Да, перенос копирует письма и не трогает источник. Старый ящик можно закрыть после сверки папок.',
        ],
        [
          'Сохранятся ли вложенные папки?',
          'Да, вложенность любой глубины переносится как есть, включая папки с кириллическими названиями.',
        ],
      ],
    },
    en: {
      title: 'Migrate Mail.ru to Yandex Mail — MoveMailbox',
      description:
        'Move email from Mail.ru to Yandex Mail over IMAP. App passwords are required on both sides and the two services expect different login formats.',
      h1: 'Migrate email from Mail.ru to Yandex Mail',
      intro:
        'Mail.ru to Yandex is a route where both sides demand an app password and each expects a different login format. That is the only real complication — both servers otherwise behave predictably.',
      pitfalls: [
        'Mail.ru requires an external application password created in account security settings; the normal password is refused.',
        'Mail.ru logins are full addresses, Yandex standard mailboxes use the local part only. This mismatch causes most auth failures.',
        'Yandex needs IMAP switched on separately under mail client settings, or access stays closed even with a valid password.',
        'Both services rate-limit. The transfer proceeds folder by folder and cannot be rushed.',
      ],
      faq: [
        [
          'Does mail stay on Mail.ru?',
          'Yes. The transfer copies and never touches the source. Close the old mailbox once you have compared folder counts.',
        ],
        [
          'Are nested folders preserved?',
          'Yes, nesting of any depth is preserved, including folders with Cyrillic names.',
        ],
      ],
    },
    uk: {
      title: 'Перенесення пошти з Mail.ru до Яндекса — MoveMailbox',
      description:
        'Переносимо листи з Mail.ru до Яндекс.Пошти через IMAP. Пароль застосунку з обох боків і різні формати логіна.',
      h1: 'Перенесення пошти з Mail.ru до Яндекса',
      intro:
        'Перенесення пошти з Mail.ru до Яндекса — маршрут, де пароль застосунку потрібен з обох боків, а формати логіна різні.',
      pitfalls: [
        'Mail.ru вимагає пароль для зовнішнього застосунку — він створюється в налаштуваннях безпеки облікового запису, звичайний пароль не підійде.',
        'Логін Mail.ru — повна адреса, логін Яндекса для звичайної скриньки — без домену. Часта причина помилки авторизації.',
        'У Яндекса потрібно окремо увімкнути IMAP у розділі «Поштові програми», інакше доступ закритий навіть із правильним паролем.',
        'Обидва сервіси обмежують частоту запитів. Перенесення йде папка за папкою, і квапити його не можна.',
      ],
      faq: [
        [
          'Чи залишиться пошта на Mail.ru?',
          'Так, перенесення копіює листи й не чіпає джерело. Стару скриньку можна закрити після звірки папок.',
        ],
        [
          'Чи збережуться вкладені папки?',
          'Так, вкладеність будь-якої глибини переноситься як є, включно з папками з кириличними назвами.',
        ],
      ],
    },
  },

  {
    slug: 'icloud-to-gmail',
    source: 'icloud',
    destination: 'gmail',
    tier: 1,
    ru: {
      title: 'Перенос почты с iCloud на Gmail — MoveMailbox',
      description:
        'Переносим письма с iCloud Mail на Gmail по IMAP. Пароль для приложения Apple обязателен всегда, а логин указывается без домена.',
      h1: 'Перенос почты с iCloud на Gmail',
      intro:
        'Перенос почты с iCloud на Gmail отличается двумя вещами: Apple никогда не принимает обычный пароль Apple ID по IMAP, а логин указывается без домена. Для anna@icloud.com логин — это просто anna.',
      pitfalls: [
        'Пароль для приложения обязателен всегда, даже без двухфакторной аутентификации её придётся сначала включить на appleid.apple.com.',
        'Дефисы в пароле вида abcd-efgh-ijkl-mnop нужно сохранять — Apple их учитывает.',
        'Логин — только часть до собаки. Полный адрес Apple не примет.',
        'Псевдонимы iCloud не имеют собственных ящиков: вся почта лежит в основном аккаунте, отдельно её не перенести.',
        'Лимит одновременных подключений низкий — параллельные потоки Apple рвёт.',
      ],
      faq: [
        [
          'Работает ли перенос для @me.com и @mac.com?',
          'Да, старые адреса Apple используют тот же сервер imap.mail.me.com. Менять настройки не нужно.',
        ],
        [
          'Перенесутся ли письма из псевдонимов?',
          'Да, потому что они и так лежат в основном ящике. Отдельно выбрать почту конкретного псевдонима по IMAP нельзя.',
        ],
      ],
    },
    en: {
      title: 'Migrate iCloud Mail to Gmail — MoveMailbox',
      description:
        'Move iCloud Mail to Gmail over IMAP. Apple always requires an app-specific password, and the login is the part before the @ only.',
      h1: 'Migrate email from iCloud to Gmail',
      intro:
        'iCloud to Gmail differs in two ways: Apple never accepts a plain Apple ID password over IMAP, and the username is the local part only. For anna@icloud.com the login is simply anna.',
      pitfalls: [
        'An app-specific password is always required. If two-factor authentication is off, you must enable it first at appleid.apple.com.',
        'Keep the hyphens in passwords shaped like abcd-efgh-ijkl-mnop — Apple counts them.',
        'The login is the local part only; a full address is rejected.',
        'iCloud aliases have no separate mailbox — all mail sits in the primary account and cannot be migrated separately.',
        'Concurrent connection limits are low, so parallel threads get dropped.',
      ],
      faq: [
        [
          'Does this work for @me.com and @mac.com?',
          'Yes. Legacy Apple addresses use the same imap.mail.me.com server, no settings change needed.',
        ],
        [
          'What happens to alias mail?',
          'It moves, because it already lives in the primary mailbox. Selecting a single alias over IMAP is not possible.',
        ],
      ],
    },
    uk: {
      title: 'Перенесення пошти з iCloud до Gmail — MoveMailbox',
      description:
        'Переносимо листи з iCloud Mail до Gmail через IMAP. Пароль для застосунку Apple обов’язковий завжди, логін — без домену.',
      h1: 'Перенесення пошти з iCloud до Gmail',
      intro:
        'Перенесення пошти з iCloud до Gmail має дві особливості: Apple ніколи не приймає звичайний пароль Apple ID, а логін вказується без домену.',
      pitfalls: [
        'Пароль для застосунку обов’язковий завжди; без двофакторної автентифікації її доведеться спершу увімкнути на appleid.apple.com.',
        'Дефіси в паролі вигляду abcd-efgh-ijkl-mnop потрібно зберігати — Apple їх враховує.',
        'Логін — лише частина до равлика. Повну адресу Apple не прийме.',
        'Псевдоніми iCloud не мають власних скриньок: уся пошта лежить в основному обліковому записі, окремо її не перенести.',
        'Ліміт одночасних підключень низький — паралельні потоки Apple рве.',
      ],
      faq: [
        [
          'Чи працює перенесення для @me.com і @mac.com?',
          'Так, старі адреси Apple використовують той самий сервер imap.mail.me.com. Змінювати налаштування не потрібно.',
        ],
        [
          'Чи перенесуться листи з псевдонімів?',
          'Так, бо вони й так лежать в основній скриньці. Окремо обрати пошту конкретного псевдоніма через IMAP не можна.',
        ],
      ],
    },
  },

  {
    slug: 'yahoo-to-gmail',
    source: 'yahoo',
    destination: 'gmail',
    tier: 2,
    ru: {
      title: 'Перенос почты с Yahoo на Gmail — MoveMailbox',
      description:
        'Переносим письма с Yahoo Mail на Gmail по IMAP. Пароль приложения Yahoo, папка Bulk Mail вместо Спама и сохранение вложенных папок.',
      h1: 'Перенос почты с Yahoo на Gmail',
      intro:
        'Перенос почты с Yahoo на Gmail — один из самых простых маршрутов. Yahoo давно требует пароль приложения для сторонних клиентов, и это единственная настройка, которую нужно сделать заранее.',
      pitfalls: [
        'Yahoo не принимает пароль аккаунта: нужен пароль приложения из раздела безопасности учётной записи.',
        'Спам у Yahoo называется Bulk Mail — при ручном сопоставлении папок это часто упускают.',
        'Неактивные ящики Yahoo может отключить: если аккаунтом не пользовались год, сначала войдите через веб-интерфейс.',
      ],
      faq: [
        [
          'Сохранятся ли даты писем?',
          'Да, дата получения переносится вместе с письмом. Архив не станет «сегодняшним» — порядок сортировки в Gmail останется прежним.',
        ],
      ],
    },
    en: {
      title: 'Migrate Yahoo Mail to Gmail — MoveMailbox',
      description:
        'Move Yahoo Mail to Gmail over IMAP. Yahoo app passwords, the Bulk Mail folder instead of Spam, and nested folders preserved as they are.',
      h1: 'Migrate email from Yahoo Mail to Gmail',
      intro:
        'Yahoo to Gmail is one of the simplest routes. Yahoo has required app passwords for third-party clients for years, and that is the single setting you need to prepare in advance.',
      pitfalls: [
        'Yahoo rejects account passwords — generate an app password in account security settings.',
        'Yahoo calls its spam folder Bulk Mail, which is easy to miss when mapping folders by hand.',
        'Dormant Yahoo mailboxes get disabled. If the account has been idle for a year, sign in via the web first.',
      ],
      faq: [
        [
          'Are message dates preserved?',
          'Yes, the received date moves with each message. Your archive will not appear as if it all arrived today.',
        ],
      ],
    },
    uk: {
      title: 'Перенесення пошти з Yahoo до Gmail — MoveMailbox',
      description:
        'Переносимо листи з Yahoo Mail до Gmail через IMAP. Пароль застосунку Yahoo та папка Bulk Mail замість Спаму.',
      h1: 'Перенесення пошти з Yahoo до Gmail',
      intro:
        'Перенесення пошти з Yahoo до Gmail — один із найпростіших маршрутів. Yahoo давно вимагає пароль застосунку для сторонніх клієнтів.',
      pitfalls: [
        'Yahoo не приймає пароль облікового запису: потрібен пароль застосунку з розділу безпеки облікового запису.',
        'Спам у Yahoo називається Bulk Mail — під час ручного зіставлення папок це часто пропускають.',
        'Неактивні скриньки Yahoo може вимкнути: якщо обліковим записом не користувалися рік, спершу увійдіть через вебінтерфейс.',
      ],
      faq: [
        [
          'Чи збережуться дати листів?',
          'Так, дата отримання переноситься разом із листом. Архів не стане «сьогоднішнім» — порядок сортування в Gmail залишиться тим самим.',
        ],
      ],
    },
  },

  {
    slug: 'cpanel-to-microsoft-365',
    source: 'cpanel',
    destination: 'microsoft-365',
    tier: 1,
    ru: {
      title: 'Перенос почты с хостинга на Microsoft 365 — MoveMailbox',
      description:
        'Переносим почту с cPanel-хостинга на Microsoft 365 по IMAP. Самоподписанные сертификаты, подключение по IP и правильный порядок смены MX.',
      h1: 'Перенос почты с cPanel на Microsoft 365',
      intro:
        'Перенос почты с хостинга на Microsoft 365 — типовой корпоративный переезд, и ломается он почти всегда на двух вещах: сертификате shared-хостинга и порядке действий вокруг смены MX-записи.',
      pitfalls: [
        'На shared-хостинге сертификат выписан на имя сервера вроде srv142.hoster.net, а вы подключаетесь по mail.вашдомен.ru. Включите приём непроверенного сертификата или подключайтесь по имени из сертификата.',
        'Если mail.домен уже указывает на новый сервер, подключайтесь к старому по IP-адресу — поле хоста это принимает.',
        'Microsoft 365 требует OAuth 2.0 на стороне назначения: администратор тенанта даёт согласие один раз.',
        'Разделитель папок: Dovecot использует слэш, старые Courier-серверы — точку. Без сопоставления INBOX.Sent станет отдельной папкой вместо вложенной.',
        'Проверьте квоту ящика в Microsoft 365 до запуска: перенос встанет ровно в тот момент, когда место кончится.',
      ],
      faq: [
        [
          'В каком порядке менять MX и переносить почту?',
          'Сначала перенесите основную массу писем при работающем старом сервере, затем переключите MX, а через сутки запустите второй проход — он докопирует письма, пришедшие в переходный период.',
        ],
        [
          'Что делать с автоответчиками и фильтрами?',
          'Они не переносятся по IMAP — это конфигурация сервера, а не письма. Sieve-фильтры и автоответы придётся создать в Microsoft 365 заново.',
        ],
        [
          'Можно ли перенести все ящики домена сразу?',
          'Да, пакетным режимом: список ящиков с логинами загружается CSV-файлом, в конце формируется сводный отчёт по всем.',
        ],
      ],
    },
    en: {
      title: 'Migrate cPanel email to Microsoft 365 — MoveMailbox',
      description:
        'Move mail from cPanel hosting to Microsoft 365 over IMAP. Self-signed certificates, connecting by IP address and the right MX cutover order.',
      h1: 'Migrate email from cPanel to Microsoft 365',
      intro:
        'Moving email from hosting to Microsoft 365 is the standard corporate migration, and it almost always breaks on two things: the shared host’s certificate, and the order of operations around the MX cutover.',
      pitfalls: [
        'Shared hosting certificates are issued for the server name, not your domain. Accept the unverified certificate or connect using the name on the certificate.',
        'If mail.yourdomain already points at the new server, connect to the old one by IP address — the host field accepts it.',
        'Microsoft 365 requires OAuth 2.0 on the destination; a tenant admin consents once.',
        'Folder separators differ: Dovecot uses a slash, legacy Courier uses a dot. Without mapping, INBOX.Sent becomes a top-level folder.',
        'Check the destination mailbox quota first — the transfer stops the moment space runs out.',
      ],
      faq: [
        [
          'What order should I migrate and change MX in?',
          'Move the bulk of the mail while the old server still works, switch MX, then run a second pass a day later to pick up anything that arrived during the transition.',
        ],
        [
          'What about autoresponders and filters?',
          'They do not travel over IMAP — they are server configuration, not messages. Sieve rules and vacation replies must be recreated in Microsoft 365.',
        ],
        [
          'Can I migrate every mailbox on the domain at once?',
          'Yes, via batch mode: upload a CSV of mailboxes and logins, and get one consolidated report at the end.',
        ],
      ],
    },
    uk: {
      title: 'Перенесення пошти з хостингу на Microsoft 365 — MoveMailbox',
      description:
        'Переносимо пошту з cPanel-хостингу на Microsoft 365 через IMAP. Самопідписані сертифікати, підключення за IP та порядок зміни MX.',
      h1: 'Перенесення пошти з cPanel на Microsoft 365',
      intro:
        'Перенесення пошти з хостингу на Microsoft 365 ламається майже завжди на двох речах: сертифікаті shared-хостингу та порядку дій навколо зміни MX-запису.',
      pitfalls: [
        'На shared-хостингу сертифікат виписаний на ім’я сервера на кшталт srv142.hoster.net, а ви підключаєтеся за mail.вашдомен. Увімкніть приймання неперевіреного сертифіката або підключайтеся за іменем із сертифіката.',
        'Якщо mail.домен уже вказує на новий сервер, підключайтеся до старого за IP-адресою — поле хоста це приймає.',
        'Microsoft 365 вимагає OAuth 2.0 на боці призначення: адміністратор тенанта надає згоду один раз.',
        'Роздільник папок: Dovecot використовує слеш, старі сервери Courier — крапку. Без зіставлення INBOX.Sent стане окремою папкою замість вкладеної.',
        'Перевірте квоту скриньки в Microsoft 365 до запуску: перенесення стане рівно тієї миті, коли місце закінчиться.',
      ],
      faq: [
        [
          'У якому порядку змінювати MX і переносити пошту?',
          'Спершу перенесіть основну масу листів, поки працює старий сервер, потім перемкніть MX, а через добу запустіть другий прохід — він докопіює листи, що надійшли в перехідний період.',
        ],
        [
          'Що робити з автовідповідачами та фільтрами?',
          'Вони не переносяться через IMAP — це конфігурація сервера, а не листи. Sieve-фільтри та автовідповіді доведеться створити в Microsoft 365 наново.',
        ],
        [
          'Чи можна перенести всі скриньки домену одразу?',
          'Так, пакетним режимом: список скриньок із логінами завантажується CSV-файлом, наприкінці формується зведений звіт за всіма.',
        ],
      ],
    },
  },

  {
    slug: 'hosting-to-hosting',
    source: 'cpanel',
    destination: 'cpanel',
    tier: 1,
    ru: {
      title: 'Перенос почты с одного хостинга на другой — MoveMailbox',
      description:
        'Как перенести почту при смене хостинга без потери писем. Подключение по IP, порядок смены MX, TTL и второй проход после переключения.',
      h1: 'Перенос почты с одного хостинга на другой',
      intro:
        'Перенос почты с одного хостинга на другой технически самый простой случай — вы контролируете обе стороны. Вся сложность в другом: в какой момент переключать MX-запись, чтобы не потерять письма переходного периода.',
      pitfalls: [
        'Понизьте TTL MX-записи за сутки до переключения — иначе часть отправителей будет слать письма на старый сервер ещё двое суток.',
        'Логин почти всегда полный адрес: anna@домен.ru, а не anna.',
        'Если mail.домен уже переехал, подключайтесь к старому серверу по IP-адресу.',
        'Самоподписанный или чужой сертификат — норма для shared-хостинга: включите приём непроверенного сертификата.',
        'Переносить лучше при остановленном доступе пользователей, иначе новые письма падают в оба ящика одновременно.',
      ],
      faq: [
        [
          'Как не потерять письма при переезде?',
          'Порядок такой: понизить TTL, перенести основную массу почты, переключить MX, через сутки запустить повторный проход. Второй запуск копирует только новое, дублей не создаёт.',
        ],
        [
          'Сколько времени занимает перенос между хостингами?',
          'Здесь нет лимитов провайдера, скорость упирается в канал: около 4–5 ГБ в час. Ящик на 10 ГБ переезжает примерно за два часа.',
        ],
        [
          'Переносятся ли настройки ящиков?',
          'Нет. IMAP переносит письма и папки. Пароли, алиасы, пересылки, автоответы и фильтры настраиваются на новом хостинге заново.',
        ],
      ],
    },
    en: {
      title: 'Migrate email between hosting providers — MoveMailbox',
      description:
        'How to move mail when changing hosting without losing messages. Connecting by IP, MX cutover order, TTL, and the second pass afterwards.',
      h1: 'Migrate email from one hosting provider to another',
      intro:
        'Host to host is technically the easiest migration — you control both ends. The difficulty is elsewhere: choosing the moment to switch the MX record so that nothing arriving during the transition is lost.',
      pitfalls: [
        'Lower the MX TTL a day before the cutover, or some senders will keep delivering to the old server for another two days.',
        'The login is almost always the full address: anna@domain.com, not anna.',
        'If mail.domain has already moved, connect to the old server by IP address.',
        'A self-signed or mismatched certificate is normal on shared hosting — enable accepting unverified certificates.',
        'Migrate with user access paused, otherwise new mail lands in both mailboxes at once.',
      ],
      faq: [
        [
          'How do I avoid losing mail during the move?',
          'Lower the TTL, move the bulk of the mail, switch MX, then run a second pass a day later. The repeat run copies only what is new and never duplicates.',
        ],
        [
          'How long does a host-to-host migration take?',
          'There are no provider caps here, so bandwidth is the limit: about 4–5 GB per hour. A 10 GB mailbox takes roughly two hours.',
        ],
        [
          'Do mailbox settings move too?',
          'No. IMAP carries messages and folders. Passwords, aliases, forwarders, autoresponders and filters are configured again on the new host.',
        ],
      ],
    },
    uk: {
      title: 'Перенесення пошти з одного хостингу на інший — MoveMailbox',
      description:
        'Як перенести пошту під час зміни хостингу без втрати листів. Підключення за IP, порядок зміни MX, TTL і другий прохід.',
      h1: 'Перенесення пошти з одного хостингу на інший',
      intro:
        'Перенесення пошти між хостингами технічно найпростіше — ви контролюєте обидві сторони. Складність в іншому: коли саме перемикати MX-запис.',
      pitfalls: [
        'Знизьте TTL MX-запису за добу до перемикання — інакше частина відправників ще дві доби слатиме листи на старий сервер.',
        'Логін майже завжди повна адреса: anna@домен, а не anna.',
        'Якщо mail.домен уже переїхав, підключайтеся до старого сервера за IP-адресою.',
        'Самопідписаний або чужий сертифікат — норма для shared-хостингу: увімкніть приймання неперевіреного сертифіката.',
        'Переносити краще із зупиненим доступом користувачів, інакше нові листи падають в обидві скриньки одночасно.',
      ],
      faq: [
        [
          'Як не втратити листи під час переїзду?',
          'Порядок такий: знизити TTL, перенести основну масу пошти, перемкнути MX, через добу запустити повторний прохід. Другий запуск копіює лише нове й дублікатів не створює.',
        ],
        [
          'Скільки часу займає перенесення між хостингами?',
          'Тут немає лімітів провайдера, швидкість упирається в канал: близько 4–5 ГБ на годину. Скринька на 10 ГБ переїжджає приблизно за дві години.',
        ],
        [
          'Чи переносяться налаштування скриньок?',
          'Ні. IMAP переносить листи й папки. Паролі, аліаси, пересилання, автовідповіді та фільтри налаштовуються на новому хостингу наново.',
        ],
      ],
    },
  },

  {
    slug: 'yandex-to-microsoft-365',
    source: 'yandex',
    destination: 'microsoft-365',
    tier: 2,
    ru: {
      title: 'Перенос почты с Яндекс 360 на Microsoft 365 — MoveMailbox',
      description:
        'Миграция корпоративной почты с Яндекс 360 на Microsoft 365 по IMAP. Пароли приложений у источника и OAuth на стороне Microsoft.',
      h1: 'Перенос почты с Яндекс 360 на Microsoft 365',
      intro:
        'Перенос почты с Яндекс 360 на Microsoft 365 сочетает требования обоих провайдеров: у Яндекса нужны пароли приложений и включённый IMAP для каждого пользователя, у Microsoft — согласие администратора на OAuth.',
      pitfalls: [
        'В Яндекс 360 администратор организации может запретить IMAP на уровне всей компании — проверьте до начала.',
        'Логин в Яндекс 360 на своём домене — полный адрес, в отличие от обычных ящиков Яндекса.',
        'Microsoft 365 не примет пароль: нужен OAuth 2.0 с согласием администратора тенанта.',
        'Пакетную миграцию удобнее делать через CSV — по одной строке на пользователя.',
      ],
      faq: [
        [
          'Нужно ли создавать пароль приложения для каждого сотрудника?',
          'Да, если работать через пароли приложений — их создаёт каждый пользователь в своём Яндекс ID. Альтернатива для больших организаций — OAuth на стороне Яндекса.',
        ],
      ],
    },
    en: {
      title: 'Migrate Yandex 360 to Microsoft 365 — MoveMailbox',
      description:
        'Corporate mail migration from Yandex 360 to Microsoft 365 over IMAP. Source-side app passwords and Microsoft OAuth admin consent explained.',
      h1: 'Migrate email from Yandex 360 to Microsoft 365',
      intro:
        'Yandex 360 to Microsoft 365 combines the requirements of both providers: Yandex needs app passwords and IMAP enabled per user, Microsoft needs tenant admin consent for OAuth.',
      pitfalls: [
        'A Yandex 360 organisation admin can disable IMAP company-wide. Check before you start.',
        'Yandex 360 custom-domain logins are full addresses, unlike standard Yandex mailboxes.',
        'Microsoft 365 will not accept a password — OAuth 2.0 with tenant admin consent is required.',
        'Batch migrations are easier via CSV, one row per user.',
      ],
      faq: [
        [
          'Does every employee need their own app password?',
          'Yes, if you use app passwords — each user creates one in their Yandex ID. For larger organisations OAuth on the Yandex side is the alternative.',
        ],
      ],
    },
    uk: {
      title: 'Перенесення пошти з Яндекс 360 на Microsoft 365 — MoveMailbox',
      description:
        'Міграція корпоративної пошти з Яндекс 360 на Microsoft 365 через IMAP. Паролі застосунків у джерела та OAuth на боці Microsoft.',
      h1: 'Перенесення пошти з Яндекс 360 на Microsoft 365',
      intro:
        'Перенесення з Яндекс 360 на Microsoft 365 поєднує вимоги обох провайдерів: паролі застосунків у Яндекса та згоду адміністратора на OAuth у Microsoft.',
      pitfalls: [
        'У Яндекс 360 адміністратор організації може заборонити IMAP на рівні всієї компанії — перевірте до початку.',
        'Логін у Яндекс 360 на власному домені — повна адреса, на відміну від звичайних скриньок Яндекса.',
        'Microsoft 365 не прийме пароль: потрібен OAuth 2.0 зі згодою адміністратора тенанта.',
        'Пакетну міграцію зручніше робити через CSV — по одному рядку на користувача.',
      ],
      faq: [
        [
          'Чи потрібно створювати пароль застосунку для кожного співробітника?',
          'Так, якщо працювати через паролі застосунків — їх створює кожен користувач у своєму Яндекс ID. Альтернатива для великих організацій — OAuth на боці Яндекса.',
        ],
      ],
    },
  },

  {
    slug: 'cpanel-to-gmail',
    source: 'cpanel',
    destination: 'gmail',
    tier: 2,
    ru: {
      title: 'Перенос почты с хостинга на Gmail — MoveMailbox',
      description:
        'Переносим почту с cPanel-хостинга в Gmail или Google Workspace по IMAP. Сертификаты shared-хостинга, подключение по IP и квота Google.',
      h1: 'Перенос почты с cPanel на Gmail',
      intro:
        'Перенос почты с хостинга в Gmail часто делают при переходе на Google Workspace. На стороне хостинга главная проблема — сертификат, на стороне Google — пароль приложения и общая квота с Диском.',
      pitfalls: [
        'Сертификат shared-хостинга обычно выписан на имя сервера: включите приём непроверенного сертификата.',
        'Логин на cPanel — полный адрес почтового ящика.',
        'Квота Gmail общая с Google Диском и Фото. Проверьте свободное место до переноса большого архива.',
        'Для Gmail нужен пароль приложения, а IMAP включается отдельно в настройках почты.',
      ],
      faq: [
        [
          'Можно ли перенести почту, если домен уже переехал?',
          'Да. Укажите старый сервер по IP-адресу — поле хоста принимает и имя, и IP.',
        ],
      ],
    },
    en: {
      title: 'Migrate cPanel email to Gmail — MoveMailbox',
      description:
        'Move mail from cPanel hosting into Gmail or Google Workspace over IMAP. Shared-host certificates, connecting by IP, and shared Google quota.',
      h1: 'Migrate email from cPanel to Gmail',
      intro:
        'Hosting to Gmail is a common move when a company adopts Google Workspace. On the hosting side the certificate is the usual blocker; on the Google side it is app passwords and storage shared with Drive.',
      pitfalls: [
        'Shared hosting certificates are normally issued for the server name — enable accepting unverified certificates.',
        'cPanel logins are the full mailbox address.',
        'Gmail storage is shared with Drive and Photos. Check free space before moving a large archive.',
        'Gmail needs an app password, and IMAP must be enabled separately in mail settings.',
      ],
      faq: [
        [
          'Can I migrate if the domain has already moved?',
          'Yes. Point the source at the old server by IP address — the host field accepts both names and IPs.',
        ],
      ],
    },
    uk: {
      title: 'Перенесення пошти з хостингу до Gmail — MoveMailbox',
      description:
        'Переносимо пошту з cPanel-хостингу до Gmail або Google Workspace через IMAP. Сертифікати, підключення за IP та квота Google.',
      h1: 'Перенесення пошти з cPanel до Gmail',
      intro:
        'Перенесення пошти з хостингу до Gmail часто роблять під час переходу на Google Workspace. Головна проблема — сертифікат shared-хостингу.',
      pitfalls: [
        'Сертифікат shared-хостингу зазвичай виписаний на ім’я сервера: увімкніть приймання неперевіреного сертифіката.',
        'Логін на cPanel — повна адреса поштової скриньки.',
        'Квота Gmail спільна з Google Диском і Фото. Перевірте вільне місце до перенесення великого архіву.',
        'Для Gmail потрібен пароль застосунку, а IMAP вмикається окремо в налаштуваннях пошти.',
      ],
      faq: [
        [
          'Чи можна перенести пошту, якщо домен уже переїхав?',
          'Так. Вкажіть старий сервер за IP-адресою — поле хоста приймає і ім’я, і IP.',
        ],
      ],
    },
  },

  {
    slug: 'zoho-to-microsoft-365',
    source: 'zoho',
    destination: 'microsoft-365',
    tier: 2,
    ru: {
      title: 'Перенос почты с Zoho на Microsoft 365 — MoveMailbox',
      description:
        'Миграция с Zoho Mail на Microsoft 365 по IMAP. Региональные датацентры Zoho, пароли приложений и OAuth на стороне Microsoft.',
      h1: 'Перенос почты с Zoho Mail на Microsoft 365',
      intro:
        'Перенос почты с Zoho на Microsoft 365 спотыкается на неочевидном: у Zoho несколько региональных датацентров, и ящик из европейского не отвечает на американском хосте. Ошибка при этом выглядит как неверный пароль.',
      pitfalls: [
        'Выберите правильный регион: imap.zoho.com для США, imap.zoho.eu для Европы, imap.zoho.in для Индии. Неверный хост даёт ошибку авторизации, а не соединения.',
        'На бесплатном тарифе Zoho доступ по IMAP может быть закрыт: авторизация проходит, а папки пустые.',
        'Zoho требует включить IMAP Access в настройках почты и создать пароль приложения.',
        'Microsoft 365 на приёме требует OAuth 2.0 с согласием администратора.',
      ],
      faq: [
        [
          'Почему Zoho говорит «неверный пароль» при правильном пароле?',
          'Скорее всего выбран не тот региональный сервер. Ящик, созданный в EU-датацентре, на US-хосте не авторизуется, и ошибка выглядит одинаково.',
        ],
      ],
    },
    en: {
      title: 'Migrate Zoho Mail to Microsoft 365 — MoveMailbox',
      description:
        'Move Zoho Mail to Microsoft 365 over IMAP. Zoho regional data centres, app passwords and Microsoft OAuth consent, all in one guide.',
      h1: 'Migrate email from Zoho Mail to Microsoft 365',
      intro:
        'Zoho to Microsoft 365 trips on something non-obvious: Zoho runs several regional data centres, and a mailbox created in the EU will not authenticate against the US host. The error looks exactly like a wrong password.',
      pitfalls: [
        'Pick the right region: imap.zoho.com for the US, imap.zoho.eu for Europe, imap.zoho.in for India. The wrong host returns an auth error, not a connection error.',
        'On Zoho free plans IMAP may be restricted — authentication succeeds but folders come back empty.',
        'Zoho requires IMAP Access enabled in mail settings plus an app password.',
        'Microsoft 365 on the receiving side requires OAuth 2.0 with admin consent.',
      ],
      faq: [
        [
          'Why does Zoho reject a correct password?',
          'Most likely the wrong regional server. A mailbox created in the EU data centre will not authenticate on the US host, and the error is identical.',
        ],
      ],
    },
    uk: {
      title: 'Перенесення пошти з Zoho на Microsoft 365 — MoveMailbox',
      description:
        'Міграція з Zoho Mail на Microsoft 365 через IMAP. Регіональні дата-центри Zoho, паролі застосунків та OAuth у Microsoft.',
      h1: 'Перенесення пошти з Zoho Mail на Microsoft 365',
      intro:
        'Перенесення з Zoho на Microsoft 365 спотикається на неочевидному: скринька з європейського дата-центру не відповідає на американському хості.',
      pitfalls: [
        'Оберіть правильний регіон: imap.zoho.com для США, imap.zoho.eu для Європи, imap.zoho.in для Індії. Невірний хост дає помилку авторизації, а не з’єднання.',
        'На безкоштовному тарифі Zoho доступ через IMAP може бути закритий: авторизація проходить, а папки порожні.',
        'Zoho вимагає увімкнути IMAP Access у налаштуваннях пошти та створити пароль застосунку.',
        'Microsoft 365 на прийомі вимагає OAuth 2.0 зі згодою адміністратора.',
      ],
      faq: [
        [
          'Чому Zoho каже «невірний пароль» за правильного пароля?',
          'Найімовірніше обрано не той регіональний сервер. Скринька, створена в EU-дата-центрі, на US-хості не авторизується, і помилка виглядає однаково.',
        ],
      ],
    },
  },

  {
    slug: 'exchange-to-google-workspace',
    source: 'exchange',
    destination: 'google-workspace',
    tier: 2,
    ru: {
      title: 'Миграция с Exchange на Google Workspace — MoveMailbox',
      description:
        'Переносим почту с локального Exchange Server на Google Workspace по IMAP. Включение IMAP в Exchange, сертификаты и что не переносится.',
      h1: 'Миграция с Exchange на Google Workspace',
      intro:
        'Миграция с локального Exchange на Google Workspace выполняется по IMAP, и это накладывает ограничение: переедут письма и папки, но не календари, задачи и публичные папки — они живут вне протокола.',
      pitfalls: [
        'IMAP в Exchange Server по умолчанию выключен: службу Microsoft Exchange IMAP4 нужно запустить и настроить.',
        'Сертификат внутреннего Exchange часто выписан на внутреннее имя — включите приём непроверенного сертификата.',
        'Публичные папки по IMAP недоступны — для них нужен отдельный инструмент миграции.',
        'Календари, задачи и контакты выгружаются отдельно и импортируются в Google вручную.',
        'Квота Google Workspace общая с Диском: считайте суммарный объём заранее.',
      ],
      faq: [
        [
          'Переедут ли публичные папки Exchange?',
          'Нет. Публичные папки — это не пользовательские IMAP-ящики, доступа к ним по протоколу нет. Их переносят отдельными инструментами Microsoft или экспортом в PST.',
        ],
        [
          'Как перенести сотню ящиков?',
          'Через CSV-пакет: одна строка на пользователя, задачи идут очередью, в конце сводный отчёт с количеством писем по каждому ящику.',
        ],
      ],
    },
    en: {
      title: 'Migrate Exchange to Google Workspace — MoveMailbox',
      description:
        'Move mail from on-premise Exchange Server to Google Workspace over IMAP. Enabling IMAP4, certificates, and what the protocol cannot carry.',
      h1: 'Migrate Exchange Server to Google Workspace',
      intro:
        'On-premise Exchange to Google Workspace runs over IMAP, which sets the boundary up front: messages and folders move, calendars, tasks and public folders do not — they live outside the protocol.',
      pitfalls: [
        'IMAP is disabled by default on Exchange Server; the Microsoft Exchange IMAP4 service must be started and configured.',
        'Internal Exchange certificates are often issued for an internal name — enable accepting unverified certificates.',
        'Public folders are not reachable over IMAP and need a dedicated migration tool.',
        'Calendars, tasks and contacts export separately and import into Google by hand.',
        'Google Workspace quota is shared with Drive — total the volume in advance.',
      ],
      faq: [
        [
          'Do Exchange public folders migrate?',
          'No. Public folders are not user IMAP mailboxes and the protocol cannot reach them. Use Microsoft tooling or a PST export instead.',
        ],
        [
          'How do I move a hundred mailboxes?',
          'With a CSV batch: one row per user, jobs run through a queue, and you get a consolidated report with per-mailbox message counts.',
        ],
      ],
    },
    uk: {
      title: 'Міграція з Exchange на Google Workspace — MoveMailbox',
      description:
        'Переносимо пошту з локального Exchange Server на Google Workspace через IMAP. Увімкнення IMAP4, сертифікати та обмеження протоколу.',
      h1: 'Міграція з Exchange на Google Workspace',
      intro:
        'Міграція з локального Exchange на Google Workspace виконується через IMAP: переїдуть листи й папки, але не календарі, завдання та публічні папки.',
      pitfalls: [
        'IMAP в Exchange Server за замовчуванням вимкнений: службу Microsoft Exchange IMAP4 потрібно запустити й налаштувати.',
        'Сертифікат внутрішнього Exchange часто виписаний на внутрішнє ім’я — увімкніть приймання неперевіреного сертифіката.',
        'Публічні папки через IMAP недоступні — для них потрібен окремий інструмент міграції.',
        'Календарі, завдання та контакти вивантажуються окремо й імпортуються в Google вручну.',
        'Квота Google Workspace спільна з Диском: рахуйте сумарний обсяг заздалегідь.',
      ],
      faq: [
        [
          'Чи переїдуть публічні папки Exchange?',
          'Ні. Публічні папки — це не користувацькі IMAP-скриньки, доступу до них через протокол немає. Їх переносять окремими інструментами Microsoft або експортом у PST.',
        ],
        [
          'Як перенести сотню скриньок?',
          'Через CSV-пакет: один рядок на користувача, завдання йдуть чергою, наприкінці — зведений звіт із кількістю листів за кожною скринькою.',
        ],
      ],
    },
  },

  {
    slug: 'gmail-to-yandex',
    source: 'gmail',
    destination: 'yandex',
    tier: 2,
    ru: {
      title: 'Перенос почты с Gmail на Яндекс — MoveMailbox',
      description:
        'Переносим письма с Gmail на Яндекс.Почту по IMAP. Ловушка ярлыка «Вся почта», пароли приложений с обеих сторон и лимиты обоих провайдеров.',
      h1: 'Перенос почты с Gmail на Яндекс',
      intro:
        'Перенос почты с Gmail на Яндекс требует настройки на обеих сторонах: у Gmail — включённый IMAP и пароль приложения, у Яндекса — то же самое плюс правильный формат логина без домена.',
      pitfalls: [
        'Исключите [Gmail]/All Mail, иначе каждое письмо приедет дважды и объём удвоится.',
        'Логин Яндекса для обычного ящика — без домена, логин Gmail — полный адрес. Разные форматы на одной странице путают чаще всего.',
        'Gmail отдаёт около 2.5 ГБ в сутки, Яндекс ограничивает частоту запросов. Большой архив едет несколько дней.',
        'Пароль приложения нужен и там, и там.',
      ],
      faq: [
        [
          'Сохранятся ли вложенные ярлыки Gmail?',
          'Да, вложенные ярлыки вида Работа/Клиенты станут вложенными папками в Яндексе. Структура сохраняется.',
        ],
      ],
    },
    en: {
      title: 'Migrate Gmail to Yandex Mail — MoveMailbox',
      description:
        'Move Gmail messages to Yandex Mail over IMAP. The All Mail duplication trap, app passwords on both sides and each provider’s rate limits.',
      h1: 'Migrate email from Gmail to Yandex Mail',
      intro:
        'Gmail to Yandex needs setup on both ends: Gmail wants IMAP enabled and an app password, Yandex wants the same plus a login without the domain part.',
      pitfalls: [
        'Exclude [Gmail]/All Mail or every message arrives twice and the volume doubles.',
        'Yandex standard mailboxes use the local part as login, Gmail uses the full address. Mixing them up is the most common mistake here.',
        'Gmail serves about 2.5 GB per day, Yandex rate-limits requests. A large archive takes several days.',
        'App passwords are required on both sides.',
      ],
      faq: [
        [
          'Do nested Gmail labels survive?',
          'Yes — nested labels such as Work/Clients become nested folders in Yandex. The structure is preserved.',
        ],
      ],
    },
    uk: {
      title: 'Перенесення пошти з Gmail до Яндекса — MoveMailbox',
      description:
        'Переносимо листи з Gmail до Яндекс.Пошти через IMAP. Пастка ярлика «Вся пошта» та паролі застосунків з обох боків.',
      h1: 'Перенесення пошти з Gmail до Яндекса',
      intro:
        'Перенесення пошти з Gmail до Яндекса потребує налаштування з обох боків: пароль застосунку та правильний формат логіна.',
      pitfalls: [
        'Виключіть [Gmail]/All Mail, інакше кожен лист приїде двічі й обсяг подвоїться.',
        'Логін Яндекса для звичайної скриньки — без домену, логін Gmail — повна адреса. Різні формати на одній сторінці плутають найчастіше.',
        'Gmail віддає близько 2.5 ГБ на добу, Яндекс обмежує частоту запитів. Великий архів їде кілька днів.',
        'Пароль застосунку потрібен і там, і там.',
      ],
      faq: [
        [
          'Чи збережуться вкладені ярлики Gmail?',
          'Так, вкладені ярлики на кшталт Робота/Клієнти стануть вкладеними папками в Яндексі. Структура зберігається.',
        ],
      ],
    },
  },

  {
    slug: 'gmail-to-zoho',
    source: 'gmail',
    destination: 'zoho',
    tier: 2,
    ru: {
      title: 'Перенос почты с Gmail на Zoho Mail — MoveMailbox',
      description:
        'Переносим почту с Gmail на Zoho Mail по IMAP. Частый маршрут при уходе с платного Google Workspace: региональные хосты Zoho и ярлык «Вся почта».',
      h1: 'Перенос почты с Gmail на Zoho Mail',
      intro:
        'Перенос почты с Gmail на Zoho чаще всего делают компании, уходящие с платного Google Workspace. Технически маршрут простой, но у Zoho есть особенность: региональные датацентры, и хост нужно выбрать правильный.',
      pitfalls: [
        'Хост Zoho зависит от региона: com, eu или in. Ошибка выглядит как неверный пароль.',
        'Исключите [Gmail]/All Mail, иначе объём удвоится.',
        'На бесплатном тарифе Zoho доступ по IMAP бывает ограничен — проверьте план заранее.',
        'Zoho требует включить IMAP Access и создать пароль приложения.',
      ],
      faq: [
        [
          'Хватит ли места на Zoho?',
          'Зависит от тарифа: базовые планы Zoho дают 5–10 ГБ на пользователя. Замерьте объём ящика в Gmail до переноса — это бесплатно и занимает минуту.',
        ],
      ],
    },
    en: {
      title: 'Migrate Gmail to Zoho Mail — MoveMailbox',
      description:
        'Move Gmail to Zoho Mail over IMAP. A common route when leaving paid Google Workspace: Zoho regional hosts and the All Mail duplication trap.',
      h1: 'Migrate email from Gmail to Zoho Mail',
      intro:
        'Gmail to Zoho is most often a company leaving paid Google Workspace. The route is technically simple, but Zoho has one quirk: regional data centres, and you must pick the right host.',
      pitfalls: [
        'The Zoho host depends on region: com, eu or in. Getting it wrong looks like a wrong password.',
        'Exclude [Gmail]/All Mail or the volume doubles.',
        'Zoho free plans may restrict IMAP — check the plan first.',
        'Zoho requires IMAP Access enabled plus an app password.',
      ],
      faq: [
        [
          'Will Zoho have enough space?',
          'It depends on the plan — Zoho entry tiers give 5–10 GB per user. Measure the Gmail mailbox first; it is free and takes a minute.',
        ],
      ],
    },
    uk: {
      title: 'Перенесення пошти з Gmail до Zoho Mail — MoveMailbox',
      description:
        'Переносимо пошту з Gmail до Zoho Mail через IMAP. Частий маршрут під час відходу з платного Google Workspace.',
      h1: 'Перенесення пошти з Gmail до Zoho Mail',
      intro:
        'Перенесення пошти з Gmail до Zoho найчастіше роблять компанії, що йдуть з платного Google Workspace.',
      pitfalls: [
        'Хост Zoho залежить від регіону: com, eu або in. Помилка виглядає як невірний пароль.',
        'Виключіть [Gmail]/All Mail, інакше обсяг подвоїться.',
        'На безкоштовному тарифі Zoho доступ через IMAP буває обмежений — перевірте план заздалегідь.',
        'Zoho вимагає увімкнути IMAP Access і створити пароль застосунку.',
      ],
      faq: [
        [
          'Чи вистачить місця на Zoho?',
          'Залежить від тарифу: базові плани Zoho дають 5–10 ГБ на користувача. Заміряйте обсяг скриньки в Gmail до перенесення — це безкоштовно й займає хвилину.',
        ],
      ],
    },
  },
];

export const migrationRouteSlugs = migrationRoutes.map((r) => r.slug);

export function findRoute(slug: string): MigrationRoute | undefined {
  return migrationRoutes.find((r) => r.slug === slug);
}

export function isMigrationRouteSlug(value: string): boolean {
  return migrationRouteSlugs.includes(value);
}
