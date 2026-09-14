/* Тема выставляется до первой отрисовки — иначе при загрузке мигает светлым.
   Отдельным файлом, а не inline: CSP на бекенде задаёт script-src 'self'. */
(function () {
  try {
    var m = localStorage.getItem('mm.theme');
    if (m === 'dark' || m === 'light') document.documentElement.dataset.theme = m;
  } catch (e) {}
})();

/* Плашка «страница есть на вашем языке» решается здесь же, до первой
   отрисовки. Раньше она появлялась после гидратации и двигала страницу:
   0.11 CLS на мобильном — при пороге «хорошо» 0.1. DOM тут ещё не собран,
   поэтому ставим атрибут на <html>, а показывает нужный блок CSS. */
(function () {
  try {
    if (localStorage.getItem('mm.lang')) return;
  } catch (e) {}
  var page = (document.documentElement.getAttribute('lang') || '').slice(0, 2);
  var list = (navigator.languages && navigator.languages.length)
    ? navigator.languages : [navigator.language];
  for (var i = 0; i < list.length; i++) {
    var base = String(list[i] || '').toLowerCase().split('-')[0];
    if (base !== 'ru' && base !== 'en' && base !== 'uk') continue;
    if (base !== page) document.documentElement.setAttribute('data-lang-suggest', base);
    return;
  }
})();
