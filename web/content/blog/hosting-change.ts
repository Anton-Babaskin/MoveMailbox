import type { BlogPost } from '@/data/blog-posts';

export const hostingChange: BlogPost = {
  slug: 'hosting-change',
  date: '2026-09-12',
  icon: 'sv',
  ru: {
    title: 'Перенос почты при смене хостинга — MoveMailbox',
    description:
      'Порядок действий при переезде домена: сначала завести ящики и перенести почту, и только потом менять MX. Что делать с TTL и вторым проходом.',
    h1: 'Перенос почты при смене хостинга: пошагово',
    tag: 'Хостинг',
    card: 'Главное правило переезда: сначала почта, потом DNS. Порядок действий целиком, включая TTL, второй проход и период, когда письма идут в оба ящика.',
    lede: 'Самая дорогая ошибка при смене хостинга делается в первый же день: человек меняет MX-запись, а потом начинает разбираться с почтой. Несколько часов писем уходит в ящик, которого уже никто не читает.',
    blocks: [
      {
        h2: 'Правило одно: сначала почта, потом DNS',
        paragraphs: [
          'MX-запись говорит всему интернету, какой сервер принимает почту для домена. Пока она указывает на старый хостинг, письма идут туда — и это хорошо: у вас есть время спокойно перенести архив.',
          'Если поменять MX первым действием, начинается неприятное: новые письма падают на новый сервер, старые остаются на старом, а часть отправителей ещё несколько часов или суток использует закешированный ответ и шлёт по-старому. Вы получаете два живых ящика и ручную склейку.',
          'Правильный порядок обратный: завести ящики на новом хостинге, перенести почту, убедиться, что всё на месте, и только потом переключать MX. Почта в этот момент уже ждёт на новом месте.',
        ],
      },
      {
        h2: 'Порядок действий',
        paragraphs: [
          'Полный сценарий переезда домена без потери писем. Шаги с первого по третий можно делать за неделю до переключения, они ни на что не влияют.',
        ],
        steps: [
          'Заведите на новом хостинге те же ящики, что есть на старом, с теми же адресами. Пароли можно временные — потом смените.',
          'Понизьте TTL у MX-записи до 300 секунд минимум за сутки до переключения: иначе старое значение будет жить у чужих резолверов ровно столько, сколько там было прописано раньше.',
          'Сделайте первый проход переноса. Он самый долгий; пусть идёт хоть всю ночь, на работающую почту это не влияет.',
          'Сверьте число писем по папкам на старом и новом сервере.',
          'Переключите MX на новый хостинг и дождитесь, пока изменение разойдётся.',
          'Через сутки сделайте второй проход. Он догонит письма, пришедшие на старый сервер за время переключения, и займёт минуты.',
          'Оставьте старые ящики нетронутыми ещё на пару недель — это бесплатная страховка.',
        ],
      },
      {
        h2: 'Что не забыть, кроме писем',
        paragraphs: [
          'Перенос по IMAP копирует письма и папки. Всё остальное живёт в других местах и переезжает отдельно.',
        ],
        bullets: [
          'Записи SPF и DKIM для нового сервера — без них почта с нового хостинга поедет в спам.',
          'Пересылки, автоответы и правила фильтрации: они настроены в панели старого хостинга, а не в письмах.',
          'Псевдонимы и общие ящики: их проще создать заново, чем искать в архиве.',
          'Пароли ящиков: после переезда лучше сменить на постоянные и отозвать временные.',
        ],
      },
      {
        h2: 'Если MX уже переключили',
        paragraphs: [
          'Ничего страшного, порядок просто станет другим. Перенесите почту со старого сервера на новый как обычно — старый ящик никуда не делся, доступ по IMAP к нему обычно остаётся даже после смены MX.',
          'Главное — не удалять хостинг и не закрывать аккаунт до того, как архив переехал и сверен. Именно на этом шаге почту теряют по-настоящему и безвозвратно.',
        ],
      },
    ],
    faq: [
      [
        'Сколько времени письма могут идти в старый ящик после смены MX?',
        'Столько, каким был TTL записи до понижения: у многих хостеров это сутки. Поэтому TTL и понижают заранее.',
      ],
      [
        'Нужно ли останавливать почту на время переноса?',
        'Нет. Перенос только читает со старого сервера и пишет на новый; пользоваться ящиком можно всё это время.',
      ],
      [
        'Второй проход не создаст дубли?',
        'Нет, он сверяет письма на приёмнике и копирует только недостающие.',
      ],
      [
        'Сервер нового хостинга отвечает ошибкой сертификата',
        'Часто так бывает, когда почтовый домен ещё не указывает на новый сервер и сертификат выписан на имя хостера. Разбор этой ошибки — на отдельной странице.',
      ],
    ],
    links: [
      { path: '/migrate/cpanel-to-gmail', label: 'Перенос с хостинга на Gmail' },
      { path: '/docs/errors/certificate-verify-failed', label: 'Ошибка проверки сертификата: разбор' },
      { path: '/routes', label: 'Все маршруты переноса' },
    ],
  },
  en: {
    title: 'Moving mail when you change hosting — MoveMailbox',
    description:
      'The order that avoids lost messages: create mailboxes, migrate the mail, and only then change MX. What to do about TTL and the second pass.',
    h1: 'Moving mail when you change hosting, step by step',
    tag: 'Hosting',
    card: 'One rule: mail first, DNS second. The full sequence, including TTL, the catch-up pass and the window when messages land in both mailboxes.',
    lede: 'The most expensive mistake in a hosting move happens on day one: the MX record is changed first, and the mail is sorted out afterwards. Hours of messages land in a mailbox nobody reads any more.',
    blocks: [
      {
        h2: 'One rule: mail first, DNS second',
        paragraphs: [
          'The MX record tells the whole internet which server accepts mail for your domain. While it points at the old host, messages go there — and that is good, because it gives you time to move the archive calmly.',
          'Change MX first and the unpleasant part starts: new mail lands on the new server, old mail stays on the old one, and some senders keep using a cached answer for hours or days. You end up with two live mailboxes and a manual merge.',
          'The right order is the reverse: create the mailboxes, migrate the mail, confirm it is all there, and only then switch MX. By that point the archive is already waiting on the new side.',
        ],
      },
      {
        h2: 'The sequence',
        paragraphs: [
          'The full domain move without losing messages. Steps one to three can happen a week ahead; they change nothing for your users.',
        ],
        steps: [
          'Create the same mailboxes on the new host with the same addresses. Temporary passwords are fine — change them later.',
          'Lower the MX record TTL to 300 seconds at least a day before the switch, otherwise the old value lives in other resolvers for as long as it said it would.',
          'Run the first migration pass. It is the long one; let it run overnight, it does not disturb working mail.',
          'Compare message counts per folder on the old and the new server.',
          'Point MX at the new host and wait for the change to propagate.',
          'A day later, run a second pass. It catches up whatever reached the old server during the switch and takes minutes.',
          'Leave the old mailboxes untouched for another couple of weeks — free insurance.',
        ],
      },
      {
        h2: 'What else moves besides messages',
        paragraphs: [
          'An IMAP migration copies messages and folders. Everything else lives elsewhere and moves separately.',
        ],
        bullets: [
          'SPF and DKIM records for the new server, without which your outgoing mail lands in spam.',
          'Forwarding, auto-replies and filter rules: they are configured in the old control panel, not inside the messages.',
          'Aliases and shared mailboxes: faster to recreate than to hunt for in the archive.',
          'Mailbox passwords: replace the temporary ones after the move and revoke the old ones.',
        ],
      },
      {
        h2: 'If MX has already been switched',
        paragraphs: [
          'Not a disaster, just a different order. Migrate from the old server to the new one as usual — the old mailbox is still there, and IMAP access to it normally survives the MX change.',
          'What matters is not deleting the hosting account before the archive has moved and been checked. That is the step where mail is genuinely and permanently lost.',
        ],
      },
    ],
    faq: [
      [
        'How long can mail keep arriving at the old mailbox after an MX change?',
        'As long as the record TTL was before you lowered it — a full day at many hosts. That is why you lower it in advance.',
      ],
      [
        'Do I have to stop using mail during the migration?',
        'No. The migration reads from the old server and writes to the new one; the mailbox stays usable throughout.',
      ],
      [
        'Will the second pass create duplicates?',
        'No, it compares the destination and copies only what is missing.',
      ],
      [
        'The new host answers with a certificate error',
        'Common while the mail domain still does not point at the new server and the certificate carries the hosting name. There is a full write-up of that error.',
      ],
    ],
    links: [
      { path: '/migrate/cpanel-to-gmail', label: 'Move from hosting to Gmail' },
      { path: '/docs/errors/certificate-verify-failed', label: 'Certificate verify failed explained' },
      { path: '/routes', label: 'All migration routes' },
    ],
  },
  uk: {
    title: 'Перенесення пошти при зміні хостингу — MoveMailbox',
    description:
      'Порядок дій під час переїзду домену: спершу створити скриньки й перенести пошту, і лише потім міняти MX. Що робити з TTL і другим проходом.',
    h1: 'Перенесення пошти при зміні хостингу: покроково',
    tag: 'Хостинг',
    card: 'Головне правило переїзду: спершу пошта, потім DNS. Повний порядок дій, включно з TTL, другим проходом і періодом, коли листи йдуть в обидві скриньки.',
    lede: 'Найдорожча помилка під час зміни хостингу робиться першого ж дня: людина змінює MX-запис, а потім починає розбиратися з поштою. Кілька годин листів іде у скриньку, яку вже ніхто не читає.',
    blocks: [
      {
        h2: 'Правило одне: спершу пошта, потім DNS',
        paragraphs: [
          'MX-запис каже всьому інтернету, який сервер приймає пошту для домену. Доки він указує на старий хостинг, листи йдуть туди — і це добре: у вас є час спокійно перенести архів.',
          'Якщо змінити MX першою дією, починається неприємне: нові листи падають на новий сервер, старі лишаються на старому, а частина відправників ще кілька годин або діб використовує кешовану відповідь. Ви отримуєте дві живі скриньки й ручне склеювання.',
          'Правильний порядок зворотний: створити скриньки на новому хостингу, перенести пошту, переконатися, що все на місці, і лише потім перемикати MX.',
        ],
      },
      {
        h2: 'Порядок дій',
        paragraphs: [
          'Повний сценарій переїзду домену без втрати листів. Кроки з першого до третього можна робити за тиждень до перемикання.',
        ],
        steps: [
          'Створіть на новому хостингу ті самі скриньки, що є на старому, з тими самими адресами. Паролі можна тимчасові.',
          'Знизьте TTL MX-запису до 300 секунд щонайменше за добу до перемикання: інакше старе значення житиме в чужих резолверах стільки, скільки там було прописано раніше.',
          'Зробіть перший прохід перенесення. Він найдовший; хай іде хоч усю ніч, на робочу пошту це не впливає.',
          'Звірте кількість листів за папками на старому й новому сервері.',
          'Перемкніть MX на новий хостинг і дочекайтеся поширення зміни.',
          'Через добу зробіть другий прохід: він дожене листи, що надійшли на старий сервер під час перемикання.',
          'Лишіть старі скриньки недоторканими ще на пару тижнів — це безплатна страховка.',
        ],
      },
      {
        h2: 'Що не забути, крім листів',
        paragraphs: [
          'Перенесення по IMAP копіює листи й папки. Усе інше живе в інших місцях і переїжджає окремо.',
        ],
        bullets: [
          'Записи SPF і DKIM для нового сервера — без них пошта з нового хостингу поїде в спам.',
          'Пересилання, автовідповіді та правила фільтрації: вони налаштовані в панелі старого хостингу, а не в листах.',
          'Псевдоніми та спільні скриньки: їх простіше створити наново, ніж шукати в архіві.',
          'Паролі скриньок: після переїзду краще змінити на постійні й відкликати тимчасові.',
        ],
      },
      {
        h2: 'Якщо MX уже перемкнули',
        paragraphs: [
          'Нічого страшного, порядок просто стане іншим. Перенесіть пошту зі старого сервера на новий як зазвичай — доступ по IMAP до старої скриньки зазвичай лишається навіть після зміни MX.',
          'Головне — не видаляти хостинг і не закривати акаунт, доки архів не переїхав і не звірений. Саме на цьому кроці пошту втрачають по-справжньому й безповоротно.',
        ],
      },
    ],
    faq: [
      [
        'Скільки часу листи можуть іти у стару скриньку після зміни MX?',
        'Стільки, яким був TTL запису до зниження: у багатьох хостерів це доба. Тому TTL і знижують заздалегідь.',
      ],
      [
        'Чи потрібно зупиняти пошту на час перенесення?',
        'Ні. Перенесення лише читає зі старого сервера й пише на новий.',
      ],
      [
        'Чи не створить другий прохід дублі?',
        'Ні, він звіряє листи на приймачі й копіює лише те, чого бракує.',
      ],
      [
        'Сервер нового хостингу відповідає помилкою сертифіката',
        'Часто так буває, коли поштовий домен ще не вказує на новий сервер. Розбір цієї помилки — на окремій сторінці.',
      ],
    ],
    links: [
      { path: '/migrate/cpanel-to-gmail', label: 'Перенесення з хостингу на Gmail' },
      { path: '/docs/errors/certificate-verify-failed', label: 'Помилка перевірки сертифіката: розбір' },
      { path: '/routes', label: 'Усі маршрути перенесення' },
    ],
  },
};
