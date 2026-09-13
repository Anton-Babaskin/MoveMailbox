import type { ProviderKey } from './providers';
import type { Language, RouteCopy } from './migration-routes';

/**
 * Страницы провайдеров: /migrate/gmail, /migrate/microsoft-365 и так далее.
 *
 * Отличие от маршрутов A → B: сюда приходят по запросу про один сервис
 * («migrate gmail», «перенесення пошти imap», «exchange imap migration»),
 * когда вторая сторона ещё не выбрана. Страница отвечает на три вопроса:
 * какие настройки, что здесь ломается и куда отсюда чаще всего переносят.
 *
 * ВАЖНО: тексты не шаблонные. Одинаковые описания с подставленным именем
 * провайдера поисковик склеивает и показывает одну страницу из пяти.
 *
 * Порядок языков в работе: английский и украинский — основные рынки,
 * русский идёт наравне. Переводы делаются под запросы своего рынка, а не
 * подстрочником: в украинском «перенесення пошти», а не «перенос почты».
 */

export type ProviderHub = {
  /** Слаг внутри /migrate/. Не пересекается со слагами маршрутов A → B. */
  slug: string;
  /** Провайдер из справочника; null — общая страница про любой IMAP. */
  provider: ProviderKey | null;
  ru: RouteCopy;
  en: RouteCopy;
  uk: RouteCopy;
};

