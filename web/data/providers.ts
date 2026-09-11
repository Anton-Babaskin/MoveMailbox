/**
 * Справочник IMAP-провайдеров.
 * Единый источник правды для маршрутов, гайдов и подстановки в форму.
 */

export type ProviderKey =
  | 'gmail'
  | 'google-workspace'
  | 'microsoft-365'
  | 'outlook'
  | 'yahoo'
  | 'icloud'
  | 'yandex'
  | 'mailru'
  | 'zoho'
  | 'cpanel'
  | 'exchange';

export type Provider = {
  key: ProviderKey;
  /** Отображаемое имя — используется в H1 и title маршрутов. */
  name: string;
  /** Короткое имя для слагов и хлебных крошек. */
  short: string;
  host: string;
  port: 993;
  security: 'tls';
  /** Формат логина: полный адрес или локальная часть. */
  login: 'email' | 'local';
  /** Нужен ли пароль приложения вместо обычного. */
  appPassword: boolean;
  /** Поддерживает ли OAuth 2.0 (XOAUTH2). */
  oauth: boolean;
  /** Практический потолок скорости выгрузки, МБ/час. Для калькулятора. */
  rateMbPerHour: number;
  /** Слаг гайда в /docs/providers/, если он есть. */
  guide?: string;
  /** Папки, которые почти всегда исключают. */
  excludeFolders?: string[];
};

export const providers: Record<ProviderKey, Provider> = {
  gmail: {
    key: 'gmail',
    name: 'Gmail',
    short: 'Gmail',
    host: 'imap.gmail.com',
    port: 993,
    security: 'tls',
    login: 'email',
    appPassword: true,
    oauth: true,
    rateMbPerHour: 104,
    guide: 'gmail',
    excludeFolders: ['[Gmail]/All Mail', '[Gmail]/Spam', '[Gmail]/Trash'],
  },
  'google-workspace': {
    key: 'google-workspace',
    name: 'Google Workspace',
    short: 'Workspace',
    host: 'imap.gmail.com',
    port: 993,
    security: 'tls',
    login: 'email',
    appPassword: true,
    oauth: true,
    rateMbPerHour: 104,
    guide: 'gmail',
    excludeFolders: ['[Gmail]/All Mail', '[Gmail]/Spam'],
  },
  'microsoft-365': {
    key: 'microsoft-365',
    name: 'Microsoft 365',
    short: 'Microsoft 365',
    host: 'outlook.office365.com',
    port: 993,
    security: 'tls',
    login: 'email',
    appPassword: false,
    oauth: true,
    rateMbPerHour: 520,
    guide: 'microsoft-365',
  },
  outlook: {
    key: 'outlook',
    name: 'Outlook.com',
    short: 'Outlook',
    host: 'outlook.office365.com',
    port: 993,
    security: 'tls',
    login: 'email',
    appPassword: true,
    oauth: true,
    rateMbPerHour: 520,
    guide: 'microsoft-365',
    excludeFolders: ['Junk'],
  },
  yahoo: {
    key: 'yahoo',
    name: 'Yahoo Mail',
    short: 'Yahoo',
    host: 'imap.mail.yahoo.com',
    port: 993,
    security: 'tls',
    login: 'email',
    appPassword: true,
    oauth: false,
    rateMbPerHour: 700,
  },
  icloud: {
    key: 'icloud',
    name: 'iCloud Mail',
    short: 'iCloud',
    host: 'imap.mail.me.com',
    port: 993,
    security: 'tls',
    login: 'local',
    appPassword: true,
    oauth: false,
    rateMbPerHour: 820,
  },
  yandex: {
    key: 'yandex',
    name: 'Яндекс.Почта',
    short: 'Яндекс',
    host: 'imap.yandex.ru',
    port: 993,
    security: 'tls',
    login: 'local',
    appPassword: true,
    oauth: true,
    rateMbPerHour: 1450,
    guide: 'yandex',
  },
  mailru: {
    key: 'mailru',
    name: 'Mail.ru',
    short: 'Mail.ru',
    host: 'imap.mail.ru',
    port: 993,
    security: 'tls',
    login: 'email',
    appPassword: true,
    oauth: false,
    rateMbPerHour: 1100,
  },
  zoho: {
    key: 'zoho',
    name: 'Zoho Mail',
    short: 'Zoho',
    host: 'imap.zoho.eu',
    port: 993,
    security: 'tls',
    login: 'email',
    appPassword: true,
    oauth: false,
    rateMbPerHour: 1200,
  },
  cpanel: {
    key: 'cpanel',
    name: 'cPanel / Dovecot',
    short: 'cPanel',
    host: 'mail.example.com',
    port: 993,
    security: 'tls',
    login: 'email',
    appPassword: false,
    oauth: false,
    rateMbPerHour: 4600,
  },
  exchange: {
    key: 'exchange',
    name: 'Exchange Server',
    short: 'Exchange',
    host: 'mail.example.com',
    port: 993,
    security: 'tls',
    login: 'email',
    appPassword: false,
    oauth: false,
    rateMbPerHour: 3200,
  },
};

export function provider(key: ProviderKey): Provider {
  return providers[key];
}
