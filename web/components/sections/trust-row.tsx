import { trustRow } from '@/content/sections/trust-row';
import type { Lang } from '@/i18n/config';

export function TrustRow({ lang }: { lang: Lang }) {
  const t = trustRow[lang];
  return (
    <>
      <div className="trust">
        <ul className="shell">
          <li><svg><use href="#ml" /></svg>{t.protocol}</li>
          <li><svg><use href="#ck" /></svg>{t.sourceKept}</li>
          <li><svg><use href="#ck" /></svg>{t.imapsync}</li>
          <li><svg><use href="#ck" /></svg>{t.free}</li>
        </ul>
      </div>
    </>
  );
}
