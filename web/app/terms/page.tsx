import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Условия использования — MoveMailbox',
  description: 'Онлайн-перенос и платные услуги пока не предоставляются.',
  alternates: { canonical: '/terms/' },
  robots: { index: false, follow: true },
};

export default function Page() {
  return <main className="shell" style={{ paddingTop: '48px', paddingBottom: '80px' }}>
    <h1>Условия использования</h1>
    <p className="lede" style={{ marginTop: '24px' }}>Онлайн-перенос и платные услуги пока не предоставляются. Опубликованные тарифы предварительные. Локальные сборки доступны как preview: перед использованием сделайте резервную копию и ознакомьтесь с документацией и условиями репозитория. Полные условия онлайн-сервиса будут опубликованы до запуска.</p>
    <p style={{ marginTop: '24px' }}><a href="/guides/">Руководства</a> · <a href="https://github.com/Anton-Babaskin/MoveMailbox">Репозиторий</a></p>
  </main>;
}
