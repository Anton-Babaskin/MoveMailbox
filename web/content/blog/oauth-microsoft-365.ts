import type { BlogPost } from '@/data/blog-posts';

export const oauthMicrosoft365: BlogPost = {
  slug: 'oauth-microsoft-365',
  date: '2026-09-12',
  icon: 'lp',
  ru: {
    title: 'OAuth 2.0 для Microsoft 365 — MoveMailbox',
    description:
      'Microsoft отключил basic auth для IMAP: почему пара логин-пароль больше не проходит, как выглядит XOAUTH2 и что должен согласовать администратор тенанта.',
    h1: 'OAuth 2.0 для Microsoft 365: когда пароль приложения не работает',
    tag: 'Аутентификация',
    card: 'Basic auth в Exchange Online отключён, паролей приложений там нет. Что вместо них, какие права нужны и что делать, если вы не администратор.',
    lede: 'С остальными провайдерами схема простая: включил двухфакторную аутентификацию, выпустил пароль приложения, перенёс почту. С Microsoft 365 так не получится — там этой двери больше нет.',
    blocks: [
      {
        h2: 'Что именно отключили',
        paragraphs: [
          'Exchange Online перестал принимать по IMAP обычную пару логин-пароль: это и есть basic auth, устаревшая аутентификация. Отказ приходит на этапе входа и выглядит как неверный пароль, хотя пароль верный.',
          'Паролей приложений, как у Google или Apple, в Microsoft 365 в общем случае нет: политика безопасности по умолчанию их не выдаёт. Поэтому совет «выпустите пароль приложения» здесь просто не выполним.',
          'Вместо этого используется OAuth 2.0 — механизм, в котором клиент получает токен доступа, а не пароль. По IMAP он передаётся расширением XOAUTH2.',
        ],
        sample: {
          caption: 'Так выглядит отказ при попытке basic auth',
          body: 'a1 LOGIN "user@company.com" "********"\na1 NO LOGIN failed. Basic authentication is disabled for this tenant.',
        },
      },
      {
        h2: 'Как это работает на практике',
        paragraphs: [
          'Пользователь входит через обычную страницу Microsoft, подтверждает второй фактор и соглашается выдать приложению доступ к почте. Приложение получает токен, ограниченный по правам и по времени, и ходит с ним по IMAP.',
          'Для переноса это лучше пароля сразу по двум причинам: токен нельзя использовать для входа в аккаунт, и он протухает сам, даже если о нём забыли.',
        ],
        bullets: [
          'Нужное право доступа — чтение почты по IMAP (IMAP.AccessAsUser.All в терминах Microsoft).',
          'Согласие даёт либо сам пользователь, либо администратор тенанта сразу за всех.',
          'Токен живёт ограниченное время; для долгого переноса нужен refresh-токен, который клиент обновляет сам.',
          'Отзывается тоже централизованно: администратор закрывает доступ приложению одной кнопкой.',
        ],
      },
      {
        h2: 'Если вы не администратор',
        paragraphs: [
          'Это самый частый тупик: почта корпоративная, прав нет, а переехать надо.',
        ],
        steps: [
          'Проверьте, включён ли IMAP для вашего ящика вообще: администратор мог выключить протокол отдельно от аутентификации.',
          'Попросите администратора либо дать согласие для приложения переноса, либо временно разрешить устаревшую аутентификацию для одного ящика на время переезда.',
          'Если ни то, ни другое невозможно — перенос в обратную сторону обычно остаётся доступен: почту забирают на другой сервер и уже оттуда загружают, пользуясь доступом, который есть.',
          'Крайний вариант — экспорт средствами самого Microsoft 365 и загрузка получившегося архива на новый сервер по IMAP.',
        ],
      },
      {
        h2: 'Чем это отличается от Outlook.com',
        paragraphs: [
          'Личные ящики Outlook.com и Hotmail — отдельная история от корпоративного Microsoft 365, хотя интерфейс похож. Там свои настройки доступа, и они менялись не одновременно с корпоративными.',
          'Практический вывод один: перед переносом с любого адреса Microsoft стоит сначала проверить подключение, а не начинать копирование вслепую. Проверка занимает секунды и сразу показывает, чего именно не хватает.',
        ],
      },
    ],
    faq: [
      [
        'Можно ли выпустить пароль приложения в Microsoft 365?',
        'В большинстве тенантов нет: политика по умолчанию их не выдаёт. Штатный путь — OAuth.',
      ],
      [
        'Что должен сделать администратор тенанта?',
        'Дать согласие приложению на доступ к почте по IMAP или, как временная мера, разрешить устаревшую аутентификацию для конкретного ящика.',
      ],
      [
        'Безопаснее ли токен, чем пароль?',
        'Да: им нельзя войти в аккаунт, его права ограничены почтой, и он истекает сам.',
      ],
      [
        'Сервер отвечает AUTHENTICATIONFAILED — это точно OAuth?',
        'Не обязательно. Тот же код приходит при выключенном IMAP и при неверном формате логина; разбор причин — на отдельной странице.',
      ],
    ],
    links: [
      { path: '/migrate/gmail-to-microsoft-365', label: 'Перенос с Gmail на Microsoft 365' },
      { path: '/docs/errors/authenticationfailed', label: 'Ошибка AUTHENTICATIONFAILED: разбор' },
      { path: '/guides', label: 'Настройки IMAP по провайдерам' },
    ],
  },
  en: {
    title: 'OAuth 2.0 for Microsoft 365 — MoveMailbox',
    description:
      'Microsoft turned off basic auth for IMAP: why a login and password no longer get through, what XOAUTH2 looks like and what the tenant admin must approve.',
    h1: 'OAuth 2.0 for Microsoft 365: when app passwords do not exist',
    tag: 'Authentication',
    card: 'Basic auth is off in Exchange Online and app passwords are not offered. What replaces them, which permission is needed, and what to do without admin rights.',
    lede: 'With most providers the recipe is simple: enable two-factor, issue an app password, migrate. Microsoft 365 does not work that way — that door has been closed.',
    blocks: [
      {
        h2: 'What exactly was turned off',
        paragraphs: [
          'Exchange Online stopped accepting an ordinary username and password over IMAP. That is basic authentication, the legacy kind. The refusal arrives at login and reads like a wrong password, even though the password is right.',
          'App passwords of the Google or Apple kind generally do not exist in Microsoft 365: the default security policy does not issue them. So the usual advice to create one simply cannot be followed here.',
          'What replaces it is OAuth 2.0, where the client receives an access token instead of a password. Over IMAP that token is carried by the XOAUTH2 extension.',
        ],
        sample: {
          caption: 'What a basic auth attempt gets back',
          body: 'a1 LOGIN "user@company.com" "********"\na1 NO LOGIN failed. Basic authentication is disabled for this tenant.',
        },
      },
      {
        h2: 'How it works in practice',
        paragraphs: [
          'The user signs in on the normal Microsoft page, passes the second factor and agrees to give the application access to mail. The application receives a token limited in scope and in time, and uses it over IMAP.',
          'For a migration that beats a password twice over: the token cannot be used to sign in to the account, and it expires on its own even if everyone forgets about it.',
        ],
        bullets: [
          'The permission needed is IMAP access on behalf of the user (IMAP.AccessAsUser.All in Microsoft terms).',
          'Consent comes either from the user or from a tenant administrator on everyone behalf.',
          'Tokens are short-lived; a long migration needs a refresh token, which the client renews itself.',
          'Revocation is central too: an administrator closes the application access with one click.',
        ],
      },
      {
        h2: 'If you are not an administrator',
        paragraphs: ['This is the most common dead end: company mail, no rights, and a move to make.'],
        steps: [
          'Check whether IMAP is enabled for your mailbox at all — an administrator can disable the protocol separately from authentication.',
          'Ask the administrator either to grant consent for the migration application or to allow legacy authentication for one mailbox for the duration of the move.',
          'If neither is possible, migrating in the other direction usually still works: pull the mail to another server and upload from there with the access you do have.',
          'As a last resort, export with the Microsoft 365 tooling and upload the resulting archive to the new server over IMAP.',
        ],
      },
      {
        h2: 'How this differs from Outlook.com',
        paragraphs: [
          'Personal Outlook.com and Hotmail mailboxes are a separate story from corporate Microsoft 365, similar interface notwithstanding. They have their own access settings, changed on their own schedule.',
          'One practical conclusion: with any Microsoft address, test the connection before copying anything. It takes seconds and states exactly what is missing.',
        ],
      },
    ],
    faq: [
      [
        'Can I create an app password in Microsoft 365?',
        'In most tenants, no: the default policy does not issue them. OAuth is the supported path.',
      ],
      [
        'What does the tenant administrator have to do?',
        'Grant the application consent for IMAP mail access, or as a temporary measure allow legacy authentication for a specific mailbox.',
      ],
      [
        'Is a token safer than a password?',
        'Yes: it cannot sign in to the account, its scope is limited to mail, and it expires by itself.',
      ],
      [
        'The server says AUTHENTICATIONFAILED — is that always OAuth?',
        'Not necessarily. The same code appears when IMAP is disabled or the username format is wrong; there is a full write-up of the causes.',
      ],
    ],
    links: [
      { path: '/migrate/gmail-to-microsoft-365', label: 'Move from Gmail to Microsoft 365' },
      { path: '/docs/errors/authenticationfailed', label: 'AUTHENTICATIONFAILED explained' },
      { path: '/guides', label: 'IMAP settings by provider' },
    ],
  },
  uk: {
    title: 'Microsoft 365 і OAuth 2.0 замість пароля — MoveMailbox',
    description:
      'Microsoft вимкнув basic auth для IMAP: чому пара логін-пароль більше не проходить, як має вигляд XOAUTH2 і що має погодити адміністратор тенанта.',
    h1: 'OAuth 2.0 для Microsoft 365: коли пароля застосунку не існує',
    tag: 'Автентифікація',
    card: 'Basic auth в Exchange Online вимкнено, паролів застосунків там немає. Що замість них, які права потрібні й що робити, якщо ви не адміністратор.',
    lede: 'З рештою провайдерів схема проста: увімкнув двофакторну автентифікацію, випустив пароль застосунку, переніс пошту. З Microsoft 365 так не вийде — там цих дверей більше немає.',
    blocks: [
      {
        h2: 'Що саме вимкнули',
        paragraphs: [
          'Exchange Online перестав приймати по IMAP звичайну пару логін-пароль: це і є basic auth, застаріла автентифікація. Відмова приходить на етапі входу й має вигляд неправильного пароля.',
          'Паролів застосунків, як у Google чи Apple, у Microsoft 365 загалом немає: політика безпеки за замовчуванням їх не видає.',
          'Замість цього використовується OAuth 2.0 — механізм, у якому клієнт отримує токен доступу, а не пароль. По IMAP він передається розширенням XOAUTH2.',
        ],
        sample: {
          caption: 'Так має вигляд відмова при спробі basic auth',
          body: 'a1 LOGIN "user@company.com" "********"\na1 NO LOGIN failed. Basic authentication is disabled for this tenant.',
        },
      },
      {
        h2: 'Як це працює на практиці',
        paragraphs: [
          'Користувач входить через звичайну сторінку Microsoft, підтверджує другий фактор і погоджується надати застосунку доступ до пошти. Застосунок отримує токен, обмежений за правами й за часом.',
          'Для перенесення це краще за пароль одразу з двох причин: токен не можна використати для входу в акаунт, і він протухає сам.',
        ],
        bullets: [
          'Потрібне право доступу — читання пошти по IMAP (IMAP.AccessAsUser.All у термінах Microsoft).',
          'Згоду дає або сам користувач, або адміністратор тенанта одразу за всіх.',
          'Токен живе обмежений час; для довгого перенесення потрібен refresh-токен.',
          'Відкликається теж централізовано: адміністратор закриває доступ застосунку однією кнопкою.',
        ],
      },
      {
        h2: 'Якщо ви не адміністратор',
        paragraphs: ['Це найчастіший глухий кут: пошта корпоративна, прав немає, а переїхати треба.'],
        steps: [
          'Перевірте, чи ввімкнено IMAP для вашої скриньки взагалі.',
          'Попросіть адміністратора або надати згоду застосунку перенесення, або тимчасово дозволити застарілу автентифікацію для однієї скриньки.',
          'Якщо ні те, ні те неможливе — перенесення у зворотний бік зазвичай лишається доступним.',
          'Крайній варіант — експорт засобами самого Microsoft 365 і завантаження архіву на новий сервер по IMAP.',
        ],
      },
      {
        h2: 'Чим це відрізняється від Outlook.com',
        paragraphs: [
          'Особисті скриньки Outlook.com і Hotmail — окрема історія від корпоративного Microsoft 365, хоча інтерфейс схожий.',
          'Практичний висновок один: перед перенесенням із будь-якої адреси Microsoft варто спершу перевірити підключення, а не починати копіювання наосліп.',
        ],
      },
    ],
    faq: [
      [
        'Чи можна випустити пароль застосунку в Microsoft 365?',
        'У більшості тенантів ні: політика за замовчуванням їх не видає. Штатний шлях — OAuth.',
      ],
      [
        'Що має зробити адміністратор тенанта?',
        'Надати згоду застосунку на доступ до пошти по IMAP або тимчасово дозволити застарілу автентифікацію.',
      ],
      [
        'Чи безпечніший токен за пароль?',
        'Так: ним не можна ввійти в акаунт, його права обмежені поштою, і він спливає сам.',
      ],
      [
        'Сервер відповідає AUTHENTICATIONFAILED — це точно OAuth?',
        'Не обов’язково. Той самий код приходить за вимкненого IMAP і за неправильного формату логіна.',
      ],
    ],
    links: [
      { path: '/migrate/gmail-to-microsoft-365', label: 'Перенесення з Gmail на Microsoft 365' },
      { path: '/docs/errors/authenticationfailed', label: 'Помилка AUTHENTICATIONFAILED: розбір' },
      { path: '/guides', label: 'Налаштування IMAP за провайдерами' },
    ],
  },
};
