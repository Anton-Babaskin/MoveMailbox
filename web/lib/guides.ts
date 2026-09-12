// @ts-nocheck — imperative bundle ported from the static mockup
/* eslint-disable */
const $ = (s: string, r: ParentNode = document) => r.querySelector(s) as HTMLElement | null;
const $$ = (s: string, r: ParentNode = document) =>
  Array.prototype.slice.call(r.querySelectorAll(s)) as HTMLElement[];

/** Справочник провайдеров: данные и переключение вкладок. */
export function initProviderGuides() {
  (function(){
  /* ---- provider guides ---- */
  var PV={
   gmail:{n:'Gmail / Google Workspace',
    intro:'Самый частый источник и самое частое место, где перенос спотыкается. Gmail не хранит папки — он хранит ярлыки, поэтому одно письмо видно сразу в нескольких «папках», и наивный перенос легко создаёт дубликаты.',
    conn:[['Сервер','imap.gmail.com'],['Порт','993 · SSL/TLS'],['Логин','полный адрес'],['Пароль','пароль приложения']],
    steps:['В аккаунте Google включите двухэтапную аутентификацию — без неё пароли приложений недоступны.',
     'Откройте раздел «Пароли приложений», создайте пароль с именем MoveMailbox и скопируйте 16 символов.',
     'В Gmail: Настройки → Пересылка и POP/IMAP → «Включить IMAP» → Сохранить.',
     'В поле пароля вставьте пароль приложения без пробелов. Обычный пароль аккаунта работать не будет.',
     'Для Google Workspace убедитесь, что администратор не выключил IMAP для организации.'],
    warns:[['<b>Ярлык «Вся почта»</b> — <code>[Gmail]/All Mail</code> содержит копии всех писем. Если не исключить его, объём удваивается и в назначение приезжают дубли.',1],
     ['<b>Лимит на объём</b> — Gmail отдаёт примерно 2 500 МБ в сутки на ящик через IMAP. Большой архив едет несколько дней, это нормально, а не поломка.',1],
     ['<b>Корзина и Спам</b> обычно переносить не нужно: снимите галочки на <code>[Gmail]/Trash</code> и <code>[Gmail]/Spam</code>.',1],
     ['<b>Приостановка</b> — при слишком агрессивной скорости Google временно блокирует IMAP на несколько часов. Мы держим один поток и паузы между папками.',1]],
    cmd:'imapsync \\\n  --host1 imap.gmail.com --port1 993 --ssl1 \\\n  --user1 anna@old.com --passfile1 /run/secrets/p1 \\\n  --host2 imap.new.com --port2 993 --ssl2 \\\n  --user2 anna@new.com --passfile2 /run/secrets/p2 \\\n  --exclude "^\\[Gmail\\]/All Mail$" --exclude "^\\[Gmail\\]/Spam$" \\\n  --automap --dry'},
   m365:{n:'Microsoft 365 / Exchange Online',
    intro:'Самый денежный маршрут и самый требовательный. Microsoft отключил basic authentication для Exchange Online, поэтому обычная пара «логин + пароль» на большинстве тенантов уже не проходит — нужен OAuth 2.0 (XOAUTH2).',
    conn:[['Сервер','outlook.office365.com'],['Порт','993 · SSL/TLS'],['Логин','UPN пользователя'],['Аутентификация','OAuth 2.0 / XOAUTH2']],
    steps:['Убедитесь, что у пользователя включён IMAP: Exchange admin center → Получатели → Почтовые ящики → Управление email-приложениями.',
     'Если basic auth отключён (по умолчанию так) — авторизуйтесь через OAuth: MoveMailbox запросит доступ и получит токен, пароль вводить не нужно.',
     'Для тенанта, где OAuth ещё не согласован, администратор даёт согласие один раз на приложение с правом <code>IMAP.AccessAsUser.All</code>.',
     'Альтернатива для одиночного ящика с MFA — пароль приложения, но он доступен не во всех тенантах и Microsoft его сворачивает.',
     'Проверьте лимит подключений: 20 одновременных IMAP-сессий на ящик, иначе сервер начнёт рвать соединения.'],
    warns:[['<b>Throttling</b> — Exchange Online режет скорость при интенсивной записи. На больших ящиках закладывайте время, а не увеличивайте параллелизм.',1],
     ['<b>Спецпапки</b> — Archive, Conversation History и Notes переносятся как обычные IMAP-папки, но их содержимое в Outlook может выглядеть иначе.',1],
     ['<b>Размер письма</b> — по умолчанию 35 МБ на входящее. Письма с большими вложениями будут пропущены и попадут в отчёт.',1],
     ['<b>Личные архивы</b> (In-Place Archive) через IMAP не видны вообще — это отдельное хранилище, нужен другой инструмент.',1]],
    cmd:'imapsync \\\n  --host1 imap.old.com --port1 993 --ssl1 --user1 anna@old.com \\\n  --host2 outlook.office365.com --port2 993 --ssl2 \\\n  --user2 anna@company.com \\\n  --oauthaccesstoken2 /run/secrets/o365.token \\\n  --office2 --automap --useuid'},
   outlook:{n:'Outlook.com / Hotmail / Live',
    intro:'Личные ящики Microsoft. Хост тот же, что у корпоративного 365, но пароль приложения здесь ещё поддерживается — при включённой двухшаговой проверке это самый простой путь.',
    conn:[['Сервер','outlook.office365.com'],['Порт','993 · SSL/TLS'],['Логин','полный адрес'],['Пароль','пароль приложения']],
    steps:['Включите двухшаговую проверку в настройках безопасности учётной записи Microsoft.',
     'Создайте пароль приложения в разделе «Дополнительные параметры безопасности».',
     'В качестве логина укажите полный адрес: <code>name@outlook.com</code>, <code>@hotmail.com</code> или <code>@live.ru</code>.',
     'Если двухшаговая проверка выключена, подойдёт обычный пароль — но включить её всё равно стоит.'],
    warns:[['<b>Папка «Нежелательная почта»</b> у Microsoft называется <code>Junk</code>, а не <code>Spam</code> — при ручном маппинге это частая ошибка.',1],
     ['<b>Кириллические имена папок</b> кодируются в modified UTF-7. Мы декодируем их автоматически, но в чужих логах вы увидите <code>&amp;BB0EQgQ-</code> — это норма.',1],
     ['<b>Старые Hotmail-ящики</b> иногда требуют однократного входа через веб-интерфейс, прежде чем IMAP начнёт отвечать.',1]],
    cmd:'imapsync \\\n  --host1 outlook.office365.com --port1 993 --ssl1 \\\n  --user1 anna@outlook.com --passfile1 /run/secrets/p1 \\\n  --host2 imap.new.com --port2 993 --ssl2 --user2 anna@new.com \\\n  --regextrans2 "s/^Junk$/Спам/" --automap'},
   yandex:{n:'Яндекс.Почта',
    intro:'Яндекс требует два отдельных действия: включить IMAP в почте и создать пароль приложения в Яндекс ID. Пропуск любого из них даёт одинаковую ошибку «AUTHENTICATIONFAILED», из-за чего люди часами проверяют не тот пароль.',
    conn:[['Сервер','imap.yandex.ru'],['Порт','993 · SSL/TLS'],['Логин','логин без домена'],['Пароль','пароль приложения']],
    steps:['Почта → Настройки → «Почтовые программы» → включить «С сервера imap.yandex.ru по протоколу IMAP».',
     'Яндекс ID → Безопасность → «Пароли приложений» → создать пароль для типа «Почта».',
     'Для домена на Яндекс 360 логин — полный адрес; для обычного ящика достаточно логина без <code>@yandex.ru</code>.',
     'Проверьте, что в аккаунте не включён «Запрет доступа сторонним приложениям».'],
    warns:[['<b>Ограничение скорости</b> — Яндекс закрывает соединение при слишком частых запросах. Один поток и небольшие паузы работают стабильнее, чем пять потоков.',1],
     ['<b>Папка «Удалённые»</b> очищается по расписанию сервера — переносить её обычно бессмысленно.',1],
     ['<b>Яндекс 360 для бизнеса</b> — администратор может запретить IMAP на уровне организации; проверяйте до начала переноса.',1]],
    cmd:'imapsync \\\n  --host1 imap.yandex.ru --port1 993 --ssl1 --user1 anna \\\n  --passfile1 /run/secrets/p1 \\\n  --host2 imap.gmail.com --port2 993 --ssl2 --user2 anna@gmail.com \\\n  --passfile2 /run/secrets/p2 --automap --skipcrossduplicates'},
   icloud:{n:'iCloud Mail',
    intro:'У Apple пароль приложения обязателен всегда — обычный пароль Apple ID по IMAP не примут ни при каких настройках. Логин здесь тоже нестандартный: только часть до собаки.',
    conn:[['Сервер','imap.mail.me.com'],['Порт','993 · SSL/TLS'],['Логин','часть до @'],['Пароль','app-specific password']],
    steps:['На appleid.apple.com включите двухфакторную аутентификацию, если она ещё не включена.',
     'Раздел «Безопасность» → «Пароли для приложений» → создать и скопировать пароль вида <code>abcd-efgh-ijkl-mnop</code>.',
     'В логин впишите только имя пользователя: для <code>anna@icloud.com</code> это <code>anna</code>.',
     'Дефисы в пароле сохраняйте — Apple их учитывает.'],
    warns:[['<b>Псевдонимы (aliases)</b> не имеют собственных ящиков: вся почта лежит в основном аккаунте.',1],
     ['<b>Лимит одновременных подключений</b> низкий — параллельные переносы нескольких папок Apple рвёт.',1],
     ['<b>@mac.com и @me.com</b> работают через тот же хост, менять ничего не нужно.',1]],
    cmd:'imapsync \\\n  --host1 imap.mail.me.com --port1 993 --ssl1 --user1 anna \\\n  --passfile1 /run/secrets/p1 \\\n  --host2 imap.new.com --port2 993 --ssl2 --user2 anna@new.com \\\n  --passfile2 /run/secrets/p2 --automap --maxbytespersecond 900000'},
   zoho:{n:'Zoho Mail',
    intro:'Частый выбор небольших компаний, уходящих с бесплатного Google Workspace. Главная особенность — региональные датацентры: неправильный хост даёт ошибку авторизации, а не ошибку соединения.',
    conn:[['Сервер','imap.zoho.com / .eu'],['Порт','993 · SSL/TLS'],['Логин','полный адрес'],['Пароль','app password']],
    steps:['Zoho Mail → Settings → Mail Accounts → включить IMAP Access.',
     'Accounts → Security → App Passwords → создать пароль для MoveMailbox.',
     'Выберите правильный регион: <code>imap.zoho.com</code> (US), <code>imap.zoho.eu</code> (EU), <code>imap.zoho.in</code> (IN).',
     'Для бесплатного тарифа IMAP может быть недоступен — проверьте план до начала.'],
    warns:[['<b>Регион</b> — ящик, созданный в EU-датацентре, не отвечает на US-хосте, и наоборот. Ошибка выглядит как неверный пароль.',1],
     ['<b>Бесплатный план</b> исторически ограничивает IMAP/POP. Если авторизация проходит, а папки пустые — дело в плане.',1],
     ['<b>Zoho-специфичные папки</b> вроде <code>Templates</code> переносить не нужно.',1]],
    cmd:'imapsync \\\n  --host1 imap.zoho.eu --port1 993 --ssl1 --user1 anna@company.com \\\n  --passfile1 /run/secrets/p1 \\\n  --host2 outlook.office365.com --port2 993 --ssl2 \\\n  --user2 anna@company.com --oauthaccesstoken2 /run/secrets/tok \\\n  --office2 --automap'},
   cpanel:{n:'cPanel / Dovecot / свой сервер',
    intro:'Классический переезд с хостинга на хостинг. Технически самый простой случай — вы контролируете обе стороны, — но чаще всего ломается на сертификате: у shared-хостинга он выписан на имя сервера, а не на ваш домен.',
    conn:[['Сервер','mail.domain.tld'],['Порт','993 · SSL/TLS'],['Логин','полный адрес'],['Пароль','пароль ящика']],
    steps:['Возьмите настройки в cPanel → Email Accounts → Connect Devices → секция «Secure SSL/TLS Settings».',
     'Логин почти всегда полный адрес: <code>anna@domain.tld</code>, а не <code>anna</code>.',
     'Если <code>mail.domain.tld</code> уже указывает на новый сервер, подключайтесь к старому по IP-адресу — поле хоста это принимает.',
     'При самоподписанном сертификате включите в расширенных настройках приём непроверенного сертификата.',
     'На своём Dovecot переносить лучше при остановленном доступе пользователей — иначе новые письма падают в оба ящика.'],
    warns:[['<b>Разделитель папок</b> — Dovecot использует <code>/</code>, старые Courier-серверы <code>.</code>. Из-за этого <code>INBOX.Sent</code> превращается в отдельную папку вместо вложенной.',1],
     ['<b>Квота на назначении</b> — 12 ГБ не влезут в тариф на 5 ГБ. Проверьте квоту до запуска, иначе перенос встанет на середине.',1],
     ['<b>Смена DNS</b> — переносите почту до переключения MX, а после переключения догоняйте вторым проходом: повторный запуск скопирует только новое.',1],
     ['<b>Автоответы и фильтры</b> (Sieve) через IMAP не переносятся — их придётся перенести отдельно.',1]],
    cmd:'imapsync \\\n  --host1 203.0.113.10 --port1 993 --ssl1 --user1 anna@domain.tld \\\n  --passfile1 /run/secrets/p1 --sslargs1 SSL_verify_mode=0 \\\n  --host2 mail.newhost.tld --port2 993 --ssl2 --user2 anna@domain.tld \\\n  --passfile2 /run/secrets/p2 \\\n  --automap --usecache --skipsize --addheader'}
  };
  function esc(s){return s;}
  function render(key){
    var d=PV[key];
    var conn=d.conn.map(function(c){return '<div><small>'+c[0]+'</small><strong>'+c[1]+'</strong></div>';}).join('');
    var steps=d.steps.map(function(s){return '<li>'+s+'</li>';}).join('');
    var warns=d.warns.map(function(w){return '<li><svg><use href="#al"/></svg><span>'+w[0]+'</span></li>';}).join('');
    var btn=$('.pv-nav button[data-pv="'+key+'"]'),
        brand=btn.getAttribute('style'),
        slot=btn.querySelector('.pvi').innerHTML;
    $('#pvBody').innerHTML='<div class="pv-panel">'+
      '<div class="pv-head"><span class="pvi lg" style="'+brand+'">'+slot+'</span>'+
      '<h3>'+d.n+'</h3><span class="hosttag">'+d.conn[0][1]+' : '+d.conn[1][1].split(' ')[0]+'</span></div>'+
      '<p class="intro">'+d.intro+'</p>'+
      '<div class="conn">'+conn+'</div>'+
      '<div class="pv-cols"><div><h4>Пошагово</h4><ol class="olist">'+steps+'</ol></div>'+
      '<div><h4>Подводные камни</h4><ul class="warns">'+warns+'</ul></div></div>'+
      '<div class="cmd"><small>Эквивалент в imapsync — то, что MoveMailbox соберёт за вас</small><pre>'+d.cmd+'</pre></div>'+
      '</div>';
  }
  $$('.pv-nav button').forEach(function(b){ b.addEventListener('click',function(){
    $$('.pv-nav button').forEach(function(o){o.setAttribute('aria-selected','false')});
    b.setAttribute('aria-selected','true'); render(b.dataset.pv); });});
  render('gmail');
  })();
}