export const providerHubs: ProviderHub[] = [
  {
    slug: 'gmail',
    provider: 'gmail',
    ru: {
      title: 'Перенос почты Gmail по IMAP — MoveMailbox',
      description:
        'Как перенести почту Gmail на другой сервер: адрес imap.gmail.com, пароль приложения, что делать с ярлыками и папкой «Вся почта».',
      h1: 'Перенос почты Gmail',
      intro:
        'Gmail отдаёт всю переписку по IMAP, но устроен не как обычный ящик: то, что в интерфейсе выглядит папками, на самом деле ярлыки, и одно письмо с тремя ярлыками приезжает на новый сервер трижды. Ниже — настройки подключения, ловушки, из-за которых перенос идёт втрое дольше ожидаемого, и направления, куда из Gmail переносят чаще всего.',
      pitfalls: [
        'Папка «[Gmail]/Вся почта» содержит копии писем из всех остальных папок. Если её не исключить, объём переноса вырастет примерно вдвое, а в новом ящике появятся дубликаты.',
        'Обычный пароль аккаунта IMAP не примет: нужен пароль приложения, а он выдаётся только при включённой двухэтапной аутентификации.',
        'Ярлыки Gmail — не папки. Письмо с двумя ярлыками при переносе попадёт в обе папки назначения, и суммарный счётчик получится больше, чем показывает Gmail.',
        'Загрузка В Gmail заметно медленнее выгрузки ИЗ него: приём ограничен жёстче, и перенос в Gmail планируйте с запасом по времени.',
      ],
      faq: [
        [
          'Нужно ли включать IMAP в настройках Gmail?',
          'Да, в веб-интерфейсе Gmail: «Настройки → Пересылка и POP/IMAP → Включить IMAP». Без этого сервер не пустит ни один клиент, включая нас.',
        ],
        [
          'Где взять пароль приложения?',
          'В настройках безопасности аккаунта Google, после включения двухэтапной аутентификации. Это 16 символов, которые вводятся вместо обычного пароля — и отзываются одним нажатием, когда перенос закончен.',
        ],
        [
          'Останутся ли письма в Gmail после переноса?',
          'Да. Базовый режим только копирует и ничего не удаляет в источнике. Удаление происходит лишь в строгом зеркале, и то в ящике назначения, и только после двух подтверждений.',
        ],
        [
          'Что делать с папками «Спам» и «Корзина»?',
          'Обычно их не переносят: это мусор, который занимает место и время. В выборе папок просто снимите с них отметку.',
        ],
      ],
    },
    en: {
      title: 'Gmail mailbox migration over IMAP — MoveMailbox',
      description:
        'How to migrate a Gmail mailbox to another server: imap.gmail.com, app passwords, and what to do about labels and the All Mail folder.',
      h1: 'Gmail mailbox migration',
      intro:
        'Gmail hands over the whole mailbox through IMAP, but it is not a normal mailbox underneath: what looks like folders are labels, and one message carrying three labels arrives at the new server three times. Below are the connection settings, the traps that make a migration take three times longer than expected, and the destinations people leave Gmail for most often.',
      pitfalls: [
        'The "[Gmail]/All Mail" folder holds a copy of every message from every other folder. Leave it selected and the transfer roughly doubles in size, and the new mailbox ends up with duplicates.',
        'IMAP will not take the account password: you need an app password, and Google issues those only when 2-step verification is on.',
        'Gmail labels are not folders. A message with two labels lands in two destination folders, so the final count is higher than the number Gmail shows you.',
        'Uploading into Gmail is noticeably slower than downloading out of it: the receiving side is throttled harder, so plan extra time for migrations that end in Gmail.',
      ],
      faq: [
        [
          'Do I need to enable IMAP in Gmail first?',
          'Yes — in the Gmail web interface: Settings → Forwarding and POP/IMAP → Enable IMAP. Without it no client can connect, ours included.',
        ],
        [
          'Where do I get an app password?',
          'In the security settings of your Google account, once 2-step verification is enabled. It is 16 characters used instead of the normal password, and you can revoke it in one click when the migration is done.',
        ],
        [
          'Will the mail stay in Gmail after the migration?',
          'Yes. The default mode only copies and never deletes anything at the source. Deletion happens only in strict mirror mode, only on the destination, and only after two explicit confirmations.',
        ],
        [
          'What about Spam and Trash?',
          'Usually they are not worth moving: they cost space and time. Just clear their checkboxes in the folder list.',
        ],
      ],
    },
    uk: {
      title: 'Перенесення пошти Gmail за IMAP — MoveMailbox',
      description:
        'Як перенести пошту Gmail на інший сервер: адреса imap.gmail.com, пароль застосунку, що робити з мітками та текою «Уся пошта».',
      h1: 'Перенесення пошти Gmail',
      intro:
        'Gmail віддає все листування за IMAP, але всередині влаштований не як звичайна скринька: те, що в інтерфейсі має вигляд тек, насправді мітки, і лист із трьома мітками приїде на новий сервер тричі. Нижче — налаштування підключення, пастки, через які перенесення триває втричі довше за очікуване, і напрямки, куди з Gmail переходять найчастіше.',
      pitfalls: [
        'Тека «[Gmail]/Уся пошта» містить копії листів з усіх інших тек. Якщо її не зняти, обсяг перенесення зросте приблизно вдвічі, а в новій скриньці з’являться дублікати.',
        'Звичайний пароль акаунта IMAP не прийме: потрібен пароль застосунку, а його видають лише за увімкненої двоетапної перевірки.',
        'Мітки Gmail — не теки. Лист із двома мітками потрапить у дві теки призначення, тож підсумковий лічильник буде більшим, ніж показує Gmail.',
        'Завантаження В Gmail помітно повільніше за вивантаження З нього: приймання обмежене жорсткіше, тому перенесення до Gmail плануйте із запасом часу.',
      ],
      faq: [
        [
          'Чи треба вмикати IMAP у налаштуваннях Gmail?',
          'Так, у вебінтерфейсі Gmail: «Налаштування → Пересилання і POP/IMAP → Увімкнути IMAP». Без цього сервер не пустить жодного клієнта, зокрема й нас.',
        ],
        [
          'Де взяти пароль застосунку?',
          'У налаштуваннях безпеки акаунта Google, після увімкнення двоетапної перевірки. Це 16 символів, які вводять замість звичайного пароля — і відкликають одним натисканням, коли перенесення завершено.',
        ],
        [
          'Чи залишаться листи в Gmail після перенесення?',
          'Так. Базовий режим лише копіює і нічого не видаляє в джерелі. Видалення відбувається тільки в суворому дзеркалі, лише у скриньці призначення і лише після двох підтверджень.',
        ],
        [
          'Що робити з теками «Спам» і «Кошик»?',
          'Зазвичай їх не переносять: це сміття, яке забирає місце й час. У виборі тек просто зніміть із них позначку.',
        ],
      ],
    },
  },

  {
    slug: 'microsoft-365',
    provider: 'microsoft-365',
    ru: {
      title: 'Перенос почты Microsoft 365 по IMAP — MoveMailbox',
      description:
        'Перенос ящика Microsoft 365: outlook.office365.com, пароль приложения вместо обычного, ограничения скорости и что делать с архивом.',
      h1: 'Перенос почты Microsoft 365',
      intro:
        'Microsoft 365 отдаёт ящик по IMAP с адреса outlook.office365.com, но вход по обычному паролю в большинстве арендаторов закрыт политикой безопасности. Ниже — что именно нужно включить на стороне арендатора, почему выгрузка идёт медленнее, чем ожидается от облака такого размера, и куда из Microsoft 365 переносят чаще всего.',
      pitfalls: [
        'Базовая аутентификация для IMAP отключена по умолчанию. Рабочий вариант — пароль приложения при включённой многофакторной проверке; в части арендаторов их выдачу тоже запрещают политикой, и тогда включать доступ должен администратор.',
        'Онлайн-архив (In-Place Archive) по IMAP не виден: это отдельное хранилище. Его содержимое переносится только после того, как письма возвращены в основной ящик.',
        'Сервис притормаживает клиентов, которые читают слишком быстро. Наши измерения на боевых ящиках дают порядка половины гигабайта в час — это свойство сервиса, а не переноса.',
        'Общие и ресурсные ящики требуют собственных учётных данных: вход в личный ящик не даёт к ним доступа по IMAP.',
      ],
      faq: [
        [
          'Нужен ли администратор арендатора?',
          'Не всегда. Если в вашей учётной записи разрешены пароли приложений, хватит и их. Если политика их запрещает — доступ по IMAP включает администратор, точечно и на время переноса.',
        ],
        [
          'Какой адрес сервера указывать?',
          'outlook.office365.com, порт 993, SSL/TLS. Он же используется для Outlook.com — почтовые домены разные, IMAP-точка входа одна.',
        ],
        [
          'Перенесутся ли календарь и контакты?',
          'Нет. IMAP — протокол почты: письма, папки и флаги. Календарь и контакты переносятся отдельными средствами Microsoft.',
        ],
        [
          'Можно ли перенести только последний год переписки?',
          'Сейчас выбор идёт по папкам, а не по датам. Если письма старше года лежат в отдельной папке, снимите с неё отметку — и будет ровно то, что нужно.',
        ],
      ],
    },
    en: {
      title: 'Microsoft 365 mailbox migration over IMAP — MoveMailbox',
      description:
        'Migrate a Microsoft 365 mailbox: outlook.office365.com, app passwords instead of the normal one, throttling, and what happens to the archive.',
      h1: 'Microsoft 365 mailbox migration',
      intro:
        'Microsoft 365 serves the mailbox over IMAP at outlook.office365.com, but signing in with the ordinary password is blocked by security policy in most tenants. Below is what has to be enabled on the tenant side, why the export runs slower than you would expect from a cloud this size, and where people move Microsoft 365 mail to most often.',
      pitfalls: [
        'Basic authentication for IMAP is off by default. The working route is an app password with multi-factor authentication enabled; some tenants block app passwords too, and then an administrator has to open IMAP access.',
        'The in-place archive is invisible over IMAP — it is a separate store. Its contents move only after the messages are returned to the primary mailbox.',
        'The service throttles clients that read too fast. Our measurements on real mailboxes land around half a gigabyte per hour: that is a property of the service, not of the transfer.',
        'Shared and resource mailboxes need credentials of their own; signing in to a personal mailbox does not grant IMAP access to them.',
      ],
      faq: [
        [
          'Do I need a tenant administrator?',
          'Not always. If your account is allowed to create app passwords, that is enough. If policy forbids them, an administrator enables IMAP access for the account, narrowly and for the duration of the migration.',
        ],
        [
          'Which server address do I enter?',
          'outlook.office365.com, port 993, SSL/TLS. Outlook.com uses the same host — different mail domains, one IMAP entry point.',
        ],
        [
          'Will calendars and contacts come across?',
          'No. IMAP is a mail protocol: messages, folders and flags. Calendars and contacts move with Microsoft’s own tools.',
        ],
        [
          'Can I migrate only the last year of mail?',
          'Selection today is by folder, not by date. If the older mail lives in its own folder, clear that checkbox and you get exactly what you need.',
        ],
      ],
    },
    uk: {
      title: 'Перенесення пошти Microsoft 365 за IMAP — MoveMailbox',
      description:
        'Перенесення скриньки Microsoft 365: outlook.office365.com, пароль застосунку замість звичайного, обмеження швидкості та що робити з архівом.',
      h1: 'Перенесення пошти Microsoft 365',
      intro:
        'Microsoft 365 віддає скриньку за IMAP з адреси outlook.office365.com, але вхід зі звичайним паролем у більшості орендарів закрито політикою безпеки. Нижче — що саме потрібно увімкнути на боці орендаря, чому вивантаження йде повільніше, ніж очікуєш від хмари такого розміру, і куди з Microsoft 365 переходять найчастіше.',
      pitfalls: [
        'Базову автентифікацію для IMAP вимкнено за замовчуванням. Робочий варіант — пароль застосунку за увімкненої багатофакторної перевірки; у частині орендарів їх видачу теж забороняють політикою, і тоді доступ відкриває адміністратор.',
        'Онлайн-архів (In-Place Archive) за IMAP не видно: це окреме сховище. Його вміст переноситься лише після повернення листів до основної скриньки.',
        'Сервіс пригальмовує клієнтів, які читають надто швидко. Наші вимірювання на робочих скриньках дають близько половини гігабайта на годину — це властивість сервісу, а не перенесення.',
        'Спільні та ресурсні скриньки потребують власних облікових даних: вхід до особистої скриньки не дає до них доступу за IMAP.',
      ],
      faq: [
        [
          'Чи потрібен адміністратор орендаря?',
          'Не завжди. Якщо вашому обліковому запису дозволено паролі застосунків, вистачить їх. Якщо політика забороняє — доступ за IMAP вмикає адміністратор, точково й на час перенесення.',
        ],
        [
          'Яку адресу сервера вказувати?',
          'outlook.office365.com, порт 993, SSL/TLS. Її ж використовує Outlook.com — поштові домени різні, точка входу IMAP одна.',
        ],
        [
          'Чи перенесуться календар і контакти?',
          'Ні. IMAP — протокол пошти: листи, теки та прапорці. Календар і контакти переносять окремими засобами Microsoft.',
        ],
        [
          'Чи можна перенести лише останній рік листування?',
          'Зараз вибір іде за теками, а не за датами. Якщо старіші листи лежать в окремій теці, зніміть із неї позначку — і отримаєте саме те, що потрібно.',
        ],
      ],
    },
  },

  {
    slug: 'yahoo',
    provider: 'yahoo',
    ru: {
      title: 'Перенос почты Yahoo Mail по IMAP — MoveMailbox',
      description:
        'Перенос ящика Yahoo Mail: imap.mail.yahoo.com, обязательный пароль приложения и папки, которые не стоит переносить.',
      h1: 'Перенос почты Yahoo Mail',
      intro:
        'Yahoo Mail подключается по IMAP с адреса imap.mail.yahoo.com и требует пароль приложения — обычный пароль от аккаунта сторонним клиентам не подходит в принципе. Дальше всё просто: папки — настоящие папки, дубликатов нет, и перенос идёт ровно. Ниже настройки, три ловушки и направления, куда из Yahoo уходят чаще всего.',
      pitfalls: [
        'Пароль приложения обязателен: в отличие от Gmail это не «рекомендуется при 2FA», а единственный способ войти по IMAP.',
        'Аккаунт, в который долго не заходили, может быть частично заморожен. Зайдите в веб-интерфейс до переноса, иначе IMAP ответит отказом авторизации.',
        'Папка Bulk Mail — это спам. Перенос спама в новый ящик почти всегда ошибка: он заново попадёт в фильтры и испортит репутацию новой папки «Входящие».',
      ],
      faq: [
        [
          'Где выдают пароль приложения Yahoo?',
          'В настройках безопасности аккаунта Yahoo, раздел «Generate app password». Пароль показывается один раз, вводится вместо обычного и отзывается там же после переноса.',
        ],
        [
          'Yahoo ограничивает скорость выгрузки?',
          'Жёстких ограничений мы не встречали: по нашим замерам Yahoo отдаёт быстрее Gmail. Итоговое время чаще упирается в приёмную сторону.',
        ],
        [
          'Можно ли перенести ящик на домене, который обслуживает Yahoo?',
          'Да, подключение то же самое. Логин — полный адрес почты, а не имя пользователя.',
        ],
        [
          'Что будет со статусами «прочитано» и «избранное»?',
          'Они сохраняются: флаги переносятся вместе с письмами, как и даты получения.',
        ],
      ],
    },
    en: {
      title: 'Yahoo Mail migration over IMAP — MoveMailbox',
      description:
        'Move a Yahoo Mail mailbox: imap.mail.yahoo.com, the mandatory app password, and the folders you should leave behind.',
      h1: 'Yahoo Mail migration',
      intro:
        'Yahoo Mail connects over IMAP at imap.mail.yahoo.com and requires an app password — the account password simply does not work for third-party clients. After that it behaves well: folders are real folders, there are no duplicate stores, and the transfer runs evenly. Below are the settings, three traps, and where Yahoo mailboxes usually go.',
      pitfalls: [
        'The app password is mandatory. Unlike Gmail this is not "recommended when 2FA is on" — it is the only way to sign in over IMAP.',
        'An account left unused for a long time can be partly frozen. Sign in to the web interface before migrating, or IMAP will answer with an authentication failure.',
        'The Bulk Mail folder is spam. Carrying spam into a new mailbox is almost always a mistake: it gets re-filtered and drags down the reputation of the new inbox.',
      ],
      faq: [
        [
          'Where does Yahoo issue app passwords?',
          'In the account security settings, under "Generate app password". It is shown once, used instead of the normal password, and revoked in the same place once the migration is done.',
        ],
        [
          'Does Yahoo throttle downloads?',
          'We have not run into hard limits: in our measurements Yahoo serves faster than Gmail. The total time usually depends on the receiving side.',
        ],
        [
          'Can I migrate a mailbox on a domain hosted by Yahoo?',
          'Yes, the connection is identical. The login is the full email address, not the user name.',
        ],
        [
          'What happens to read and starred flags?',
          'They survive: flags travel with the messages, and so do the original dates.',
        ],
      ],
    },
    uk: {
      title: 'Перенесення пошти Yahoo Mail за IMAP — MoveMailbox',
      description:
        'Перенесення скриньки Yahoo Mail: imap.mail.yahoo.com, обов’язковий пароль застосунку та теки, які не варто переносити.',
      h1: 'Перенесення пошти Yahoo Mail',
      intro:
        'Yahoo Mail підключається за IMAP з адреси imap.mail.yahoo.com і потребує пароль застосунку — звичайний пароль від акаунта стороннім клієнтам не підходить узагалі. Далі все просто: теки — справжні теки, дублікатів немає, перенесення йде рівно. Нижче налаштування, три пастки й напрямки, куди з Yahoo ідуть найчастіше.',
      pitfalls: [
        'Пароль застосунку обов’язковий: на відміну від Gmail це не «рекомендовано за 2FA», а єдиний спосіб увійти за IMAP.',
        'Акаунт, до якого довго не заходили, може бути частково заморожений. Зайдіть у вебінтерфейс до перенесення, інакше IMAP відповість відмовою авторизації.',
        'Тека Bulk Mail — це спам. Переносити спам у нову скриньку майже завжди помилка: він знову потрапить у фільтри й зіпсує репутацію нової теки «Вхідні».',
      ],
      faq: [
        [
          'Де видають пароль застосунку Yahoo?',
          'У налаштуваннях безпеки акаунта Yahoo, розділ «Generate app password». Пароль показують один раз, уводять замість звичайного і відкликають там само після перенесення.',
        ],
        [
          'Чи обмежує Yahoo швидкість вивантаження?',
          'Жорстких обмежень ми не зустрічали: за нашими замірами Yahoo віддає швидше за Gmail. Підсумковий час частіше залежить від приймальної сторони.',
        ],
        [
          'Чи можна перенести скриньку на домені, який обслуговує Yahoo?',
          'Так, підключення те саме. Логін — повна адреса пошти, а не ім’я користувача.',
        ],
        [
          'Що буде зі статусами «прочитано» та «обране»?',
          'Вони зберігаються: прапорці переносяться разом із листами, як і дати отримання.',
        ],
      ],
    },
  },

  {
    slug: 'imap',
    provider: null,
    ru: {
      title: 'Перенос почты по IMAP между любыми серверами — MoveMailbox',
      description:
        'Как перенести ящик по IMAP: где взять адрес сервера, порты 993 и 143, SSL/TLS против STARTTLS и что делать во время переезда домена.',
      h1: 'Перенос почты по IMAP',
      intro:
        'IMAP поддерживают все почтовые сервисы и почти каждый хостинг, поэтому перенести ящик можно между любыми двумя серверами — не спрашивая разрешения ни у одного из них. Нужны четыре вещи с каждой стороны: адрес сервера, порт, логин и пароль. Ниже — где их взять, когда порт 993, а когда 143, и как подключиться, пока домен ещё указывает на старый сервер.',
      pitfalls: [
        'Адрес сервера почти всегда есть в панели хостинга («Настройка почтового клиента») или в письме от провайдера при заведении ящика. Если панели нет, работает imap.домен или mail.домен.',
        'Порт 993 — это SSL/TLS, порт 143 — STARTTLS. Мы не подключаемся без шифрования и не отключаем проверку сертификата: если сертификат сервера не проходит проверку, это видно в журнале, а не молча игнорируется.',
        'Пока домен переключается на нового провайдера, ваше имя mail.домен ещё ведёт на старый сервер. Правильный обход — не IP, а собственное имя хостинга (вроде mail.хостер.tld), которое от вашего DNS не зависит: сертификат проверяется ровно по тому имени, которое вы ввели, и на IP он почти никогда не выписан.',
        'У части хостингов логин — не адрес почты, а имя вида user@domain или просто user. Ошибка авторизации при верном пароле чаще всего означает именно это.',
      ],
      faq: [
        [
          'Что делать, если я не знаю адрес IMAP-сервера?',
          'Посмотрите в панели хостинга раздел «Почта → Настройка клиента». Если доступа нет, попробуйте imap.вашдомен и mail.вашдомен на порту 993 — на большинстве хостингов работает один из двух.',
        ],
        [
          'Можно ли указать IP вместо имени сервера?',
          'Поле его принимает, но подключение по IP пройдёт только если сертификат сервера выписан на этот IP — это редкость. Проверка сертификата идёт по тому, что введено в поле, и отключить её нельзя: именно так пароль и уезжает не на тот сервер. На время переезда домена используйте имя хостинга, а не своё.',
        ],
        [
          'Перенос идёт через ваши серверы?',
          'В онлайн-режиме письма идут потоком с сервера-источника на сервер назначения, копий у себя мы не делаем. Если отдавать пароли вообще не хочется, есть локальный клиент — он работает на вашем компьютере без нашей инфраструктуры.',
        ],
        [
          'Что если на сервере самоподписанный сертификат?',
          'Соединение будет отклонено, и причина попадёт в журнал. Правильное решение — выпустить нормальный сертификат (Let’s Encrypt бесплатен), а не отключать проверку.',
        ],
      ],
    },
    en: {
      title: 'IMAP mailbox migration between any servers — MoveMailbox',
      description:
        'How to migrate a mailbox over IMAP: where to find the server address, ports 993 and 143, SSL/TLS versus STARTTLS, and what to do mid-domain-transfer.',
      h1: 'IMAP mailbox migration',
      intro:
        'Every mail service and almost every hosting panel speaks IMAP, so a mailbox can be moved between any two servers without asking either of them for permission. You need four things per side: server address, port, login and password. Below is where to find them, when the port is 993 and when it is 143, and how to connect while the domain still points at the old host.',
      pitfalls: [
        'The server address is nearly always in the hosting panel under "mail client configuration", or in the message the provider sent when the mailbox was created. With no panel, imap.yourdomain or mail.yourdomain usually answers.',
        'Port 993 means SSL/TLS, port 143 means STARTTLS. We never connect unencrypted and never turn certificate verification off: a certificate that fails validation shows up in the log instead of being silently ignored.',
        'While a domain is moving to a new provider, your own mail.yourdomain still resolves to the old host. The right workaround is not an IP but the hosting provider’s own mail hostname (something like mail.hoster.tld), which does not depend on your DNS: the certificate is verified against exactly the name you typed, and certificates are almost never issued for an IP.',
        'On some hosts the login is not the email address but user@domain or plain user. An authentication failure with a correct password usually means exactly this.',
      ],
      faq: [
        [
          'What if I do not know the IMAP server address?',
          'Look for "Mail → client configuration" in the hosting panel. With no access, try imap.yourdomain and mail.yourdomain on port 993 — on most hosts one of the two answers.',
        ],
        [
          'Can I enter an IP instead of a hostname?',
          'The field accepts one, but the connection succeeds only if the server certificate covers that IP — which is rare. Verification runs against whatever you typed and cannot be turned off: skipping it is exactly how a password ends up on the wrong server. During a domain transfer use the hosting provider’s hostname instead of your own.',
        ],
        [
          'Does the mail pass through your servers?',
          'In the online mode messages stream from the source server to the destination server; we keep no copies. If handing over passwords is out of the question, the local client runs on your own machine with no infrastructure of ours involved.',
        ],
        [
          'What about a self-signed certificate?',
          'The connection is refused and the reason lands in the log. The right fix is a real certificate — Let’s Encrypt is free — not disabling verification.',
        ],
      ],
    },
    uk: {
      title: 'Перенесення пошти за IMAP між будь-якими серверами — MoveMailbox',
      description:
        'Як перенести скриньку за IMAP: де взяти адресу сервера, порти 993 і 143, SSL/TLS проти STARTTLS і що робити під час переїзду домену.',
      h1: 'Перенесення пошти за IMAP',
      intro:
        'IMAP підтримують усі поштові сервіси та майже кожен хостинг, тому скриньку можна перенести між будь-якими двома серверами — не питаючи дозволу в жодного з них. Потрібні чотири речі з кожного боку: адреса сервера, порт, логін і пароль. Нижче — де їх узяти, коли порт 993, а коли 143, і як підключитися, доки домен ще вказує на старий сервер.',
      pitfalls: [
        'Адреса сервера майже завжди є в панелі хостингу («Налаштування поштового клієнта») або в листі від провайдера, коли скриньку створювали. Якщо панелі немає, працює imap.домен або mail.домен.',
        'Порт 993 — це SSL/TLS, порт 143 — STARTTLS. Ми не підключаємось без шифрування і не вимикаємо перевірку сертифіката: якщо сертифікат сервера не проходить перевірку, це видно в журналі, а не мовчки ігнорується.',
        'Поки домен переходить до нового провайдера, ваше ім’я mail.домен ще веде на старий сервер. Правильний обхід — не IP, а власне ім’я хостингу (на кшталт mail.хостер.tld), яке від вашого DNS не залежить: сертифікат перевіряється саме за тим ім’ям, яке ви ввели, а на IP його майже ніколи не виписують.',
        'У частини хостингів логін — не адреса пошти, а ім’я на кшталт user@domain або просто user. Помилка авторизації за правильного пароля найчастіше означає саме це.',
      ],
      faq: [
        [
          'Що робити, якщо я не знаю адреси IMAP-сервера?',
          'Подивіться в панелі хостингу розділ «Пошта → Налаштування клієнта». Якщо доступу немає, спробуйте imap.вашдомен і mail.вашдомен на порту 993 — на більшості хостингів працює один із двох.',
        ],
        [
          'Чи можна вказати IP замість імені сервера?',
          'Поле його приймає, але підключення за IP пройде лише якщо сертифікат сервера виписано на цю IP — це рідкість. Перевірка сертифіката йде за тим, що введено в полі, і вимкнути її не можна: саме так пароль і потрапляє не на той сервер. На час переїзду домену використовуйте ім’я хостингу, а не своє.',
        ],
        [
          'Чи йде перенесення через ваші сервери?',
          'В онлайн-режимі листи йдуть потоком із сервера-джерела на сервер призначення, копій у себе ми не робимо. Якщо віддавати паролі не хочеться взагалі, є локальний клієнт — він працює на вашому комп’ютері без нашої інфраструктури.',
        ],
        [
          'А якщо на сервері самопідписаний сертифікат?',
          'З’єднання буде відхилено, і причина потрапить у журнал. Правильне рішення — випустити нормальний сертифікат (Let’s Encrypt безкоштовний), а не вимикати перевірку.',
        ],
      ],
    },
  },

  {
    slug: 'exchange',
    provider: 'exchange',
    ru: {
      title: 'Перенос почты с Exchange Server по IMAP — MoveMailbox',
      description:
        'Перенос ящиков с локального Exchange: включение службы IMAP, сертификат, ограничения политики и порядок переезда.',
      h1: 'Перенос почты с Exchange Server',
      intro:
        'На локальном Exchange служба IMAP есть всегда, но по умолчанию она остановлена — и это первое, что нужно исправить администратору. Дальше ящик ведёт себя как обычный IMAP-сервер, а значит переносится куда угодно: в Microsoft 365, в Google Workspace или на собственный почтовик. Ниже — что включить, на что смотреть в сертификате и где Exchange ограничивает скорость.',
      pitfalls: [
        'Служба «Microsoft Exchange IMAP4» по умолчанию не запущена. Её запускают и ставят в автозапуск обе части: IMAP4 и IMAP4 Backend, иначе подключение обрывается сразу после приветствия.',
        'Сертификат на почтовом имени должен быть настоящим и включать то имя, которое вы вводите в поле сервера. Самоподписанный сертификат мы не примем — это не обходится флагом.',
        'Политика регулирования (throttling policy) ограничивает число одновременных IMAP-подключений на пользователя. На больших ящиках это заметно сильнее, чем скорость дисков.',
        'Публичные папки по IMAP недоступны: это отдельное хранилище Exchange, которое переносится собственными средствами Microsoft.',
      ],
      faq: [
        [
          'Какой адрес сервера указывать для Exchange?',
          'Внешнее имя почтового сервера — то, что стоит в сертификате: обычно mail.вашдомен. Если внешнего доступа нет, подойдёт внутреннее имя или IP, когда перенос запускается из той же сети.',
        ],
        [
          'Нужно ли останавливать почту на время переноса?',
          'Нет. Источник не изменяется, пользователи продолжают работать. Повторный запуск после переключения домена доберёт письма, пришедшие за время переезда.',
        ],
        [
          'Поддерживается ли Exchange Online?',
          'Да, но подключение там другое: outlook.office365.com и пароль приложения. Это описано на странице Microsoft 365.',
        ],
        [
          'Сохранятся ли даты писем?',
          'Да, даты получения и флаги прочтения переносятся вместе с письмами — папки в новом ящике выглядят как в старом.',
        ],
      ],
    },
    en: {
      title: 'Exchange Server mailbox migration over IMAP — MoveMailbox',
      description:
        'Migrate mailboxes off on-premises Exchange: starting the IMAP service, certificates, throttling policy, and the order of the move.',
      h1: 'Exchange Server mailbox migration',
      intro:
        'On-premises Exchange always ships an IMAP service, but it is stopped by default — that is the first thing an administrator has to change. After that the mailbox behaves like any IMAP server and can move anywhere: to Microsoft 365, to Google Workspace, or to a mail server of your own. Below is what to start, what to check in the certificate, and where Exchange throttles.',
      pitfalls: [
        'The "Microsoft Exchange IMAP4" service is not running by default. Start both halves — IMAP4 and IMAP4 Backend — and set them to automatic, or the connection drops right after the greeting.',
        'The certificate on the mail name must be real and must cover the exact name you type into the server field. A self-signed certificate is refused; there is no flag to work around it.',
        'The throttling policy caps concurrent IMAP connections per user. On large mailboxes that ceiling is far more noticeable than disk speed.',
        'Public folders are not reachable over IMAP: they are a separate Exchange store and move with Microsoft’s own tooling.',
      ],
      faq: [
        [
          'Which server address do I use for Exchange?',
          'The external mail name — the one in the certificate, usually mail.yourdomain. With no external access, an internal name or IP works when the migration runs from the same network.',
        ],
        [
          'Do users have to stop working during the migration?',
          'No. The source is never modified and people keep working. A second run after the domain switch picks up whatever arrived while the move was in progress.',
        ],
        [
          'Is Exchange Online supported?',
          'Yes, but it connects differently: outlook.office365.com with an app password. That is covered on the Microsoft 365 page.',
        ],
        [
          'Are message dates preserved?',
          'Yes — received dates and read flags travel with the messages, so folders in the new mailbox look like the old ones.',
        ],
      ],
    },
    uk: {
      title: 'Перенесення пошти з Exchange Server за IMAP — MoveMailbox',
      description:
        'Перенесення скриньок із локального Exchange: увімкнення служби IMAP, сертифікат, обмеження політики та порядок переїзду.',
      h1: 'Перенесення пошти з Exchange Server',
      intro:
        'На локальному Exchange служба IMAP є завжди, але за замовчуванням вона зупинена — і це перше, що має виправити адміністратор. Далі скринька поводиться як звичайний IMAP-сервер, а отже переноситься куди завгодно: у Microsoft 365, у Google Workspace або на власний поштовик. Нижче — що увімкнути, на що дивитися в сертифікаті та де Exchange обмежує швидкість.',
      pitfalls: [
        'Служба «Microsoft Exchange IMAP4» за замовчуванням не запущена. Запускають і ставлять в автозапуск обидві частини: IMAP4 та IMAP4 Backend, інакше з’єднання обривається одразу після привітання.',
        'Сертифікат на поштовому імені має бути справжнім і містити те ім’я, яке ви вводите в полі сервера. Самопідписаний сертифікат ми не приймемо — це не обходиться прапорцем.',
        'Політика регулювання (throttling policy) обмежує кількість одночасних IMAP-підключень на користувача. На великих скриньках це помітніше за швидкість дисків.',
        'Публічні теки за IMAP недоступні: це окреме сховище Exchange, яке переносять власними засобами Microsoft.',
      ],
      faq: [
        [
          'Яку адресу сервера вказувати для Exchange?',
          'Зовнішнє ім’я поштового сервера — те, що стоїть у сертифікаті: зазвичай mail.вашдомен. Якщо зовнішнього доступу немає, підійде внутрішнє ім’я або IP, коли перенесення запускають із тієї ж мережі.',
        ],
        [
          'Чи треба зупиняти пошту на час перенесення?',
          'Ні. Джерело не змінюється, користувачі продовжують працювати. Повторний запуск після перемикання домену добере листи, що надійшли за час переїзду.',
        ],
        [
          'Чи підтримується Exchange Online?',
          'Так, але підключення там інше: outlook.office365.com і пароль застосунку. Це описано на сторінці Microsoft 365.',
        ],
        [
          'Чи збережуться дати листів?',
          'Так, дати отримання та прапорці прочитання переносяться разом із листами — теки в новій скриньці виглядають як у старій.',
        ],
      ],
    },
  },
];

export const providerHubSlugs = providerHubs.map((hub) => hub.slug);

export function findProviderHub(slug: string): ProviderHub | undefined {
  return providerHubs.find((hub) => hub.slug === slug);
}

export function isProviderHubSlug(slug: string): boolean {
  return providerHubSlugs.includes(slug);
}

/** Явная проверка типа: языковые ключи должны совпадать с Language. */
export type HubLanguage = Language;
