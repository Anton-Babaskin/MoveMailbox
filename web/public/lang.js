/* Язык по языку браузера.
   Отдельным файлом, а не inline: CSP на бекенде задаёт script-src 'self'.

   Правила намеренно узкие, потому что автоперенаправление по языку легко
   ломает индексацию и бесит пользователя:
   - перенаправляем только с русской версии (она же x-default) и только один
     раз, до первой отрисовки;
   - явный выбор в переключателе запоминается и отменяет автоопределение
     навсегда;
   - адрес с префиксом (/en, /uk) не трогаем вовсе: человек уже там, где хотел;
   - поисковых роботов не трогаем: пусть каждая языковая версия достаётся им
     по своему адресу, как и объявлено в hreflang. */
(function () {
  var KEY = 'mm.lang';
  var PREFIXED = ['en', 'uk'];

  function stored() {
    try {
      return localStorage.getItem(KEY);
    } catch (e) {
      return null;
    }
  }

  /* Первый язык из списка предпочтений, для которого у нас есть версия. */
  function detect() {
    var list = navigator.languages || [navigator.language || ''];
    for (var i = 0; i < list.length; i++) {
      var tag = String(list[i]).toLowerCase();
      var base = tag.split('-')[0];
      if (base === 'ru') return 'ru';
      if (base === 'uk') return 'uk';
      if (base === 'en') return 'en';
    }
    return null;
  }

  function isCrawler() {
    return /bot|crawl|spider|slurp|yandex|google|bing|duckduck|baidu|facebookexternalhit|telegram|whatsapp|preview/i.test(
      navigator.userAgent || '',
    );
  }

  var path = location.pathname;
  var first = path.split('/')[1];

  /* На языковой версии только запоминаем, что человек здесь, и выходим. */
  if (PREFIXED.indexOf(first) !== -1) return;

  if (stored() || isCrawler()) return;

  var want = detect();
  if (!want || want === 'ru') return;

  location.replace('/' + want + (path === '/' ? '/' : path) + location.search + location.hash);
})();

/* Клик по переключателю языка — явный выбор: запоминаем и больше не угадываем. */
document.addEventListener('click', function (e) {
  var link = e.target && e.target.closest && e.target.closest('[data-lang]');
  if (!link) return;
  try {
    localStorage.setItem('mm.lang', link.getAttribute('data-lang'));
  } catch (err) {}
});
