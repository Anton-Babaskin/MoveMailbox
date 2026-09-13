'use client';

import { useEffect } from 'react';
import { initWorkspace } from '@/lib/workspace';
import { workspace } from '@/content/sections/workspace';
import { workspaceRuntime } from '@/content/sections/workspace-runtime';
import { href, type Lang } from '@/i18n/config';

/**
 * На GitHub Pages бекенда нет: собирать пароли формой, которой некуда
 * их отправить, нечестно и опасно. Флаг выставляется в сборке Pages.
 */
const STATIC_SITE = process.env.NEXT_PUBLIC_STATIC_SITE === '1';

export function Workspace({ lang }: { lang: Lang }) {
  const t = workspace[lang];
  // Подписи кнопок, которые код меняет по ходу работы, живут в runtime-словаре:
  // здесь берём из него же исходное состояние, чтобы серверная разметка и
  // первое обновление в браузере не расходились.
  const rt = workspaceRuntime[lang];

  // Интерфейс инициализируется всегда: без этого не работают ни схема
  // соединения, ни расширенные настройки, ни дерево папок — страница
  // выглядит сломанной. В статической сборке гасятся только сетевые вызовы.
  useEffect(() => { initWorkspace(lang, !STATIC_SITE); }, [lang]);

  return (
    <>
      <section className="wide-shell" id="workspace" style={{ paddingTop: '0' }}>

        <div className="ws">
          <div className="ws-bar">
            <span className="dots"><i></i><i></i><i></i></span>
            <h2>{t.title}</h2>
            <span className="tail"><span className="chip">{t.chip}</span></span>
          </div>

          <div className="panes">
            <div className="mbx">
              <div className="mbx-head">
                <span className="mbx-n">01</span>
                <div><small>{t.srcSmall}</small><h3>{t.srcTitle}</h3></div>
                <span className="st" data-st="src"><i></i>{t.notChecked}</span>
              </div>
              <label className="f"><span>{t.hostLabel}</span>
                <input placeholder={t.srcHostPlaceholder} spellCheck="false" autoCapitalize="none" /></label>
              <label className="f"><span>{t.loginLabel}</span>
                <input placeholder={t.loginPlaceholder} spellCheck="false" autoCapitalize="none" /></label>
              <label className="f"><span>{t.passwordLabel}</span>
                <span className="pw"><input type="password" placeholder={STATIC_SITE ? t.staticPasswordPlaceholder : t.passwordPlaceholder} disabled={STATIC_SITE} autoComplete="off" />
                  <button type="button" data-pw aria-label={t.showPassword}><svg aria-hidden="true"><use href="#ey" /></svg></button></span></label>
              <details className="adv">
                <summary><svg aria-hidden="true" className="gear"><use href="#gr" /></svg><span>{t.connSettings}</span><small>{t.connSettingsHint}</small><svg aria-hidden="true" className="chev"><use href="#cv" /></svg></summary>
                <div className="adv-in">
                  <label>{t.securityLabel}<select data-sec><option value="tls">SSL / TLS</option><option value="starttls">STARTTLS</option></select></label>
                  <label>{t.portLabel}<select data-port><option value="auto">{t.portAuto}</option><option value="manual">{t.portManual}</option></select><input data-port-num type="number" min="1" max="65535" placeholder="993" inputMode="numeric" hidden /></label>
                </div>
              </details>
            </div>

            <div className="mid">
              <canvas id="flow" aria-hidden="true"></canvas>
              <div className="mid-in">
                <button className="knob" type="button" id="swap" title={t.swap} aria-label={t.swap}><svg aria-hidden="true"><use href="#sw" /></svg></button>
                <button className="btn btn-g mid-check" type="button" id="checkBoth" disabled={STATIC_SITE}>
                  <svg aria-hidden="true" style={{ width: '15px', height: '15px' }}><use href="#ck" /></svg>{t.checkBoth}
                </button>
                <div className="mid-links">
                  <a href={href(lang, '/guides')}>{t.linkProviders}</a>
                  <a href={href(lang, '/docs/errors')}>{t.linkErrors}</a>
                </div>
              </div>
            </div>

            <div className="mbx">
              <div className="mbx-head">
                <span className="mbx-n">02</span>
                <div><small>{t.dstSmall}</small><h3>{t.dstTitle}</h3></div>
                <span className="st" data-st="dst"><i></i>{t.notChecked}</span>
              </div>
              <label className="f"><span>{t.hostLabel}</span>
                <input placeholder={t.dstHostPlaceholder} spellCheck="false" autoCapitalize="none" /></label>
              <label className="f"><span>{t.loginLabel}</span>
                <input placeholder={t.loginPlaceholder} spellCheck="false" autoCapitalize="none" /></label>
              <label className="f"><span>{t.passwordLabel}</span>
                <span className="pw"><input type="password" placeholder={STATIC_SITE ? t.staticPasswordPlaceholder : t.passwordPlaceholder} disabled={STATIC_SITE} autoComplete="off" />
                  <button type="button" data-pw aria-label={t.showPassword}><svg aria-hidden="true"><use href="#ey" /></svg></button></span></label>
              <details className="adv">
                <summary><svg aria-hidden="true" className="gear"><use href="#gr" /></svg><span>{t.connSettings}</span><small>{t.connSettingsHint}</small><svg aria-hidden="true" className="chev"><use href="#cv" /></svg></summary>
                <div className="adv-in">
                  <label>{t.securityLabel}<select data-sec><option value="tls">SSL / TLS</option><option value="starttls">STARTTLS</option></select></label>
                  <label>{t.portLabel}<select data-port><option value="auto">{t.portAuto}</option><option value="manual">{t.portManual}</option></select><input data-port-num type="number" min="1" max="65535" placeholder="993" inputMode="numeric" hidden /></label>
                  <label style={{ gridColumn: '1/-1' }}>{t.subfolderLabel}
                    <input type="text" data-subfolder placeholder={t.subfolderPlaceholder} spellCheck="false" /></label>
      </div>
              </details>
            </div>
          </div>

          {STATIC_SITE && (
            <p className="keep" role="status" style={{ padding: '18px', display: 'block' }}>
              {t.previewNoticeA}
              <a href={href(lang, '/download')}>{t.previewNoticeLink}</a>
              {t.previewNoticeB}
            </p>
          )}

          <div className="launch">
            <div className="assure">
              <span><svg aria-hidden="true"><use href="#ky" /></svg>{t.assureSource}</span>
              <span><svg aria-hidden="true"><use href="#sv" /></svg>{t.assureSize}</span>
            </div>
            <div className="acts">
              <button className="btn btn-p btn-lg" id="start" disabled={STATIC_SITE}><svg aria-hidden="true" style={{ width: '17px', height: '17px' }}><use href="#pl" /></svg>{t.start}</button>
              <button className="btn btn-g" id="stop" disabled><svg aria-hidden="true" style={{ width: '15px', height: '15px' }}><use href="#sq" /></svg>{t.stop}</button>
            </div>
            <p id="modeHint" style={{ display: 'none', width: '100%', margin: '0', fontFamily: 'var(--mono)', fontSize: '11.5px', color: 'var(--amb)' }}></p>
          </div>

          <div className="opts">
            <details className="drop">
              <summary><span className="sn">03</span><b>{t.foldersTitle}</b><span className="sum" id="fsum">{t.foldersSum}</span><svg aria-hidden="true" className="chev"><use href="#cv" /></svg></summary>
              <div className="drop-in">
                <div className="fbar">
                  <button className="btn btn-g" type="button" id="floadBtn" disabled={STATIC_SITE}>
                    <svg aria-hidden="true" style={{ width: '15px', height: '15px' }}><use href="#cv" /></svg>{rt.foldersLoad}
                  </button>
                  <button className="btn btn-g" type="button" id="fallBtn" hidden>{rt.selectNone}</button>
                </div>
                {/* Список заполняется именами папок, которые вернул сервер-источника.
                    До запроса он пуст: придуманных папок и размеров здесь нет. */}
                <div id="flist"></div>
                <p className="fhint" id="fhint">{t.foldersHint}</p>
              </div>
            </details>
            <details className="drop">
              <summary><span className="sn">04</span><b>{t.advTitle}</b><span className="sum">{t.advSum}</span><svg aria-hidden="true" className="chev"><use href="#cv" /></svg></summary>
              <div className="adv-modes">
                <label className="mode-ck"><input type="checkbox" data-mode="verbose" /><span className="bx off"><svg aria-hidden="true"><use href="#ck" /></svg></span>
                  <span><b>{t.modeVerboseTitle}</b>{t.modeVerboseTextA}<code>--dry</code>{t.modeVerboseTextB}</span></label>
                <label className="mode-ck"><input type="checkbox" data-mode="creds" /><span className="bx off"><svg aria-hidden="true"><use href="#ck" /></svg></span>
                  <span><b>{t.modeCredsTitle}</b>{t.modeCredsText}</span></label>
                <label className="mode-ck"><input type="checkbox" data-mode="sizes" /><span className="bx off"><svg aria-hidden="true"><use href="#ck" /></svg></span>
                  <span><b>{t.modeSizesTitle}</b>{t.modeSizesText}</span></label>
                <label className="mode-ck"><input type="checkbox" data-mode="folders" /><span className="bx off"><svg aria-hidden="true"><use href="#ck" /></svg></span>
                  <span><b>{t.modeFoldersTitle}</b>{t.modeFoldersTextA}<code>--justfolders</code>{t.modeFoldersTextB}</span></label>
              </div>
              <div className="strict">
                <svg aria-hidden="true"><use href="#al" /></svg>
                <div><strong>{t.strictTitle}</strong>
                  <p>{t.strictText}</p></div>
                <button type="button" id="strict">{t.strictBtn}</button>
              </div>
            </details>
          </div>

          <div style={{ padding: '2px 24px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="keep" id="keepNote">
              <svg aria-hidden="true"><use href="#sh" /></svg>
              <p><b>{t.keepBold}</b> {t.keepText} <a href={href(lang, '/download')}>{t.keepLink}</a></p>
            </div>
            <p className="note" style={{ padding: '0' }}>{t.freeNote}</p>
          </div>

          <div className="mon">
            <div className="mon-h">
              <svg aria-hidden="true"><use href="#tx" /></svg>
              <span><strong>{t.logTitle}</strong><small>{t.logSub}</small></span>
              <span className="stt" id="stt"><i></i>{t.statusWaiting}</span>
            </div>
            {/* Шесть величин. Четыре приходят от задания: процент, перенесено,
                пропущено, объём. Две считаются здесь по часам браузера и по
                реальным счётчикам — прошедшее время и оценка остатка; они
                помечены знаком ≈, потому что это расчёт, а не поле API. */}
            <div className="mon-s">
              <div><small>{t.metricProgress}</small><strong id="mp">0%</strong></div>
              <div><small>{t.metricElapsed}</small><strong id="mel">00:00</strong></div>
              <div><small>{t.metricLeft}</small><strong id="me">—</strong></div>
              <div><small>{t.metricTransferred}</small><strong id="mt">—</strong></div>
              <div><small>{t.metricSkipped}</small><strong id="msk">—</strong></div>
              <div><small>{t.metricBytes}</small><strong id="mv">—</strong></div>
            </div>
            <div className="track"><i id="mbar"></i></div>
            <p className="mon-ph" id="mphase">{t.phaseIdle}</p>
            <p className="mon-est" id="mest">{t.estimateNote}</p>
            <div className="log" id="log" aria-live="polite">
              <div><time>00:00</time><b>{t.logFirst}</b></div>
            </div>
            <p className="log-foot">{t.logFoot}</p>
          </div>
        </div>
      </section>
    </>
  );
}
