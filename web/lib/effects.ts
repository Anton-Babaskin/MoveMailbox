// @ts-nocheck — imperative bundle ported from the static mockup
/* eslint-disable */
const $ = (s: string, r: ParentNode = document) => r.querySelector(s) as HTMLElement | null;
const $$ = (s: string, r: ParentNode = document) =>
  Array.prototype.slice.call(r.querySelectorAll(s)) as HTMLElement[];

/** Скролл-эффекты: прогресс чтения, кнопка наверх, рельс хронологии,
 * появление блоков и подсветка карточек по курсору. */
export function initEffects() {
  /* ---- scroll: header, progress, back-to-top ---- */
  var sprog=$('#sprog'), toTop=$('#toTop'), ringFg=$('#ringFg'), C=153.9;
  function onScroll(){
    var max=document.documentElement.scrollHeight-innerHeight,
        r=max>0?Math.min(1,scrollY/max):0;
    $('.top').classList.toggle('stuck', scrollY>12);
    sprog.style.width=(r*100)+'%';
    toTop.classList.toggle('on', scrollY>560);
    ringFg.style.strokeDashoffset=(C*(1-r)).toFixed(1);
  }
  addEventListener('scroll',onScroll,{passive:true}); addEventListener('resize',onScroll); onScroll();
  toTop.addEventListener('click',function(){ scrollTo({top:0,behavior:'smooth'}); });

  /* ---- flow rail progress ---- */
  (function(){
    var wrap=$('#flow4'); if(!wrap) return;
    var fill=$('#railFill'), stns=$$('.stn',wrap), reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
    function tick(){
      if(wrap.offsetParent===null) return;
      var r=wrap.getBoundingClientRect(),
          start=innerHeight*0.82, span=Math.max(240,r.height*0.75),
          p=Math.max(0,Math.min(1,(start-r.top)/span));
      fill.style.width=(p*100).toFixed(1)+'%';
      stns.forEach(function(s,i){ s.classList.toggle('on', p >= (i/stns.length)+0.06); });
    }
    if(reduce){ fill.style.width='100%'; stns.forEach(function(s){s.classList.add('on')}); return; }
    addEventListener('scroll',tick,{passive:true}); addEventListener('resize',tick);
    addEventListener('hashchange',function(){setTimeout(tick,60)});
    tick();
  })();

  /* ---- reveal on scroll ---- */
  if('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion:reduce)').matches){
    var io=new IntersectionObserver(function(es){ es.forEach(function(e){
      if(e.isIntersecting){ e.target.classList.remove('pre'); io.unobserve(e.target); } });},
      {rootMargin:'0px 0px -8% 0px',threshold:.06});
    $$('.card,.rt,.pl,.post,.slist article,.pv,.biz,.frame,.tx-cols,.calc,.err,.who,.next-grid a,.proof').forEach(function(el,i){
      var top=el.getBoundingClientRect().top;
      if(top>innerHeight*0.9){ el.classList.add('rv','pre');
        el.style.transitionDelay=((i%4)*55)+'ms'; io.observe(el); }
    });
  }

  /* ---- card glow ---- */
  $$('.card').forEach(function(c){ c.addEventListener('pointermove',function(e){
    var r=c.getBoundingClientRect();
    c.style.setProperty('--mx',(e.clientX-r.left)+'px');
    c.style.setProperty('--my',(e.clientY-r.top)+'px'); });});
}
