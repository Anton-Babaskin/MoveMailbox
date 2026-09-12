import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Блог MoveMailbox — MoveMailbox',
  description: 'Статьи готовятся.',
  alternates: { canonical: '/blog/' },
  robots: { index: false, follow: true },
};

export default function Page() {
  return <main className="shell" style={{ paddingTop: '48px', paddingBottom: '80px' }}>
    <h1>Блог MoveMailbox</h1>
    <p className="lede" style={{ marginTop: '24px' }}>Статьи готовятся. Сейчас доступны руководства по переносу и разборы ошибок IMAP.</p>
    <p style={{ marginTop: '24px' }}><a href="/guides/">Руководства</a> · <a href="https://github.com/Anton-Babaskin/MoveMailbox">Репозиторий</a></p>
  </main>;
}
