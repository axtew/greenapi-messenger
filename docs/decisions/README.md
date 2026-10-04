# Решения (ADR)

Архитектурные решения в формате [MADR](https://adr.github.io/madr/). Подробное обсуждение вариантов —
`plans/messenger-v1/brainstorm.md`. Новое решение — следующий номер, `NNNN-short-title.md` (имя файла — по-английски); принятое не переписывается,
а заменяется новым ADR со ссылкой на старый.

| № | Решение | Статус |
|---|---|---|
| [0001](0001-telegram-instead-of-max.md) | Telegram вместо MAX | принято |
| [0002](0002-no-backend.md) | Без бэкенда: браузер ходит в GREEN-API напрямую | принято |
| [0003](0003-tanstack-query-and-poller.md) | TanStack Query как хранилище + poller вне React | принято |
| [0004](0004-chat-id-from-check-account.md) | chatId только из `checkAccount` / уведомлений | принято |
| [0005](0005-single-queue-consumer.md) | Один потребитель очереди: Web Locks | принято |
| [0006](0006-cloudflare-workers-hosting.md) | Хостинг — Cloudflare Workers Static Assets | принято |
| [0007](0007-russian-language.md) | Язык репозитория — русский | принято |
