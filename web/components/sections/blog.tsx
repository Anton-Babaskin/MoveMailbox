export function Blog() {
  return (
    <>
      <section className="shell" id="blog">
        <div className="head-wide">
          <p className="eyebrow">Блог</p>
          <h2>Разборы миграций, <span className="ital">граблей и провайдеров.</span></h2>
          <p className="lede" style={{ marginTop: '16px' }}>Пишем о том, что реально ломается при переносе почты: новые ограничения провайдеров, аутентификация, доставляемость после переезда, свой почтовый сервер.</p>
        </div>
        <div className="bgrid">
          <a className="post" href="#">
            <div className="cover"><svg className="gl"><use href="#ky" /></svg></div>
            <div className="body">
              <div className="meta"><span className="tg">Аутентификация</span><span>8 мин</span></div>
              <h3>Microsoft закрыл basic auth: что делать с миграцией на 365</h3>
              <p>Почему пара «логин + пароль» больше не проходит, как выглядит XOAUTH2 на практике и какие права должен согласовать администратор тенанта.</p>
              <span className="rd">Читать<svg><use href="#ar" /></svg></span>
            </div>
          </a>
          <a className="post" href="#">
            <div className="cover"><svg className="gl"><use href="#ml" /></svg></div>
            <div className="body">
              <div className="meta"><span className="tg">Gmail</span><span>6 мин</span></div>
              <h3>Почему после переноса из Gmail писем стало вдвое больше</h3>
              <p>Ярлыки против папок, ловушка <code>[Gmail]/All Mail</code> и как посчитать реальный объём ящика до того, как выбирать тариф.</p>
              <span className="rd">Читать<svg><use href="#ar" /></svg></span>
            </div>
          </a>
          <a className="post" href="#">
            <div className="cover"><svg className="gl"><use href="#sv" /></svg></div>
            <div className="body">
              <div className="meta"><span className="tg">Хостинг</span><span>11 мин</span></div>
              <h3>Переезд домена без потери почты: порядок действий по шагам</h3>
              <p>Что делать до смены MX, как догнать письма вторым проходом и почему TTL стоит опустить за сутки до переключения.</p>
              <span className="rd">Читать<svg><use href="#ar" /></svg></span>
            </div>
          </a>
        </div>
      </section>
    </>
  );
}
