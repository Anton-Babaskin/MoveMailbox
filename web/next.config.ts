import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /**
   * Статический экспорт: на выходе готовый HTML в out/.
   * Его публикует GitHub Pages, он же вшивается в Go-бинарь,
   * когда подключится бекенд — адреса при переезде не меняются.
   */
  output: 'export',
  /**
   * Обязательно true для GitHub Pages: Pages отдаёт файл только по
   * точному пути, extensionless-адреса он не разрешает. С этим флагом
   * каждая страница становится каталогом с index.html, и /migrate/x/
   * открывается сам собой.
   */
  trailingSlash: true,
  reactStrictMode: true,
  /**
   * Страница 404 отдаёт весь документ целиком.
   *
   * Корневого layout у проекта нет — их два, по одному на языковое дерево, —
   * поэтому обычный not-found.tsx получал от Next собственную обёртку, и в
   * 404.html оказывалось два тега <html>. Браузер второй выбрасывает, React
   * при гидратации видит не своё дерево и ругается. global-not-found.tsx
   * рендерит документ сам и этой двойной обёртки не создаёт.
   */
  experimental: { globalNotFound: true },
  images: { unoptimized: true },
};

export default nextConfig;
