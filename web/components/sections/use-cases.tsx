export function UseCases({ pageTitle = false }: { pageTitle?: boolean } = {}) {
  const Heading = pageTitle ? 'h1' : 'h2';
  return (
    <>
      <section className="shell">
        <div className="head-wide">
          <p className="eyebrow">Кому это нужно</p>
          <Heading style={{ fontSize: "clamp(1.75rem,3.4vw,2.75rem)" }}>Три ситуации, <span className="ital">в которых почта переезжает.</span></Heading>
        </div>
        <div className="who-grid">
          <article className="who">
            <span className="who-n">01</span>
            <h3>Личный ящик</h3>
            <p>Уходите от провайдера, меняете работу или закрываете старый адрес. Один ящик, письма и папки целиком.</p>
            <span className="who-tag">до 5 ГБ бесплатно · без регистрации</span>
          </article>
          <article className="who">
            <span className="who-n">02</span>
            <h3>Переезд хостинга</h3>
            <p>Домен уезжает к новому провайдеру, и почта должна приехать целой. Подключение по IP, второй проход после смены MX.</p>
            <span className="who-tag">без лимита в self-hosted</span>
          </article>
          <article className="who">
            <span className="who-n">03</span>
            <h3>IT-команда</h3>
            <p>Сорок ящиков за уикенд и один отчёт, который можно показать руководству. Пакетный режим и сводка по каждому пользователю.</p>
            <span className="who-tag">CSV · сводный отчёт</span>
          </article>
        </div>
        <div className="proof">
          <div><strong>Код на GitHub</strong><span>Ядро и клиенты на GitHub</span></div>
          <div><strong>imapsync</strong><span>Проверенный движок, лицензия NLPL</span></div>
          <div><strong>0 удалений</strong><span>Базовый режим только копирует</span></div>
          <div><strong>Self-hosted</strong><span>Можно поднять у себя, без нас</span></div>
        </div>
      </section>
    </>
  );
}
