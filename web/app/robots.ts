import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/seo';

/** Экспортируется как статический файл при output: 'export'. */
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE}/sitemap.xml`,
    /* host здесь был, но это нестандартная директива: Яндекс отказался от
       неё, остальные не читали никогда. Зеркало задаётся редиректом, и он
       у нас есть — www и http уходят на apex по 301. */
  };
}
