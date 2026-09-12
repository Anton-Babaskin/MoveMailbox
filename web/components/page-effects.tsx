'use client';

import { useEffect } from 'react';
import { initEffects } from '@/lib/effects';

/** Скролл-эффекты и кнопка «наверх». Ничего не рендерит, кроме самой кнопки. */
export function PageEffects() {
  useEffect(() => {
    initEffects();
  }, []);

  return (
    <>
      <div className="sprog" id="sprog" aria-hidden="true" />
      <button className="top-btn" id="toTop" type="button" aria-label="Наверх">
        <svg className="ring" viewBox="0 0 54 54" aria-hidden="true">
          <circle className="bgc" cx="27" cy="27" r="24.5" />
          <circle
            className="fg"
            cx="27"
            cy="27"
            r="24.5"
            strokeDasharray="153.9"
            strokeDashoffset="153.9"
            id="ringFg"
          />
        </svg>
        <svg className="ic" aria-hidden="true">
          <use href="#up" />
        </svg>
      </button>
    </>
  );
}
