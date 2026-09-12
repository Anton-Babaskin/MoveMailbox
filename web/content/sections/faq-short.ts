/** Копия короткого FAQ на главной. Один файл на секцию — три языка рядом. */

export type FaqItem = {
  readonly q: string;
  readonly a: string;
};

export type FaqShortCopy = {
  readonly eyebrow: string;
  readonly h2: string;
  /** Две колонки по два вопроса: разметка требует именно такой формы. */
  readonly colA: readonly FaqItem[];
  readonly colB: readonly FaqItem[];
  readonly allLink: string;
};

export const faqShort = {
  ru: {
    eyebrow: 'FAQ',
    h2: 'Перед первым переносом',
    colA: [
      {
        q: 'Что происходит с моим паролем?',
        a: 'Соединение защищено HTTPS. Перед постановкой задания в очередь учётные данные шифруются для воркера: открытый пароль не сохраняется, временно хранится зашифрованный пакет. Расшифровка — в памяти воркера на время переноса. В self-hosted пароль передаётся вашим почтовым серверам без инфраструктуры MoveMailbox.',
      },
      {
        q: 'Удаляется ли старая почта?',
        a: 'Нет. Базовый сценарий — одностороннее копирование, источник не изменяется. Старый ящик стоит отключать только после сверки счётчиков папок.',
      },
    ],
    colB: [
      {
        q: 'Что означает «до 5 ГБ бесплатно»?',
        a: 'Бесплатно переносится один целый ящик, измеренный в 5 ГБ или меньше. Мы не копируем первые 5 ГБ большого ящика и не останавливаемся на полпути — объём известен до запуска.',
      },
      {
        q: 'Что делать, если перенос оборвался?',
        a: 'Запустить снова. imapsync сверяет, что уже лежит в назначении, и копирует только недостающее — повтор дешёвый и не создаёт дублей.',
      },
    ],
    allLink: 'Все вопросы и ответы',
  },
  en: {
    eyebrow: 'FAQ',
    h2: 'Before your first transfer',
    colA: [
      {
        q: 'What happens to my password?',
        a: 'The connection runs over HTTPS. Before a job is queued, the credentials are encrypted for the worker: the plain password is never stored, only an encrypted package is kept for a while. It is decrypted in the worker’s memory for the duration of the transfer. With self-hosted, the password goes to your own mail servers and no MoveMailbox infrastructure is involved.',
      },
      {
        q: 'Does the old mail get deleted?',
        a: 'No. The default scenario is a one-way copy and the source is left untouched. Only switch the old mailbox off once you have compared the folder counts.',
      },
    ],
    colB: [
      {
        q: 'What does “up to 5 GB free” mean?',
        a: 'One whole mailbox that measures 5 GB or less moves for free. We do not copy the first 5 GB of a large mailbox and stop halfway — the size is known before the run starts.',
      },
      {
        q: 'What if the transfer breaks off?',
        a: 'Start it again. imapsync checks what is already on the destination and copies only what is missing — a rerun is cheap and creates no duplicates.',
      },
    ],
    allLink: 'All questions and answers',
  },
  uk: {
    eyebrow: 'FAQ',
    h2: 'Перед першим перенесенням',
    colA: [
      {
        q: 'Що відбувається з моїм паролем?',
        a: 'З’єднання захищене HTTPS. Перед постановкою завдання в чергу облікові дані шифруються для воркера: відкритий пароль не зберігається, тимчасово лежить зашифрований пакет. Розшифрування — у пам’яті воркера на час перенесення. У self-hosted пароль передається вашим поштовим серверам без інфраструктури MoveMailbox.',
      },
      {
        q: 'Чи видаляється стара пошта?',
        a: 'Ні. Базовий сценарій — одностороннє копіювання, джерело не змінюється. Стару скриньку варто вимикати лише після звіряння лічильників папок.',
      },
    ],
    colB: [
      {
        q: 'Що означає «до 5 ГБ безкоштовно»?',
        a: 'Безкоштовно переноситься одна ціла скринька, заміряна в 5 ГБ або менше. Ми не копіюємо перші 5 ГБ великої скриньки і не спиняємося на півдорозі — обсяг відомий до запуску.',
      },
      {
        q: 'Що робити, якщо перенесення обірвалося?',
        a: 'Запустити знову. imapsync звіряє, що вже лежить у призначенні, і копіює лише те, чого бракує — повтор дешевий і не створює дублів.',
      },
    ],
    allLink: 'Усі запитання та відповіді',
  },
} as const satisfies Record<'ru' | 'en' | 'uk', FaqShortCopy>;
