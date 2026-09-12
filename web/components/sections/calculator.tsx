'use client';

import { useEffect } from 'react';
import { initCalculator } from '@/lib/calculator';
import { calculator } from '@/content/sections/calculator';
import type { Lang } from '@/i18n/config';

export function Calculator({ lang }: { lang: Lang }) {
  const t = calculator[lang];

  useEffect(() => { initCalculator(lang); }, [lang]);

  return (
    <>
      <section className="shell alt" id="calc">
        <div className="head-wide">
          <p className="eyebrow">{t.eyebrow}</p>
          <h2>{t.h2a}<span className="ital">{t.h2b}</span></h2>
          <p className="lede" style={{ marginTop: '16px' }}>{t.lede}</p>
        </div>
        <div className="calc">
          <div className="calc-in">
            <div className="ctrl">
              <label htmlFor="cSize">{t.sizeLabel} <span className="val" id="cSizeV">{t.sizeValue}</span></label>
              <input type="range" id="cSize" min="1" max="120" value="12" step="1" />
            </div>
            <div className="ctrl">
              <label>{t.srcLabel}</label>
              <div className="src-grid" id="cSrc">
                <button type="button" aria-pressed="true"  data-r="104"  data-n="Gmail"           data-note="суточный лимит выгрузки ~2.5 ГБ"><b>{t.src.gmail.name}</b><small>{t.src.gmail.rate}</small></button>
                <button type="button" aria-pressed="false" data-r="520"  data-n="Microsoft 365"   data-note="троттлинг Exchange Online при активной записи"><b>{t.src.m365.name}</b><small>{t.src.m365.rate}</small></button>
                <button type="button" aria-pressed="false" data-r="1450" data-n="Яндекс.Почта"    data-note="ограничение частоты запросов, рвёт частые сессии"><b>{t.src.yandex.name}</b><small>{t.src.yandex.rate}</small></button>
                <button type="button" aria-pressed="false" data-r="820"  data-n="iCloud Mail"     data-note="низкий лимит одновременных подключений"><b>{t.src.icloud.name}</b><small>{t.src.icloud.rate}</small></button>
                <button type="button" aria-pressed="false" data-r="4600" data-n="свой IMAP-сервер" data-note="упирается в канал, а не в лимиты провайдера"><b>{t.src.own.name}</b><small>{t.src.own.rate}</small></button>
              </div>
            </div>
          </div>
          <div className="calc-out">
            <div>
              <p className="lbl">{t.timeLabel}</p>
              <p className="calc-big" id="cTime">—</p>
            </div>
            <div className="calc-rows">
              <div><span>{t.rowSource}</span><b id="cName">{t.sourceDefault}</b></div>
              <div><span>{t.rowRate}</span><b id="cRate">—</b></div>
              <div><span>{t.rowMsgs}</span><b id="cMsgs">—</b></div>
              <div><span>{t.rowPlan}</span><b className="hi" id="cPlan">—</b></div>
            </div>
            <p className="calc-note" id="cNote">{t.note}</p>
          </div>
        </div>
      </section>
    </>
  );
}
