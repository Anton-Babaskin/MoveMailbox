// @ts-nocheck — imperative bundle ported from the static mockup
/* eslint-disable */

import type { calculatorRuntime } from '@/content/sections/calculator-runtime';
import type { Lang } from '@/i18n/config';

const $ = (s: string, r: ParentNode = document) => r.querySelector(s) as HTMLElement | null;
const $$ = (s: string, r: ParentNode = document) =>
  Array.prototype.slice.call(r.querySelectorAll(s)) as HTMLElement[];

/** Калькулятор времени переноса по лимитам провайдеров.
 *  Словарь приходит аргументом — по той же причине, что и в workspace:
 *  клиентскому бандлу незачем знать языки, которых посетитель не видит. */
export function initCalculator(
  strings: (typeof calculatorRuntime)[Lang],
  lang: Lang = 'ru',
) {
  /* Строки интерфейса берём одним блоком: ниже код работает только с T. */
  var T = strings;

  /* ---- calculator ---- */
  (function(){
    var sz=$('#cSize'), grid=$('#cSrc'), dstGrid=$('#cDst'); if(!sz) return;
    /* Формы числительных приходят из словаря вместе с правилом выбора:
       'slavic' — три формы (1 день / 2 дня / 5 дней), 'english' — две. */
    function plural(n,f){
      if(T.pluralRule==='english') return f[n===1?0:1];
      return f[n%10===1&&n%100!==11?0:(n%10>=2&&n%10<=4&&(n%100<10||n%100>=20)?1:2)];
    }
    function human(h){
      if(h<1) return '<em>'+Math.max(5,Math.round(h*60))+'</em> '+T.minutes;
      if(h<24){var m=Math.round((h%1)*60);return '<em>'+Math.floor(h)+'</em> '+T.hours+(m?' <em>'+m+'</em> '+T.minutes:'');}
      var d=Math.floor(h/24), r=Math.round(h%24);
      return '<em>'+d+'</em> '+plural(d,T.days)+(r?' <em>'+r+'</em> '+T.hours:'');
    }
    /* Ключ словаря — значение data-n: разметка одна на все языки. */
    function pick(g){ return g.querySelector('[aria-pressed="true"]'); }
    function info(act,dict){ return dict[act.dataset.n] || {name:act.dataset.n, note:''}; }
    function calc(){
      var gb=+sz.value,
          from=pick(grid), to=pick(dstGrid),
          fromRate=+from.dataset.r, toRate=+to.dataset.r,
          /* Скорость переноса — минимум из двух: медленная сторона определяет
             всё, быстрая просто ждёт. Именно поэтому приёмник вообще спрашивается. */
          rate=Math.min(fromRate,toRate),
          slow=toRate<fromRate?to:from,
          mb=gb*1024, hours=mb/rate,
          s=info(from,T.sources), d=info(to,T.destinations),
          limit=info(slow, toRate<fromRate?T.destinations:T.sources);
      sz.style.setProperty('--fill',((gb-1)/119*100)+'%');
      $('#cSizeV').textContent=gb+' '+T.gb;
      $('#cTime').innerHTML=human(hours);
      $('#cName').textContent=s.name;
      $('#cDstName').textContent=d.name;
      $('#cRate').textContent=(rate>=1024?(rate/1024).toFixed(1)+' '+T.gbPerHour:rate+' '+T.mbPerHour);
      $('#cMsgs').textContent=Math.round(gb*3400).toLocaleString(T.numberLocale);
      var plan = gb<=5?T.planFree : gb<=25?T.planStandard : gb<=100?T.planLarge : T.planBusiness;
      $('#cPlan').textContent=plan;
      /* В примечании называем узкое место: человеку важно не «медленно»,
         а «медленно из-за приёмника» — это меняет решение, а не настроение. */
      /* Полосы: доля от быстрой стороны, чтобы разрыв было видно глазами. */
      var top=Math.max(fromRate,toRate);
      function bar(id,r,slowest){
        var el=$(id); if(!el) return;
        el.classList.toggle('slow', slowest);
        var fill=el.querySelector('u'), value=el.querySelector('b');
        if(fill) fill.style.width=Math.max(3,Math.round(r/top*100))+'%';
        if(value) value.textContent=(r>=1024?(r/1024).toFixed(1)+' '+T.gbPerHour:r+' '+T.mbPerHour);
      }
      bar('#cBarSrc',fromRate,fromRate<=toRate);
      bar('#cBarDst',toRate,toRate<fromRate);

      var side=(toRate<fromRate?T.sideDestination:T.sideSource);
      $('#cNote').textContent=T.notePrefix+side+limit.note+T.noteTail;
    }
    sz.addEventListener('input',calc);
    [grid,dstGrid].forEach(function(g){
      if(!g) return;
      g.addEventListener('click',function(e){
        var b=e.target.closest('button'); if(!b) return;
        $$('button',g).forEach(function(o){o.setAttribute('aria-pressed','false')});
        b.setAttribute('aria-pressed','true'); calc();
      });
    });
    calc();
  })();
}
