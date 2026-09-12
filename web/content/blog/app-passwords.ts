import type { BlogPost } from '@/data/blog-posts';

export const appPasswords: BlogPost = {
  slug: 'app-passwords',
  date: '2026-09-12',
  icon: 'ky',
  ru: {
    title: 'Пароль приложения для почты — MoveMailbox',
    description:
      'Зачем почтовому клиенту отдельный пароль приложения, где его выдают Gmail, Яндекс, Mail.ru, iCloud и Zoho и почему обычный пароль больше не подходит.',
    h1: 'Пароль приложения: зачем он нужен и где его взять',
    tag: 'Доступ',
    card: 'Отдельный пароль для IMAP вместо основного: кто его требует, где он лежит у каждого провайдера и что делать, если раздел с ним не открывается.',
    lede: 'Почти каждый перенос почты начинается с одной и той же заминки: человек вводит пароль, которым только что зашёл в веб-интерфейс, и получает отказ. Пароль верный. Просто он не для IMAP.',
    blocks: [
      {
        h2: 'Почему основной пароль не проходит',
        paragraphs: [
          'Веб-интерфейс почты умеет спросить второй фактор: код из приложения, SMS, подтверждение на телефоне. Протокол IMAP так не умеет — в нём есть ровно одна команда LOGIN с логином и паролем, и никакого места для второго шага в ней нет.',
          'Провайдеры решили это одинаково: основной пароль перестали принимать по IMAP вообще, а для внешних клиентов выдают отдельный — пароль приложения. Это длинная случайная строка, которая работает только для почтовых протоколов, не даёт войти в веб-интерфейс и отзывается одной кнопкой, не трогая основной пароль.',
          'Отсюда практическое следствие: пароль приложения безопаснее давать инструменту переноса, чем основной. Даже если он утечёт, им нельзя зайти в аккаунт, сменить пароль или прочитать документы на диске.',
        ],
      },
      {
        h2: 'Где его взять у популярных провайдеров',
        paragraphs: [
          'Раздел называется по-разному, но лежит всегда в настройках безопасности аккаунта, а не в настройках почты. Точные названия пунктов провайдеры двигают, поэтому ориентируйтесь на смысл, а не на дословный путь.',
        ],
        bullets: [
          'Gmail и Google Workspace — «Безопасность» → «Пароли приложений». Пункт появляется только при включённой двухэтапной аутентификации; без неё раздела в меню просто нет.',
          'Яндекс — «Безопасность» → «Пароли приложений» → тип «Почта». IMAP дополнительно включается в настройках самой почты.',
          'Mail.ru — «Безопасность» → «Пароли для внешних приложений».',
          'iCloud — «Вход и безопасность» → «Пароли для приложений». Двухфакторная аутентификация обязательна.',
          'Zoho Mail — «Security» → «App passwords».',
          'Yahoo — «Account security» → «Generate app password».',
          'Fastmail — «Settings» → «Password & Security» → «App passwords», с выбором прав только на почту.',
          'Microsoft 365 и Outlook.com — особый случай: там пароли приложений отключены политикой по умолчанию, вместо них OAuth. Об этом отдельная статья.',
        ],
      },
      {
        h2: 'Как он выглядит и как его вводить',
        paragraphs: [
          'Gmail показывает пароль четырьмя группами по четыре символа. Пробелы в нём — оформление, а не часть пароля: вводить нужно шестнадцать символов подряд. Это причина примерно каждой третьей ошибки аутентификации при переносе с Gmail.',
          'Пароль показывают ровно один раз. Не сохранили — не страшно: старый отзывается, новый выпускается за полминуты, на почту это никак не влияет.',
          'Логин при этом остаётся прежним — полный адрес. Исключение стоит запомнить: у Яндекса для ящика на своём домене логином нередко служит часть до собаки, и попытка войти полным адресом даёт тот же отказ, что и неверный пароль.',
        ],
        sample: {
          caption: 'Так это выглядит в журнале при неверном формате',
          body: 'a1 LOGIN "user@example.com" "abcd efgh ijkl mnop"\na1 NO [AUTHENTICATIONFAILED] Invalid credentials (Failure)',
        },
      },
      {
        h2: 'Если раздела с паролями приложений нет',
        paragraphs: [
          'Три причины по убыванию частоты — и что с ними делать.',
        ],
        steps: [
          'Не включена двухфакторная аутентификация. У Google и Apple раздел появляется только после неё; включите и обновите страницу.',
          'Администратор корпоративного тенанта запретил устаревшую аутентификацию. Тогда пароля приложения не будет в принципе — нужен OAuth или временное разрешение от администратора.',
          'У провайдера этого механизма нет вовсе: он пускает по основному паролю, но требует отдельно включить IMAP. Проверьте настройки почты — обычно это один переключатель.',
        ],
      },
      {
        h2: 'Что с ним делать после переноса',
        paragraphs: [
          'Отозвать. Пароль приложения выдаётся под конкретную задачу, и после того, как почта переехала и вы сверили счётчики, он больше не нужен ни вам, ни нам.',
          'Отзыв делается в том же разделе, где пароль выпускался, и мгновенно закрывает доступ по IMAP, не затрагивая ни основной пароль, ни активные сессии в браузере.',
        ],
      },
    ],
    faq: [
      [
        'Пароль приложения и пароль от почты — это разные пароли?',
        'Да. Основной открывает веб-интерфейс и весь аккаунт, пароль приложения работает только по почтовым протоколам и отзывается отдельно.',
      ],
      [
        'Это безопасно — отдавать пароль приложения сервису переноса?',
        'Безопаснее, чем отдавать основной: им нельзя войти в аккаунт и нельзя сменить пароль. После переноса его нужно отозвать — тогда доступ закрывается полностью.',
      ],
      [
        'Сколько паролей приложений можно выпустить?',
        'У большинства провайдеров — несколько десятков. Для переноса достаточно одного на ящик, и лучше выпустить отдельный, а не переиспользовать пароль от почтового клиента на телефоне.',
      ],
      [
        'Сервер отвечает AUTHENTICATIONFAILED даже с паролем приложения',
        'Проверьте три вещи: убраны ли пробелы, включён ли IMAP в настройках почты и в каком формате провайдер ждёт логин. Разбор этой ошибки — на отдельной странице.',
      ],
    ],
    links: [
      { path: '/guides', label: 'Настройки IMAP по провайдерам' },
      { path: '/docs/errors/authenticationfailed', label: 'Ошибка AUTHENTICATIONFAILED: разбор' },
      { path: '/migrate/gmail-to-outlook', label: 'Перенос с Gmail на Outlook' },
    ],
  },
  en: {
    title: 'App passwords for email — MoveMailbox',
    description:
      'Why an IMAP client needs its own app password, where Gmail, Yandex, iCloud, Zoho and Fastmail hide the setting, and what to do when the section is missing.',
    h1: 'App passwords: why you need one and where to get it',
    tag: 'Access',
    card: 'A separate password for IMAP instead of your account one: who requires it, where each provider keeps it, and what to do when the section will not appear.',
    lede: 'Almost every migration starts with the same stumble. You type the password you just used to sign in to the web interface, and the server refuses it. The password is correct. It is simply not meant for IMAP.',
    blocks: [
      {
        h2: 'Why your normal password is refused',
        paragraphs: [
          'A webmail login can ask for a second factor: a code from an app, an SMS, a tap on your phone. IMAP cannot. The protocol has exactly one LOGIN command carrying a username and a password, and there is nowhere in it for a second step.',
          'Providers all solved this the same way. The account password stopped being accepted over IMAP at all, and external clients get a separate one instead: an app password. It is a long random string that works only for mail protocols, cannot sign you in to the web interface, and can be revoked with one click without touching your real password.',
          'That leads to a practical point worth keeping: handing a migration tool an app password is safer than handing it your account password. Even if it leaks, nobody can enter the account, change the password, or read your files.',
        ],
      },
      {
        h2: 'Where each provider keeps it',
        paragraphs: [
          'The section has a different name everywhere, but it always lives in account security settings, never in mail settings. Providers move the exact wording around, so follow the meaning rather than a literal path.',
        ],
        bullets: [
          'Gmail and Google Workspace — Security, then App passwords. The entry only exists once two-step verification is on; without it the menu item is simply absent.',
          'Yandex — Security, then App passwords, type Mail. IMAP also has to be enabled in mail settings.',
          'Mail.ru — Security, then passwords for external applications.',
          'iCloud — Sign-In and Security, then App-Specific Passwords. Two-factor authentication is required.',
          'Zoho Mail — Security, then App passwords.',
          'Yahoo — Account security, then Generate app password.',
          'Fastmail — Settings, Password and Security, App passwords, with a mail-only scope.',
          'Microsoft 365 and Outlook.com are the exception: app passwords are disabled by default policy there and OAuth takes their place. That has its own article.',
        ],
      },
      {
        h2: 'What it looks like and how to type it',
        paragraphs: [
          'Gmail shows the password as four groups of four characters. The spaces are presentation, not part of the secret: what you paste is sixteen characters with nothing between them. This is behind roughly every third authentication failure we see on Gmail migrations.',
          'The password is shown exactly once. Losing it costs nothing — revoke the old one, issue a new one in half a minute, and the mailbox itself is untouched.',
          'The username stays what it was: the full address. One exception is worth remembering — on Yandex, a mailbox on a custom domain often expects only the part before the at sign, and signing in with the full address fails exactly like a wrong password would.',
        ],
        sample: {
          caption: 'What the wrong format looks like in the log',
          body: 'a1 LOGIN "user@example.com" "abcd efgh ijkl mnop"\na1 NO [AUTHENTICATIONFAILED] Invalid credentials (Failure)',
        },
      },
      {
        h2: 'When the app password section is missing',
        paragraphs: ['Three reasons, most common first, and what to do about each.'],
        steps: [
          'Two-factor authentication is off. Google and Apple only reveal the section after it is enabled; turn it on and reload the page.',
          'A tenant administrator has blocked legacy authentication. Then no app password exists at all, and you need OAuth or a temporary exception from the administrator.',
          'The provider has no such mechanism: it accepts the account password but wants IMAP enabled separately. Check mail settings — it is usually a single switch.',
        ],
      },
      {
        h2: 'What to do with it afterwards',
        paragraphs: [
          'Revoke it. An app password is issued for one job, and once the mail has moved and the counters match, neither you nor we need it any more.',
          'Revoking happens in the same place it was issued and closes IMAP access immediately, leaving your account password and your browser sessions alone.',
        ],
      },
    ],
    faq: [
      [
        'Is an app password different from my mailbox password?',
        'Yes. The account password opens the web interface and the whole account; an app password works only over mail protocols and is revoked on its own.',
      ],
      [
        'Is it safe to give a migration service an app password?',
        'Safer than giving it the account password: it cannot sign in to the account or change the password. Revoke it after the migration and access is closed completely.',
      ],
      [
        'How many app passwords can I create?',
        'Most providers allow dozens. One per mailbox is enough for a migration, and a fresh one beats reusing the password your phone client already has.',
      ],
      [
        'The server still answers AUTHENTICATIONFAILED with an app password',
        'Check three things: the spaces are gone, IMAP is enabled in mail settings, and the username is in the format the provider expects. There is a full write-up of that error.',
      ],
    ],
    links: [
      { path: '/guides', label: 'IMAP settings by provider' },
      { path: '/docs/errors/authenticationfailed', label: 'AUTHENTICATIONFAILED explained' },
      { path: '/migrate/gmail-to-outlook', label: 'Move from Gmail to Outlook' },
    ],
  },
  uk: {
    title: 'Пароль застосунку для пошти — MoveMailbox',
    description:
      'Навіщо поштовому клієнту окремий пароль застосунку, де його видають Gmail, Яндекс, iCloud і Zoho та що робити, якщо потрібного розділу немає.',
    h1: 'Пароль застосунку: навіщо він і де його взяти',
    tag: 'Доступ',
    card: 'Окремий пароль для IMAP замість основного: хто його вимагає, де він лежить у кожного провайдера і що робити, якщо розділ не відкривається.',
    lede: 'Майже кожне перенесення пошти починається з однієї й тієї самої заминки: людина вводить пароль, яким щойно зайшла у вебінтерфейс, і отримує відмову. Пароль правильний. Просто він не для IMAP.',
    blocks: [
      {
        h2: 'Чому основний пароль не проходить',
        paragraphs: [
          'Вебінтерфейс пошти вміє запитати другий фактор: код із застосунку, SMS, підтвердження на телефоні. Протокол IMAP так не вміє — у ньому є рівно одна команда LOGIN з логіном і паролем, і місця для другого кроку в ній немає.',
          'Провайдери розв’язали це однаково: основний пароль перестали приймати по IMAP узагалі, а для зовнішніх клієнтів видають окремий — пароль застосунку. Це довгий випадковий рядок, який працює лише для поштових протоколів, не дає ввійти у вебінтерфейс і відкликається однією кнопкою, не чіпаючи основний пароль.',
          'Звідси практичний висновок: пароль застосунку безпечніше давати інструменту перенесення, ніж основний. Навіть якщо він витече, ним не можна зайти в акаунт, змінити пароль чи прочитати документи на диску.',
        ],
      },
      {
        h2: 'Де його взяти в популярних провайдерів',
        paragraphs: [
          'Розділ називається по-різному, але лежить завжди в налаштуваннях безпеки акаунта, а не в налаштуваннях пошти. Точні назви пунктів провайдери пересувають, тож орієнтуйтеся на зміст, а не на дослівний шлях.',
        ],
        bullets: [
          'Gmail і Google Workspace — «Безпека» → «Паролі застосунків». Пункт з’являється лише за ввімкненої двоетапної автентифікації.',
          'Яндекс — «Безпека» → «Паролі застосунків» → тип «Пошта». IMAP додатково вмикається в налаштуваннях самої пошти.',
          'Mail.ru — «Безпека» → «Паролі для зовнішніх застосунків».',
          'iCloud — «Вхід і безпека» → «Паролі для застосунків». Двофакторна автентифікація обов’язкова.',
          'Zoho Mail — «Security» → «App passwords».',
          'Yahoo — «Account security» → «Generate app password».',
          'Fastmail — «Settings» → «Password & Security» → «App passwords», з правами лише на пошту.',
          'Microsoft 365 і Outlook.com — окремий випадок: там паролі застосунків вимкнені політикою за замовчуванням, замість них OAuth. Про це окрема стаття.',
        ],
      },
      {
        h2: 'Який він на вигляд і як його вводити',
        paragraphs: [
          'Gmail показує пароль чотирма групами по чотири символи. Пробіли в ньому — оформлення, а не частина пароля: вводити треба шістнадцять символів поспіль. Це причина приблизно кожної третьої помилки автентифікації під час перенесення з Gmail.',
          'Пароль показують рівно один раз. Не зберегли — не біда: старий відкликається, новий випускається за півхвилини, на пошту це ніяк не впливає.',
          'Логін при цьому лишається тим самим — повна адреса. Виняток варто запам’ятати: у Яндекса для скриньки на власному домені логіном часто є частина до равлика, і спроба ввійти повною адресою дає ту саму відмову, що й неправильний пароль.',
        ],
        sample: {
          caption: 'Так це має вигляд у журналі за неправильного формату',
          body: 'a1 LOGIN "user@example.com" "abcd efgh ijkl mnop"\na1 NO [AUTHENTICATIONFAILED] Invalid credentials (Failure)',
        },
      },
      {
        h2: 'Якщо розділу з паролями застосунків немає',
        paragraphs: ['Три причини за спаданням частоти — і що з ними робити.'],
        steps: [
          'Не ввімкнено двофакторну автентифікацію. У Google і Apple розділ з’являється лише після неї; увімкніть і оновіть сторінку.',
          'Адміністратор корпоративного тенанта заборонив застарілу автентифікацію. Тоді пароля застосунку не буде взагалі — потрібен OAuth або тимчасовий дозвіл від адміністратора.',
          'У провайдера такого механізму немає зовсім: він пускає за основним паролем, але вимагає окремо ввімкнути IMAP. Перевірте налаштування пошти — зазвичай це один перемикач.',
        ],
      },
      {
        h2: 'Що з ним робити після перенесення',
        paragraphs: [
          'Відкликати. Пароль застосунку видається під конкретну задачу, і після того, як пошта переїхала і ви звірили лічильники, він більше не потрібен ні вам, ні нам.',
          'Відкликання робиться в тому самому розділі, де пароль випускався, і миттєво закриває доступ по IMAP, не зачіпаючи ні основний пароль, ні активні сесії в браузері.',
        ],
      },
    ],
    faq: [
      [
        'Пароль застосунку і пароль від пошти — це різні паролі?',
        'Так. Основний відкриває вебінтерфейс і весь акаунт, пароль застосунку працює лише поштовими протоколами й відкликається окремо.',
      ],
      [
        'Це безпечно — віддавати пароль застосунку сервісу перенесення?',
        'Безпечніше, ніж віддавати основний: ним не можна ввійти в акаунт і не можна змінити пароль. Після перенесення його потрібно відкликати.',
      ],
      [
        'Скільки паролів застосунків можна випустити?',
        'У більшості провайдерів — кілька десятків. Для перенесення достатньо одного на скриньку, і краще випустити окремий, ніж перевикористовувати наявний.',
      ],
      [
        'Сервер відповідає AUTHENTICATIONFAILED навіть із паролем застосунку',
        'Перевірте три речі: чи прибрані пробіли, чи ввімкнено IMAP у налаштуваннях пошти і в якому форматі провайдер чекає логін. Розбір цієї помилки — на окремій сторінці.',
      ],
    ],
    links: [
      { path: '/guides', label: 'Налаштування IMAP за провайдерами' },
      { path: '/docs/errors/authenticationfailed', label: 'Помилка AUTHENTICATIONFAILED: розбір' },
      { path: '/migrate/gmail-to-outlook', label: 'Перенесення з Gmail на Outlook' },
    ],
  },
};
