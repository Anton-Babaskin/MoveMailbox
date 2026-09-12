import type { BlogPost } from '@/data/blog-posts';

export const gmailAllMailTrap: BlogPost = {
  slug: 'gmail-all-mail-trap',
  date: '2026-09-12',
  icon: 'ml',
  ru: {
    title: 'Ловушка «Вся почта» в Gmail — MoveMailbox',
    description:
      'Почему после переноса из Gmail писем становится вдвое больше: ярлыки вместо папок, папка «Вся почта» и как посчитать реальный объём ящика заранее.',
    h1: 'Почему после переноса из Gmail писем стало вдвое больше',
    tag: 'Gmail',
    card: 'Ярлыки против папок и папка «Вся почта»: главная причина удвоенного объёма и дублей. Что исключать и как оценить настоящий размер ящика.',
    lede: 'Человек переносит ящик на десять гигабайт, а на новом месте оказывается двадцать. Ничего не сломалось: Gmail показал одни и те же письма дважды, и перенос честно скопировал всё, что увидел.',
    blocks: [
      {
        h2: 'У Gmail нет папок',
        paragraphs: [
          'Внутри Gmail письмо существует ровно в одном экземпляре, а ярлыки — это метки на нём. Письмо с тремя ярлыками — это одно письмо, показанное в трёх местах.',
          'Протокол IMAP такого понятия не знает: в нём есть папки, и письмо лежит в папке. Чтобы показать ярлыки внешнему клиенту, Gmail выдаёт каждый ярлык как отдельную папку, а сверх того добавляет служебную папку «Вся почта», в которой лежит вообще всё.',
          'Дальше арифметика простая. Любой инструмент переноса видит письмо в папке ярлыка и это же письмо во «Всей почте» — и копирует оба раза, потому что с точки зрения протокола это два разных письма в двух разных папках.',
        ],
        sample: {
          caption: 'Как выглядит список папок Gmail по IMAP',
          body: '* LIST (\\HasNoChildren \\All) "/" "[Gmail]/All Mail"\n* LIST (\\HasNoChildren \\Trash) "/" "[Gmail]/Trash"\n* LIST (\\HasNoChildren \\Junk) "/" "[Gmail]/Spam"\n* LIST (\\HasNoChildren) "/" "Клиенты"',
        },
      },
      {
        h2: 'Что с этим делать',
        paragraphs: [
          'Решение зависит от того, что вам нужно на новом месте: структура ярлыков или просто вся почта одним архивом.',
        ],
        bullets: [
          'Нужна структура — исключите «Вся почта», «Спам» и «Корзину». Останутся «Входящие», «Отправленные» и ваши ярлыки как обычные папки.',
          'Нужен архив без структуры — перенесите только «Вся почта». Получится один большой ящик, зато гарантированно без дублей и без потерь.',
          'Не нужно и то и другое сразу: это и есть тот самый двойной объём.',
          'Письмо без единого ярлыка живёт только во «Всей почте». Если исключить её целиком, архивная почта не переедет — это обратная сторона первого варианта.',
        ],
      },
      {
        h2: 'Как оценить реальный объём заранее',
        paragraphs: [
          'Цифра в настройках Google — это место на аккаунте вместе с диском и фотографиями, для планирования переноса она почти бесполезна.',
          'Правильнее посмотреть размеры папок по IMAP: сложите все папки, кроме «Всей почты», и вы получите объём с сохранением структуры; размер одной «Всей почты» — объём варианта «архивом». Разница между этими двумя числами и есть цена вопроса.',
        ],
        steps: [
          'Запустите режим подсчёта размеров папок, не начиная копирование.',
          'Сравните сумму пользовательских папок с размером «Вся почта».',
          'Выберите вариант и явно исключите лишние папки до старта, а не после.',
          'Сверьте счётчики писем по папкам после переноса.',
        ],
      },
      {
        h2: 'Что ещё удивляет на Gmail',
        paragraphs: [
          'Письма из «Отправленных» в ящиках Gmail часто имеют и пользовательский ярлык — значит, приедут и туда и туда. Это тот же механизм.',
          'Важные и Помеченные — тоже отдельные IMAP-папки, и это тоже копии. В подавляющем большинстве переносов их исключают вместе со спамом и корзиной.',
        ],
      },
    ],
    faq: [
      [
        'Можно ли перенести ярлыки Gmail как ярлыки?',
        'Только если принимающая сторона тоже Gmail. В обычном IMAP ярлык становится папкой, и письмо с тремя ярлыками окажется в трёх папках.',
      ],
      [
        'Если исключить «Вся почта», потеряется ли архив?',
        'Потеряются письма, у которых нет ни одного ярлыка и которых нет во «Входящих». Если архивом вы пользуетесь, переносите «Всю почту» и исключайте ярлыки.',
      ],
      [
        'Появятся ли дубли, если запустить перенос второй раз?',
        'Нет. Повторный проход сверяет письма на приёмнике и копирует только недостающие.',
      ],
      [
        'Почему объём на новом месте всё равно отличается?',
        'Провайдеры по-разному считают служебные данные и вложения. Сверять надо число писем по папкам, а не гигабайты.',
      ],
    ],
    links: [
      { path: '/migrate/gmail-to-outlook', label: 'Перенос с Gmail на Outlook' },
      { path: '/migrate/gmail-to-microsoft-365', label: 'Перенос с Gmail на Microsoft 365' },
      { path: '/docs/errors/quota-exceeded', label: 'Ошибка QUOTA EXCEEDED: разбор' },
    ],
  },
  en: {
    title: 'The Gmail All Mail trap — MoveMailbox',
    description:
      'Why a Gmail migration can double your message count: labels instead of folders, the All Mail folder, and how to measure the real mailbox size first.',
    h1: 'Why a Gmail migration doubles your message count',
    tag: 'Gmail',
    card: 'Labels versus folders and the All Mail folder: the number one cause of doubled volume and duplicates, and what to exclude before you start.',
    lede: 'Someone moves a ten-gigabyte mailbox and finds twenty on the other side. Nothing broke: Gmail presented the same messages twice, and the migration faithfully copied everything it was shown.',
    blocks: [
      {
        h2: 'Gmail has no folders',
        paragraphs: [
          'Inside Gmail a message exists exactly once and labels are tags on it. A message with three labels is one message shown in three places.',
          'IMAP has no such concept. It has folders, and a message lives in a folder. To expose labels to an external client, Gmail presents every label as a folder and adds a system folder called All Mail that contains everything.',
          'The arithmetic follows. Any migration tool sees the message in the label folder and the same message in All Mail, and copies both, because as far as the protocol is concerned those are two messages in two folders.',
        ],
        sample: {
          caption: 'What the Gmail folder list looks like over IMAP',
          body: '* LIST (\\HasNoChildren \\All) "/" "[Gmail]/All Mail"\n* LIST (\\HasNoChildren \\Trash) "/" "[Gmail]/Trash"\n* LIST (\\HasNoChildren \\Junk) "/" "[Gmail]/Spam"\n* LIST (\\HasNoChildren) "/" "Clients"',
        },
      },
      {
        h2: 'What to do about it',
        paragraphs: [
          'The answer depends on what you want on the other side: the label structure, or simply all the mail as one archive.',
        ],
        bullets: [
          'You want the structure — exclude All Mail, Spam and Trash. Inbox, Sent and your labels arrive as ordinary folders.',
          'You want a flat archive — migrate only All Mail. One large mailbox, but guaranteed free of duplicates and of gaps.',
          'What you do not want is both at once: that is the doubled volume.',
          'A message with no label at all lives only in All Mail. Exclude that folder entirely and archived mail does not come across — the flip side of the first option.',
        ],
      },
      {
        h2: 'Measuring the real size in advance',
        paragraphs: [
          'The figure in Google account settings covers Drive and Photos too, which makes it close to useless for planning a mail migration.',
          'Look at folder sizes over IMAP instead: the sum of every folder except All Mail is the structured option, and the size of All Mail alone is the archive option. The gap between those two numbers is what the decision costs.',
        ],
        steps: [
          'Run a folder-size pass without copying anything.',
          'Compare the sum of your own folders with the size of All Mail.',
          'Pick an option and exclude the extra folders before the start, not after.',
          'Compare per-folder message counts once the migration finishes.',
        ],
      },
      {
        h2: 'Other Gmail surprises',
        paragraphs: [
          'Messages in Sent often carry a user label as well, so they land in both places. Same mechanism.',
          'Important and Starred are IMAP folders too, and they are copies as well. Nearly every migration excludes them along with Spam and Trash.',
        ],
      },
    ],
    faq: [
      [
        'Can Gmail labels be migrated as labels?',
        'Only when the receiving side is also Gmail. In plain IMAP a label becomes a folder, so a message with three labels lands in three folders.',
      ],
      [
        'If I exclude All Mail, do I lose the archive?',
        'You lose messages that carry no label and are not in the Inbox. If you rely on the archive, migrate All Mail and exclude the labels instead.',
      ],
      [
        'Will a second run create duplicates?',
        'No. A repeat pass compares the destination and copies only what is missing.',
      ],
      [
        'Why does the size still differ on the new side?',
        'Providers account for metadata and attachments differently. Compare message counts per folder, not gigabytes.',
      ],
    ],
    links: [
      { path: '/migrate/gmail-to-outlook', label: 'Move from Gmail to Outlook' },
      { path: '/migrate/gmail-to-microsoft-365', label: 'Move from Gmail to Microsoft 365' },
      { path: '/docs/errors/quota-exceeded', label: 'QUOTA EXCEEDED explained' },
    ],
  },
  uk: {
    title: 'Пастка «Уся пошта» в Gmail — MoveMailbox',
    description:
      'Чому після перенесення з Gmail листів стає вдвічі більше: ярлики замість папок, папка «Уся пошта» і як оцінити справжній обсяг скриньки заздалегідь.',
    h1: 'Чому після перенесення з Gmail листів стало вдвічі більше',
    tag: 'Gmail',
    card: 'Ярлики проти папок і папка «Уся пошта»: головна причина подвоєного обсягу й дублів. Що виключати й як оцінити справжній розмір скриньки.',
    lede: 'Людина переносить скриньку на десять гігабайтів, а на новому місці виявляється двадцять. Нічого не зламалося: Gmail показав ті самі листи двічі, і перенесення чесно скопіювало все, що побачило.',
    blocks: [
      {
        h2: 'У Gmail немає папок',
        paragraphs: [
          'Усередині Gmail лист існує рівно в одному примірнику, а ярлики — це позначки на ньому. Лист із трьома ярликами — це один лист, показаний у трьох місцях.',
          'Протокол IMAP такого поняття не знає: у ньому є папки, і лист лежить у папці. Щоб показати ярлики зовнішньому клієнту, Gmail видає кожен ярлик як окрему папку, а понад те додає службову папку «Уся пошта», де лежить узагалі все.',
          'Далі арифметика проста. Будь-який інструмент перенесення бачить лист у папці ярлика і той самий лист в «Усій пошті» — і копіює обидва рази, бо з погляду протоколу це два різні листи у двох різних папках.',
        ],
        sample: {
          caption: 'Який вигляд має список папок Gmail по IMAP',
          body: '* LIST (\\HasNoChildren \\All) "/" "[Gmail]/All Mail"\n* LIST (\\HasNoChildren \\Trash) "/" "[Gmail]/Trash"\n* LIST (\\HasNoChildren \\Junk) "/" "[Gmail]/Spam"\n* LIST (\\HasNoChildren) "/" "Клієнти"',
        },
      },
      {
        h2: 'Що з цим робити',
        paragraphs: [
          'Рішення залежить від того, що вам потрібно на новому місці: структура ярликів чи просто вся пошта одним архівом.',
        ],
        bullets: [
          'Потрібна структура — виключіть «Усю пошту», «Спам» і «Кошик». Лишаться «Вхідні», «Надіслані» та ваші ярлики як звичайні папки.',
          'Потрібен архів без структури — перенесіть лише «Усю пошту». Вийде одна велика скринька, зате гарантовано без дублів і без втрат.',
          'Не потрібно і те, і те водночас: це і є той самий подвійний обсяг.',
          'Лист без жодного ярлика живе лише в «Усій пошті». Якщо виключити її повністю, архівна пошта не переїде.',
        ],
      },
      {
        h2: 'Як оцінити справжній обсяг заздалегідь',
        paragraphs: [
          'Цифра в налаштуваннях Google — це місце на акаунті разом із диском і фото, для планування перенесення вона майже марна.',
          'Правильніше подивитися розміри папок по IMAP: сума всіх папок, крім «Усієї пошти», — це обсяг зі збереженням структури; розмір самої «Усієї пошти» — обсяг варіанта «архівом». Різниця між цими числами і є ціна питання.',
        ],
        steps: [
          'Запустіть режим підрахунку розмірів папок, не починаючи копіювання.',
          'Порівняйте суму власних папок із розміром «Усієї пошти».',
          'Виберіть варіант і явно виключіть зайві папки до старту, а не після.',
          'Звірте лічильники листів за папками після перенесення.',
        ],
      },
      {
        h2: 'Що ще дивує в Gmail',
        paragraphs: [
          'Листи з «Надісланих» часто мають і користувацький ярлик — отже, приїдуть і туди, і туди. Це той самий механізм.',
          'Важливі та Позначені — теж окремі IMAP-папки, і це теж копії. У переважній більшості перенесень їх виключають разом зі спамом і кошиком.',
        ],
      },
    ],
    faq: [
      [
        'Чи можна перенести ярлики Gmail як ярлики?',
        'Лише якщо приймальна сторона теж Gmail. У звичайному IMAP ярлик стає папкою.',
      ],
      [
        'Якщо виключити «Усю пошту», чи втратиться архів?',
        'Втратяться листи, які не мають жодного ярлика й не лежать у «Вхідних». Якщо архівом користуєтеся — переносьте «Усю пошту» і виключайте ярлики.',
      ],
      [
        'Чи з’являться дублі, якщо запустити перенесення вдруге?',
        'Ні. Повторний прохід звіряє листи на приймачі й копіює лише те, чого бракує.',
      ],
      [
        'Чому обсяг на новому місці все одно відрізняється?',
        'Провайдери по-різному рахують службові дані та вкладення. Звіряти треба кількість листів за папками, а не гігабайти.',
      ],
    ],
    links: [
      { path: '/migrate/gmail-to-outlook', label: 'Перенесення з Gmail на Outlook' },
      { path: '/migrate/gmail-to-microsoft-365', label: 'Перенесення з Gmail на Microsoft 365' },
      { path: '/docs/errors/quota-exceeded', label: 'Помилка QUOTA EXCEEDED: розбір' },
    ],
  },
};
