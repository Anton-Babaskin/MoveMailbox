/**
 * Вставка JSON-LD в разметку страницы.
 *
 * Несколько объектов передаём массивом — Google читает любое число
 * блоков application/ld+json на странице.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Array<Record<string, unknown>> }) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          // Содержимое собирается на сервере из наших же данных.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item).replace(/</g, '\\u003c') }}
        />
      ))}
    </>
  );
}
