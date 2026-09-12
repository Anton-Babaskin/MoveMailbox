import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Конфиденциальность — MoveMailbox',
  description: 'Сейчас этот сайт — статическая предварительная версия на GitHub Pages.',
  alternates: { canonical: '/privacy/' },
  robots: { index: false, follow: true },
};

export default function Page() {
  return <main className="shell" style={{ paddingTop: '48px', paddingBottom: '80px' }}>
    <h1>Конфиденциальность</h1>
    <p className="lede" style={{ marginTop: '24px' }}>Сейчас этот сайт — статическая предварительная версия на GitHub Pages. Ввод учётных данных и онлайн-перенос отключены. Этот сайт не принимает пароли почтовых ящиков и платежи. Технические данные запросов может обрабатывать хостинг GitHub согласно своей политике конфиденциальности. Полная политика онлайн-сервиса будет опубликована до его запуска.</p>
    <p style={{ marginTop: '24px' }}><a href="/guides/">Руководства</a> · <a href="https://github.com/Anton-Babaskin/MoveMailbox">Репозиторий</a> · <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">Политика GitHub</a></p>
  </main>;
}
