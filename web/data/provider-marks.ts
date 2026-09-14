import type { ProviderKey } from '@/data/providers';

/**
 * Значки провайдеров.
 *
 * У каждого сервиса — плашка с его цветом. Внутри либо официальный знак,
 * либо буква: и то и другое узнаётся с одного взгляда в ряду карточек.
 *
 * Где владелец дал официальный файл, стоит logo — путь к нему, и значок
 * рисует картинку вместо буквы. Логотипы лежат у нас (public/brand/providers),
 * а не тянутся с чужого домена: на странице ноль третьих сторон, и политика
 * connect-src 'self' остаётся нетронутой. Происхождение и условия — в
 * public/brand/providers/NOTICE.md.
 *
 * Буква остаётся запасным вариантом, а не временной заглушкой: для части
 * сервисов официальный знак — это надпись целиком («cPanel», «ZOHO»), и в
 * квадрате 34px она превращается в кашу. Там буква честнее.
 *
 * b1 — светлый край градиента, b2 — основной цвет: им же красится буква,
 * подчёркивание значка и подсветка карточки при наведении.
 */
export type ProviderMark = {
  letter: string;
  b1: string;
  b2: string;
  /** Путь к официальному знаку, если он есть и читается в квадрате. */
  logo?: string;
};

export const providerMarks: Record<ProviderKey, ProviderMark> = {
  gmail: { letter: 'G', b1: '#F2685A', b2: '#C42D20', logo: '/brand/providers/gmail.svg' },
  'google-workspace': { letter: 'W', b1: '#F2907A', b2: '#B3421F' },
  'microsoft-365': { letter: 'M', b1: '#5A8DE8', b2: '#1B4699' },
  outlook: { letter: 'O', b1: '#5AA0E8', b2: '#0F5FA8', logo: '/brand/providers/outlook.svg' },
  yahoo: { letter: 'Y', b1: '#A98BE8', b2: '#5B2D91' },
  icloud: { letter: 'i', b1: '#7FC4F0', b2: '#14719E' },
  yandex: { letter: 'Я', b1: '#F0655E', b2: '#C22B26' },
  mailru: { letter: '@', b1: '#6E8FE8', b2: '#1F3FA8' },
  zoho: { letter: 'Z', b1: '#E8A05A', b2: '#9E5A0E' },
  cpanel: { letter: 'c', b1: '#E8944E', b2: '#A4560D' },
  exchange: { letter: 'E', b1: '#6FA8DC', b2: '#1F5FA8' },
};

export function mark(key: ProviderKey): ProviderMark {
  return providerMarks[key];
}
