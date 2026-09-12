/** Копия секции «Как это работает». Один файл на секцию — три языка рядом. */
export const howItWorks = {
  ru: {
    eyebrow: 'Как это работает',
    h2a: 'До нового ящика — ',
    h2b: 'четыре понятных шага.',
    s1: {
      tm: '≈ 30 секунд',
      h3: 'Подключите',
      p1: 'Введите IMAP-серверы, логины почтовых ящиков и пароли приложения. Порт подставится сам: ',
      p2: ' для SSL/TLS, ',
      p3: ' для STARTTLS.',
    },
    s2: {
      tm: '≈ 1 минута',
      h3: 'Проверьте',
      p: 'Мы отдельно проверим TLS и авторизацию, затем оценим полный объём почты. Ошибка скажет, что именно не сошлось — сертификат или пароль.',
    },
    s3: {
      tm: 'от часа до суток',
      h3: 'Запустите',
      p: 'Ящик до 5 ГБ переносится бесплатно. Для большего объёма сначала выбирается тариф. Повторный запуск докидывает только недостающие письма.',
    },
    s4: {
      tm: '≈ 5 минут',
      h3: 'Сверьте',
      p: 'Получите отчёт и сравните папки до удаления или отключения старого ящика. Мы не удаляем исходный ящик ни при каком сценарии.',
    },
  },
  en: {
    eyebrow: 'How it works',
    h2a: 'Your new mailbox is ',
    h2b: 'four clear steps away.',
    s1: {
      tm: '≈ 30 seconds',
      h3: 'Connect',
      p1: 'Enter the IMAP servers, mailbox logins and app passwords. The port fills itself in: ',
      p2: ' for SSL/TLS, ',
      p3: ' for STARTTLS.',
    },
    s2: {
      tm: '≈ 1 minute',
      h3: 'Check',
      p: 'We test TLS and authentication separately, then measure the full size of the mailbox. If something fails, the error says which part — the certificate or the password.',
    },
    s3: {
      tm: 'an hour to a day',
      h3: 'Run it',
      p: 'A mailbox up to 5 GB transfers for free. Above that you pick a plan first. Running it again copies only the messages that are missing.',
    },
    s4: {
      tm: '≈ 5 minutes',
      h3: 'Compare',
      p: 'You get a report — compare the folders before deleting or shutting down the old mailbox. We never delete the source mailbox, under any scenario.',
    },
  },
  uk: {
    eyebrow: 'Як це працює',
    h2a: 'До нової скриньки — ',
    h2b: 'чотири зрозумілі кроки.',
    s1: {
      tm: '≈ 30 секунд',
      h3: 'Підключіть',
      p1: 'Введіть IMAP-сервери, логіни поштових скриньок і паролі застосунку. Порт підставиться сам: ',
      p2: ' для SSL/TLS, ',
      p3: ' для STARTTLS.',
    },
    s2: {
      tm: '≈ 1 хвилина',
      h3: 'Перевірте',
      p: 'Ми окремо перевіримо TLS і авторизацію, потім оцінимо повний обсяг пошти. Помилка підкаже, що саме не зійшлося — сертифікат чи пароль.',
    },
    s3: {
      tm: 'від години до доби',
      h3: 'Запустіть',
      p: 'Скринька до 5 ГБ переноситься безкоштовно. Для більшого обсягу спершу обирається тариф. Повторний запуск докидає лише ті листи, яких бракує.',
    },
    s4: {
      tm: '≈ 5 хвилин',
      h3: 'Звірте',
      p: 'Отримайте звіт і порівняйте папки до видалення чи вимкнення старої скриньки. Ми не видаляємо вихідну скриньку за жодного сценарію.',
    },
  },
} as const;
