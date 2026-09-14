/** Быстрый старт: плитки провайдеров на главной.
 *  Ведут на страницы /migrate/<провайдер> — точку входа для тех, кто ещё не
 *  выбрал вторую сторону. Подпись у каждой плитки своя: одинаковые
 *  «Перенести почту X» не помогают ни человеку, ни поиску. */
export const quickstart = {
  ru: {
    eyebrow: 'Быстрый старт',
    h2a: 'Откуда переносим ',
    h2b: 'почту?',
    lede: 'Выберите сервис — покажем настройки, подводные камни и порядок действий. Своего сервера в списке нет? Он под последней плиткой.',
    cards: {
      gmail: 'Ярлыки, «Вся почта» и пароль приложения',
      'microsoft-365': 'Пароль приложения, архив и ограничения скорости',
      yahoo: 'Обязательный пароль приложения',
      exchange: 'Служба IMAP, сертификат и политики',
      imap: 'Любой сервер: хостинг, Dovecot, свой почтовик',
    },
    go: 'Настройки и порядок',
  },
  en: {
    eyebrow: 'Quickstart',
    h2a: 'Where are you moving mail ',
    h2b: 'from?',
    lede: 'Pick the service and get its settings, its traps and the order of steps. Your own server is behind the last card.',
    cards: {
      gmail: 'Labels, All Mail and the app password',
      'microsoft-365': 'App password, archive and throttling',
      yahoo: 'App password is mandatory',
      exchange: 'IMAP service, certificate and policies',
      imap: 'Any server: hosting, Dovecot, your own mail host',
    },
    go: 'Settings and steps',
  },
  uk: {
    eyebrow: 'Швидкий старт',
    h2a: 'Звідки переносимо ',
    h2b: 'пошту?',
    lede: 'Оберіть сервіс — покажемо налаштування, підводні камені та порядок дій. Власного сервера немає в списку? Він за останньою пліткою.',
    cards: {
      gmail: 'Мітки, «Уся пошта» і пароль застосунку',
      'microsoft-365': 'Пароль застосунку, архів і обмеження швидкості',
      yahoo: 'Обов’язковий пароль застосунку',
      exchange: 'Служба IMAP, сертифікат і політики',
      imap: 'Будь-який сервер: хостинг, Dovecot, власний поштовик',
    },
    go: 'Налаштування та кроки',
  },
} as const;

/**
 * Марки провайдеров — наши собственные.
 *
 * Официальные логотипы Gmail, Microsoft и Yahoo здесь не стоят намеренно:
 * это чужие торговые марки, и их размещение рядом с кнопкой переноса читается
 * как заявление о партнёрстве, которого нет. Вместо них — монограмма в нашей
 * типографике на нейтральной подложке, с фирменным цветом сервиса только в
 * акценте. Узнаётся, ничего не копирует.
 */
export const quickstartMarks: Record<string, { letter: string; b1: string; b2: string }> = {
  gmail: { letter: 'G', b1: '#F2685A', b2: '#C42D20' },
  'microsoft-365': { letter: 'M', b1: '#5A8DE8', b2: '#1B4699' },
  yahoo: { letter: 'Y', b1: '#A98BE8', b2: '#5B2D91' },
  exchange: { letter: 'E', b1: '#6FA8DC', b2: '#1F5FA8' },
  imap: { letter: '@', b1: '#5AC8A8', b2: '#0A7C5C' },
};

/** Порядок плиток. Общая IMAP-плитка последняя: она для тех, кто не нашёл свой. */
export const quickstartOrder = ['gmail', 'microsoft-365', 'yahoo', 'exchange', 'imap'] as const;
