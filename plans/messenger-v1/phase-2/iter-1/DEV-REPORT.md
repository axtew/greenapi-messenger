Status: COMPLETED

## Phase goal

Phase 2 — Слой GREEN-API: клиент, сессия, сервисы. Все запросы к GREEN-API, нужные до Phase 9, доступны как типизированные функции сервисов
с проверкой ответа zod и покрыты unit-тестами на стабе `fetch`.

## What was implemented

- Клиент `greenApiRequest` (хост-константа `https://api.green-api.com`, URL `waInstance{id}/{method}/{token}{pathSuffix}{query}`, креды по умолчанию из
  сессии, без сессии — `GreenApiError` http/401 без запроса; POST — JSON с `Content-Type`; не 200 → `http`; сбой `fetch` → `network`/`null`;
  `AbortError` при прерванном `signal` пробрасывается как есть; не-JSON или ошибка zod → `invalidResponse`).
  `GreenApiError` — `kind` / `status` / `method`; `message` = `GREEN-API <method>: <причина>`, URL и токена в нём нет; у `network` исходная ошибка
  намеренно не прикладывается как `cause` (её текст может содержать адрес с токеном), у `invalidResponse` — прикладывается (ZodError/SyntaxError).
- Сессия: `getSession` (zod-проверка формы, битый JSON / чужая форма → `null`), `saveSession`, `clearSession` — все в `try/catch`;
  `signOut(reason?: "expired")` → `clearSession()` + `window.location.assign("/login[?reason=expired]")`.
- zod-схемы по доменам и сервисы по таблице фазы: `checkInstanceAuthorized(credentials)`, `getInstanceSettings()`, `getAccount()`,
  `checkAccount(phone)`, `getContact(chatId)`, `getChatIds()`, `getChatHistory(chatId, count)`, `sendMessage(chatId, text)`.
- Нормализация на границе (общие хелперы сервисов в `src/api/services/_helpers.ts`): `""` / отсутствие → `null`; телефон — строка цифр,
  `0` → `null`; **`username` хранится без ведущего `@`** (API отдаёт `"@vasilisa"`), в цепочке имени `getContact` он выводится как `@vasilisa`.
- История: записи от новых к старым → разворот + стабильная сортировка по `timestamp` (порядок поступления при равном времени сохраняется);
  `text` — `textMessage` для `textMessage`, `textMessage ?? extendedTextMessage.text` для `extendedTextMessage`, иначе `null`;
  `statusMessage === "failed"` → `FAILED`, иначе `SENT`; `replacesId = editedMessageId || deletedMessageId || null`; `chatId` записи — аргумент запроса.
- Тесты `src/api/__tests__/api.test.ts` — 29 кейсов: сессия (сохранение, битый JSON, чужая форма, clear, `signOut` с причиной и без);
  URL с `query` + `pathSuffix`; явные `credentials` важнее сессии; без сессии — 401 без `fetch`; 401 → http/401; сетевой сбой → network/`null`,
  без `cause`; `AbortError` пробрасывается; ответ не той формы и не-JSON → `invalidResponse`; токен не встречается в `message` ни одной ошибки
  (включая сетевую ошибку, текст которой содержит токен); маппинг всех сервисов (`checkAccount` — номер числом, метод/заголовок/тело;
  `exist:false`; `getChatIds` отбрасывает отрицательные id и держит порядок; цепочка имени `getContact` в 5 вариантах, `phone: 0 → null`;
  история — текст / `extendedTextMessage` / нетекстовое → `null`, `failed`, `replacesId` правки и удаления, `isDeleted`, порядок; `sendMessage`).
  Окружение — node: `fetch`, `localStorage` (in-memory `Storage`) и `window.location.assign` подменены `vi.stubGlobal`.

Сверка форм ответов — `brainstorm.md` + документация Telegram API GREEN-API (страницы GetAccountSettings, GetStateInstance, GetSettings,
GetContactInfo, CheckAccount, GetChats, GetChatHistory, SendMessage скачаны в scratchpad, в репозиторий не попали). Живых запросов к инстансу
не делалось — квоты не тратились.

## Files created

