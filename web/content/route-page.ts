/** Обвязка страницы маршрута: заголовки блоков и подписи, не сам контент. */
export const routePage = {
  ru: {
    home: 'Главная',
    routes: 'Маршруты',
    from: 'ОТКУДА',
    to: 'КУДА',
    server: 'Сервер IMAP',
    port: 'Порт',
    login: 'Логин',
    loginEmail: 'полный адрес',
    loginLocal: 'часть до @',
    password: 'Пароль',
    passwordApp: 'пароль приложения',
    passwordPlain: 'пароль от ящика',
    cta: (from: string, to: string) => `Перенести ${from} → ${to}`,
    pitfallsA: 'Что ломает перенос',
    pitfallsB: 'именно на этой паре',
    faqEyebrow: 'FAQ',
    faqTitle: 'Частые вопросы',
    relatedEyebrow: 'Смежные маршруты',
    relatedTitle: 'Другие направления',
    steps: {
      prepSource: (p: string) => `Подготовить ${p}`,
      prepSourceText: (p: string, app: boolean) =>
        `Включите IMAP и создайте пароль${app ? ' приложения' : ''} в ${p}.`,
      prepDest: (p: string) => `Подготовить ${p}`,
      prepDestText: (p: string) =>
        `Создайте ящик в ${p} и убедитесь, что места хватает под весь объём.`,
      servers: 'Указать серверы',
      serversText: (a: string, b: string) =>
        `Источник — ${a}:993, назначение — ${b}:993, оба по SSL/TLS.`,
      run: 'Запустить и сверить',
      runText:
        'Замерьте объём, запустите перенос и сверьте счётчики писем по папкам.',
    },
  },
  en: {
    home: 'Home',
    routes: 'Routes',
    from: 'FROM',
    to: 'TO',
    server: 'IMAP server',
    port: 'Port',
    login: 'Username',
    loginEmail: 'full address',
    loginLocal: 'part before @',
    password: 'Password',
    passwordApp: 'app password',
    passwordPlain: 'mailbox password',
    cta: (from: string, to: string) => `Move ${from} → ${to}`,
    pitfallsA: 'What breaks',
    pitfallsB: 'on this particular pair',
    faqEyebrow: 'FAQ',
    faqTitle: 'Common questions',
    relatedEyebrow: 'Related routes',
    relatedTitle: 'Other directions',
    steps: {
      prepSource: (p: string) => `Prepare ${p}`,
      prepSourceText: (p: string, app: boolean) =>
        `Turn on IMAP and create an ${app ? 'app password' : 'account password'} in ${p}.`,
      prepDest: (p: string) => `Prepare ${p}`,
      prepDestText: (p: string) =>
        `Create the mailbox in ${p} and make sure it has room for the whole archive.`,
      servers: 'Set the servers',
      serversText: (a: string, b: string) =>
        `Source ${a}:993, destination ${b}:993, both over SSL/TLS.`,
      run: 'Run and reconcile',
      runText:
        'Measure the size, start the transfer, then compare message counts folder by folder.',
    },
  },
  uk: {
    home: 'Головна',
    routes: 'Маршрути',
    from: 'ЗВІДКИ',
    to: 'КУДИ',
    server: 'Сервер IMAP',
    port: 'Порт',
    login: 'Логін',
    loginEmail: 'повна адреса',
    loginLocal: 'частина до @',
    password: 'Пароль',
    passwordApp: 'пароль застосунку',
    passwordPlain: 'пароль від скриньки',
    cta: (from: string, to: string) => `Перенести ${from} → ${to}`,
    pitfallsA: 'Що ламає перенесення',
    pitfallsB: 'саме на цій парі',
    faqEyebrow: 'FAQ',
    faqTitle: 'Часті питання',
    relatedEyebrow: 'Суміжні маршрути',
    relatedTitle: 'Інші напрямки',
    steps: {
      prepSource: (p: string) => `Підготувати ${p}`,
      prepSourceText: (p: string, app: boolean) =>
        `Увімкніть IMAP і створіть пароль${app ? ' застосунку' : ''} у ${p}.`,
      prepDest: (p: string) => `Підготувати ${p}`,
      prepDestText: (p: string) =>
        `Створіть скриньку в ${p} і переконайтеся, що місця вистачає на весь обсяг.`,
      servers: 'Вказати сервери',
      serversText: (a: string, b: string) =>
        `Джерело — ${a}:993, призначення — ${b}:993, обидва через SSL/TLS.`,
      run: 'Запустити та звірити',
      runText:
        'Заміряйте обсяг, запустіть перенесення і звірте лічильники листів по папках.',
    },
  },
} as const;
