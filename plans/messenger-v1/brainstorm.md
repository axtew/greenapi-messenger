# Brainstorm — messenger-v1

Обсуждение подхода перед планированием: варианты, отклонённое, принятые решения и проверенные факты о GREEN-API.
Согласовано 2026-10-03. Ключевые решения оформлены как ADR в [`docs/decisions/`](../../docs/decisions/README.md).

## Approach

**Direction:** SPA на Vite + React 19 + TS без бэкенда: браузер ходит в GREEN-API напрямую (CORS открыт), деплой — Cloudflare Workers Static Assets.
Серверные данные живут в TanStack Query: история чата — query через `getChatHistory`, отправка — mutation `sendMessage` с optimistic append,
профиль собеседника (имя + аватар) — query через `getContactInfo` с кэшем. Получение — отдельный TS-модуль poller'а
(long-poll `receiveNotification` → обработка → `deleteNotification`, AbortController, backoff, лидер через Web Locks, идемпотентный старт под StrictMode),
который разбирает уведомления zod-схемой и пишет в кэш через `setQueryData`; неизвестный chatId → новый чат.
Список чатов — localStorage по `idInstance`, сортировка по последнему сообщению, локальный счётчик непрочитанных (хранится с чатом).
Логин: `idInstance` + `apiTokenInstance` (localStorage, «Выйти»), проверки `getStateInstance` и `getSettings`. Новый чат — номер → `checkAccount` → числовой chatId.
Роутинг — TanStack Router code-based. Из других проектов автора переиспользуются хук форм `useForm` (+ `useLatest`), i18n-контекст со словарём,
конфиги eslint / prettier / wrangler.

**Rejected:**
- свой store на `useSyncExternalStore` — loading / error / retry пришлось бы писать руками;
- Zustand — новая зависимость без выигрыша;
- самописный HTTP-сервис автора из другого проекта — рассчитан на обновление токена и повторы, которых здесь нет, а поллингу понадобилось бы отдельное хранилище;
- поле ввода хоста API — ТЗ просит только `idInstance` и `apiTokenInstance`;
- кнопка «настроить инстанс» через `setSettings` — ломает чужую вебхук-интеграцию;
- `getChats` как источник списка чатов — приходят каналы, группы и служебные чаты, а писать на тарифе «Разработчик» можно только в 3 чата;
- `номер@c.us` как chatId — не совпадает с chatId входящих и тратит отдельный слот квоты.

**Risks / edge-cases to handle:**
- Хост — константа `https://api.green-api.com` (проверено на реальном инстансе); поля ввода хоста нет.
- Логин: инстанс не `authorized` → ошибка; `webhookUrl` не пуст или `incomingWebhook` выключен → предупреждение без блокировки, с названием настройки.
- Очередь: удалять **все** уведомления, включая нетекстовые и служебные; пустой ответ по таймауту; ошибки сети и 429 → backoff.
- Дедуп по `idMessage`: история ↔ очередь ↔ optimistic ↔ эхо `outgoingAPIMessageReceived`.
- Текст: `textMessage` (ссылки приходят им же; `extendedTextMessage` из документации — принимать тоже); `outgoingMessageReceived` (отправлено с телефона) — показывать как исходящее.
- `checkAccount`: `exist:false` (нет аккаунта или номер скрыт настройками приватности), 469 → понятные тексты; chatId по номеру кэшируется.
- Лимит 3 чата **не моделируется** — только понятная ошибка на 466 / `quotaExceeded`.
- Аватар: `getContactInfo` один раз на чат, кэш; нет аватара или ошибка загрузки → инициалы.
- Непрочитанные: счётчик входящих в неактивный чат, сброс при открытии; хранится с чатом в localStorage.
- StrictMode — один poller; две вкладки — Web Locks; выход из аккаунта — abort цикла.
- Токен в localStorage — отметить в README.

## Принятые решения

**Продукт**
1. Мессенджер — **Telegram** (ТЗ разрешает; аккаунта MAX нет).
2. Входящее из неизвестного чата → чат создаётся автоматически.
3. История через `getChatHistory` — базовый функционал, грузится при открытии чата.
4. Новый чат — только по номеру телефона; `exist:false` → понятный текст про приватность. Поиск по `@username` — в бэклоге (обсуждено: дёшево, но сверх ТЗ).
5. Аватары и имена собеседников — в MVP (`getContactInfo` — 100 вызовов в месяц на тарифе «Разработчик», поэтому кэш в localStorage и вызов только для новых чатов; инициалы как фолбэк).
6. Счётчик непрочитанных — в MVP (локальный, см. 6d). Сортировка чатов по последнему сообщению — в MVP.
6a. **Неудачная отправка — в MVP:** `outgoingMessageStatus` со `status: "failed"` помечает сообщение «не доставлено» с причиной из `description`.
    Остальные статусы (отправлено / доставлено / прочитано) — в бэклоге.
