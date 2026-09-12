import type { Lang } from '@/i18n/config';

/**
 * Метаданные статических страниц на трёх языках.
 *
 * Описания намеренно разные по смыслу, а не переведённые слово в слово:
 * поисковые запросы в русском, английском и украинском формулируются
 * по-разному, и снипет должен попадать в них, а не в кальку.
 */
export type PageMeta = { title: string; description: string };

export const pages: Record<string, Record<Lang, PageMeta>> = {
  '/': {
    ru: {
      title: 'MoveMailbox — перенос почты между IMAP-серверами',
      description:
        'Перенос почты между IMAP-серверами: письма, папки и вложения. Онлайн до 5 ГБ бесплатно или локальный клиент без облачного лимита.',
    },
    en: {
      title: 'MoveMailbox — move email between IMAP servers',
      description:
        'Transfer mail between IMAP servers: messages, folders and attachments. Up to 5 GB free online, or run it locally with no size cap.',
    },
    uk: {
      title: 'MoveMailbox — перенесення пошти між IMAP-серверами',
      description:
        'Перенесення пошти між IMAP-серверами: листи, папки та вкладення. Онлайн до 5 ГБ безкоштовно або локальний клієнт без обмеження обсягу.',
    },
  },
  '/routes': {
    ru: {
      title: 'Маршруты переноса почты — MoveMailbox',
      description:
        'Готовые инструкции для частых переездов: Gmail, Outlook, Яндекс, iCloud, хостинги. Что переносится по IMAP, а что придётся перенести руками.',
    },
    en: {
      title: 'Email migration routes — MoveMailbox',
      description:
        'Step-by-step guides for the common moves: Gmail, Outlook, Yandex, iCloud, shared hosting. What IMAP carries over, and what you move by hand.',
    },
    uk: {
      title: 'Маршрути перенесення пошти — MoveMailbox',
      description:
        'Готові інструкції для частих переїздів: Gmail, Outlook, Яндекс, iCloud, хостинги. Що переноситься через IMAP, а що доведеться робити вручну.',
    },
  },
  '/guides': {
    ru: {
      title: 'Настройки IMAP-провайдеров — MoveMailbox',
      description:
        'Хост, порт, пароли приложений и подводные камни Gmail, Microsoft 365, Яндекса, iCloud, Zoho и cPanel в одном справочнике.',
    },
    en: {
      title: 'IMAP provider settings — MoveMailbox',
      description:
        'Hosts, ports, app passwords and the quirks of Gmail, Microsoft 365, Yandex, iCloud, Zoho and cPanel, collected in one reference.',
    },
    uk: {
      title: 'Налаштування IMAP-провайдерів — MoveMailbox',
      description:
        'Хост, порт, паролі застосунків і підводні камені Gmail, Microsoft 365, Яндекса, iCloud, Zoho та cPanel в одному довіднику.',
    },
  },
  '/pricing': {
    ru: {
      title: 'Тарифы и калькулятор переноса — MoveMailbox',
      description:
        'Сколько займёт перенос вашего ящика и во сколько обойдётся. До 5 ГБ бесплатно, дальше разовый платёж за ящик.',
    },
    en: {
      title: 'Pricing and transfer calculator — MoveMailbox',
      description:
        'How long your mailbox will take to move and what it will cost. Up to 5 GB free, then a one-off payment per mailbox.',
    },
    uk: {
      title: 'Тарифи та калькулятор перенесення — MoveMailbox',
      description:
        'Скільки часу забере перенесення вашої скриньки та скільки це коштуватиме. До 5 ГБ безкоштовно, далі разовий платіж за скриньку.',
    },
  },
  '/security': {
    ru: {
      title: 'Безопасность — MoveMailbox',
      description:
        'Что происходит с учётными данными на каждом шаге переноса: шифрование, расшифровка в памяти воркера, отсутствие архива писем.',
    },
    en: {
      title: 'Security — MoveMailbox',
      description:
        'What happens to your credentials at every step: encryption before queueing, decryption in worker memory, and no archive of your mail.',
    },
    uk: {
      title: 'Безпека — MoveMailbox',
      description:
        'Що відбувається з обліковими даними на кожному кроці перенесення: шифрування, розшифрування в пам’яті воркера, відсутність архіву листів.',
    },
  },
  '/download': {
    ru: {
      title: 'Скачать клиент — MoveMailbox',
      description:
        'Настольный клиент для Windows и Linux, Docker-сборка для своего сервера. Без лимита по объёму, почта идёт напрямую между вашими серверами.',
    },
    en: {
      title: 'Download the client — MoveMailbox',
      description:
        'Desktop client for Windows and Linux, plus a Docker image for your own server. No size cap, and mail goes straight between your servers.',
    },
    uk: {
      title: 'Завантажити клієнт — MoveMailbox',
      description:
        'Настільний клієнт для Windows і Linux, Docker-збірка для власного сервера. Без обмеження обсягу, пошта йде напряму між вашими серверами.',
    },
  },
  '/blog': {
    ru: {
      title: 'Блог — MoveMailbox',
      description:
        'Разборы миграций, изменения у провайдеров и грабли, на которые наступают при переносе почты.',
    },
    en: {
      title: 'Blog — MoveMailbox',
      description:
        'Migration write-ups, provider changes, and the rakes people keep stepping on when moving email.',
    },
    uk: {
      title: 'Блог — MoveMailbox',
      description:
        'Розбори міграцій, зміни у провайдерів і граблі, на які наступають під час перенесення пошти.',
    },
  },
  '/docs/errors': {
    ru: {
      title: 'Ошибки IMAP и что они значат — MoveMailbox',
      description:
        'AUTHENTICATIONFAILED, certificate verify failed, OVERQUOTA и другие ответы IMAP-серверов: причина и решение.',
    },
    en: {
      title: 'IMAP errors and what they mean — MoveMailbox',
      description:
        'AUTHENTICATIONFAILED, certificate verify failed, OVERQUOTA and other IMAP server replies: what causes them and how to fix them.',
    },
    uk: {
      title: 'Помилки IMAP і що вони означають — MoveMailbox',
      description:
        'AUTHENTICATIONFAILED, certificate verify failed, OVERQUOTA та інші відповіді IMAP-серверів: причина та вирішення.',
    },
  },
};
