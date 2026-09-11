export function FaqShort() {
  return (
    <>
      <section className="shell">
        <div className="head-wide"><p className="eyebrow">FAQ</p><h2>Перед первым переносом</h2></div>
        <div className="faq">
          <div>
            <details open><summary>Что происходит с моим паролем?<span className="pm"></span></summary>
              <p>Соединение защищено HTTPS. Перед постановкой задания в очередь учётные данные шифруются для воркера: открытый пароль не сохраняется, временно хранится зашифрованный пакет. Расшифровка — в памяти воркера на время переноса. В self-hosted пароль передаётся вашим почтовым серверам без инфраструктуры MoveMailbox.</p></details>
            <details><summary>Удаляется ли старая почта?<span className="pm"></span></summary>
              <p>Нет. Базовый сценарий — одностороннее копирование, источник не изменяется. Старый ящик стоит отключать только после сверки счётчиков папок.</p></details>
          </div>
          <div>
            <details><summary>Что означает «до 5 ГБ бесплатно»?<span className="pm"></span></summary>
              <p>Бесплатно переносится один целый ящик, измеренный в 5 ГБ или меньше. Мы не копируем первые 5 ГБ большого ящика и не останавливаемся на полпути — объём известен до запуска.</p></details>
            <details><summary>Что делать, если перенос оборвался?<span className="pm"></span></summary>
              <p>Запустить снова. imapsync сверяет, что уже лежит в назначении, и копирует только недостающее — повтор дешёвый и не создаёт дублей.</p></details>
          </div>
        </div>
        <p style={{ marginTop: '22px' }}><a className="brief-link" href="/guides/">Все вопросы и ответы<svg><use href="#ar" /></svg></a></p>
      </section>
    </>
  );
}
