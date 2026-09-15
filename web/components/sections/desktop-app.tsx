import { desktopApp } from '@/content/sections/desktop-app';
import type { Lang } from '@/i18n/config';

export function DesktopApp({ lang }: { lang: Lang }) {
  const t = desktopApp[lang];
  return (
    <>
      <section className="shell" id="windows">
        <div className="win">
          {/* Было нарисованное окно приложения: полоса с тремя точками, именем
              программы и подписью «IMAP → IMAP». От него отказались на главной
              и отказываемся здесь — сайт говорит своим языком, а не рисует
              чужой интерфейс. Осталось то, что действительно что-то сообщает:
              значок, название режима словами и полосы идущего копирования. */}
          <div className="frame" aria-hidden="true">
            <div className="frame-b">
              <span className="ico"><svg aria-hidden="true" style={{ width: '26px', height: '26px' }}><use href="#lp" /></svg></span>
              <strong>{t.mockTitle}</strong>
              <span>{t.mockNote}</span>
              <div className="bars"><i></i><i></i><i></i><i></i><i></i></div>
            </div>
          </div>
          <div>
            <p className="eyebrow">{t.eyebrow}</p>
            <h2>{t.h2a}<span className="ital">{t.h2b}</span></h2>
            <p className="lede" style={{ marginTop: '16px' }}>{t.lede}</p>
            <ul className="ticks" style={{ marginTop: '22px' }}>
              <li><svg aria-hidden="true"><use href="#ck" /></svg>{t.ticks[0]}</li>
              <li><svg aria-hidden="true"><use href="#ck" /></svg>{t.ticks[1]}</li>
              <li><svg aria-hidden="true"><use href="#ck" /></svg>{t.ticks[2]}</li>
              <li><svg aria-hidden="true"><use href="#ck" /></svg>{t.ticks[3]}</li>
            </ul>
            <div className="keep local" style={{ marginTop: '22px' }}>
              <svg aria-hidden="true"><use href="#al" /></svg>
              <p><b>{t.keepStrong}</b>{t.keepRest}</p>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '26px' }}>
              <a className="btn btn-p" href="https://github.com/Anton-Babaskin/MoveMailbox/releases/tag/v0.4.0-preview" target="_blank" rel="noreferrer">{t.download}<svg aria-hidden="true" style={{ width: '16px', height: '16px' }}><use href="#dl" /></svg></a>
              <a className="btn btn-g" href="https://github.com/Anton-Babaskin/MoveMailbox#readme" target="_blank" rel="noreferrer">{t.whatsInside}</a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
