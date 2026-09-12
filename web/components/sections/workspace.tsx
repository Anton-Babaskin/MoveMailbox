'use client';

import { useEffect } from 'react';
import { initWorkspace } from '@/lib/workspace';
import { workspace } from '@/content/sections/workspace';
import { href, type Lang } from '@/i18n/config';

/**
 * На GitHub Pages бекенда нет: собирать пароли формой, которой некуда
 * их отправить, нечестно и опасно. Флаг выставляется в сборке Pages.
 */
const STATIC_SITE = process.env.NEXT_PUBLIC_STATIC_SITE === '1';

export function Workspace({ lang }: { lang: Lang }) {
  const t = workspace[lang];

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
                    <input type="text" placeholder={t.subfolderPlaceholder} spellCheck="false" /></label>
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
              <div className="drop-in" id="flist">
              <div className="frow"><span className="bx"><svg aria-hidden="true"><use href="#ck" /></svg></span><span className="nm">INBOX</span><span className="c" data-c="18442">18 442</span><span className="s">{t.sizeInbox}</span></div>
              <div className="frow"><span className="bx"><svg aria-hidden="true"><use href="#ck" /></svg></span><span className="nm">INBOX.Sent</span><span className="c" data-c="9117">9 117</span><span className="s">{t.sizeSent}</span></div>
              <div className="frow"><span className="bx"><svg aria-hidden="true"><use href="#ck" /></svg></span><span className="nm">INBOX.Archive.2019-2024</span><span className="c" data-c="11863">11 863</span><span className="s">{t.sizeArchive}</span></div>
              <div className="frow"><span className="bx"><svg aria-hidden="true"><use href="#ck" /></svg></span><span className="nm">INBOX.Clients.Invoices</span><span className="c" data-c="1604">1 604</span><span className="s">{t.sizeInvoices}</span></div>
              <div className="frow"><span className="bx off"><svg aria-hidden="true"><use href="#ck" /></svg></span><span className="nm">INBOX.Junk</span><span className="c" data-c="7330">7 330</span><span className="s">{t.sizeJunk}</span></div>
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
            <div className="mon-s">
              <div><small>{t.metricProgress}</small><strong id="mp">0%</strong></div>
              <div><small>{t.metricLeft}</small><strong id="me">--:--</strong></div>
              <div><small>{t.metricSpeed}</small><strong id="mv">— <span style={{ fontSize: '.7em', color: '#5E7284' }}>{t.speedUnit}</span></strong></div>
            </div>
            <div className="track"><i id="mbar"></i></div>
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
