// @ts-nocheck — imperative bundle ported from the static mockup
/* eslint-disable */
// Разметка секции статична, поэтому обработчики вешаются императивно один раз.

import { createGuestClient } from '../../sdk/guest-client.mjs';
import { workspaceRuntime } from '@/content/sections/workspace-runtime';
import { href, type Lang } from '@/i18n/config';

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

/**
 * Ключ, под которым в sessionStorage лежит ИДЕНТИФИКАТОР задания — и больше
 * ничего. Пароли и реквизиты в хранилище браузера не попадают никогда, а по
 * одному идентификатору чужую задачу не открыть: доступ даёт гостевая cookie.
 * sessionStorage, а не localStorage: перезагрузка вкладки переживается,
 * закрытая вкладка — нет.
 */
const JOB_KEY = 'movemailbox.job';

const TERMINAL = ['completed', 'failed', 'cancelled'];

/** Логика рабочей области: проверка подключения, список папок источника,
 * режимы запуска, строгое зеркало с подтверждением, настоящий прогресс
 * задания, отмена и восстановление после перезагрузки страницы.
 *
 * Весь обмен с сервером идёт через sdk/guest-client.mjs — общий клиент
 * гостевого API (docs/GUEST-INTEGRATION.md). Он же владеет сессией, CSRF,
 * потоком событий и переподключением; здесь остаётся только отрисовка.
 *
 * @param lang   язык строк интерфейса
 * @param online false — статическая сборка без бекенда: интерфейс живёт
 *               полностью (переключатели, схема соединения, модалки),
 *               но ни один сетевой вызов не выполняется.
 */
