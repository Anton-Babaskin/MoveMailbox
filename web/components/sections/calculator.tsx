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
              {/* defaultValue, а не value: ползунком управляет императивный код в
                  lib/calculator.ts. С value React считает поле контролируемым,
                  предупреждает об отсутствии onChange и откатывает значение. */}
              <input type="range" id="cSize" min="1" max="120" defaultValue="12" step="1" />
            </div>
            <div className="ctrl">
              <label>{t.srcLabel}</label>
              <div className="src-grid" id="cSrc">
                <button type="button" aria-pressed="true"  data-r="104"  data-n="Gmail"><b>{t.src.gmail.name}</b><small>{t.src.gmail.rate}</small><i>{t.src.gmail.basis}</i></button>
                <button type="button" aria-pressed="false" data-r="520"  data-n="Microsoft 365"><b>{t.src.m365.name}</b><small>{t.src.m365.rate}</small><i>{t.src.m365.basis}</i></button>
                <button type="button" aria-pressed="false" data-r="1450" data-n="Яндекс.Почта"><b>{t.src.yandex.name}</b><small>{t.src.yandex.rate}</small><i>{t.src.yandex.basis}</i></button>
                <button type="button" aria-pressed="false" data-r="820"  data-n="iCloud Mail"><b>{t.src.icloud.name}</b><small>{t.src.icloud.rate}</small><i>{t.src.icloud.basis}</i></button>
                <button type="button" aria-pressed="false" data-r="4600" data-n="свой IMAP-сервер"><b>{t.src.own.name}</b><small>{t.src.own.rate}</small><i>{t.src.own.basis}</i></button>
              </div>
            </div>
            <div className="ctrl">
              <label>{t.dstLabel}</label>
              {/* Приёмник считается отдельно: у Gmail документированный лимит на
                  загрузку в пять раз строже, чем на выгрузку, и без этой колонки
                  расчёт переноса В Gmail врал бы в пять раз. */}
              <div className="src-grid" id="cDst">
                <button type="button" aria-pressed="true"  data-r="4600" data-n="свой IMAP-сервер"><b>{t.dst.own.name}</b><small>{t.dst.own.rate}</small><i>{t.dst.own.basis}</i></button>
                <button type="button" aria-pressed="false" data-r="21"   data-n="Gmail"><b>{t.dst.gmail.name}</b><small>{t.dst.gmail.rate}</small><i>{t.dst.gmail.basis}</i></button>
                <button type="button" aria-pressed="false" data-r="520"  data-n="Microsoft 365"><b>{t.dst.m365.name}</b><small>{t.dst.m365.rate}</small><i>{t.dst.m365.basis}</i></button>
                <button type="button" aria-pressed="false" data-r="1450" data-n="Яндекс.Почта"><b>{t.dst.yandex.name}</b><small>{t.dst.yandex.rate}</small><i>{t.dst.yandex.basis}</i></button>
                <button type="button" aria-pressed="false" data-r="820"  data-n="iCloud Mail"><b>{t.dst.icloud.name}</b><small>{t.dst.icloud.rate}</small><i>{t.dst.icloud.basis}</i></button>
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
              <div><span>{t.rowDest}</span><b id="cDstName">—</b></div>
              <div><span>{t.rowRate}</span><b id="cRate">—</b></div>
              <div><span>{t.rowMsgs}</span><b id="cMsgs">—</b></div>
              <div><span>{t.rowPlan}</span><b className="hi" id="cPlan">—</b></div>
            </div>
            {/* Две полосы: видно, какая сторона держит перенос. Числа те же,
                что в строках выше, — это их прочтение, а не новые данные. */}
            <div className="calc-bars" aria-hidden="true">
              <div className="calc-bar" id="cBarSrc"><span className="calc-bar-l">{t.barSource}</span><i><u /></i><b /></div>
              <div className="calc-bar" id="cBarDst"><span className="calc-bar-l">{t.barDest}</span><i><u /></i><b /></div>
            </div>
            <p className="calc-note" id="cNote">{t.note}</p>
          </div>
        </div>
      </section>
    </>
  );
}
