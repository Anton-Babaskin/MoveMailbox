import { brief } from '@/content/sections/brief';
import { href, type Lang } from '@/i18n/config';

export function Brief({ lang }: { lang: Lang }) {
  const t = brief[lang];
  return (
    <>
      <section className="shell alt">
        <div className="brief">
          <div className="brief-col">
            <p className="eyebrow">{t.stepsEyebrow}</p>
            <ol className="brief-list">
              <li><span>1</span><div><b>{t.step1Title}</b>{t.step1Text}</div></li>
              <li><span>2</span><div><b>{t.step2Title}</b>{t.step2Text}</div></li>
              <li><span>3</span><div><b>{t.step3Title}</b>{t.step3Text}</div></li>
              <li><span>4</span><div><b>{t.step4Title}</b>{t.step4Text}</div></li>
            </ol>
          </div>
          <div className="brief-col">
            <p className="eyebrow">{t.factsEyebrow}</p>
            <ul className="brief-facts">
              <li><svg><use href="#ck" /></svg><div><b>{t.fact1Title}</b>{t.fact1Text}</div></li>
              <li><svg><use href="#ck" /></svg><div><b>{t.fact2Title}</b>{t.fact2Text}</div></li>
              <li><svg><use href="#ck" /></svg><div><b>{t.fact3Title}</b>{t.fact3Text}</div></li>
              <li><svg><use href="#ck" /></svg><div><b>{t.fact4Title}</b>{t.fact4Text}</div></li>
            </ul>
            <a className="brief-link" href={href(lang, '/security')}>{t.securityLink}<svg><use href="#ar" /></svg></a>
          </div>
        </div>
      </section>
    </>
  );
}