7. Адаптив — две колонки на широком экране, один экран с «назад» на узком. Тема — только светлая.
8. Всё, что сверх сценария ТЗ, — в `BACKLOG.md` с приоритетами (Next / Later / Отклонённое).

6b. Нетекстовые сообщения (стикеры, фото, отправленные с телефона) — плашка «Сообщение этого типа не поддерживается» на месте пузыря.
6c. История — последние 100 сообщений чата; удалённые (`isDeleted`) не показываются, отредактированные — с актуальным текстом без пометки.
6d. Счётчик непрочитанных хранится вместе с чатом в localStorage. Метода прочитанности в API нет (проверено: `getChats`, `lastIncomingMessages`,
    `getChatHistory` не отдают флага), поэтому счёт локальный; сообщение, прочитанное в самом Telegram, у нас остаётся непрочитанным.
6e. Список чатов — localStorage браузера + синхронизация с сервером при входе (по образцу чатов в консоли GREEN-API): `getChats` → личные чаты
    (`chatId` > 0), первые 10 → `getContactInfo` только для новых → `getChatHistory` с `count: 1` для снимка последнего сообщения. Периодического
    опроса `getChats` нет — новые собеседники приходят уведомлениями. Допущение: `getChats` отсортирован по активности (проверить на нескольких чатах).
6f. Токен перестал действовать посреди сессии (401) — выход на экран входа с сообщением. Чат из адреса, которого нет в списке, — перенаправление на главную.

**Архитектура**
9. Ядро — TanStack Query + poller вне React ([ADR 0003](../../docs/decisions/0003-tanstack-query-and-poller.md)).
10. Хранение: учётные данные и список чатов — localStorage; сообщения — только кэш запросов (персистентный кэш — в бэклоге).
11. Несколько вкладок — Web Locks, поллит одна вкладка ([ADR 0005](../../docs/decisions/0005-single-queue-consumer.md)); синхронизация вкладок — в бэклоге.
12. Проверка настроек инстанса на логине — `getStateInstance` + `getSettings` (`webhookUrl`, `incomingWebhook`).
13. Роутинг — TanStack Router code-based: `/login`, `/`, `/chat/$chatId`, guard в `beforeLoad`.
14. i18n — инфраструктура словарей, только `ru.json`.
15. Хук форм `useForm` переносится как есть; в коде — один JSDoc-абзац о том, что это общий хук автора с известными ограничениями (FIXME),
    история происхождения — в README.

**Процесс**
16. Проверки: на каждой фазе — браузерная проверка агентом через Playwright MCP на живом инстансе (креды в `.env.local`);
    получение ответа проверяет владелец руками. Отдельная фаза — `@playwright/test`-спеки со стабом GREEN-API (`page.route`), воспроизводимые без кредов.
    Unit-тесты на vitest — для чистой логики.
17. Коммиты делает владелец после собственного ревью каждой фазы; агенты в git не пишут.
18. Хостинг — Cloudflare Workers Static Assets ([ADR 0006](../../docs/decisions/0006-cloudflare-workers-hosting.md)).

## Интерфейс (по референсам веб-версии Telegram, 2026-10-04)

Референсы — [`docs/design/`](../../docs/design/). Делаем две раскладки: десктоп (две колонки) и мобильную (один экран); планшетную — нет.

**В MVP:**
- Левая панель: кнопка-гамбургер с меню из двух пунктов — подключённый аккаунт (`getAccountSettings`: username или телефон) и «Выйти»; список чатов.
- Элемент списка: аватар, имя, последнее сообщение в одну строку, время (сегодня — `13:31`, эта неделя — день недели, раньше — дата),
  бейдж непрочитанных; выбранный чат подсвечен.
