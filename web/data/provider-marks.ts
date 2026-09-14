import type { ProviderKey } from '@/data/providers';

/**
 * Значки провайдеров.
 *
 * Это наши собственные марки, а не логотипы сервисов: буква в плашке и пара
 * цветов, по которым сервис узнаётся с одного взгляда. Так сделано не из
 * осторожности ради осторожности — чужой логотип пришлось бы либо тянуть с
 * чужого домена (а у нас connect-src 'self' и ни одной третьей стороны на
 * странице), либо класть копию в репозиторий и следить за её актуальностью.
 * Буква и цвет не устаревают и не зависят ни от кого.
 *
 * Если когда-нибудь появятся официальные файлы, менять придётся только этот
 * справочник: разметка значка (.pvi) уже умеет <img> вместо <i>.
 *
 * b1 — светлый край градиента, b2 — основной цвет: им же красится буква,
 * подчёркивание значка и подсветка карточки при наведении.
 */
export type ProviderMark = { letter: string; b1: string; b2: string };

export const providerMarks: Record<ProviderKey, ProviderMark> = {
  gmail: { letter: 'G', b1: '#F2685A', b2: '#C42D20' },
  'google-workspace': { letter: 'W', b1: '#F2907A', b2: '#B3421F' },
  'microsoft-365': { letter: 'M', b1: '#5A8DE8', b2: '#1B4699' },
  outlook: { letter: 'O', b1: '#5AA0E8', b2: '#0F5FA8' },
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
