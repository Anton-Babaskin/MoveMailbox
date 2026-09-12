/** Копия полного FAQ. Один файл на секцию — три языка рядом. */

export type FaqItem = {
  readonly q: string;
  readonly a: string;
};

export type FaqFullCopy = {
  readonly eyebrow: string;
  readonly h2: string;
  /** Две колонки по четыре вопроса: разметка требует именно такой формы. */
  readonly colA: readonly FaqItem[];
  readonly colB: readonly FaqItem[];
};

export const faqFull = {
  ru: {
    eyebrow: 'FAQ',
    h2: 'Перед первым переносом',
    colA: [
      {
        q: 'Что происходит с моим паролем?',
        a: 'Соединение защищено HTTPS. Перед постановкой задания в очередь учётные данные шифруются для воркера: открытый пароль не сохраняется, временно хранится зашифрованный пакет. Расшифровка происходит в памяти воркера, дальше данные передаются процессу imapsync через окружение. В журналах пароль не появляется, для повторного запуска вводится заново. Если такой модели недостаточно — есть self-hosted, где пароль передаётся вашим почтовым серверам без инфраструктуры MoveMailbox.',
      },
      {
        q: 'Что означает бесплатные 5 ГБ?',
        a: 'Бесплатно переносится один целый ящик, оценённый в 5 ГБ или меньше. Мы не будем копировать первые 5 ГБ большого ящика и внезапно останавливаться.',
      },
      {
        q: 'Можно закрыть браузер?',
        a: 'В hosted-версии задача будет выполняться на нашем worker и продолжится после закрытия вкладки. Локальный Windows-клиент должен оставаться запущенным.',
      },
      {
        q: 'Что делать, если перенос оборвался?',
        a: 'Запустить снова. imapsync сверяет, что уже лежит в назначении, и копирует только недостающее — повтор дешёвый и не создаёт дублей.',
      },
    ],
    colB: [
      {
        q: 'Почему Windows без облачного лимита?',
        a: 'Работу и трафик обеспечивает компьютер пользователя, поэтому коммерческий лимит MoveMailbox Cloud не применяется. Ограничения провайдера остаются.',
      },
      {
        q: 'Удаляется ли старая почта?',
        a: 'Нет. Базовый сценарий — одностороннее копирование. Старый ящик стоит удалять только после ручной сверки и резервного периода.',
      },
      {
        q: 'Какие серверы поддерживаются?',
        a: 'Совместимые IMAP-серверы. Gmail, Microsoft и некоторые корпоративные системы могут требовать пароль приложения, включение IMAP или OAuth.',
      },
      {
        q: 'Сохранятся ли даты, флаги и вложения?',
        a: 'Да. Переносится исходный RFC-822 объект целиком: заголовки, дата, вложения, флаги прочитано/отвечено, структура вложенных папок. Не переносятся серверные фильтры, автоответы и контакты — это не IMAP.',
      },
    ],
  },
  en: {
    eyebrow: 'FAQ',
    h2: 'Before your first transfer',
    colA: [
      {
        q: 'What happens to my password?',
        a: 'The connection runs over HTTPS. Before a job is queued, the credentials are encrypted for the worker: the plain password is never stored, only an encrypted package is kept for a while. It is decrypted in the worker’s memory and passed to the imapsync process through the environment. The password never shows up in the logs, and you enter it again for a rerun. If that model is not enough, there is the self-hosted version, where the password goes to your own mail servers and no MoveMailbox infrastructure is involved.',
      },
      {
        q: 'What do the free 5 GB mean?',
        a: 'One whole mailbox measured at 5 GB or less moves for free. We will not copy the first 5 GB of a large mailbox and then stop out of the blue.',
      },
      {
        q: 'Can I close the browser?',
        a: 'In the hosted version the job runs on our worker and keeps going after you close the tab. The local Windows client has to stay open.',
      },
      {
        q: 'What if the transfer breaks off?',
        a: 'Start it again. imapsync checks what is already on the destination and copies only what is missing — a rerun is cheap and creates no duplicates.',
      },
    ],
    colB: [
      {
        q: 'Why does Windows have no cloud limit?',
        a: 'The work and the traffic are handled by the user’s own machine, so the commercial MoveMailbox Cloud limit does not apply. Provider-side limits still do.',
      },
      {
        q: 'Does the old mail get deleted?',
        a: 'No. The default scenario is a one-way copy. Only delete the old mailbox after checking things by hand and letting a grace period pass.',
      },
      {
        q: 'Which servers are supported?',
        a: 'Any compatible IMAP server. Gmail, Microsoft and some corporate systems may require an app password, IMAP to be switched on, or OAuth.',
      },
      {
        q: 'Are dates, flags and attachments preserved?',
        a: 'Yes. The original RFC-822 object is moved whole: headers, date, attachments, read/answered flags, nested folder structure. Server-side filters, auto-replies and contacts are not moved — they are not part of IMAP.',
      },
    ],
  },
  uk: {
    eyebrow: 'FAQ',
    h2: 'Перед першим перенесенням',
    colA: [
      {
        q: 'Що відбувається з моїм паролем?',
        a: 'З’єднання захищене HTTPS. Перед постановкою завдання в чергу облікові дані шифруються для воркера: відкритий пароль не зберігається, тимчасово лежить зашифрований пакет. Розшифрування відбувається в пам’яті воркера, далі дані передаються процесу imapsync через оточення. У журналах пароль не з’являється, для повторного запуску його вводять наново. Якщо такої моделі замало — є self-hosted, де пароль передається вашим поштовим серверам без інфраструктури MoveMailbox.',
      },
      {
        q: 'Що означають безкоштовні 5 ГБ?',
        a: 'Безкоштовно переноситься одна ціла скринька, оцінена в 5 ГБ або менше. Ми не копіюватимемо перші 5 ГБ великої скриньки, щоб потім раптово спинитися.',
      },
      {
        q: 'Чи можна закрити браузер?',
        a: 'У hosted-версії завдання виконується на нашому worker і триває після закриття вкладки. Локальний Windows-клієнт має лишатися запущеним.',
      },
      {
        q: 'Що робити, якщо перенесення обірвалося?',
        a: 'Запустити знову. imapsync звіряє, що вже лежить у призначенні, і копіює лише те, чого бракує — повтор дешевий і не створює дублів.',
      },
    ],
    colB: [
      {
        q: 'Чому у Windows немає хмарного ліміту?',
        a: 'Роботу і трафік забезпечує комп’ютер користувача, тому комерційний ліміт MoveMailbox Cloud не застосовується. Обмеження провайдера лишаються.',
      },
      {
        q: 'Чи видаляється стара пошта?',
        a: 'Ні. Базовий сценарій — одностороннє копіювання. Стару скриньку варто видаляти лише після ручного звіряння та резервного періоду.',
      },
      {
        q: 'Які сервери підтримуються?',
        a: 'Сумісні IMAP-сервери. Gmail, Microsoft і деякі корпоративні системи можуть вимагати пароль застосунку, увімкнення IMAP або OAuth.',
      },
      {
        q: 'Чи збережуться дати, прапорці та вкладення?',
        a: 'Так. Переноситься вихідний RFC-822 об’єкт цілком: заголовки, дата, вкладення, прапорці прочитано/відповіджено, структура вкладених папок. Не переносяться серверні фільтри, автовідповіді та контакти — це не IMAP.',
      },
    ],
  },
} as const satisfies Record<'ru' | 'en' | 'uk', FaqFullCopy>;
