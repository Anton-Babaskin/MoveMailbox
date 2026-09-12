import type { Metadata } from 'next';
import { ProviderGuides } from '@/components/sections/provider-guides';
import { FaqFull } from '@/components/sections/faq-full';
import { FinalCta } from '@/components/sections/final-cta';

export const metadata: Metadata = {
  title: 'Настройки IMAP-провайдеров — MoveMailbox',
  description:
    'Хост, порт, пароли приложений и подводные камни Gmail, Microsoft 365, Яндекса, iCloud, Zoho и cPanel в одном справочнике.',
  alternates: {
    canonical: '/guides/',
  },
};

export default function Page() {
  return (
    <main>
      <ProviderGuides pageTitle />
      <FaqFull />
      <FinalCta />
    </main>
  );
}
