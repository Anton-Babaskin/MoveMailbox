import { mark } from '@/data/provider-marks';
import type { ProviderKey } from '@/data/providers';

/**
 * Значок провайдера. Один компонент на весь сайт: плитки быстрого старта,
 * карточки маршрутов и вкладки гайдов должны показывать сервис одинаково,
 * иначе Gmail на трёх страницах выглядит тремя разными сервисами.
 *
 * aria-hidden: это украшение рядом с названием, которое и так есть текстом.
 * Читать скринридеру «буква G» поверх слова «Gmail» — только мешать.
 */
export function ProviderMark({
  provider,
  size = 'sm',
}: {
  provider: ProviderKey;
  /** lg — крупная плитка (быстрый старт, шапка гайда), sm — в строке. */
  size?: 'sm' | 'lg';
}) {
  const m = mark(provider);
  return (
    <span
      className={size === 'lg' ? 'pvi lg' : 'pvi'}
      aria-hidden="true"
      style={{ ['--b1' as string]: m.b1, ['--b2' as string]: m.b2 }}
    >
      {/* alt пустой намеренно: значок уже помечен aria-hidden, а название
          сервиса стоит рядом текстом. Обычный <img>, а не next/image: сборка
          статическая, оптимизатор всё равно выключен, а лишний слой на
          восьми значках в строке ничего не даёт.
          Размеры заданы в CSS у .pvi img — картинка не двигает раскладку,
          даже если файл придёт позже разметки. */}
      {m.logo ? <img src={m.logo} alt="" loading="lazy" decoding="async" /> : <i>{m.letter}</i>}
    </span>
  );
}

/**
 * Пара «откуда → куда». Стрелка помечена aria-hidden, а направление уже
 * сказано текстом в заголовке карточки, поэтому пара целиком декоративна.
 */
export function RouteMarks({ from, to }: { from: ProviderKey; to: ProviderKey }) {
  return (
    <span className="rmk" aria-hidden="true">
      <ProviderMark provider={from} />
      <svg className="rmk-a" aria-hidden="true"><use href="#ar" /></svg>
      <ProviderMark provider={to} />
    </span>
  );
}
