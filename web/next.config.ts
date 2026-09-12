import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /**
   * Статический экспорт: сборка кладёт готовый HTML в out/,
   * его отдаёт Go-бинарь вместе с /api/*. Один origin — нет CORS,
   * нет второго рантайма в проде, нет прокси между сайтом и бекендом.
   */
  output: 'export',
  trailingSlash: true,
  // GitHub Pages serves route/index.html; canonical URLs and sitemap use /.
  reactStrictMode: true,
  images: { unoptimized: true },
};

export default nextConfig;
