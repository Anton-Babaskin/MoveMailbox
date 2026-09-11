import type { Metadata } from 'next';
import { UseCases } from '@/components/sections/use-cases';
import { Calculator } from '@/components/sections/calculator';
import { Pricing } from '@/components/sections/pricing';
import { Business } from '@/components/sections/business';
import { FinalCta } from '@/components/sections/final-cta';

export const metadata: Metadata = {
  title: 'Тарифы и калькулятор переноса — MoveMailbox',
  description:
    'Сколько займёт перенос вашего ящика и во сколько обойдётся. До 5 ГБ бесплатно, дальше разовый платёж за ящик.',
  alternates: {
    canonical: '/pricing/',
  },
};

export default function Page() {
  return (
    <main>
      <UseCases pageTitle />
      <Calculator />
      <Pricing />
      <Business />
      <FinalCta />
    </main>
  );
}
