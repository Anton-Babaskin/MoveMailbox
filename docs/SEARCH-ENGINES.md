# Подключение поисковых кабинетов

Основной адрес: https://movemailbox.com/.
Карта сайта: https://movemailbox.com/sitemap.xml.
DNS и HTTPS проверены 12 сентября 2026 года. Можно подтверждать домен сейчас.

## Google Search Console

1. В [Search Console](https://search.google.com/search-console/) выберите
   «Добавить ресурс» → «Доменный ресурс», введите `movemailbox.com` без протокола.
2. Скопируйте выданную TXT-запись `google-site-verification=…`.
3. В Namecheap: Domain List → Manage → Advanced DNS → Add New Record.
   Тип TXT Record, Host `@`, Value — полная выданная строка, TTL Automatic.
   Сохраните существующие DNS-записи, включая другие TXT, A, CNAME и почтовые.
4. Нажмите «Подтвердить» в Google. Если запись ещё не обнаружена, повторите после
   обновления DNS. Подтверждающую TXT-запись оставьте и после успеха.
5. В разделе «Файлы Sitemap» отправьте полный адрес карты сайта выше.
   Через «Проверка URL» проверьте главную и запросите индексирование.

Доменный ресурс охватывает протоколы и поддомены. Будущие пути `/en/` и `/uk/`
не требуют отдельного подтверждения; добавлять их в sitemap нужно вместе с
готовыми переводами и взаимными hreflang-ссылками.

[Подтверждение собственности Google](https://support.google.com/webmasters/answer/9008080?hl=ru),
[проверка URL](https://support.google.com/webmasters/answer/9012289?hl=ru).

## Яндекс Вебмастер

1. В [Вебмастере](https://webmaster.yandex.ru/) добавьте `https://movemailbox.com`.
2. Выберите подтверждение через DNS. Создайте отдельную TXT-запись в Namecheap
   с выданным значением, сохранив Google TXT-запись и остальные записи.
3. Подтвердите права. В «Индексирование → Файлы Sitemap» отправьте тот же адрес
   `https://movemailbox.com/sitemap.xml`.

[Подтверждение прав Яндекс](https://yandex.ru/support/webmaster/ru/service/rights),
[отправка Sitemap](https://yandex.ru/support/webmaster/ru/indexing-options/sitemap).

Подтверждение и отправка sitemap не означают мгновенное индексирование и не
гарантируют позиции. Следите за обработкой sitemap и отчётами об индексировании.
В репозиторий не нужно помещать пароль от кабинета или токены доступа аккаунта.
