// @ts-nocheck — imperative bundle ported from the static mockup
/* eslint-disable */
// Перенесено из проверенного макета без изменений логики.

import { workspaceRuntime } from '@/content/sections/workspace-runtime';
import type { Lang } from '@/i18n/config';

/**
 * В исходном макете это была глобальная переменная одного большого
 * скрипта. При разделении на модули объявление потерялось, и обращение
 * к ней роняло весь клиентский код страницы: React ловил исключение из
 * useEffect и подменял разметку страницей ошибки — «пропадали эффекты».
 *
 * Функция, а не значение: модуль импортируется и на сервере при
 * пререндере, где document ещё не существует.
 */
const root = () => document.documentElement;

const $ = (s: string, r: ParentNode = document) => r.querySelector(s) as HTMLElement | null;
const $$ = (s: string, r: ParentNode = document) =>
  Array.prototype.slice.call(r.querySelectorAll(s)) as HTMLElement[];

/** Логика рабочей области: проверка подключения, выбор папок, режимы запуска,
 * строгое зеркало с подтверждением, прогресс переноса и поток частиц.
 * Разметка статична, поэтому обработчики вешаются императивно один раз. */
/**
 * @param lang   язык строк интерфейса
 * @param online false — статическая сборка без бекенда: интерфейс живёт
 *               полностью (переключатели, схема соединения, дерево папок,
 *               модалки), но ни один сетевой вызов не выполняется.
 *               Отключать инициализацию целиком нельзя: тогда страница
 *               выглядит сломанной, а не «ещё не запущенной».
 */
