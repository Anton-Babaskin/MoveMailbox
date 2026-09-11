import type { Metadata } from 'next';
import { HowItWorks } from '@/components/sections/how-it-works';
import { ProtocolLimits } from '@/components/sections/protocol-limits';
import { PopularRoutes } from '@/components/sections/popular-routes';
import { RouteIndex } from '@/components/sections/route-index';
import { FinalCta } from '@/components/sections/final-cta';

export const metadata: Metadata = {
  title: 'Маршруты переноса почты — MoveMailbox',
  description:
    'Готовые инструкции для частых переездов: Gmail, Outlook, Яндекс, iCloud, хостинги. Что переносится по IMAP, а что придётся перенести руками.',
  alternates: {
    canonical: '/routes/',
  },
};

export default function Page() {
  return (
    <main>
      <HowItWorks pageTitle />
      <ProtocolLimits />
      <PopularRoutes />
      <RouteIndex />
      <FinalCta />
    </main>
  );
}
