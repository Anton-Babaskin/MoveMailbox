'use client';

import { useEffect } from 'react';
import { initCalculator } from '@/lib/calculator';

export function Calculator() {
  useEffect(() => { initCalculator(); }, []);

  return (
    <>
      <section className="shell alt" id="calc">
        <div className="head-wide">
          <p className="eyebrow">Оценка до запуска</p>
          <h2>Сколько это займёт <span className="ital">и во сколько обойдётся.</span></h2>
          <p className="lede" style={{ marginTop: '16px' }}>Скорость переноса определяет не ваш канал, а лимиты провайдера-источника. Gmail отдаёт около 2.5 ГБ в сутки и никакие настройки этого не изменят — поэтому время лучше узнать заранее, а не на третий день.</p>
        </div>
        <div className="calc">
          <div className="calc-in">
            <div className="ctrl">
              <label htmlFor="cSize">Объём ящика <span className="val" id="cSizeV">12 ГБ</span></label>
              <input type="range" id="cSize" min="1" max="120" value="12" step="1" />
            </div>
            <div className="ctrl">
              <label>Откуда переносим</label>
              <div className="src-grid" id="cSrc">
                <button type="button" aria-pressed="true"  data-r="104"  data-n="Gmail"           data-note="суточный лимит выгрузки ~2.5 ГБ"><b>Gmail</b><small>~2.5 ГБ / сутки</small></button>
                <button type="button" aria-pressed="false" data-r="520"  data-n="Microsoft 365"   data-note="троттлинг Exchange Online при активной записи"><b>Microsoft 365</b><small>~0.5 ГБ / час</small></button>
                <button type="button" aria-pressed="false" data-r="1450" data-n="Яндекс.Почта"    data-note="ограничение частоты запросов, рвёт частые сессии"><b>Яндекс</b><small>~1.4 ГБ / час</small></button>
                <button type="button" aria-pressed="false" data-r="820"  data-n="iCloud Mail"     data-note="низкий лимит одновременных подключений"><b>iCloud</b><small>~0.8 ГБ / час</small></button>
                <button type="button" aria-pressed="false" data-r="4600" data-n="свой IMAP-сервер" data-note="упирается в канал, а не в лимиты провайдера"><b>Свой сервер</b><small>~4.5 ГБ / час</small></button>
              </div>
            </div>
          </div>
          <div className="calc-out">
            <div>
              <p className="lbl">Ориентировочное время</p>
              <p className="calc-big" id="cTime">—</p>
            </div>
            <div className="calc-rows">
              <div><span>Источник</span><b id="cName">Gmail</b></div>
              <div><span>Эффективная скорость</span><b id="cRate">—</b></div>
              <div><span>Писем примерно</span><b id="cMsgs">—</b></div>
              <div><span>Тариф по объёму</span><b className="hi" id="cPlan">—</b></div>
            </div>
            <p className="calc-note" id="cNote">Оценка, а не гарантия: реальная скорость зависит от размера писем, числа папок и текущей загрузки провайдера. Мелкие письма едут медленнее крупных — накладные расходы на каждое сообщение одинаковы.</p>
          </div>
        </div>
      </section>
    </>
  );
}
