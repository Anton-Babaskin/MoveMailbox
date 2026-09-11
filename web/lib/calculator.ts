// @ts-nocheck — imperative bundle ported from the static mockup
/* eslint-disable */
const $ = (s: string, r: ParentNode = document) => r.querySelector(s) as HTMLElement | null;
const $$ = (s: string, r: ParentNode = document) =>
  Array.prototype.slice.call(r.querySelectorAll(s)) as HTMLElement[];

/** Калькулятор времени переноса по лимитам провайдеров. */
export function initCalculator() {
  /* ---- calculator ---- */
  (function(){
    var sz=$('#cSize'), grid=$('#cSrc'); if(!sz) return;
    function plural(n,f){return f[n%10===1&&n%100!==11?0:(n%10>=2&&n%10<=4&&(n%100<10||n%100>=20)?1:2)];}
    function human(h){
      if(h<1) return '<em>'+Math.max(5,Math.round(h*60))+'</em> мин';
      if(h<24){var m=Math.round((h%1)*60);return '<em>'+Math.floor(h)+'</em> ч'+(m?' <em>'+m+'</em> мин':'');}
      var d=Math.floor(h/24), r=Math.round(h%24);
      return '<em>'+d+'</em> '+plural(d,['день','дня','дней'])+(r?' <em>'+r+'</em> ч':'');
    }
    function calc(){
      var gb=+sz.value, act=grid.querySelector('[aria-pressed="true"]'),
          rate=+act.dataset.r, mb=gb*1024, hours=mb/rate;
      sz.style.setProperty('--fill',((gb-1)/119*100)+'%');
      $('#cSizeV').textContent=gb+' ГБ';
      $('#cTime').innerHTML=human(hours);
      $('#cName').textContent=act.dataset.n;
      $('#cRate').textContent=(rate>=1024?(rate/1024).toFixed(1)+' ГБ/ч':rate+' МБ/ч');
      $('#cMsgs').textContent=Math.round(gb*3400).toLocaleString('ru-RU');
      var plan = gb<=5?'Free · $0' : gb<=25?'Standard · $5.90' : gb<=100?'Large · $11.90' : 'Business · по запросу';
      $('#cPlan').textContent=plan;
      $('#cNote').textContent='Ограничение: '+act.dataset.note+'. Оценка, а не гарантия — мелкие письма едут медленнее крупных, накладные расходы на каждое сообщение одинаковы.';
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