export function initWorkspace(lang: Lang = 'ru', online: boolean = true) {
  /* Строки интерфейса берём одним блоком: ниже код работает только с T. */
  var T = workspaceRuntime[lang] || workspaceRuntime.ru;

  /* ---- lang + password + folders ---- */
  $$('.seg button').forEach(function(b){b.addEventListener('click',function(){
    $$('.seg button').forEach(function(o){o.setAttribute('aria-pressed','false')});
    b.setAttribute('aria-pressed','true');});});
  $$('[data-pw]').forEach(function(b){b.addEventListener('click',function(){
    var i=b.parentElement.querySelector('input');
    i.type = i.type==='password'?'text':'password';
    b.setAttribute('aria-label', i.type==='password'?T.showPassword:T.hidePassword);});});

  var sizes=['5.9 ГБ','3.1 ГБ','2.9 ГБ','412 МБ','88 МБ'];
  function recount(){
    var rows=$$('#flist .frow'), n=0, msgs=0;
    rows.forEach(function(r){ if(!r.querySelector('.bx').classList.contains('off')){
      n++; msgs+=parseInt(r.querySelector('.c').dataset.c,10);} });
    var gb=(msgs/41208*12.4).toFixed(1);
    $('#fsum').textContent=(n===rows.length
        ? T.allFolders
        : T.selectedOf.replace('{n}', String(n)).replace('{total}', String(rows.length)))+
      ' · '+msgs.toLocaleString(T.numberLocale)+' '+T.messagesUnit+' · '+gb+' '+T.gbUnit;
    $('#start').disabled = n===0;
  }
  $$('#flist .frow').forEach(function(r){ r.addEventListener('click',function(){
    r.querySelector('.bx').classList.toggle('off'); recount(); });});

  /* ---- connection check ---- */

  /* ==================================================================
     Слой доступа к бэкенду.

     Это ЕДИНСТВЕННОЕ место, где интерфейс общается с сервером.
     Пути и формы запросов повторяют internal/api/server.go и
     internal/migrator/types.go. Если контракт на бекенде меняется,
     правится только этот блок — остальной код страницы о сервере
     ничего не знает.

       check(side)       POST /api/connections/test
       folders(side)     POST /api/connections/folders
       start(opts, cb)   POST /api/jobs + SSE /api/jobs/{id}/events
       stop()            POST /api/jobs/{id}/cancel
     ================================================================== */
  var ONLINE = online;

  var API = (function(){
    var csrf = '', es = null, jobId = null;

    /* CSRF-токен нужен только в публичном режиме; в локальном он пустой. */
    function session(){
      return fetch('/api/session', { credentials:'same-origin' })
        .then(function(r){ return r.ok ? r.json() : {}; })
        .then(function(d){ csrf = (d && d.csrfToken) || ''; })
        .catch(function(){ csrf = ''; });
    }
    if (ONLINE) session();

    function send(method, url, body){
      var h = { 'Accept':'application/json' };
      if(body !== undefined) h['Content-Type'] = 'application/json';
      if(csrf) h['X-CSRF-Token'] = csrf;
      return fetch(url, {
        method: method, headers: h, credentials: 'same-origin',
        body: body === undefined ? undefined : JSON.stringify(body)
      }).then(function(r){
        return r.text().then(function(t){
          var d = {}; try { d = t ? JSON.parse(t) : {}; } catch(e) {}
          if(!r.ok){
            var err = new Error(d.message || d.error ||
              T.serverResponded.replace('{status}', String(r.status)));
            err.code = d.code || '';
            throw err;
          }
          return d;
        });
      });
    }

    function pane(side){ return $$('.mbx')[side === 'source' ? 0 : 1]; }

    /* Совпадает с migrator.Endpoint в internal/migrator/types.go. */
    function endpoint(side){
      var p = pane(side), f = $$('input', p),
          sec = p.querySelector('select[data-sec]'),
          mode = p.querySelector('select[data-port]'),
          manual = p.querySelector('input[data-port-num]');
      var security = sec && sec.value === 'starttls' ? 'starttls' : 'tls';
      var port = (mode && mode.value === 'manual' && manual && manual.value)
        ? parseInt(manual.value, 10)
        : (security === 'starttls' ? 143 : 993);
      return {
        host: f[0].value.trim(), port: port, security: security,
        username: f[1].value.trim(), password: f[2].value
      };
    }

    /* Совпадает с migrator.Options. Взаимоисключающие режимы бекенд
       отвергает сам — здесь мы их не фильтруем, чтобы не разойтись
       с его правилами валидации. */
    function options(){
      function on(name){
        var el = document.querySelector('input[data-mode="' + name + '"]');
        return !!(el && el.checked);
      }
      var strict = document.querySelector('#strict');
      return {
        dryRun: on('verbose'),
        justLogin: on('creds'),
        justFolderSizes: on('sizes'),
        justFolders: on('folders'),
        strictMirror: !!(strict && strict.dataset.on),
        strictMirrorConfirmed: !!(strict && strict.dataset.on)
      };
    }

    function close(){ if(es){ es.close(); es = null; } }

    return {
      creds: endpoint,
      endpoint: endpoint,
      options: options,

      /* POST /api/connections/test */
      check: function(side){
        if(!ONLINE) return Promise.resolve({ ok:false, message: T.offlineStatus, details: [] });
        return send('POST', '/api/connections/test', endpoint(side))
          .then(function(d){
            return { ok:true, message: d.message || T.connectionOk,
                     details: d.details || [] };
          })
          .catch(function(e){ return { ok:false, message: e.message }; });
      },

      /* POST /api/connections/folders — дерево папок источника */
      folders: function(side){
        return send('POST', '/api/connections/folders', endpoint(side || 'source'))
          .then(function(d){ return d.folders || []; });
      },

      /* POST /api/jobs, дальше SSE на /api/jobs/{id}/events.
         Переподключение по Last-Event-ID делает сам браузер. */
      start: function(opts, cb){
        if(!ONLINE){ cb.error(T.offlineStatus); return Promise.resolve(); }
        var req = {
          source: endpoint('source'),
          destination: endpoint('destination'),
          options: opts || options()
        };
        return send('POST', '/api/jobs', req).then(function(job){
          jobId = job.id || job.jobId;
          if(!jobId) throw new Error(T.noJobId);
          close();
          es = new EventSource('/api/jobs/' + encodeURIComponent(jobId) + '/events',
                               { withCredentials:true });
          es.onmessage = function(m){
            var ev; try { ev = JSON.parse(m.data); } catch(e){ return; }
            if(ev.message) cb.log(ev.message, ev.type === 'error' ? 2 : ev.type === 'done' ? 1 : 0);
            if(typeof ev.progress === 'number' && !ev.indeterminate) cb.progress(ev.progress);
            if(ev.type === 'done' || ev.type === 'finished'){ close(); cb.done(ev); }
            if(ev.type === 'error' || ev.type === 'failed'){ close(); cb.error(ev.message); }
          };
          return jobId;
        }).catch(function(e){ cb.error(e.message); });
      },

      /* POST /api/jobs/{id}/cancel */
      stop: function(){
        var id = jobId;
        close(); jobId = null;
        if(!id) return Promise.resolve();
        return send('POST', '/api/jobs/' + encodeURIComponent(id) + '/cancel')
          .catch(function(){});
      }
    };
  })();

  (function(){
    var btn=$('#checkBoth'); if(!btn) return;
    btn.addEventListener('click',function(){
      var pills=$$('.st[data-st]');
      btn.disabled=true;
      pills.forEach(function(p){ p.className='st checking'; p.innerHTML='<i></i>'+T.checking; });
      Promise.all(['source','destination'].map(function(side,i){
        return API.check(side).then(function(r){
          var p=pills[i];
          p.className = r.ok ? 'st ok' : 'st fail';
          p.innerHTML = '<i></i>' + r.message;
          return r;
        });
      })).then(function(){ btn.disabled=false; });
    });
  })();

  /* ---- swap ---- */
  $('#swap').addEventListener('click',function(){
    var p=$$('.mbx'), a=$$('input',p[0]), b=$$('input',p[1]);
    for(var i=0;i<a.length;i++){ var t=a[i].value; a[i].value=b[i].value; b[i].value=t; }
  });

  /* ---- ручной порт ---- */
  /* Поле появляется только когда выбран режим «указать вручную»:
     лишний ввод в форме — лишний способ ошибиться. */
  (function(){
    $$('select[data-port]').forEach(function(sel){
      var num = sel.parentElement.querySelector('input[data-port-num]');
      if(!num) return;
      function sync(){
        num.hidden = sel.value !== 'manual';
        if(!num.hidden && !num.value) num.focus();
      }
      sel.addEventListener('change', sync);
      sync();
    });
  })();

  /* ---- strict mirror ---- */
  /* строгое зеркало удаляет письма — включается только через явное подтверждение */
  (function(){
    var btn=$('#strict'); if(!btn) return;
    var title=btn.previousElementSibling.querySelector('strong');
    function setState(on){
      btn.dataset.on = on ? '1' : '';
      btn.textContent = on ? T.strictDisable : T.strictEnable;
      title.textContent = on ? T.strictTitleOn : T.strictTitleOff;
      btn.closest('.strict').classList.toggle('armed', on);
    }
    function ask(){
      var back=document.createElement('div');
      back.className='confirm-back';
      back.innerHTML =
        '<div class="confirm" role="dialog" aria-modal="true" aria-labelledby="cfT">'+
          '<div class="confirm-ico"><svg><use href="#al"/></svg></div>'+
          '<h3 id="cfT">'+T.confirmTitle+'</h3>'+
          '<p>'+T.confirmTextA+'<b>'+T.confirmTextStrong+'</b>'+T.confirmTextB+'</p>'+
          '<label class="confirm-check"><input type="checkbox" id="cfAck">'+
            '<span class="bx off"><svg><use href="#ck"/></svg></span>'+
            '<span>'+T.confirmAck+'</span></label>'+
          '<div class="confirm-acts">'+
            '<button class="btn btn-g" id="cfNo">'+T.confirmNo+'</button>'+
            '<button class="btn btn-danger" id="cfYes" disabled>'+T.confirmYes+'</button>'+
          '</div>'+
        '</div>';
      var prevFocus=document.activeElement;
      document.body.appendChild(back);
      var ack=back.querySelector('#cfAck'), yes=back.querySelector('#cfYes'),
          no=back.querySelector('#cfNo'), bx=back.querySelector('.bx'),
          label=back.querySelector('.confirm-check');
      label.setAttribute('tabindex','0');
      ack.addEventListener('change',function(){
        yes.disabled=!ack.checked; bx.classList.toggle('off',!ack.checked);
      });
      label.addEventListener('keydown',function(e){
        if(e.key===' '||e.key==='Enter'){ e.preventDefault(); ack.checked=!ack.checked;
          ack.dispatchEvent(new Event('change')); }
      });
      function close(){
        back.remove(); document.removeEventListener('keydown',onKey);
        if(prevFocus && prevFocus.focus) prevFocus.focus();
      }
      function onKey(e){
        if(e.key==='Escape'){ close(); return; }
        if(e.key!=='Tab') return;
        /* фокус не должен уходить за пределы диалога */
        var items=[label,no,yes].filter(function(el){ return !el.disabled; });
        var i=items.indexOf(document.activeElement);
        if(e.shiftKey){ e.preventDefault(); items[(i<=0?items.length:i)-1].focus(); }
        else { e.preventDefault(); items[(i+1)%items.length].focus(); }
      }
      document.addEventListener('keydown',onKey);
      back.addEventListener('mousedown',function(e){ if(e.target===back) close(); });
      no.addEventListener('click',close);
      yes.addEventListener('click',function(){ setState(true); close(); });
      /* фокус на отмену: подтверждение не должно быть в одном нажатии */
      no.focus();
    }
    btn.addEventListener('click',function(){
      if(btn.dataset.on==='1') setState(false); else ask();
    });
    /* подтверждение выдано под конкретный ящик назначения:
       меняются реквизиты или стороны — зеркало сбрасывается */
    var dstPane=$$('.mbx')[1];
    if(dstPane) $$('input',dstPane).forEach(function(inp){
      inp.addEventListener('input',function(){ if(btn.dataset.on==='1') setState(false); });
    });
    var swapBtn=$('#swap');
    if(swapBtn) swapBtn.addEventListener('click',function(){ if(btn.dataset.on==='1') setState(false); });
  })();

  /* ---- run modes ---- */
  var MODES={verbose:[T.modeVerboseBtn,T.modeVerboseHint],
    creds:[T.modeCredsBtn,T.modeCredsHint],
    sizes:[T.modeSizesBtn,T.modeSizesHint],
    folders:[T.modeFoldersBtn,T.modeFoldersHint]};
  function modeSync(){
    var active=null;
    $$('[data-mode]').forEach(function(i){
      i.nextElementSibling.classList.toggle('off',!i.checked);
      if(i.checked&&!active)active=i.dataset.mode;
    });
    var s=$('#start');
    s.innerHTML='<svg style="width:16px;height:16px"><use href="#pl"/></svg>'+(active?MODES[active][0]:T.startDefault);
    $('#modeHint').textContent = active?MODES[active][1]:'';
    $('#modeHint').style.display = active?'block':'none';
  }
  $$('[data-mode]').forEach(function(i){ i.addEventListener('change',function(){
    if(i.checked)$$('[data-mode]').forEach(function(o){ if(o!==i)o.checked=false; });
    modeSync(); });});

  /* ---- transfer sim ---- */
  var TRANSFER_STEPS=[
   [3,'Проверка TLS: сертификат валиден, IMAP4rev1 · STARTTLS · IDLE'],
   [7,'Авторизация подтверждена на обоих серверах',1],
   [11,'Открываю INBOX — 18 442 письма, 5.9 ГБ'],
   [26,'INBOX  6 812 / 18 442 скопировано'],
   [41,'INBOX  завершено — 18 442 / 18 442',1],
   [52,'INBOX.Sent  4 003 / 9 117 скопировано'],
   [66,'INBOX.Sent  завершено — 9 117 / 9 117',1],
   [78,'INBOX.Archive.2019-2024  7 940 / 11 863 скопировано'],
   [88,'INBOX.Clients.Invoices  завершено — 1 604 / 1 604',1],
   [94,'Сверка счётчиков папок: расхождений нет',2],
   [100,'Готово. 41 026 писем, 0 ошибок. Источник не изменён.',1]
  ];
  var running=false,lastP=0,idx=0,
      bar=$('#mbar'),mp=$('#mp'),me=$('#me'),mv=$('#mv'),stt=$('#stt'),log=$('#log'),
      bStart=$('#start'),bStop=$('#stop');
  function t2(s){return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');}
  function push(txt,kind,sec){
    var d=document.createElement('div');
    d.innerHTML='<time>'+t2(sec)+'</time><b class="'+(kind===1?'g':kind===2?'a':'')+'"></b>';
    d.querySelector('b').textContent=txt; log.appendChild(d); log.scrollTop=log.scrollHeight;
  }
  function reset(){ API.stop(); running=false; }
  bStart.addEventListener('click',function(){
    reset(); lastP=0; idx=0; log.innerHTML=''; bStop.disabled=false; bStart.disabled=true;
    stt.className='stt run'; stt.innerHTML='<i></i>'+T.statusRunning;
    API.start({}, {
      progress: function(p){
        running=p<100;
        bar.style.width=p+'%'; mp.textContent=p+'%';
        me.textContent=t2(Math.round((100-p)*2.4));
        mv.innerHTML=(180+Math.round(Math.sin(p/7)*40)).toString()+
          ' <span style="font-size:.7em;color:#5E7284">'+T.speedUnit+'</span>';
        lastP=p;
      },
      log: function(text,kind){ push(text,kind,Math.round(lastP*2.4)); },
      done: function(){
        running=false; bStop.disabled=true; bStart.disabled=false;
        stt.className='stt done'; stt.innerHTML='<i></i>'+T.statusDone; me.textContent='00:00';
      },
      error: function(msg){
        running=false; bStop.disabled=true; bStart.disabled=false;
        stt.className='stt'; stt.innerHTML='<i></i>'+T.statusError;
        push(msg||T.transferFailed, 2, Math.round(lastP*2.4));
      }
    });
  });
  bStop.addEventListener('click',function(){
    reset(); bStop.disabled=true; bStart.disabled=false;
    stt.className='stt'; stt.innerHTML='<i></i>'+T.statusStopped;
    push(T.stoppedLog,2,Math.round(lastP*2.4));
  });
  recount(); modeSync();

  /* ---- flow canvas ---- */
  var cv=$('#flow'),cx=cv.getContext('2d'),parts=[],W=0,H=0,vert=false;
  function size(){var r=cv.parentElement.getBoundingClientRect();
    W=cv.width=r.width*devicePixelRatio; H=cv.height=r.height*devicePixelRatio;
    cx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0); vert=r.width>r.height;}
  size(); addEventListener('resize',size); addEventListener('hashchange',function(){setTimeout(size,60)});
  for(var i=0;i<26;i++)parts.push({t:Math.random(),o:Math.random()*.8+.2,sp:.0016+Math.random()*.0028,j:Math.random()});
  function accent(){return getComputedStyle(root()).getPropertyValue('--acc-glow').trim()||'12,138,103';}
  (function loop(){
    var r=cv.parentElement.getBoundingClientRect(); cx.clearRect(0,0,r.width,r.height);
    var a=accent(), fast=(typeof running!=='undefined') && running;
    parts.forEach(function(pt){
      pt.t+=pt.sp*(fast?3.4:1); if(pt.t>1)pt.t-=1;
      var x,y;
      if(vert){ x=pt.t*r.width; y=r.height/2+Math.sin(pt.t*6.28+pt.j*6)*(r.height*.22); }
      else{ y=pt.t*r.height; x=r.width/2+Math.sin(pt.t*6.28+pt.j*6)*(r.width*.22); }
      var d=vert?Math.abs(x-r.width/2)/(r.width/2):Math.abs(y-r.height/2)/(r.height/2);
      cx.fillStyle='rgba('+a+','+(pt.o*(1-d*.75)*(fast?.95:.55))+')';
      cx.beginPath(); cx.arc(x,y,fast?2.2:1.7,0,6.29); cx.fill();
    });
    requestAnimationFrame(loop);
  })();

  /* В статической сборке кнопки запуска остаются выключенными: обработчики
     внутри могли их включить по ходу инициализации. Интерфейс при этом живой —
     гаснет только то, что ушло бы в сеть. */
  if (!ONLINE) {
    ['#start', '#stop', '#checkBoth'].forEach(function (sel) {
      var el = $(sel) as HTMLButtonElement | null;
      if (el) el.disabled = true;
    });
  }

}
