import type { Metadata } from 'next';
import { LegalDoc } from '@/components/legal-doc';
import { legal } from '@/content/legal';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  language: 'ru',
  path: '/privacy',
  ...legal.privacy.ru.meta,
});

export default function Page() {
  return <LegalDoc lang="ru" doc="privacy" />;
}
