import type { BlogPost } from '@/data/blog-posts';

export const migrationInterrupted: BlogPost = {
  slug: 'migration-interrupted',
  date: '2026-09-12',
  icon: 'rf',
  ru: {
    title: 'Если перенос почты оборвался — MoveMailbox',
    description:
      'Обрыв переноса не ломает почту и не создаёт дублей: повтор копирует только недостающее. Что проверить перед перезапуском и чего делать не нужно.',
    h1: 'Что делать, если перенос оборвался',
    tag: 'Надёжность',
    card: 'Перезапуск — нормальная часть процесса, а не аварийное восстановление. Почему повтор дешёвый, не даёт дублей и что стоит проверить перед ним.',
    lede: 'Обрыв на середине выглядит страшнее, чем есть. Ни одно письмо при этом не пропадает: исходный ящик никто не трогал, а на приёмнике лежит ровно то, что успело скопироваться.',
    blocks: [
      {
        h2: 'Почему повтор безопасен',
        paragraphs: [
          'Перенос по IMAP — копирование, а не перемещение. Письма на источнике остаются нетронутыми от начала и до конца, что бы ни случилось с процессом.',
          'Перед копированием инструмент сверяет, что уже есть на приёмнике, и пропускает совпадения. Поэтому второй запуск после обрыва не начинает всё сначала: он проходит по спискам, видит уже перенесённое и копирует только остаток.',
          'Из этого же следует, что повтор дешёвый по времени. Если из десяти гигабайт успели переехать восемь, второй проход займёт время двух, а не десяти.',
        ],
      },
      {
        h2: 'Почему обрывается',
        paragraphs: [
          'Причины почти всегда на стороне провайдера или сети, а не в самих письмах.',
        ],
        bullets: [
          'Суточная квота на выгрузку: провайдер перестаёт отдавать письма до следующих суток.',
          'Лимит одновременных подключений: сервер закрывает сессию, если клиентов слишком много.',
          'Таймаут на длинной паузе — например, на папке с очень большими вложениями.',
          'Закончилось место в ящике-приёмнике, особенно на бесплатных тарифах.',
          'Разорванная сеть или уснувший ноутбук при локальном переносе.',
        ],
      },
      {
        h2: 'Что сделать перед перезапуском',
        paragraphs: [
          'Пять минут проверки экономят второй обрыв на том же месте.',
        ],
        steps: [
          'Посмотрите последнюю ошибку: она обычно прямо называет причину — квота, число подключений, место или сертификат.',
          'Если это квота — подождите до следующих суток, повтор раньше даст тот же результат.',
          'Проверьте свободное место в принимающем ящике и освободите, если упёрлись в лимит.',
          'Запустите перенос заново с теми же параметрами и тем же списком исключений.',
          'После завершения сверьте число писем по папкам с обеих сторон.',
        ],
      },
      {
        h2: 'Чего делать не нужно',
        paragraphs: [
          'Не стоит удалять то, что уже перенеслось, и начинать с чистого ящика: это ровно та работа, которую повтор умеет не делать.',
          'Не стоит запускать несколько копий переноса параллельно, чтобы «догнать быстрее». Провайдер ответит отказом по числу подключений, и вы получите третий обрыв вместо ускорения.',
          'И не стоит удалять исходный ящик до сверки. Пока обе стороны на месте, любая ошибка обратима; после удаления источника — уже нет.',
        ],
      },
    ],
    faq: [
      [
        'Появятся ли дубли после перезапуска?',
        'Нет. Инструмент сверяет письма на приёмнике по идентификаторам и заголовкам и копирует только отсутствующие.',
      ],
      [
        'Можно ли продолжить с той же папки, а не с начала?',
        'Проход всё равно начнётся с начала списка, но уже перенесённые письма будут пропущены — по времени это и есть продолжение.',
      ],
      [
        'Пострадает ли исходный ящик?',
        'Нет. Перенос только читает источник. Режим зеркалирования, который умеет удалять на приёмнике, включается отдельно и никогда не повторяется автоматически.',
      ],
      [
        'Сервер отвечает, что превышена квота',
        'Это отдельная ошибка с понятным разбором: либо суточный лимит выгрузки, либо место в ящике-приёмнике.',
      ],
    ],
    links: [
      { path: '/docs/errors/quota-exceeded', label: 'Ошибка QUOTA EXCEEDED: разбор' },
      { path: '/docs/errors', label: 'Все разборы ошибок IMAP' },
      { path: '/download', label: 'Локальный клиент без лимита объёма' },
    ],
  },
  en: {
    title: 'When a migration stops halfway — MoveMailbox',
    description:
      'An interrupted migration breaks nothing and creates no duplicates: a repeat run copies only what is missing. What to check first and what not to do.',
    h1: 'What to do when a migration is interrupted',
    tag: 'Reliability',
    card: 'Restarting is a normal part of the process, not disaster recovery. Why a repeat run is cheap, duplicate-free, and what to check before it.',
    lede: 'Stopping halfway looks worse than it is. No message is lost: the source mailbox was never touched, and the destination holds exactly what made it across.',
    blocks: [
      {
        h2: 'Why repeating is safe',
        paragraphs: [
          'An IMAP migration copies, it does not move. Messages on the source stay untouched from start to finish, whatever happens to the process.',
          'Before copying anything, the tool checks what the destination already has and skips the matches. So a second run after an interruption does not start over: it walks the lists, sees what is already there, and copies the remainder.',
          'That also makes the repeat cheap. If eight of ten gigabytes made it, the second pass costs the time of two, not of ten.',
        ],
      },
      {
        h2: 'Why it stops',
        paragraphs: [
          'The causes are almost always on the provider or network side, not in the messages.',
        ],
        bullets: [
          'A daily export quota: the provider stops handing out messages until the next day.',
          'A cap on simultaneous connections: the server closes the session when there are too many clients.',
          'A timeout on a long pause — a folder with very large attachments, for instance.',
          'The destination mailbox is out of space, which free plans hit quickly.',
          'A dropped network or a laptop that went to sleep during a local run.',
        ],
      },
      {
        h2: 'What to check before restarting',
        paragraphs: ['Five minutes of checking saves a second stop in the same place.'],
        steps: [
          'Read the last error: it usually names the cause outright — quota, connections, space or certificate.',
          'If it is a quota, wait for the next day; repeating sooner produces the same result.',
          'Check free space in the destination mailbox and clear some if you hit the limit.',
          'Start the migration again with the same parameters and the same exclusions.',
          'When it finishes, compare message counts per folder on both sides.',
        ],
      },
      {
        h2: 'What not to do',
        paragraphs: [
          'Do not delete what already arrived and start from an empty mailbox: that is precisely the work a repeat run knows how to skip.',
          'Do not run several copies in parallel to catch up faster. The provider will refuse on connection count, and you get a third interruption instead of speed.',
          'And do not delete the source mailbox before the counts match. While both sides exist, every mistake is reversible; after the source is gone, none of them are.',
        ],
      },
    ],
    faq: [
      [
        'Will a restart create duplicates?',
        'No. The tool compares messages on the destination by identifier and headers and copies only the missing ones.',
      ],
      [
        'Can it resume from the same folder instead of the beginning?',
        'The pass still starts at the top of the list, but already-copied messages are skipped — in time terms, that is resuming.',
      ],
      [
        'Can the source mailbox be damaged?',
        'No. The migration only reads the source. Mirror mode, which can delete on the destination, is a separate opt-in and is never replayed automatically.',
      ],
      [
        'The server says the quota is exceeded',
        'That is a distinct error with its own write-up: either the daily export limit or space in the destination mailbox.',
      ],
    ],
    links: [
      { path: '/docs/errors/quota-exceeded', label: 'QUOTA EXCEEDED explained' },
      { path: '/docs/errors', label: 'All IMAP error write-ups' },
      { path: '/download', label: 'Local client with no size cap' },
    ],
  },
  uk: {
    title: 'Якщо перенесення пошти обірвалося — MoveMailbox',
    description:
      'Обрив перенесення не ламає пошту й не створює дублів: повтор копіює лише те, чого бракує. Що перевірити перед перезапуском і чого робити не треба.',
    h1: 'Що робити, якщо перенесення обірвалося',
    tag: 'Надійність',
    card: 'Перезапуск — нормальна частина процесу, а не аварійне відновлення. Чому повтор дешевий, не дає дублів і що варто перевірити перед ним.',
    lede: 'Обрив посередині має страшніший вигляд, ніж є насправді. Жоден лист при цьому не зникає: вихідну скриньку ніхто не чіпав, а на приймачі лежить рівно те, що встигло скопіюватися.',
    blocks: [
      {
        h2: 'Чому повтор безпечний',
        paragraphs: [
          'Перенесення по IMAP — копіювання, а не переміщення. Листи на джерелі лишаються недоторканими від початку й до кінця.',
          'Перед копіюванням інструмент звіряє, що вже є на приймачі, і пропускає збіги. Тому другий запуск після обриву не починає все спочатку: він копіює лише залишок.',
          'Із цього ж випливає, що повтор дешевий за часом. Якщо з десяти гігабайтів встигли переїхати вісім, другий прохід триватиме як два, а не як десять.',
        ],
      },
      {
        h2: 'Чому обривається',
        paragraphs: ['Причини майже завжди на боці провайдера або мережі, а не в самих листах.'],
        bullets: [
          'Добова квота на вивантаження: провайдер перестає віддавати листи до наступної доби.',
          'Ліміт одночасних підключень: сервер закриває сесію, якщо клієнтів забагато.',
          'Тайм-аут на довгій паузі — наприклад, на папці з дуже великими вкладеннями.',
          'Закінчилося місце у скриньці-приймачі, особливо на безплатних тарифах.',
          'Розірвана мережа або ноутбук, що заснув, під час локального перенесення.',
        ],
      },
      {
        h2: 'Що зробити перед перезапуском',
        paragraphs: ['П’ять хвилин перевірки заощаджують другий обрив на тому самому місці.'],
        steps: [
          'Подивіться останню помилку: вона зазвичай прямо називає причину — квота, кількість підключень, місце чи сертифікат.',
          'Якщо це квота — зачекайте до наступної доби.',
          'Перевірте вільне місце у приймальній скриньці й звільніть, якщо вперлися в ліміт.',
          'Запустіть перенесення знову з тими самими параметрами й тим самим списком виключень.',
          'Після завершення звірте кількість листів за папками з обох боків.',
        ],
      },
      {
        h2: 'Чого робити не треба',
        paragraphs: [
          'Не варто видаляти те, що вже перенеслося, і починати з чистої скриньки: це саме та робота, якої повтор уміє не робити.',
          'Не варто запускати кілька копій перенесення паралельно, щоб «догнати швидше»: провайдер відмовить за кількістю підключень.',
          'І не варто видаляти вихідну скриньку до звірки. Доки обидві сторони на місці, будь-яка помилка є оборотною.',
        ],
      },
    ],
    faq: [
      [
        'Чи з’являться дублі після перезапуску?',
        'Ні. Інструмент звіряє листи на приймачі за ідентифікаторами й заголовками та копіює лише відсутні.',
      ],
      [
        'Чи можна продовжити з тієї самої папки, а не з початку?',
        'Прохід усе одно почнеться з початку списку, але вже перенесені листи буде пропущено.',
      ],
      [
        'Чи постраждає вихідна скринька?',
        'Ні. Перенесення лише читає джерело. Режим дзеркалювання вмикається окремо й ніколи не повторюється автоматично.',
      ],
      [
        'Сервер відповідає, що перевищено квоту',
        'Це окрема помилка з докладним розбором: або добовий ліміт вивантаження, або місце у скриньці-приймачі.',
      ],
    ],
    links: [
      { path: '/docs/errors/quota-exceeded', label: 'Помилка QUOTA EXCEEDED: розбір' },
      { path: '/docs/errors', label: 'Усі розбори помилок IMAP' },
      { path: '/download', label: 'Локальний клієнт без ліміту обсягу' },
    ],
  },
};
