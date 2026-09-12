import type { Metadata } from 'next';
import { Modes } from '@/components/sections/modes';
import { DesktopApp } from '@/components/sections/desktop-app';
import { FinalCta } from '@/components/sections/final-cta';

export const metadata: Metadata = {
  title: 'Скачать клиент — MoveMailbox',
  description:
    'Настольный клиент для Windows и Linux, Docker-сборка для своего сервера. Без лимита по объёму, почта идёт напрямую между вашими серверами.',
  alternates: {
    canonical: '/download/',
  },
};

export default function Page() {
  return (
    <main>
      <Modes pageTitle />
      <DesktopApp />
      <FinalCta />
    </main>
  );
}
