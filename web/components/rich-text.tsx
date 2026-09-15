import type { ReactNode } from 'react';

/**
 * Разбор простейшей разметки в строках справочника провайдеров.
 *
 * В content/sections/guides-runtime.ts шаги и подводные камни написаны с
 * `<b>` и `<code>` внутри строки: эти же строки императивный код
 * (lib/guides.ts) вставляет в панель через innerHTML, когда человек
 * переключает вкладку. Первую вкладку рисует сервер — и там строка
 * выводилась как текст, поэтому на странице было видно сами теги:
 * «‹b›Ярлык «Вся почта»‹/b› — ‹code›[Gmail]/All Mail‹/code›».
 *
 * Здесь строка превращается в настоящие элементы React. Именно разбор, а не
 * dangerouslySetInnerHTML: распознаются ровно два тега, всё остальное
 * остаётся текстом. Даже если в словарь однажды попадёт чужая строка, она
 * не станет разметкой.
 */
const TAG = /<(b|code)>([\s\S]*?)<\/\1>/g;

/** Мини-набор сущностей, который встречается в этих строках. */
function decode(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export function RichText({ text }: { text: string }): ReactNode {
  const out: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  TAG.lastIndex = 0;

  while ((match = TAG.exec(text)) !== null) {
    if (match.index > last) out.push(decode(text.slice(last, match.index)));
    const inner = decode(match[2]);
    out.push(
      match[1] === 'b'
        ? <b key={`${match.index}-b`}>{inner}</b>
        : <code key={`${match.index}-c`}>{inner}</code>,
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) out.push(decode(text.slice(last)));

  return <>{out}</>;
}
