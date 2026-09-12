import type { Metadata } from 'next';
import { Errors } from '@/components/sections/errors';
import { ErrorIndex } from '@/components/sections/error-index';
import { FinalCta } from '@/components/sections/final-cta';

export const metadata: Metadata = {
  title: 'Ошибки IMAP и что они значат — MoveMailbox',
  description:
    'AUTHENTICATIONFAILED, certificate verify failed, OVERQUOTA и другие ответы IMAP-серверов: причина и решение.',
  alternates: {
    canonical: '/docs/errors/',
  },
};

export default function Page() {
  return (
    <main>
      <Errors pageTitle />
      <ErrorIndex />
      <FinalCta />
    </main>
  );
}