- `src/api/greenApi/_client.ts` — `greenApiRequest`, `GreenApiError`.
- `src/api/greenApi/index.ts` — barrel: `GreenApiError`, `greenApiRequest`.
- `src/api/session.ts` — `getSession` / `saveSession` / `clearSession` / `signOut`.
- `src/api/schemas/account.schema.ts` — `getStateInstance`, `getSettings`, `getAccountSettings`.
- `src/api/schemas/chats.schema.ts` — `checkAccount` (discriminated union по `exist`), `getContactInfo`, `getChats` (только `chatId`).
- `src/api/schemas/messages.schema.ts` — `getChatHistory`, `sendMessage`.
- `src/api/services/account.service.ts`, `chats.service.ts`, `messages.service.ts` — сервисы по таблице фазы.
- `src/api/services/_helpers.ts` — `toNullable`, `toUsername`, `toPhone` (два потребителя в папке — `account` и `chats`; файла нет в плане, см. Known issues).
- `src/types/account.types.ts` — `ISession`, `IAccount`, `IInstanceSettings`.
- `src/types/chats.types.ts` — `IContact`, `TCheckAccountResult`.
- `src/types/messages.types.ts` — `EMessageDirection`, `EMessageStatus`, `IMessage`.
- `src/api/__tests__/api.test.ts` — unit-тесты фазы.

## Files modified

- none (Phase 1 файлы не тронуты; `pnpm format` по `src` изменений в них не дал).

## Verification

- `pnpm test` — 1 файл, 29 тестов, все зелёные.
- `pnpm format` (prettier по `src`) → `pnpm lint` — exit 0, ошибок/предупреждений нет (baseline тоже чистый).
- `pnpm build` (`tsc -b && vite build`) — exit 0; тест-файл входит в `tsc` (tsconfig.app `include: src`) и типизируется.
- Exports: у каждого нового экспорта есть импортёр вне своего модуля — сервисы, `session.*`, `GreenApiError` — тест (как и требует фаза);
  схемы и `_helpers` — сервисы; `greenApiRequest` — сервисы + тест; типы — сервисы / клиент / сессия. `GREEN_API_HOST` не экспортирован (тест сверяет литеральный URL).
- Токен: в `src/` вне тестов `apiTokenInstance` встречается только при сборке URL, в схеме сессии и в типе; в `message` ошибок не попадает (тест).
- Phase stop condition: satisfied (`pnpm test`, `pnpm lint`, `pnpm build` зелёные); файлы следующих фаз не созданы.
- Runtime/browser: не выполнялось — фаза без UI, Visual Verification N/A.

## Known issues

- **Кандидат в plan gap для Phase 6 — `checkAccount` и лимит частоты.** По документации CheckAccount лимит `rate_limit_exceeded` приходит
  **со статусом 200** и телом `{"status": false, "data": {"status": "fail", "reason": "rate_limit_exceeded", "retryAfter": …}}`; так же 200 —
  `{"status": false, "reason": "instance is starting or not authorized"}`. План (Phase 6) сопоставляет с `newChat.rateLimitError` только HTTP 469,
  а brainstorm называет оба сигнала («469 / rate_limit_exceeded → пауза ~2 ч»). Сейчас такие ответы не проходят схему и дают
  `GreenApiError` `invalidResponse` → в Phase 6 это станет `newChat.genericError`, а не «слишком много проверок». В рамках Phase 2 не обходил:
  форма `TCheckAccountResult` и виды `GreenApiError` заданы планом. Решение — до Phase 6 (например, отдельный исход в `TCheckAccountResult` или
  отображение этого тела в `GreenApiError` со статусом 469).
- **`IChat` / `IChatLastMessage` не объявлены** — у них в Phase 2 нет потребителя (дисциплина экспорта `structure.md`, ср. находку ревьюера Phase 1
  про Typography). Добавляются в `src/types/chats.types.ts` в Phase 5 вместе с кэшем списка чатов. Planner-drift: план кладёт их в контракт Phase 2.
- **`username` без `@`** — план не фиксирует формат; выбрано каноническое имя без `@` (оно задокументировано в JSDoc `IAccount` / `IContact`).
  Следующим фазам выводить его как `@${username}`.
- **`src/api/services/_helpers.ts`** — файла нет в списке плана: три нормализатора нужны двум сервисам (лестница `structure.md`, ступень 2).
- `GreenApiError.kind` — литеральный union, как в тексте плана (а не строковый enum из «Types and interfaces» → «ограниченные наборы — enum»);
  отдельный тип не заводился, чтобы в `_client.ts` осталось одно объявление типа. `signOut(reason?: "expired")` — тоже литерал, как в плане.
- `httpMethod` клиента — `"GET" | "POST"`: `DELETE` (`deleteNotification`) добавит Phase 9 вместе с потребителем. `query`, `pathSuffix`, `signal`
  реализованы, как в сигнатуре плана, и покрыты тестом, хотя сервисов-потребителей у них до Phase 9 нет.
- `getAccountSettings` на живом инстансе не проверялся (в brainstorm формы нет) — схема по документации, все поля необязательные
  (пусты/отсутствуют у неавторизованного инстанса).
