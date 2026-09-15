import { ProviderMark } from '@/components/provider-mark';
import { trustRow } from '@/content/sections/trust-row';
import { providers } from '@/data/providers';
import type { ProviderKey } from '@/data/providers';
import type { Lang } from '@/i18n/config';

/** Порядок в ленте: сначала то, что чаще ищут. */
const MARQUEE: ProviderKey[] = [
  'gmail', 'outlook', 'microsoft-365', 'yandex', 'icloud',
  'yahoo', 'mailru', 'zoho', 'cpanel', 'exchange', 'google-workspace',
];

/**
 * Лента под первым экраном.
 *
 * Была статичная строка из четырёх утверждений. Стала бегущая: в неё влезают
 * и утверждения, и все одиннадцать сервисов с их значками. Это не украшение —
 * названия сервисов здесь настоящий текст в разметке, а не картинка, и их
 * читает поисковик.
 *
 * Как устроено движение. Лента — две одинаковые дорожки подряд; первая едет
 * влево ровно на свою ширину, и в этот момент вторая оказывается точно на её
 * месте. Шва не видно, потому что смещение кратно ширине дорожки.
 *
 * Копия помечена aria-hidden: скринридер и поисковик должны увидеть список
 * один раз, а не дважды.
 */
function Track({ lang, hidden = false }: { lang: Lang; hidden?: boolean }) {
  const t = trustRow[lang];
  return (
    <div className="mq-track" aria-hidden={hidden || undefined}>
      <span className="mq-claim"><svg aria-hidden="true"><use href="#ck" /></svg>{t.sourceKept}</span>
      {MARQUEE.slice(0, 5).map((key) => (
        <span className="mq-item" key={key}>
          <ProviderMark provider={key} />
          {providers[key].name}
        </span>
      ))}
      <span className="mq-claim"><svg aria-hidden="true"><use href="#ck" /></svg>{t.imapsync}</span>
      {MARQUEE.slice(5).map((key) => (
        <span className="mq-item" key={key}>
          <ProviderMark provider={key} />
          {providers[key].name}
        </span>
      ))}
      <span className="mq-claim"><svg aria-hidden="true"><use href="#ck" /></svg>{t.free}</span>
    </div>
  );
}

export function TrustRow({ lang }: { lang: Lang }) {
  return (
    <div className="trust">
      {/* Пауза по наведению и по фокусу с клавиатуры: догонять уезжающую
          ссылку глазами — то же самое, что читать бегущую строку в метро. */}
      <div className="mq" role="group" aria-label={trustRow[lang].label}>
        <Track lang={lang} />
        <Track lang={lang} hidden />
      </div>
    </div>
  );
}
