export function Business() {
  return (
    <>
      <section className="shell">
        <div className="biz">
          <span className="ico"><svg style={{ width: '24px', height: '24px' }}><use href="#bs" /></svg></span>
          <div>
            <h2>Сорок ящиков за уикенд — <span className="ital">и один отчёт для руководства.</span></h2>
            <p>Пакетная загрузка ящиков через CSV, статус по каждому пользователю, сводный отчёт и приоритетная очередь. Одна миграция домена — один счёт и один документ для руководства.</p>
          </div>
          <a className="btn btn-p" href="https://github.com/Anton-Babaskin/MoveMailbox/issues" target="_blank" rel="noreferrer">Обсудить бизнес-сценарий<svg style={{ width: '15px', height: '15px' }}><use href="#ar" /></svg></a>
        </div>
      </section>
    </>
  );
}
