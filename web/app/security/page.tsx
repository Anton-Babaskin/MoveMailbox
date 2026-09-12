import type { Metadata } from 'next';
import { Security } from '@/components/sections/security';
import { FinalCta } from '@/components/sections/final-cta';

export const metadata: Metadata = {
  title: 'Безопасность — MoveMailbox',
  description:
    'Что происходит с учётными данными на каждом шаге переноса: шифрование, расшифровка в памяти воркера, отсутствие архива писем.',
  alternates: {
    canonical: '/security/',
  },
};

export default function Page() {
  return (
    <main>
      <Security pageTitle />
      <FinalCta />
    </main>
  );
}
