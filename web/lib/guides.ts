// @ts-nocheck — imperative bundle ported from the static mockup
/* eslint-disable */

import { guidesRuntime } from '@/content/sections/guides-runtime';
import type { Lang } from '@/i18n/config';

const $ = (s: string, r: ParentNode = document) => r.querySelector(s) as HTMLElement | null;
const $$ = (s: string, r: ParentNode = document) =>
  Array.prototype.slice.call(r.querySelectorAll(s)) as HTMLElement[];

/** Справочник провайдеров: данные и переключение вкладок. */
export function initProviderGuides(lang: Lang = 'ru') {
  /* Строки интерфейса берём одним блоком: ниже код работает только с T. */
  var T = guidesRuntime[lang] || guidesRuntime.ru;

  (function(){
  /* ---- provider guides ---- */
  var PV=T.pv;
  function esc(s){return s;}
  function render(key){
    var d=PV[key];
    var conn=d.conn.map(function(c){return '<div><small>'+c[0]+'</small><strong>'+c[1]+'</strong></div>';}).join('');
    var steps=d.steps.map(function(s){return '<li>'+s+'</li>';}).join('');
    var warns=d.warns.map(function(w){return '<li><svg><use href="#al"/></svg><span>'+w[0]+'</span></li>';}).join('');
    var btn=$('.pv-nav button[data-pv="'+key+'"]'),
        brand=btn.getAttribute('style'),
        slot=btn.querySelector('.pvi').innerHTML;
    $('#pvBody').innerHTML='<div class="pv-panel">'+
      '<div class="pv-head"><span class="pvi lg" style="'+brand+'">'+slot+'</span>'+
      '<h3>'+d.n+'</h3><span class="hosttag">'+d.conn[0][1]+' : '+d.conn[1][1].split(' ')[0]+'</span></div>'+
      '<p class="intro">'+d.intro+'</p>'+
      '<div class="conn">'+conn+'</div>'+
      '<div class="pv-cols"><div><h4>'+T.stepsTitle+'</h4><ol class="olist">'+steps+'</ol></div>'+
      '<div><h4>'+T.warnsTitle+'</h4><ul class="warns">'+warns+'</ul></div></div>'+
      '<div class="cmd"><small>'+T.cmdCaption+'</small><pre>'+d.cmd+'</pre></div>'+
      '</div>';
  }
  $$('.pv-nav button').forEach(function(b){ b.addEventListener('click',function(){
    $$('.pv-nav button').forEach(function(o){o.setAttribute('aria-selected','false')});
    b.setAttribute('aria-selected','true'); render(b.dataset.pv); });});
  render('gmail');
  })();
}
