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
  images: { unoptimized: true },
};

export default nextConfig;
