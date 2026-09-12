import type { BlogPost } from '@/data/blog-posts';

export const verifyMigration: BlogPost = {
  slug: 'verify-migration',
  date: '2026-09-12',
  icon: 'ck',
  ru: {
    title: 'Как проверить, что почта перенеслась — MoveMailbox',
    description:
      'Сверка после переноса: почему гигабайты не сходятся, как считать письма по папкам, что проверить выборочно и когда можно удалять старый ящик.',
    h1: 'Как проверить, что перенеслось всё',
    tag: 'Проверка',
    card: 'Сверять надо письма по папкам, а не объём: гигабайты не сходятся всегда и это нормально. Порядок проверки и признаки, что что-то пропущено.',
    lede: 'Перенос закончился без ошибок — это ещё не «всё на месте». Проверка занимает десять минут и делается один раз, зато после неё старый ящик можно закрывать спокойно.',
    blocks: [
      {
        h2: 'Почему объём не сходится и это нормально',
        paragraphs: [
          'Первое, что делает человек после переноса, — сравнивает гигабайты. И почти всегда видит расхождение, из которого делает неверный вывод.',
          'Провайдеры по-разному считают занятое место: кто-то учитывает служебные индексы, кто-то округляет, кто-то хранит вложения дедуплицированно. К этому добавляются заголовки, которые принимающий сервер дописывает сам.',
          'Поэтому единица сверки — письмо, а не байт. Число писем по папкам должно совпадать; объём — не обязан.',
        ],
      },
      {
        h2: 'Порядок сверки',
        paragraphs: [
          'Делается один раз после последнего прохода и занимает несколько минут.',
        ],
        steps: [
          'Сравните число писем в каждой папке с обеих сторон. Расхождение в ноль — цель; расхождение в одну-две штуки в «Корзине» и «Спаме» обычно неважно.',
          'Проверьте, что дерево папок совпадает по составу и вложенности, а не только по количеству писем.',
          'Откройте самое старое письмо в архиве и самое свежее: первое ловит проблемы с кодировками, второе — незавершённый второй проход.',
          'Проверьте пару писем с крупными вложениями: они первыми страдают от лимитов на размер сообщения.',
          'Отправьте тестовое письмо на новый ящик и ответьте с него — это проверка не переноса, а настройки нового сервера.',
        ],
      },
      {
        h2: 'Признаки, что что-то пропущено',
        paragraphs: [
          'Четыре расхождения встречаются чаще всего, и у каждого понятная причина.',
        ],
        bullets: [
          'Папка есть, писем в ней нет — папку создали, но копирование до неё не дошло: перезапустите проход.',
          'В одной папке писем меньше ровно на несколько штук — почти всегда лимит на размер письма на приёмнике: Microsoft 365 не переносит письма больше 35 МБ, iCloud не принимает больше 20 МБ.',
          'Писем больше, чем на источнике — это дубли из «Всей почты» Gmail, а не ошибка сверки.',
          'Все письма на месте, но помечены непрочитанными — статусы не перенеслись; это нормально для части провайдеров.',
        ],
      },
      {
        h2: 'Когда можно удалять старый ящик',
        paragraphs: [
          'Не сразу. Разумная практика — оставить исходный ящик нетронутым две-четыре недели после переключения MX. За это время всплывают редкие письма, о которых никто не вспомнил в день переезда.',
          'Пока обе стороны существуют, любую ошибку можно исправить повторным проходом. После удаления источника исправлять уже нечего — и именно на этом шаге почту теряют по-настоящему.',
        ],
      },
    ],
    faq: [
      [
        'Сколько писем может «не хватать» при нормальном переносе?',
        'В идеале ноль. Расхождения обычно объясняются лимитом на размер письма, спамом или корзиной, которые исключали намеренно.',
      ],
      [
        'Почему объём на новом сервере больше?',
        'Принимающий сервер дописывает свои служебные заголовки и может иначе считать вложения. Сверяйте письма, а не байты.',
      ],
      [
        'Перенеслись ли статусы прочитано и флаги?',
        'Обычно да, но не у всех провайдеров. Это свойство принимающей стороны, а не переноса.',
      ],
      [
        'Можно ли запустить сверку, не копируя ничего?',
        'Да, для этого есть отдельный режим подсчёта: он читает списки папок и писем и ничего не пишет.',
      ],
    ],
    links: [
      { path: '/docs/errors', label: 'Разборы ошибок IMAP' },
      { path: '/migrate/gmail-to-outlook', label: 'Перенос с Gmail на Outlook' },
      { path: '/security', label: 'Как устроен перенос и что с данными' },
    ],
  },
  en: {
    title: 'How to verify a mail migration — MoveMailbox',
    description:
      'Checking after the move: why gigabytes never match, how to compare message counts per folder, what to spot-check and when to delete the old mailbox.',
    h1: 'How to check that everything made it across',
    tag: 'Verification',
    card: 'Compare messages per folder, not volume: the gigabytes never match and that is fine. The checking order and the signs that something is missing.',
    lede: 'A migration that finished without errors is not yet proof that everything is there. The check takes ten minutes, happens once, and lets you close the old mailbox without second thoughts.',
    blocks: [
      {
        h2: 'Why the size never matches, and why that is fine',
        paragraphs: [
          'The first thing people do after a migration is compare gigabytes. They almost always find a difference and draw the wrong conclusion from it.',
          'Providers account for used space differently: some include indexes, some round, some deduplicate attachments. Add the headers the receiving server writes itself.',
          'So the unit of verification is the message, not the byte. Message counts per folder should match; sizes are not required to.',
        ],
      },
      {
        h2: 'The checking order',
        paragraphs: ['Done once after the final pass, a few minutes of work.'],
        steps: [
          'Compare message counts in every folder on both sides. Zero difference is the goal; one or two in Trash and Spam rarely matter.',
          'Confirm the folder tree matches in composition and nesting, not only in message counts.',
          'Open the oldest message in the archive and the newest one: the first catches encoding problems, the second an unfinished second pass.',
          'Check a couple of messages with large attachments — they are the first casualties of message-size limits.',
          'Send a test message to the new mailbox and reply from it. That checks the new server setup rather than the migration.',
        ],
      },
      {
        h2: 'Signs that something is missing',
        paragraphs: ['Four discrepancies come up most often, each with a clear cause.'],
        bullets: [
          'The folder exists but is empty — it was created and copying never reached it; run the pass again.',
          'One folder is short by a few messages — almost always a message-size limit on the destination: Microsoft 365 does not migrate messages over 35 MB, and iCloud caps them at 20 MB.',
          'More messages than on the source — those are Gmail All Mail duplicates, not a counting error.',
          'Everything is there but marked unread — flags did not travel, which is normal with some providers.',
        ],
      },
      {
        h2: 'When to delete the old mailbox',
        paragraphs: [
          'Not immediately. Sensible practice is to leave the source untouched for two to four weeks after the MX switch. That is when the rare messages nobody thought about on moving day surface.',
          'While both sides exist, any mistake is fixable with another pass. Once the source is gone there is nothing to fix from — and that is the step where mail is genuinely lost.',
        ],
      },
    ],
    faq: [
      [
        'How many messages can legitimately be missing?',
        'Ideally none. Differences usually trace back to a message-size limit, or to Spam and Trash that were excluded on purpose.',
      ],
      [
        'Why is the new mailbox larger?',
        'The receiving server adds its own headers and may count attachments differently. Compare messages, not bytes.',
      ],
      [
        'Do read flags survive?',
        'Usually, but not with every provider. That is a property of the receiving side, not of the migration.',
      ],
      [
        'Can I run a check without copying anything?',
        'Yes, there is a counting mode that reads folder and message lists and writes nothing.',
      ],
    ],
    links: [
      { path: '/docs/errors', label: 'IMAP error write-ups' },
      { path: '/migrate/gmail-to-outlook', label: 'Move from Gmail to Outlook' },
      { path: '/security', label: 'How the migration handles your data' },
    ],
  },
  uk: {
    title: 'Як перевірити, що пошта перенеслася — MoveMailbox',
    description:
      'Звірка після перенесення: чому гігабайти не сходяться, як рахувати листи за папками, що перевірити вибірково і коли можна видаляти стару скриньку.',
    h1: 'Як перевірити, що перенеслося все',
    tag: 'Перевірка',
    card: 'Звіряти треба листи за папками, а не обсяг: гігабайти не сходяться завжди, і це нормально. Порядок перевірки й ознаки, що щось пропущено.',
    lede: 'Перенесення завершилося без помилок — це ще не «все на місці». Перевірка триває десять хвилин і робиться один раз, зате після неї стару скриньку можна закривати спокійно.',
    blocks: [
      {
        h2: 'Чому обсяг не сходиться і це нормально',
        paragraphs: [
          'Перше, що робить людина після перенесення, — порівнює гігабайти. І майже завжди бачить розбіжність, з якої робить хибний висновок.',
          'Провайдери по-різному рахують зайняте місце: хтось враховує службові індекси, хтось округлює, хтось зберігає вкладення дедуплікованими.',
          'Тому одиниця звірки — лист, а не байт. Кількість листів за папками має збігатися; обсяг — не зобов’язаний.',
        ],
      },
      {
        h2: 'Порядок звірки',
        paragraphs: ['Робиться один раз після останнього проходу.'],
        steps: [
          'Порівняйте кількість листів у кожній папці з обох боків.',
          'Перевірте, що дерево папок збігається за складом і вкладеністю.',
          'Відкрийте найстаріший лист в архіві й найсвіжіший: перший ловить проблеми з кодуваннями, другий — незавершений другий прохід.',
          'Перевірте пару листів із великими вкладеннями: вони першими страждають від лімітів на розмір повідомлення.',
          'Надішліть тестовий лист на нову скриньку й відповідайте з неї.',
        ],
      },
      {
        h2: 'Ознаки, що щось пропущено',
        paragraphs: ['Чотири розбіжності трапляються найчастіше, і в кожної зрозуміла причина.'],
        bullets: [
          'Папка є, листів у ній немає — копіювання до неї не дійшло: перезапустіть прохід.',
          'В одній папці листів менше рівно на кілька штук — майже завжди ліміт на розмір листа на приймачі: Microsoft 365 не переносить листи понад 35 МБ, iCloud не приймає понад 20 МБ.',
          'Листів більше, ніж на джерелі — це дублі з «Усієї пошти» Gmail, а не помилка звірки.',
          'Усі листи на місці, але позначені непрочитаними — статуси не перенеслися.',
        ],
      },
      {
        h2: 'Коли можна видаляти стару скриньку',
        paragraphs: [
          'Не одразу. Розумна практика — лишити вихідну скриньку недоторканою два-чотири тижні після перемикання MX.',
          'Доки обидві сторони існують, будь-яку помилку можна виправити повторним проходом. Після видалення джерела виправляти вже нічого.',
        ],
      },
    ],
    faq: [
      [
        'Скільки листів може «бракувати» за нормального перенесення?',
        'В ідеалі нуль. Розбіжності зазвичай пояснюються лімітом на розмір листа або навмисно виключеними спамом і кошиком.',
      ],
      [
        'Чому обсяг на новому сервері більший?',
        'Приймальний сервер дописує свої службові заголовки. Звіряйте листи, а не байти.',
      ],
      [
        'Чи перенеслися статуси прочитано й прапорці?',
        'Зазвичай так, але не в усіх провайдерів.',
      ],
      [
        'Чи можна запустити звірку, нічого не копіюючи?',
        'Так, для цього є окремий режим підрахунку.',
      ],
    ],
    links: [
      { path: '/docs/errors', label: 'Розбори помилок IMAP' },
      { path: '/migrate/gmail-to-outlook', label: 'Перенесення з Gmail на Outlook' },
      { path: '/security', label: 'Як влаштоване перенесення і що з даними' },
    ],
  },
};
