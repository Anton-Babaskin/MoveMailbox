import { langSuggest } from '@/content/lang-suggest';
import { LANGS, href, type Lang } from '@/i18n/config';

const STORE = 'mm.lang';

/**
 * Запоминает выбранный язык. Вызывается из переключателя в шапке: если человек
 * выбрал язык руками, предлагать ему другой уже незачем.
 *
 * Живёт здесь, а не в lib/, чтобы ключ хранилища был в одном месте с разметкой,
 * которая от него зависит.
 */
export function remember(lang: Lang) {
  try {
    localStorage.setItem(STORE, lang);
  } catch {
    /* приватный режим — просто не запомним */
  }
}

/**
 * Предложение перейти на язык браузера.
 *
 * Именно предложение, а не перенаправление: автоматический редирект по языку
 * ломает две вещи сразу — человек теряет адрес, который ему прислали, а краулер
 * получает все языковые версии по одному адресу вопреки hreflang.
 *
 * Разметка рендерится на сервере для обоих «других» языков и скрыта в CSS.
 * Показывает нужный блок public/theme.js — он ставит data-lang-suggest на <html>
 * ещё в <head>, до первой отрисовки. Так сделано не из любви к сложности:
 * когда блок появлялся после гидратации, страница на мобильном дёргалась на
 * 0.11 CLS, а это ровно та аудитория, ради которой плашка и existует —
 * посетители с языком браузера, отличным от языка страницы.
 */
export function LangSuggest({ lang }: { lang: Lang }) {
  const others = LANGS.filter((l) => l !== lang);

  return (
    <>
      {others.map((want) => {
        const t = langSuggest[want];
        return (
          <div
            className="lang-suggest"
            data-suggest={want}
            key={want}
            role="region"
            aria-label={t.title}
            lang={want}
          >
            <div className="lang-suggest-in">
              <p>{t.title}</p>
              <div className="lang-suggest-acts">
                {/* href уточняется скриптом до текущего адреса; пока он не
                    отработал, ссылка ведёт на главную нужного языка — рабочий
                    вариант, а не заглушка. */}
                <a className="btn btn-p btn-s" data-suggest-go={want} href={href(want, '/')}>
                  {t.action}
                </a>
                <button type="button" className="lang-suggest-no" data-suggest-stay={lang}>
                  {t.dismiss}
                </button>
              </div>
              <button
                type="button"
                className="lang-suggest-x"
                aria-label={t.close}
                data-suggest-stay={lang}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </>
  );
}
