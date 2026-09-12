/** Копия секции «Безопасность». Один файл на секцию — три языка рядом. */
export const security = {
  ru: {
    eyebrow: 'Безопасность',
    h2a: 'Как мы защищаем ',
    h2b: 'ваши данные.',
    lede: 'Для онлайн-переноса воркеру нужен доступ к обоим ящикам — иначе копировать письма нечем. Поэтому важно не обещание «мы серьёзно относимся к безопасности», а точное описание того, что происходит с учётными данными на каждом шаге.',
    go: 'Модель безопасности и сообщение об уязвимости',
    live: 'Онлайн-сервис готовится',
    upd: 'предварительная версия',
    items: [
      {
        tag: 'TTL',
        title: 'Отдельный ключ на каждое задание',
        text: 'Соединение с сайтом защищено HTTPS. Перед постановкой задания в очередь учётные данные дополнительно шифруются для воркера: в хранилище попадает зашифрованный пакет, открытый пароль не сохраняется и не пишется в журналы. Пакет и ключ помечаются на удаление при завершении задания или по таймауту.',
      },
      {
        tag: 'IN-MEMORY',
        title: 'Расшифровка в памяти воркера',
        text: 'Пакет расшифровывается в памяти воркера в момент запуска и живёт там до конца переноса. Сам перенос выполняется отдельным процессом imapsync под управлением воркера — учётные данные передаются процессу через окружение и не попадают в аргументы команды.',
      },
      {
        tag: 'NO-STORE',
        title: 'Письма не задерживаются',
        text: 'Сообщения передаются потоком со старого сервера на новый. Мы не храним содержимое писем: MoveMailbox не становится копией вашей переписки.',
      },
      {
        tag: 'SELF-HOSTED',
        title: 'Или не отдавайте пароль вовсе',
        text: 'Настольный клиент и Docker-сборка работают целиком у вас: почта идёт напрямую между вашими серверами, наша инфраструктура не участвует. Это самый строгий вариант, и он бесплатный.',
      },
    ],
    footNote: 'Код на GitHub · ядро и клиенты на GitHub',
    footLink: 'Посмотреть код',
  },
  en: {
    eyebrow: 'Security',
    h2a: 'How we protect ',
    h2b: 'your data.',
    lede: 'For an online transfer the worker needs access to both mailboxes — otherwise there is nothing to copy the messages with. So what matters is not a promise that “we take security seriously”, but a precise description of what happens to the credentials at each step.',
    go: 'Security model and how to report a vulnerability',
    live: 'Online service in preparation',
    upd: 'preview version',
    items: [
      {
        tag: 'TTL',
        title: 'A separate key for every job',
        text: 'The connection to the site is protected by HTTPS. Before a job is put in the queue, the credentials are additionally encrypted for the worker: what goes into storage is an encrypted bundle, the plaintext password is not stored and is not written to the logs. The bundle and the key are marked for deletion when the job finishes or on timeout.',
      },
      {
        tag: 'IN-MEMORY',
        title: 'Decryption in the worker’s memory',
        text: 'The bundle is decrypted in the worker’s memory at start-up and lives there until the transfer ends. The transfer itself is carried out by a separate imapsync process managed by the worker — the credentials are passed to that process through the environment and do not end up in the command arguments.',
      },
      {
        tag: 'NO-STORE',
        title: 'Messages do not linger',
        text: 'Messages are streamed from the old server to the new one. We do not store message contents: MoveMailbox does not become a copy of your correspondence.',
      },
      {
        tag: 'SELF-HOSTED',
        title: 'Or do not hand over the password at all',
        text: 'The desktop client and the Docker build run entirely on your side: mail goes directly between your servers, our infrastructure is not involved. This is the strictest option, and it is free.',
      },
    ],
    footNote: 'Code on GitHub · core and clients on GitHub',
    footLink: 'View the code',
  },
  uk: {
    eyebrow: 'Безпека',
    h2a: 'Як ми захищаємо ',
    h2b: 'ваші дані.',
    lede: 'Для онлайн-перенесення воркеру потрібен доступ до обох скриньок — інакше копіювати листи нічим. Тому важлива не обіцянка «ми серйозно ставимося до безпеки», а точний опис того, що відбувається з обліковими даними на кожному кроці.',
    go: 'Модель безпеки та повідомлення про вразливість',
    live: 'Онлайн-сервіс готується',
    upd: 'попередня версія',
    items: [
      {
        tag: 'TTL',
        title: 'Окремий ключ на кожне завдання',
        text: 'З’єднання із сайтом захищене HTTPS. Перед постановкою завдання в чергу облікові дані додатково шифруються для воркера: у сховище потрапляє зашифрований пакет, відкритий пароль не зберігається і не пишеться в журнали. Пакет і ключ позначаються на видалення при завершенні завдання або за таймаутом.',
      },
      {
        tag: 'IN-MEMORY',
        title: 'Розшифрування в пам’яті воркера',
        text: 'Пакет розшифровується в пам’яті воркера в момент запуску і живе там до кінця перенесення. Саме перенесення виконується окремим процесом imapsync під керуванням воркера — облікові дані передаються процесу через оточення і не потрапляють в аргументи команди.',
      },
      {
        tag: 'NO-STORE',
        title: 'Листи не затримуються',
        text: 'Повідомлення передаються потоком зі старого сервера на новий. Ми не зберігаємо вміст листів: MoveMailbox не стає копією вашого листування.',
      },
      {
        tag: 'SELF-HOSTED',
        title: 'Або не віддавайте пароль узагалі',
        text: 'Настільний клієнт і Docker-збірка працюють цілком у вас: пошта йде напряму між вашими серверами, наша інфраструктура не бере участі. Це найсуворіший варіант, і він безкоштовний.',
      },
    ],
    footNote: 'Код на GitHub · ядро та клієнти на GitHub',
    footLink: 'Переглянути код',
  },
} as const;
