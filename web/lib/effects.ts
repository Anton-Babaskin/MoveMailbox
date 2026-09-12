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
  /* Раскрытие разное по типу блока: карточки выезжают снизу пачкой,
     колонки — навстречу друг другу, крупные полотна проявляются шторкой,
     числа и медальоны подрастают. Один эффект на весь сайт читается дёшево,
     четыре разных — как будто страницу собирали руками.
     Всё выключается одним системным «уменьшить движение». */
  if('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion:reduce)').matches){
    var io=new IntersectionObserver(function(es){ es.forEach(function(e){
      if(e.isIntersecting){ e.target.classList.add('rv-in'); io.unobserve(e.target); } });},
      {rootMargin:'0px 0px -10% 0px',threshold:.08});

    var plan=[
      /* тип, селектор, шаг задержки внутри группы */
      ['up',    '.card,.post,.pl,.who,.rt,.err,.next-grid a,.proof,.stn,.mode-card,'
              +'.faq details,.error-causes li,.error-fixes li,.route-links a,.guide,.plan', 70],
      ['left',  '.brief-col:first-child .brief-list li,.tx-cols>*:first-child', 60],
      ['right', '.brief-col:last-child .brief-facts li,.tx-cols>*:last-child', 60],
      ['mask',  '.frame,.calc,.biz,.pv,.slist article,.error-sample,.post-body', 0],
      ['pop',   '.trust span,.badge,.tag', 45]
    ];

    plan.forEach(function(rule){
      var type=rule[0], step=rule[2], n=0;
      $$(rule[1]).forEach(function(el){
        if(el.dataset.rv) return;                       /* один эффект на элемент */
        if(el.getBoundingClientRect().top<innerHeight*0.88) return;  /* уже на экране */
        el.dataset.rv=type;
        if(step) el.style.setProperty('--rv-delay',(n%5)*step+'ms');
        n++;
        io.observe(el);
      });
    });
  }

  /* ---- линия шагов прочерчивается по мере прокрутки ---- */
  (function(){
    var list=$('.brief-list');
    if(!list || matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    var items=$$('.brief-list li');
    function tick(){
      var r=list.getBoundingClientRect();
      var anchor=innerHeight*0.62;                       /* «перо» чуть ниже центра экрана */
      var p=Math.max(0,Math.min(1,(anchor-r.top)/(r.height||1)));
      list.style.setProperty('--rail',String(p));
      var filled=r.top+34+(r.height-68)*p;
      items.forEach(function(li){
        var m=li.getBoundingClientRect();
        li.classList.toggle('on', m.top+34<=filled);
      });
    }
    addEventListener('scroll',tick,{passive:true}); addEventListener('resize',tick); tick();
  })();

  /* ---- card glow ---- */
  $$('.card').forEach(function(c){ c.addEventListener('pointermove',function(e){
    var r=c.getBoundingClientRect();
    c.style.setProperty('--mx',(e.clientX-r.left)+'px');
    c.style.setProperty('--my',(e.clientY-r.top)+'px'); });});
}