export function initWorkspace(lang: Lang = 'ru', online: boolean = true) {
  /* Строки интерфейса берём одним блоком: ниже код работает только с T. */
  var T = workspaceRuntime[lang] || workspaceRuntime.ru;
  var ONLINE = online;
  /* Клиент создаётся один раз на инициализацию: он держит промис сессии. */
  var client = ONLINE ? createGuestClient() : null;

  /* ---- пароль ---- */
  $$('[data-pw]').forEach(function(b){b.addEventListener('click',function(){
    var i=b.parentElement.querySelector('input');
    i.type = i.type==='password'?'text':'password';
    b.setAttribute('aria-label', i.type==='password'?T.showPassword:T.hidePassword);});});

  /* ==================================================================
     Реквизиты подключения и параметры задания.
     Формы запросов повторяют migrator.Endpoint и migrator.Options.
     ================================================================== */
  function pane(side){ return $$('.mbx')[side === 'source' ? 0 : 1]; }

  function endpoint(side){
    var p = pane(side), f = $$('input', p),
        sec = p.querySelector('select[data-sec]'),
        mode = p.querySelector('select[data-port]'),
        manual = p.querySelector('input[data-port-num]');
    var security = sec && sec.value === 'starttls' ? 'starttls' : 'tls';
    /* Порт и режим шифрования уходят явно: API не угадывает их сам и
       не выключает проверку сертификата. */
    var port = (mode && mode.value === 'manual' && manual && manual.value)
      ? parseInt(manual.value, 10)
      : (security === 'starttls' ? 143 : 993);
    return {
      host: f[0].value.trim(), port: port, security: security,
      username: f[1].value.trim(), password: f[2].value
    };
  }

  /* ==================================================================
     Проверка полей до отправки запроса.

     Пустая форма не должна доходить до сети: запрос уйдёт, сервер вернёт
     страницу вместо JSON, и человек увидит «Unexpected token '<'». Поэтому
     всё, что можно проверить в браузере, проверяется здесь.
     ================================================================== */
  function sideName(side){ return side === 'source' ? T.sideSource : T.sideDestination; }

  function invalid(side){
    var ep = endpoint(side), name = sideName(side);
    if(!ep.host || !ep.username || !ep.password) return T.errNeedFields.replace('{side}', name);
    /* Частая ошибка: в поле сервера вставляют ссылку из браузера. */
    if(/\s/.test(ep.host) || /^[a-z]+:\/\//i.test(ep.host) || ep.host.indexOf('/') >= 0)
      return T.errHostFormat.replace('{side}', name);
    if(!(ep.port >= 1 && ep.port <= 65535)) return T.errPortRange.replace('{side}', name);
    return null;
  }

  function formError(text, link){
    var box = $('#wsErr'); if(!box) return;
    if(!text){ box.hidden = true; box.textContent = ''; return; }
    box.textContent = text;
    if(link){
      box.appendChild(document.createTextNode(' '));
      var a = document.createElement('a');
      a.href = link.href; a.textContent = link.text;
      box.appendChild(a);
    }
    box.hidden = false;
  }

  /* ---- перевод ошибок API в человеческие строки ----
     APIError несёт status и code; сетевой обрыв приходит обычным TypeError.
     403 значит «сессия не подтверждена», а не «повторить запрос молча». */
  function message(e){
    if(!e) return '';
    if(e.status === 429) return T.errTooMany;
    if(e.status === 503) return T.errUnavailable;
    if(e.status === 403) return T.errForbidden;
    if(e.name === 'TypeError') return T.errNetwork;
    /* Ответ не разобрался как JSON: по адресу отвечает сайт, а не API.
       Человеку нельзя показывать «Unexpected token '<'». */
    if(e.name === 'SyntaxError') return T.errNotJson;
    return e.message || String(e);
  }

  /* ---- значения, которых может не быть ----
     Отсутствующее поле события — это «не менялось», а не ноль. */
  function hasNumber(value){ return typeof value === 'number' && isFinite(value); }
  function count(value){
    return hasNumber(value) ? value.toLocaleString(T.numberLocale) : T.noValue;
  }
  function bytes(value){
    if(!hasNumber(value)) return T.noValue;
    var units = String(T.bytesUnits).split(','), n = value, i = 0;
    /* Десятичные приставки: бесплатный лимит на бекенде тоже десятичный. */
    while(n >= 1000 && i < units.length - 1){ n /= 1000; i++; }
    var digits = i === 0 ? 0 : n < 10 ? 1 : 0;
    return n.toLocaleString(T.numberLocale, {
      minimumFractionDigits: digits, maximumFractionDigits: digits
    }) + ' ' + units[i];
  }
  function phaseLabel(phase){
    if(!phase) return '';
    var key = 'phase' + phase.charAt(0).toUpperCase() + phase.slice(1);
    return T[key] || phase;
  }

  /* ==================================================================
     Папки источника.

     Список приходит с сервера пользователя и содержит только имена и
     разделители — ни размеров, ни счётчиков писем в API нет, поэтому их
     нет и в интерфейсе. Пока список не загружен (folders === null),
     задание уходит без поля folders, то есть переносятся все папки.
     Выбор родителя не распространяется на вложенные папки: сервер их
     сам не добавит, и мы не делаем вид, что добавит.
     ================================================================== */
  var folders = null;

  function rows(){ return $$('#flist .frow'); }
  function chosen(){
    return rows().filter(function(r){ return !r.querySelector('.bx').classList.contains('off'); });
  }
  function selectedFolders(){
    if(folders === null) return null;
    return chosen().map(function(r){ return r.dataset.name; });
  }

  function hint(text, bad){
    var el = $('#fhint'); if(!el) return;
    el.textContent = text;                    /* имена папок и ошибки — только текстом */
    el.classList.toggle('bad', !!bad);
  }

  function recount(){
    var all = rows(), n = chosen().length, sum = $('#fsum');
    if(sum) sum.textContent = folders === null || n === all.length
      ? T.allFolders
      : n === 0
        ? T.selectedNothing
        : T.selectedOf.replace('{n}', String(n)).replace('{total}', String(all.length));
    var toggle = $('#fallBtn');
    if(toggle && !toggle.hidden) toggle.textContent = n === all.length ? T.selectNone : T.selectAll;
    controls();
  }

  function renderFolders(list){
    var box = $('#flist'); if(!box) return;
    box.textContent = '';
    list.forEach(function(item){
      var name = typeof item === 'string' ? item : (item && item.name) || '';
      if(!name) return;
      var row = document.createElement('div');
      row.className = 'frow';
      row.dataset.name = name;
      row.setAttribute('role', 'checkbox');
      row.setAttribute('aria-checked', 'true');
      row.tabIndex = 0;
      var box2 = document.createElement('span');
      box2.className = 'bx';
      box2.innerHTML = '<svg aria-hidden="true"><use href="#ck"/></svg>';
      var nm = document.createElement('span');
      nm.className = 'nm';
      nm.textContent = name;                  /* имя папки приходит с чужого сервера */
      row.appendChild(box2); row.appendChild(nm);
      function toggle(){
        var off = box2.classList.toggle('off');
        row.setAttribute('aria-checked', off ? 'false' : 'true');
        recount();
      }
      row.addEventListener('click', toggle);
      row.addEventListener('keydown', function(e){
        if(e.key === ' ' || e.key === 'Enter'){ e.preventDefault(); toggle(); }
      });
      box.appendChild(row);
    });
    folders = rows().map(function(r){ return r.dataset.name; });
    var toggleAll = $('#fallBtn');
    if(toggleAll) toggleAll.hidden = folders.length === 0;
  }

  (function(){
    var btn = $('#floadBtn'); if(!btn) return;
    btn.addEventListener('click', function(){
      if(!ONLINE) return;
      var problem = invalid('source');
      if(problem){ hint(problem, true); return; }
      var ep = endpoint('source');
      btn.disabled = true;
      hint(T.foldersLoading, false);
      client.folders(ep).then(function(data){
        var list = (data && data.folders) || [];
        if(!list.length){ hint(T.foldersNone, true); return; }
        renderFolders(list);
        hint(T.foldersLoaded.replace('{n}', String(folders.length)), false);
      }).catch(function(e){
        hint(T.foldersFailed.replace('{message}', message(e)), true);
      }).then(function(){ btn.disabled = false; recount(); });
    });
    var all = $('#fallBtn');
    if(all) all.addEventListener('click', function(){
      var turnOn = chosen().length !== rows().length;
      rows().forEach(function(r){
        r.querySelector('.bx').classList.toggle('off', !turnOn);
        r.setAttribute('aria-checked', turnOn ? 'true' : 'false');
      });
      recount();
    });
  })();

  /* ---- проверка подключения ---- */
  (function(){
    var btn=$('#checkBoth'); if(!btn) return;
    function fill(pill, text, cls){
      pill.className = 'st ' + cls;
      pill.textContent = '';
      pill.appendChild(document.createElement('i'));
      pill.appendChild(document.createTextNode(text));   /* ответ сервера — текстом */
    }
    btn.addEventListener('click',function(){
      if(!ONLINE) return;
      var pills=$$('.st[data-st]');
      var problems=['source','destination'].map(invalid);
      if(problems[0] || problems[1]){
        /* Ни одного запроса: показываем, что именно не заполнено. */
        formError(problems.filter(Boolean).join(' · '));
        problems.forEach(function(problem, i){
          if(problem) fill(pills[i], problem, 'fail');
        });
        return;
      }
      formError(null);
      btn.disabled=true;
      pills.forEach(function(p){ fill(p, T.checking, 'checking'); });
      Promise.all(['source','destination'].map(function(side,i){
        return client.check(endpoint(side)).then(function(d){
          fill(pills[i], d && d.message ? d.message : T.connectionOk, 'ok');
        }).catch(function(e){
          fill(pills[i], message(e), 'fail');
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
    /* подтверждение выдано под конкретную пару ящиков: меняются реквизиты
       любой стороны или стороны меняются местами — зеркало сбрасывается */
    $$('.mbx').forEach(function(mbx){
      $$('input',mbx).forEach(function(inp){
        inp.addEventListener('input',function(){ if(btn.dataset.on==='1') setState(false); });
      });
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

  /* ==================================================================
     Ход задания.

     Единственный источник правды — представление задания с сервера
     (snapshot). События потока только уточняют его между снимками:
     отсутствующее поле события значит «не изменилось».

     Полей скорости, прошедшего и оставшегося времени в API нет. Мы их не
     выдумываем, а считаем из того, что известно точно: время старта задания
     (startedAt с сервера) и счётчики перенесённого. Такие величины помечены
     знаком ≈ и цветом — это расчёт, а не данные сервера. Как только бекенд
     начнёт отдавать остаток и общий объём (imapsync их печатает, воркер уже
     разбирает — см. internal/migrator/progress.go), их можно показывать без
     приставки «примерно».
     ================================================================== */
  var bar=$('#mbar'), track=bar && bar.parentElement, mp=$('#mp'), mt=$('#mt'),
      msk=$('#msk'), mv=$('#mv'), mel=$('#mel'), me=$('#me'), mph=$('#mphase'),
      stt=$('#stt'), log=$('#log'), bStart=$('#start'), bStop=$('#stop');
  var jobId = null, jobStatus = null, stopping = false, running = false,
      lost = false, disconnect = null;
  /* Измерения по часам браузера: начало задания, последние счётчики и
     последний известный процент. Ничего из этого не подменяет данные сервера. */
  var startedAt = 0, elapsedFrozen = 0, lastBytes = 0, lastTransferred = 0,
      lastPercent = 0, indeterminate = false, ticker = null;

  function clock(stamp){
    var d = stamp ? new Date(stamp) : new Date();
    if(isNaN(d.getTime())) d = new Date();
    return [d.getHours(), d.getMinutes(), d.getSeconds()]
      .map(function(v){ return String(v).padStart(2,'0'); }).join(':');
  }

  /* Журнал строится узлами: сообщения сервера и имена папок не должны
     попадать в разметку как HTML. */
  function push(text, kind, stamp){
    if(!text || !log) return;
    var line=document.createElement('div'),
        time=document.createElement('time'),
        body=document.createElement('b');
    time.textContent=clock(stamp);
    body.className = kind===1 ? 'g' : kind===2 ? 'a' : '';
    body.textContent=text;
    line.appendChild(time); line.appendChild(body);
    log.appendChild(line);
    while(log.children.length > 400) log.removeChild(log.firstChild);
    log.scrollTop=log.scrollHeight;
  }

  function status(text, cls){
    if(!stt) return;
    stt.className = 'stt' + (cls ? ' ' + cls : '');
    stt.textContent='';
    stt.appendChild(document.createElement('i'));
    stt.appendChild(document.createTextNode(text));
  }

  function progress(value, waiting){
    if(!track) return;
    indeterminate = !!waiting;
    if(waiting){
      track.classList.add('wait');
      if(mp) mp.textContent='…';
      return;
    }
    if(!hasNumber(value)) return;
    track.classList.remove('wait');
    var p=Math.max(0, Math.min(100, Math.round(value)));
    lastPercent = p;
    bar.style.width=p+'%';
    if(mp) mp.textContent=p+'%';
  }

  /* мм:сс до часа, дальше ч:мм:сс — как в выводе imapsync */
  function duration(seconds){
    if(!hasNumber(seconds) || seconds < 0) return T.noValue;
    var s=Math.round(seconds), h=Math.floor(s/3600), m=Math.floor((s%3600)/60), sec=s%60;
    var two=function(v){ return String(v).padStart(2,'0'); };
    return (h ? h + ':' + two(m) : two(m)) + ':' + two(sec);
  }

  /* Значение-расчёт: тот же формат, но с ≈ и другим цветом. */
  function estimate(el, text){
    if(!el) return;
    el.textContent = text === null ? T.noValue : '≈ ' + text;
    el.classList.toggle('est', text !== null);
  }

  function elapsedSeconds(){
    if(!startedAt) return 0;
    return elapsedFrozen || (Date.now() - startedAt) / 1000;
  }

  /* Скорость и остаток считаются от реально перенесённого за реально
     прошедшее время. Ни одного числа «из воздуха»: пока перенос не начал
     двигаться, в плитках стоит прочерк. */
  function derived(){
    var seconds = elapsedSeconds();
    if(mel) mel.textContent = startedAt ? duration(seconds) : '00:00';
    var speed = seconds > 2 && lastBytes > 0 ? lastBytes / seconds : 0;
    if(mph){
      var parts=[mph.dataset.phase || ''];
      if(mph.dataset.folder) parts.push(T.folderLabel + ': ' + mph.dataset.folder);
      if(speed > 0) parts.push('≈ ' + bytes(speed) + T.perSecond +
        (lastTransferred > 0 ? ' · ' + Math.round(lastTransferred / seconds * 60).toLocaleString(T.numberLocale) +
          ' ' + T.messagesShort + '/' + T.minuteShort : ''));
      mph.textContent = parts.filter(Boolean).join(' · ');
    }
    if(!me) return;
    if(!running && jobStatus){ estimate(me, null); return; }
    if(indeterminate || lastPercent < 3 || lastPercent >= 100 || seconds < 5){
      estimate(me, null);
      return;
    }
    estimate(me, duration(seconds * (100 - lastPercent) / lastPercent));
  }

  function startTicker(){
    if(ticker) return;
    ticker = setInterval(derived, 1000);
  }
  function stopTicker(){
    if(!ticker) return;
    clearInterval(ticker); ticker = null;
  }

  function metrics(data){
    if('transferred' in data){
      lastTransferred = data.transferred;
      if(mt) mt.textContent=count(data.transferred);
    }
    if('skipped' in data && msk) msk.textContent=count(data.skipped);
    if('bytes' in data){
      lastBytes = data.bytes;
      if(mv) mv.textContent=bytes(data.bytes);
    }
    if(mph && (data.phase || data.currentFolder)){
      if(data.phase) mph.dataset.phase = phaseLabel(data.phase);
      if(data.currentFolder) mph.dataset.folder = data.currentFolder;
    }
    derived();
  }

  var STATUS_TEXT = {
    queued: ['statusQueued','run'], running: ['statusRunning','run'],
    completed: ['statusDone','done'], failed: ['statusError',''],
    cancelled: ['statusCancelled','']
  };

  /* Полный снимок задания: заменяет и метрики, и журнал целиком. */
  function renderView(view){
    if(!view || !view.id) return;
    jobId = view.id;
    jobStatus = view.status;
    running = TERMINAL.indexOf(view.status) < 0;
    var style = STATUS_TEXT[view.status] || ['statusRunning','run'];
    status(stopping && running ? T.statusCancelling : T[style[0]], style[1]);
    /* Часы задания берём с сервера: после перезагрузки страницы «прошло»
       считается от настоящего старта, а не от момента открытия вкладки. */
    var began = Date.parse(view.startedAt || view.createdAt || '');
    startedAt = isNaN(began) ? startedAt || Date.now() : began;
    var ended = Date.parse(view.finishedAt || '');
    elapsedFrozen = !isNaN(ended) && startedAt ? Math.max(0, (ended - startedAt) / 1000) : 0;
    progress(view.progress, false);
    metrics(view);
    if(log){
      log.textContent='';
      (view.recentEvents || []).forEach(function(ev){ logEvent(ev); });
    }
    if(view.error) push(view.error, 2, view.finishedAt);
    if(view.status === 'failed' && !view.error) push(T.finishedFailed, 2, view.finishedAt);
    if(view.status === 'cancelled') push(T.finishedCancelled, 2, view.finishedAt);
    if(!running){
      stopping=false;
      forget();
      stopTicker();
      if(disconnect){ disconnect(); disconnect=null; }
      if(mph){ mph.dataset.folder=''; mph.textContent=phaseLabel(view.phase) || T.phaseIdle; }
      if(mel) mel.textContent=duration(elapsedSeconds());
      estimate(me, null);
    } else {
      startTicker();
    }
    controls();
  }

  function logEvent(ev){
    if(!ev) return;
    var text = ev.message;
    if(!text){
      var parts=[phaseLabel(ev.phase)];
      if(ev.currentFolder) parts.push(ev.currentFolder);
      text = parts.filter(Boolean).join(' · ');
    }
    push(text, ev.type === 'error' ? 2 : ev.type === 'finished' ? 1 : 0, ev.timestamp);
  }

  /* Событие потока: уточняет метрики и добавляет строку журнала.
     'finished' терминальным не считаем — клиент сам запросит снимок. */
  function applyEvent(ev){
    if(!ev) return;
    if('progress' in ev || ev.indeterminate) progress(ev.progress, !!ev.indeterminate);
    metrics(ev);
    logEvent(ev);
  }

  function observe(id){
    if(disconnect){ disconnect(); disconnect=null; }
    disconnect = client.watch(id, {
      snapshot: renderView,
      event: applyEvent,
      connection: function(state){
        if(state === 'reconnecting' && !lost){ lost=true; push(T.streamLost, 2); }
        if(state === 'connected' && lost){ lost=false; push(T.streamBack, 0); }
      },
      error: function(e){
        if(e && (e.status === 404 || e.status === 403)){
          forget(); running=false; stopping=false; stopTicker();
          push(T.jobGone, 2); status(T.statusError, ''); controls();
          return;
        }
        push(message(e), 2);
      }
    });
  }

  /* Хранится только идентификатор: ни пароля, ни адресов серверов. */
  function remember(id){
    jobId=id;
    try { sessionStorage.setItem(JOB_KEY, id); } catch(e) {}
  }
  function forget(){
    try { sessionStorage.removeItem(JOB_KEY); } catch(e) {}
  }

  /* Кнопка запуска гаснет, пока задание живо, и пока выбран пустой список
     папок: сервер такой запрос отвергнет, и лучше сказать это заранее. */
  function controls(){
    if(!bStart || !bStop) return;
    var empty = folders !== null && chosen().length === 0;
    bStart.disabled = !ONLINE || running || empty;
    bStop.disabled = !ONLINE || !running || stopping;
  }

  function buildOptions(){
    function on(name){
      var el = document.querySelector('input[data-mode="' + name + '"]');
      return !!(el && el.checked);
    }
    /* syncFlags и preserveDates — нормальное копирование: пропущенные
       булевы поля бекенд считает выключенными. */
    var opts = {
      syncFlags: true, preserveDates: true,
      dryRun: on('verbose'), justLogin: on('creds'),
      justFolderSizes: on('sizes'), justFolders: on('folders')
    };
    var strict = $('#strict');
    if(strict && strict.dataset.on === '1'){
      /* Оба флага и только после двух подтверждений в интерфейсе. */
      opts.strictMirror = true;
      opts.strictMirrorConfirmed = true;
    }
    var picked = selectedFolders();
    if(picked && picked.length) opts.folders = picked;
    var sub = document.querySelector('input[data-subfolder]');
    if(sub && sub.value.trim()) opts.destinationSubfolder = sub.value.trim();
    return opts;
  }

  if(bStart) bStart.addEventListener('click', function(){
    if(!ONLINE || running) return;
    var problems = ['source','destination'].map(invalid).filter(Boolean);
    if(problems.length){ formError(problems.join(' · ')); return; }
    if(folders !== null && chosen().length === 0){
      hint(T.startNeedsFolders, true);
      formError(T.startNeedsFolders);
      return;
    }
    formError(null);
    running=true; stopping=false; lost=false;
    if(log) log.textContent='';
    progress(0, false);
    startedAt=Date.now(); elapsedFrozen=0; lastBytes=0; lastTransferred=0; lastPercent=0;
    if(mt) mt.textContent=T.noValue;
    if(msk) msk.textContent=T.noValue;
    if(mv) mv.textContent=T.noValue;
    if(mel) mel.textContent='00:00';
    estimate(me, null);
    if(mph){ mph.dataset.phase=''; mph.dataset.folder=''; }
    startTicker();
    status(T.statusQueued, 'run');
    controls();
    client.start({
      source: endpoint('source'),
      destination: endpoint('destination'),
      options: buildOptions()
    }).then(function(job){
      if(!job || !job.id) throw new Error(T.noJobId);
      remember(job.id);
      renderView(job);
      observe(job.id);
    }).catch(function(e){
      /* Повторной отправки нет и быть не должно: задание могло быть принято. */
      running=false; stopTicker(); controls();
      status(T.statusError, '');
      push(message(e) || T.transferFailed, 2);
    });
  });

  /* Отмена — это запрос, а не факт: ждём терминального состояния. */
  if(bStop) bStop.addEventListener('click', function(){
    if(!ONLINE || !jobId || !running) return;
    stopping=true; controls();
    status(T.statusCancelling, 'run');
    push(T.cancelRequested, 2);
    client.cancel(jobId).catch(function(e){
      stopping=false; controls();
      push(message(e), 2);
    });
  });

  /* ---- восстановление после перезагрузки страницы ----
     Пароли не сохраняются, POST /api/jobs не повторяется: по сохранённому
     идентификатору запрашивается представление и заново открывается поток.
     404 значит, что задание этой сессии больше не доступно. */
  if(ONLINE){
    var saved = null;
    try { saved = sessionStorage.getItem(JOB_KEY); } catch(e) { saved = null; }
    if(saved) client.get(saved).then(function(view){
      push(T.restored, 0);
      renderView(view);
      if(TERMINAL.indexOf(view.status) < 0) observe(view.id);
    }).catch(function(e){
      if(e && (e.status === 404 || e.status === 403)){ forget(); push(T.jobGone, 2); }
      else push(message(e), 2);
    });
  }

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

  /* ---- есть ли по этому адресу вообще API переноса ----
     Копию сайта можно открыть где угодно: с GitHub Pages, из архива, с чужого
     хостинга. Там /api/session отдаёт HTML, и любая кнопка кончалась бы
     технической ошибкой разбора JSON. Один запрос при инициализации — и
     кнопки честно выключены с объяснением. Сетевой сбой так не трактуем:
     гасим только когда ответ заведомо не от API. */
  if(ONLINE){
    client.session().catch(function(e){
      var noApi = e && (e.name === 'SyntaxError' || e.status === 404 || e.status === 405);
      if(!noApi){ formError(message(e)); return; }
      ONLINE = false;
      offline();
      formError(T.errNoApi, { href: href(lang, '/download'), text: T.errNoApiLink });
    });
  }

  function offline(){
    ['#start', '#stop', '#checkBoth', '#floadBtn'].forEach(function (sel) {
      var el = $(sel) as HTMLButtonElement | null;
      if (el) el.disabled = true;
    });
  }

  /* В статической сборке сетевые кнопки остаются выключенными: интерфейс
     живой — гаснет только то, что ушло бы в сеть. */
  if (!ONLINE) offline();

}
