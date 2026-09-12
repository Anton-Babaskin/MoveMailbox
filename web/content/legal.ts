/// <reference lib="es2022" />
// Относительный путь (а не алиас @/) и ссылка на lib выше нужны, чтобы файл
// проходил и отдельную проверку `npx tsc --noEmit --strict content/legal.ts`,
// которая запускается без tsconfig. В сборке Next это ничего не меняет.
import type { Lang } from '../i18n/config';

/**
 * Тексты правовых страниц на трёх языках.
 *
 * Перевод намеренно буквальный по смыслу: правовой документ не должен
 * обещать в переводе больше, чем в оригинале. Плейсхолдеры {{...}}
 * сохранены во всех языках — владелец находит их поиском по скобкам,
 * переведено только пояснение внутри.
 */
export type LegalSection = { h: string; p: string[] };

export type LegalDocContent = {
  meta: { title: string; description: string };
  eyebrow: string;
  title: string;
  updated: string;
  sections: LegalSection[];
};

export type LegalDocId = 'privacy' | 'terms';

export const legal: Record<LegalDocId, Record<Lang, LegalDocContent>> = {
  privacy: {
    ru: {
      meta: {
        title: 'Политика конфиденциальности — MoveMailbox',
        description:
          'Какие данные MoveMailbox получает при переносе почты, где они хранятся, сколько живут и что удаляется после завершения задания.',
      },
      eyebrow: 'Правовые документы',
      title: 'Политика конфиденциальности',
      updated: '11 сентября 2026',
      sections: [
        {
          h: 'Кто обрабатывает данные',
          p: [
            'Сервис MoveMailbox по адресу movemailbox.com управляется {{ОПЕРАТОР: юридическое лицо или ИП, адрес}}. Вопросы по обработке данных — {{КОНТАКТНЫЙ EMAIL}}.',
            'Локальный клиент MoveMailbox работает на вашем компьютере и не отправляет нам ни учётные данные, ни содержимое писем. Всё, что описано ниже, относится только к онлайн-переносу.',
          ],
        },
        {
          h: 'Учётные данные почтовых ящиков',
          p: [
            'Чтобы перенести почту, сервису нужны адрес сервера, логин и пароль обоих ящиков. Соединение с сайтом защищено HTTPS.',
            'Перед постановкой задания в очередь учётные данные шифруются для воркера: открытый пароль не сохраняется, хранится зашифрованный пакет. Расшифровка происходит в памяти воркера на время переноса, imapsync запускается отдельным процессом и получает данные через окружение, а не через аргументы командной строки.',
            'После завершения или отмены задания зашифрованный пакет и ключ помечаются на удаление вместе с самим заданием.',
          ],
        },
        {
          h: 'Содержимое писем',
          p: [
            'Письма передаются с сервера-источника на сервер-назначение потоком. Мы не создаём копий переписки для себя, не индексируем её и не читаем.',
            'Журнал переноса содержит имена папок и счётчики писем — без темы, отправителя и текста.',
          ],
        },
        {
          h: 'Что остаётся после переноса',
          p: [
            'Технические записи о задании: время, объём, количество писем, результат и сообщения об ошибках. Они нужны для поддержки и для расчёта тарифа.',
            'Стандартные журналы веб-сервера: IP-адрес, User-Agent, запрошенный URL.',
          ],
        },
        {
          h: 'Аналитика и сторонние сервисы',
          p: [
            '{{УКАЖИТЕ: используемая аналитика, платёжный провайдер, хостинг — и страну размещения серверов. Если аналитики нет, так и напишите.}}',
          ],
        },
        {
          h: 'Ваши права',
          p: [
            'Вы можете запросить сведения о своих данных, их исправление или удаление, написав на {{КОНТАКТНЫЙ EMAIL}}. Задание можно остановить в любой момент — перенесённые письма останутся в ящике назначения, источник не изменяется.',
          ],
        },
      ],
    },
    en: {
      meta: {
        title: 'Privacy Policy — MoveMailbox',
        description:
          'What data MoveMailbox receives during a mail transfer, where it is stored, how long it is kept and what is removed once the job is over.',
      },
      eyebrow: 'Legal',
      title: 'Privacy Policy',
      updated: '11 September 2026',
      sections: [
        {
          h: 'Who processes the data',
          p: [
            'The MoveMailbox service at movemailbox.com is operated by {{OPERATOR: legal entity or sole proprietor, address}}. Questions about data processing — {{CONTACT EMAIL}}.',
            'The local MoveMailbox client runs on your own computer and sends us neither credentials nor message content. Everything described below applies to the online transfer only.',
          ],
        },
        {
          h: 'Mailbox credentials',
          p: [
            'To transfer mail, the service needs the server address, the login and the password of both mailboxes. The connection to the site is protected by HTTPS.',
            'Before a job is put into the queue, the credentials are encrypted for the worker: the plaintext password is not stored, an encrypted bundle is stored instead. Decryption happens in the worker’s memory for the duration of the transfer; imapsync is started as a separate process and receives the data through the environment rather than through command-line arguments.',
            'Once the job finishes or is cancelled, the encrypted bundle and the key are marked for deletion together with the job itself.',
          ],
        },
        {
          h: 'Message content',
          p: [
            'Messages are streamed from the source server to the destination server. We do not make copies of your correspondence for ourselves, we do not index it and we do not read it.',
            'The transfer log contains folder names and message counters — no subject, sender or body.',
          ],
        },
        {
          h: 'What is left after the transfer',
          p: [
            'Technical records about the job: time, size, number of messages, result and error messages. They are needed for support and for calculating the price.',
            'Standard web server logs: IP address, User-Agent, requested URL.',
          ],
        },
        {
          h: 'Analytics and third-party services',
          p: [
            '{{SPECIFY: the analytics in use, the payment provider, the hosting — and the country the servers are located in. If there is no analytics, say so.}}',
          ],
        },
        {
          h: 'Your rights',
          p: [
            'You can request information about your data, its correction or its deletion by writing to {{CONTACT EMAIL}}. A job can be stopped at any moment — the messages already transferred stay in the destination mailbox, the source is not changed.',
          ],
        },
      ],
    },
    uk: {
      meta: {
        title: 'Політика конфіденційності — MoveMailbox',
        description:
          'Які дані MoveMailbox отримує під час перенесення пошти, де вони зберігаються, скільки живуть і що видаляється після завершення завдання.',
      },
      eyebrow: 'Правові документи',
      title: 'Політика конфіденційності',
      updated: '11 вересня 2026',
      sections: [
        {
          h: 'Хто обробляє дані',
          p: [
            'Сервісом MoveMailbox за адресою movemailbox.com керує {{ОПЕРАТОР: юридична особа або ФОП, адреса}}. Питання щодо обробки даних — {{КОНТАКТНИЙ EMAIL}}.',
            'Локальний клієнт MoveMailbox працює на вашому комп’ютері й не надсилає нам ні облікових даних, ні вмісту листів. Усе, що описано нижче, стосується лише онлайн-перенесення.',
          ],
        },
        {
          h: 'Облікові дані поштових скриньок',
          p: [
            'Щоб перенести пошту, сервісу потрібні адреса сервера, логін і пароль обох скриньок. З’єднання із сайтом захищене HTTPS.',
            'Перед постановкою завдання в чергу облікові дані шифруються для воркера: відкритий пароль не зберігається, зберігається зашифрований пакет. Розшифрування відбувається в пам’яті воркера на час перенесення, imapsync запускається окремим процесом і отримує дані через оточення, а не через аргументи командного рядка.',
            'Після завершення або скасування завдання зашифрований пакет і ключ позначаються на видалення разом із самим завданням.',
          ],
        },
        {
          h: 'Вміст листів',
          p: [
            'Листи передаються із сервера-джерела на сервер призначення потоком. Ми не створюємо копій листування для себе, не індексуємо його і не читаємо.',
            'Журнал перенесення містить назви папок і лічильники листів — без теми, відправника та тексту.',
          ],
        },
        {
          h: 'Що залишається після перенесення',
          p: [
            'Технічні записи про завдання: час, обсяг, кількість листів, результат і повідомлення про помилки. Вони потрібні для підтримки та для розрахунку тарифу.',
            'Стандартні журнали вебсервера: IP-адреса, User-Agent, запитаний URL.',
          ],
        },
        {
          h: 'Аналітика та сторонні сервіси',
          p: [
            '{{УКАЖІТЬ: використовувана аналітика, платіжний провайдер, хостинг — і країну розміщення серверів. Якщо аналітики немає, так і напишіть.}}',
          ],
        },
        {
          h: 'Ваші права',
          p: [
            'Ви можете запитати відомості про свої дані, їх виправлення або видалення, написавши на {{КОНТАКТНИЙ EMAIL}}. Завдання можна зупинити будь-якої миті — перенесені листи залишаться у скриньці призначення, джерело не змінюється.',
          ],
        },
      ],
    },
  },

  terms: {
    ru: {
      meta: {
        title: 'Условия использования — MoveMailbox',
        description:
          'Условия использования сервиса переноса почты MoveMailbox: что входит в бесплатный объём, ограничения и ответственность сторон.',
      },
      eyebrow: 'Правовые документы',
      title: 'Условия использования',
      updated: '11 сентября 2026',
      sections: [
        {
          h: 'Что мы делаем',
          p: [
            'MoveMailbox копирует письма, папки и вложения с одного IMAP-сервера на другой. Базовый сценарий — одностороннее копирование: ящик-источник не изменяется и не очищается.',
            'Перенос выполняет imapsync. Сервис не является почтовым провайдером и не хранит вашу почту.',
          ],
        },
        {
          h: 'Ваши обязательства',
          p: [
            'Вы подтверждаете, что имеете право доступа к обоим ящикам. Перенос чужой почты без разрешения владельца запрещён.',
            'Вы отвечаете за корректность введённых адресов серверов и за то, что в ящике назначения достаточно места.',
            'Запрещено использовать сервис для рассылки, обхода лимитов провайдеров и любой автоматизации, нарушающей условия ваших почтовых провайдеров.',
          ],
        },
        {
          h: 'Бесплатный объём и тарифы',
          p: [
            'Бесплатно переносится один целый ящик объёмом до 5 ГБ включительно. Объём измеряется до запуска, поэтому вы знаете стоимость заранее. Мы не копируем первые 5 ГБ большого ящика и не останавливаемся на полпути.',
            'Актуальные тарифы указаны на странице «Тарифы» и могут меняться; к уже оплаченному заданию применяется тариф на момент оплаты.',
            '{{УКАЖИТЕ: условия возврата средств и способ оплаты}}',
          ],
        },
        {
          h: 'Ограничения, которые от нас не зависят',
          p: [
            'Почтовые провайдеры ограничивают скорость выгрузки и число одновременных IMAP-сессий. Длительность переноса определяется этими ограничениями, а не нашей стороной.',
            'Провайдер может отклонить подключение, потребовать пароль приложения или временно заблокировать доступ. Это не считается неисправностью сервиса.',
          ],
        },
        {
          h: 'Ответственность',
          p: [
            'Сервис предоставляется «как есть». Перед переносом сделайте резервную копию важной переписки и не отключайте старый ящик, пока не сверите счётчики папок.',
            'Мы не несём ответственности за упущенную выгоду и за действия почтовых провайдеров. {{УКАЖИТЕ: предел ответственности и применимое право}}',
          ],
        },
        {
          h: 'Код на GitHub',
          p: [
            'Исходный код проекта опубликован на GitHub и распространяется по указанной там лицензии. Локальный клиент можно запускать без нашего участия — в этом случае настоящие условия к его работе не применяются.',
          ],
        },
      ],
    },
    en: {
      meta: {
        title: 'Terms of Use — MoveMailbox',
        description:
          'Terms of use for the MoveMailbox email transfer service: what the free size covers, the limits, and who is responsible for what.',
      },
      eyebrow: 'Legal',
      title: 'Terms of Use',
      updated: '11 September 2026',
      sections: [
        {
          h: 'What we do',
          p: [
            'MoveMailbox copies messages, folders and attachments from one IMAP server to another. The basic scenario is a one-way copy: the source mailbox is not changed and not emptied.',
            'The transfer is performed by imapsync. The service is not an email provider and does not store your mail.',
          ],
        },
        {
          h: 'Your obligations',
          p: [
            'You confirm that you are entitled to access both mailboxes. Transferring someone else’s mail without the owner’s permission is prohibited.',
            'You are responsible for the server addresses you enter being correct and for there being enough space in the destination mailbox.',
            'Using the service for bulk mailing, for working around provider limits, or for any automation that breaks the terms of your email providers is prohibited.',
          ],
        },
        {
          h: 'Free size and pricing',
          p: [
            'One whole mailbox of up to 5 GB inclusive is transferred free of charge. The size is measured before the run, so you know the price in advance. We do not copy the first 5 GB of a large mailbox and we do not stop halfway.',
            'Current prices are listed on the “Pricing” page and may change; a job that has already been paid for is charged at the price in effect at the moment of payment.',
            '{{SPECIFY: refund terms and payment method}}',
          ],
        },
        {
          h: 'Limits that are not up to us',
          p: [
            'Email providers cap the download speed and the number of simultaneous IMAP sessions. How long a transfer takes is set by those limits, not by our side.',
            'A provider may refuse the connection, require an app password or temporarily block access. That is not considered a malfunction of the service.',
          ],
        },
        {
          h: 'Liability',
          p: [
            'The service is provided “as is”. Before a transfer, back up correspondence that matters to you and do not switch off the old mailbox until you have checked the folder counters.',
            'We are not liable for lost profit or for the actions of email providers. {{SPECIFY: liability cap and governing law}}',
          ],
        },
        {
          h: 'Code on GitHub',
          p: [
            'The source code of the project is published on GitHub and distributed under the licence stated there. The local client can be run without any involvement from us — in that case these terms do not apply to how it works.',
          ],
        },
      ],
    },
    uk: {
      meta: {
        title: 'Умови використання — MoveMailbox',
        description:
          'Умови використання сервісу перенесення пошти MoveMailbox: що входить у безкоштовний обсяг, обмеження та відповідальність сторін.',
      },
      eyebrow: 'Правові документи',
      title: 'Умови використання',
      updated: '11 вересня 2026',
      sections: [
        {
          h: 'Що ми робимо',
          p: [
            'MoveMailbox копіює листи, папки та вкладення з одного IMAP-сервера на інший. Базовий сценарій — одностороннє копіювання: скринька-джерело не змінюється і не очищується.',
            'Перенесення виконує imapsync. Сервіс не є поштовим провайдером і не зберігає вашу пошту.',
          ],
        },
        {
          h: 'Ваші зобов’язання',
          p: [
            'Ви підтверджуєте, що маєте право доступу до обох скриньок. Перенесення чужої пошти без дозволу власника заборонене.',
            'Ви відповідаєте за правильність введених адрес серверів і за те, щоб у скриньці призначення вистачало місця.',
            'Заборонено використовувати сервіс для розсилок, обходу лімітів провайдерів і будь-якої автоматизації, що порушує умови ваших поштових провайдерів.',
          ],
        },
        {
          h: 'Безкоштовний обсяг і тарифи',
          p: [
            'Безкоштовно переноситься одна ціла скринька обсягом до 5 ГБ включно. Обсяг вимірюється до запуску, тому ви знаєте вартість заздалегідь. Ми не копіюємо перші 5 ГБ великої скриньки і не зупиняємося на півдорозі.',
            'Актуальні тарифи вказані на сторінці «Тарифи» і можуть змінюватися; до вже оплаченого завдання застосовується тариф на момент оплати.',
            '{{УКАЖІТЬ: умови повернення коштів і спосіб оплати}}',
          ],
        },
        {
          h: 'Обмеження, які від нас не залежать',
          p: [
            'Поштові провайдери обмежують швидкість вивантаження та кількість одночасних IMAP-сесій. Тривалість перенесення визначається цими обмеженнями, а не нашою стороною.',
            'Провайдер може відхилити підключення, вимагати пароль застосунку або тимчасово заблокувати доступ. Це не вважається несправністю сервісу.',
          ],
        },
        {
          h: 'Відповідальність',
          p: [
            'Сервіс надається «як є». Перед перенесенням зробіть резервну копію важливого листування і не вимикайте стару скриньку, доки не звірите лічильники папок.',
            'Ми не несемо відповідальності за втрачену вигоду та за дії поштових провайдерів. {{УКАЖІТЬ: межа відповідальності та застосовне право}}',
          ],
        },
        {
          h: 'Код на GitHub',
          p: [
            'Вихідний код проєкту опубліковано на GitHub і поширюється за вказаною там ліцензією. Локальний клієнт можна запускати без нашої участі — у такому разі ці умови до його роботи не застосовуються.',
          ],
        },
      ],
    },
  },
};

/** Подпись над заголовком: «Редакция от <дата>.» на языке страницы. */
export const legalUpdatedLabel: Record<Lang, (updated: string) => string> = {
  ru: (updated) => `Редакция от ${updated}.`,
  en: (updated) => `Revision of ${updated}.`,
  uk: (updated) => `Редакція від ${updated}.`,
};