- Круглая кнопка-карандаш внизу списка — новый чат: левая панель сменяется видом «Новый чат» со стрелкой «назад» и полем номера (реф. `07-new-chat-panel`).
- Шапка чата: аватар, имя, подзаголовок — `@username`, а если его нет, номер.
- Переписка: пузыри входящих и исходящих с хвостиком и временем внутри, разделители дат («Сегодня», «Вчера», «4 октября»),
  кликабельные ссылки (`http` / `https`, без `innerHTML`), пометка «не доставлено» у сообщений со статусом `failed`.
- Поле ввода: многострочное, Enter — отправить, Shift+Enter — перенос, круглая кнопка отправки, неактивная при пустом поле.
- Пустые состояния: чат не выбран — плашка «Выберите чат» на фоне; список пуст — «Чатов пока нет» с подсказкой про карандаш.
- Фон переписки — зелёный градиент в тонах Telegram, без узора (узор — ассет Telegram).
- Шрифт — Roboto (лицензия SIL OFL), подключается пакетом `@fontsource/roboto` (без запросов к Google).
- Экран входа — карточка по центру в той же стилистике.

**Не делаем / в бэклог:** поиск (бэклог), меню Telegram и меню собеседника, звонки, голосовые (не нужны), эмодзи и файлы (бэклог),
плашка «Unread Messages» в переписке (бэклог Next), статус «в сети» (бэклог).

## Проверенные факты — GREEN-API для Telegram (2026-10-03)

- Документация: https://green-api.com/telegram/docs/api/. Каждый запрос: `{apiUrl}/waInstance{idInstance}/{method}/{apiTokenInstance}`.
- **CORS открыт** и на хосте инстанса (`4100.api.green-api.com`), и на общем `api.green-api.com`: `Access-Control-Allow-Origin: *`,
  методы `GET, POST, OPTIONS, DELETE` (проверено curl). Прокси не нужен.
- `apiUrl` — у каждого инстанса свой, показан в консоли; в примерах документации `https://4100.api.green-api.com`, id инстансов `41…`.
- Авторизация инстанса — QR (Telegram → Настройки → Устройства) или код; до 2–5 минут в состоянии `starting`.
- **chatId — числовая строка** (`"10000000"`, группа — с минусом); `phone@c.us` принимается только для совместимости.
- Тариф «Разработчик»: 3 чата; разные форматы id одного контакта считаются разными чатами; `checkAccount` — 100 вызовов в месяц; превышение — 466 / `quotaExceeded`.
- **`checkAccount`** `POST {phoneNumber}` или `{username}` → `{exist, chatId, username, phoneNumber}`.
  `exist:false` — нет аккаунта **или** номер скрыт настройками приватности. 469 / `rate_limit_exceeded` → пауза ~2 ч.
- **`sendMessage`** `POST {chatId, message}` (≤ 4096 символов) → `{idMessage}`.
- **`receiveNotification`** `GET ?receiveTimeout=5..60` → `{receiptId, body}` или пусто; пока не вызван `deleteNotification`, отдаётся то же уведомление.
  Одна FIFO-очередь на 24 ч. Требует `webhookUrl: ""` и включённых `incomingWebhook` / `outgoingWebhook` / `outgoingMessageWebhook` / `outgoingAPIMessageWebhook`.
- `incomingMessageReceived`: `senderData {chatId, chatType, sender, chatName, senderName, senderContactName, senderPhoneNumber}`,
  `messageData.typeMessage: "textMessage"` → `textMessageData.textMessage`. `outgoingMessageReceived` — тот же формат.
- `getContactInfo` `POST {chatId}` → `{avatar, name, contactName, chatId, chatType, lastSeen, phoneNumber, username, …}`.
- Прочее: `getStateInstance`, `getSettings` (`typeInstance`, `webhookUrl`, флаги вебхуков), `getAccountSettings`, `getChatHistory` (`{chatId, count}`), `getChats`, `getContacts`, `lastIncomingMessages`.

## Проверено на реальном инстансе (2026-10-03)

- **Общий хост `api.green-api.com` обслуживает Telegram-инстанс** (`4100…`) так же, как его собственный `4100.api.green-api.com` →
  хост — константа в коде, вывод из `idInstance` не нужен.
- **У нового инстанса все уведомления выключены** (`incomingWebhook`, `outgoingWebhook`, `outgoingMessageWebhook`, `outgoingAPIMessageWebhook`,
  `stateWebhook` = `"no"`), `webhookUrl` пуст. Проверка настроек на логине — не перестраховка: свежий инстанс без неё молча ничего не получает.
