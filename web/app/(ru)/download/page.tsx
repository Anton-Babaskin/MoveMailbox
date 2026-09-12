import type { Metadata } from 'next';
import { Modes } from '@/components/sections/modes';
import { DesktopApp } from '@/components/sections/desktop-app';
import { FinalCta } from '@/components/sections/final-cta';
import { pages } from '@/content/pages';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  language: 'ru',
  path: '/download',
  ...pages['/download'].ru,
});

export default function Page() {
  return (
    <main>
      <Modes lang={'ru'} pageTitle />
      <DesktopApp lang={'ru'} />
      <FinalCta lang={'ru'} />
    </main>
  );
}
