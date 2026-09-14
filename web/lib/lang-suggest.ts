/**
 * Поведение плашки выбора языка.
 *
 * Видимость решает public/theme.js ещё в <head> — здесь только то, что не
 * влияет на раскладку: уточнение адреса ссылки до текущей страницы и запоминание
 * выбора. Если этот код не выполнится совсем, плашка останется рабочей: ссылка
 * ведёт на главную нужного языка, а закрыть её можно перезагрузкой.
 */
const STORE = 'mm.lang';

function save(lang: string) {
  try {
    localStorage.setItem(STORE, lang);
  } catch {
    /* приватный режим */
  }
}

export function initLangSuggest() {
  const box = document.querySelector<HTMLElement>('.lang-suggest[data-suggest]:not([hidden])');
  const root = document.documentElement;
  const want = root.dataset.langSuggest;
  if (!want) return;

  const shown = document.querySelector<HTMLElement>(`.lang-suggest[data-suggest="${want}"]`);
  if (!shown) return;

  /* Тот же адрес, но на другом языке: русский лежит в корне, остальные под
     префиксом. Путь берём из адресной строки, а не из роутера: скрипт общий
     для всех страниц. */
  const link = shown.querySelector<HTMLAnchorElement>('[data-suggest-go]');
  if (link) {
    const clean = location.pathname.replace(/^\/(en|uk)(?=\/|$)/, '') || '/';
    link.href = want === 'ru' ? clean : `/${want}${clean}`;
    link.addEventListener('click', () => save(want));
  }

  for (const button of shown.querySelectorAll<HTMLElement>('[data-suggest-stay]')) {
    button.addEventListener('click', () => {
      save(button.dataset.suggestStay || '');
      shown.classList.add('out');
      /* Прячем после анимации: у элемента нет места в потоке, поэтому
         исчезновение сдвига не вызывает. */
      setTimeout(() => {
        root.removeAttribute('data-lang-suggest');
        shown.classList.remove('out');
      }, 220);
    });
  }

  if (box && box !== shown) box.hidden = true;
}
