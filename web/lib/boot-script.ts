/**
 * Скрипт, который обязан отработать до первой отрисовки.
 *
 * Здесь он лежит строкой, а не отдельным файлом в public/, по двум причинам.
 * Первая: отдельный файл — это лишний запрос на критическом пути, а весит он
 * меньше, чем стоит round-trip на медленном канале. Вторая: читать файл через
 * fs на сборке нельзя — страница global-not-found тогда теряет собственный
 * документ и получает от Next вторую обёртку <html> (ловится проверкой
 * scripts/check-export.mjs).
 *
 * CSP не страдает: бекенд сайта считает sha256 всех инлайн-скриптов страницы
 * сам — internal/web/static.go.
 *
 * Делает ровно две вещи, обе — до первого кадра:
 *   1) выставляет выбранную тему, иначе тёмная мигает светлым;
 *   2) решает, показывать ли плашку «страница есть на вашем языке», иначе
 *      её появление двигает раскладку (было 0.11 CLS на мобильном).
 */
export const bootScript = `(function(){
try{var m=localStorage.getItem('mm.theme');
if(m==='dark'||m==='light')document.documentElement.dataset.theme=m;}catch(e){}
try{if(localStorage.getItem('mm.lang'))return;}catch(e){}
var p=(document.documentElement.getAttribute('lang')||'').slice(0,2);
var l=(navigator.languages&&navigator.languages.length)?navigator.languages:[navigator.language];
for(var i=0;i<l.length;i++){var b=String(l[i]||'').toLowerCase().split('-')[0];
if(b!=='ru'&&b!=='en'&&b!=='uk')continue;
if(b!==p)document.documentElement.setAttribute('data-lang-suggest',b);return;}
})();`;