- `getSettings` отвечает и для неавторизованного инстанса.
- Пустая очередь по таймауту — тело `null`, статус 200.
- `checkAccount` → `{"exist":true,"chatId":"334346886","username":"@…","phoneNumber":7988…,"fromCache":false}`.
- `getContactInfo` → `avatar` вида `https://4100.api.green-api.com/download/avatar/<id>.jpg`: отдаёт редирект на подписанную ссылку S3,
  живущую 24 ч; сама ссылка GREEN-API стабильна — её и кэшируем, `<img>` проходит редирект сам.
- **`sendMessage` возвращает `idMessage` даже когда доставка невозможна.** Неудача приходит позже уведомлением
  `outgoingMessageStatus` с `status: "failed"` и `description` (у свежего Telegram-аккаунта — `"peer flood"`: антиспам Telegram
  запрещает новым аккаунтам начинать диалог с не-контактами). Форма: `{typeWebhook, chatId, instanceData, timestamp, idMessage, status, description, sendByApi}`.
  Неудачное сообщение не попадает ни в `getChatHistory`, ни в `lastOutgoingMessages`, `getMessage` → 400 «Message not found».
- Уведомления по событиям, случившимся до применения настроек вебхуков, приходят после применения (с задержкой до нескольких минут).
- `receiptId` — маленькие последовательные числа (1, 2, 3…); `deleteNotification` → `{"result":true,"reason":""}`.
- **Формы уведомлений** (`instanceData` = `{idInstance, wid, typeInstance}` у всех):
  - `incomingMessageReceived` / `outgoingMessageReceived` (с телефона) / `outgoingAPIMessageReceived` (эхо нашего `sendMessage`) — одинаковые:
    `{typeWebhook, instanceData, timestamp, idMessage, senderData: {chatId, chatType, sender, chatName, senderName, senderType, senderContactName, senderPhoneNumber},
    messageData: {typeMessage: "textMessage", textMessageData: {textMessage, forwardingScore, isForwarded}}}`.
    Для исходящих `senderData` описывает **собеседника** (chatId чата), не отправителя.
  - `outgoingMessageStatus` — `{typeWebhook, chatId, instanceData, timestamp, idMessage, status, sendByApi, description?}`;
    виденные `status`: `delivered`, `read`, `failed` (статуса `sent` не пришло ни разу). Приходит и для сообщений, отправленных с телефона (`sendByApi: false`).
  - Эхо `outgoingAPIMessageReceived` несёт тот же `idMessage`, что вернул `sendMessage` → дедуп по нему работает.
- **`getChatHistory`** — массив от новых к старым: `{type: "incoming" | "outgoing", idMessage, timestamp, typeMessage, chatId, chatType, textMessage,
  isForwarded, forwardingScore, isEdited, isDeleted, editedMessageId, deletedMessageId, …}`; у исходящих — `statusMessage` и `sendByApi`,
  у входящих — `senderId`, `senderName`, `senderType`, `senderContactName`. Сообщения, отправленные с телефона, в истории есть.
- **Текст со ссылкой в Telegram приходит обычным `textMessage`** (проверено: `"Отвечаю текстом со ссылкой: https://green-api.com"`).
  `extendedTextMessage` в документации есть — схема разбора принимает его тоже (текст в `extendedTextMessageData.text`), но на практике не встретился.
- **`getChats` расходится с документацией** ([GetChats](https://green-api.com/telegram/docs/api/service/GetChats/)): на чат, начатый через API,
  пришло `[{"chatId":"334346886","name":"","phoneNumber":7988…,"username":""}]` — нет поля `type`, пустые `name` и `username`,
  хотя `getContactInfo` и `checkAccount` для того же чата отдают имя и `@username`. Проверено на одном инстансе (тариф «Разработчик») и одном чате.
  `getContacts` → `[]` (в контактах тестового аккаунта никого нет — ожидаемо). В MVP `getChats` не используется.
- **Правки и удаления в `getChatHistory`:** отредактированное сообщение — новая запись с новым `idMessage`, временем правки и `editedMessageId` = id оригинала;
  оригинал из истории пропадает. Удалённое — новая запись с `isDeleted: true`, `deletedMessageId` и **старым текстом**. При слиянии кэша оригинал,
  на который ссылается `editedMessageId` / `deletedMessageId`, удаляется. Правленое сообщение встаёт на время правки (исходное время недоступно).
- **`getContactInfo` на тарифе «Разработчик» — 100 вызовов в месяц** (таблица тарифов), как `checkAccount`.
