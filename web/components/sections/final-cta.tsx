export function FinalCta() {
  return (
    <>
      <section className="shell final">
        <span className="ico"><svg style={{ width: '24px', height: '24px' }}><use href="#ht" /></svg></span>
        <h2>Узнайте объём своего ящика. <span className="ital">Это ничего не стоит.</span></h2>
        <p className="lede" style={{ textAlign: 'center' }}>Подключите два сервера, посмотрите размер и решайте. Или заберите клиент и держите всё у себя.</p>
        <div className="btns">
          <a className="btn btn-p" href="/">Начать перенос<svg style={{ width: '16px', height: '16px' }}><use href="#ar" /></svg></a>
          <a className="btn btn-g" href="https://github.com/Anton-Babaskin/MoveMailbox/releases/tag/v0.4.0-preview" target="_blank" rel="noreferrer"><svg style={{ width: '16px', height: '16px' }}><use href="#dl" /></svg>Скачать для Windows</a>
        </div>
        <small>Код на GitHub · на базе imapsync · без регистрации</small>
      </section>
    </>
  );
}
