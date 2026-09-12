export function HowItWorks({ pageTitle = false }: { pageTitle?: boolean } = {}) {
  const Heading = pageTitle ? 'h1' : 'h2';
  return (
    <>
      <section className="shell">
        <div className="head-wide">
          <p className="eyebrow">Как это работает</p>
          <Heading style={{ fontSize: "clamp(1.75rem,3.4vw,2.75rem)" }}>До нового ящика — <span className="ital">четыре понятных шага.</span></Heading>
        </div>
        <div className="flow" id="flow4">
          <div className="rail" aria-hidden="true"><i id="railFill"></i></div>
          <div className="flow-grid">
            <article className="stn">
              <span className="node"><b>01</b></span>
              <div className="body"><span className="tm">≈ 30 секунд</span><h3>Подключите</h3>
                <p>Введите IMAP-серверы, логины почтовых ящиков и пароли приложения. Порт подставится сам: <code>993</code> для SSL/TLS, <code>143</code> для STARTTLS.</p></div>
            </article>
            <article className="stn">
              <span className="node"><b>02</b></span>
              <div className="body"><span className="tm">≈ 1 минута</span><h3>Проверьте</h3>
                <p>Мы отдельно проверим TLS и авторизацию, затем оценим полный объём почты. Ошибка скажет, что именно не сошлось — сертификат или пароль.</p></div>
            </article>
            <article className="stn">
              <span className="node"><b>03</b></span>
              <div className="body"><span className="tm">от часа до суток</span><h3>Запустите</h3>
                <p>Ящик до 5 ГБ переносится бесплатно. Для большего объёма сначала выбирается тариф. Повторный запуск докидывает только недостающие письма.</p></div>
            </article>
            <article className="stn">
              <span className="node"><b>04</b></span>
              <div className="body"><span className="tm">≈ 5 минут</span><h3>Сверьте</h3>
                <p>Получите отчёт и сравните папки до удаления или отключения старого ящика. Мы не удаляем исходный ящик ни при каком сценарии.</p></div>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
