// @ts-nocheck — imperative bundle ported from the static mockup
/* eslint-disable */

import { calculatorRuntime } from '@/content/sections/calculator-runtime';
import type { Lang } from '@/i18n/config';

const $ = (s: string, r: ParentNode = document) => r.querySelector(s) as HTMLElement | null;
const $$ = (s: string, r: ParentNode = document) =>
  Array.prototype.slice.call(r.querySelectorAll(s)) as HTMLElement[];

/** Калькулятор времени переноса по лимитам провайдеров. */
export function initCalculator(lang: Lang = 'ru') {
  /* Строки интерфейса берём одним блоком: ниже код работает только с T. */
  var T = calculatorRuntime[lang] || calculatorRuntime.ru;

  /* ---- calculator ---- */
  (function(){
    var sz=$('#cSize'), grid=$('#cSrc'); if(!sz) return;
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
    function src(act){ return T.sources[act.dataset.n] || {name:act.dataset.n, note:act.dataset.note}; }
    function calc(){
      var gb=+sz.value, act=grid.querySelector('[aria-pressed="true"]'),
          rate=+act.dataset.r, mb=gb*1024, hours=mb/rate, s=src(act);
      sz.style.setProperty('--fill',((gb-1)/119*100)+'%');
      $('#cSizeV').textContent=gb+' '+T.gb;
      $('#cTime').innerHTML=human(hours);
      $('#cName').textContent=s.name;
      $('#cRate').textContent=(rate>=1024?(rate/1024).toFixed(1)+' '+T.gbPerHour:rate+' '+T.mbPerHour);
      $('#cMsgs').textContent=Math.round(gb*3400).toLocaleString(T.numberLocale);
      var plan = gb<=5?T.planFree : gb<=25?T.planStandard : gb<=100?T.planLarge : T.planBusiness;
      $('#cPlan').textContent=plan;
      $('#cNote').textContent=T.notePrefix+s.note+T.noteTail;
    }
    sz.addEventListener('input',calc);
    grid.addEventListener('click',function(e){
      var b=e.target.closest('button'); if(!b) return;
      $$('button',grid).forEach(function(o){o.setAttribute('aria-pressed','false')});
      b.setAttribute('aria-pressed','true'); calc();
    });
    calc();
  })();
}
