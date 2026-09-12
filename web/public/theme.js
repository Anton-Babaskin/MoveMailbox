/* Тема выставляется до первой отрисовки — иначе при загрузке мигает светлым.
   Отдельным файлом, а не inline: CSP на бекенде задаёт script-src 'self'. */
(function () {
  try {
    var m = localStorage.getItem('mm.theme');
    if (m === 'dark' || m === 'light') document.documentElement.dataset.theme = m;
  } catch (e) {}
})();
