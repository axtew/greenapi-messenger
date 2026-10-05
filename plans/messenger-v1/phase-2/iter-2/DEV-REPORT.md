Status: COMPLETED

## Phase goal
Phase 2 — слой GREEN-API: клиент, сессия, сервисы. Iteration 2 — повторный прогон после поправки плана «Phase 2 — added 2026-10-05» плюс находки статического ревью iter-1 (одна [code] и одобренные владельцем необязательные замечания).

## What was implemented
- `checkAccount` распознаёт тело `{status: false, …}` в ответе 200. Схема — `z.union` с третьей веткой `{status: false, data?: {reason?}}`. Сервис бросает `GreenApiError`: при `data.reason === "rate_limit_exceeded"` — `kind: "rateLimited"`, при любом другом `status: false` — `kind: "invalidResponse"`; в обоих случаях `status: 200`, `method: "checkAccount"`. HTTP 469 по-прежнему отдаёт клиент как `http`/469, клиент в этой части не менялся.
- `GreenApiError.kind` получил вариант `"rateLimited"`, для него в `message` пишется «превышен лимит запросов». `message` по-прежнему содержит только метод и причину, токена в нём нет.
- Комментарий к `checkAccountSchema` переписан. Теперь он описывает только то, что верно: при `exist: false` `chatId` пустой, остальные поля не используются; плюс что означает `status: false`.
- 4a: `invalidResponse` прикладывает `cause` только когда это `ZodError`. `SyntaxError` из `JSON.parse` не прикладывается, комментарий объясняет почему.
- 4b: `extendedTextMessage.text` стал optional, так что неожиданная форма этого поля не роняет разбор всей истории.
- 4c: параметр `options` конструктора `GreenApiError` теперь имеет тип `ErrorOptions`.
- 4d: `clearSession` больше не экспортируется. Тест «clearSession удаляет сессию» удалён: то же покрывает тест `signOut`. Там, где тестам нужна пустая сессия, используется `localStorage.removeItem(SESSION_KEY)`.
- Ключ словаря `newChat.searchRestrictedError` добавлен в `ru.json` и интерфейс `I18n`. Другие словари не нужны: `public/dictionaries/` содержит только `ru.json`.
- По поправке Phase 5 `IChat` / `IChatLastMessage` не объявлялись.

## Files created
Список накопительный, все файлы созданы в iter-1; в iter-2 новых файлов нет.
- `src/api/greenApi/_client.ts` — `greenApiRequest` и `GreenApiError` (в iter-2 изменён: `rateLimited`, `ErrorOptions`, `cause` только `ZodError`).
- `src/api/greenApi/index.ts` — barrel клиента.
- `src/api/session.ts` — `getSession` / `saveSession` / `signOut` (в iter-2 `clearSession` стал внутренним).
- `src/api/schemas/account.schema.ts` — схемы `getStateInstance` / `getSettings` / `getAccountSettings`.
- `src/api/schemas/chats.schema.ts` — схемы `checkAccount` / `getContactInfo` / `getChats` (в iter-2 изменены ветка `status: false` и комментарий).
- `src/api/schemas/messages.schema.ts` — схемы `getChatHistory` / `sendMessage` (в iter-2 `extendedTextMessage.text` optional).
- `src/api/services/account.service.ts` — `checkInstanceAuthorized`, `getInstanceSettings`, `getAccount`.
- `src/api/services/chats.service.ts` — `checkAccount`, `getContact`, `getChatIds` (в iter-2 разбор `status: false` → `GreenApiError`).
- `src/api/services/messages.service.ts` — `getChatHistory`, `sendMessage`.
- `src/api/services/_helpers.ts` — нормализаторы `toNullable` / `toUsername` / `toPhone`.
- `src/types/account.types.ts`, `src/types/chats.types.ts`, `src/types/messages.types.ts` — доменные типы.
- `src/api/__tests__/api.test.ts` — unit-тесты слоя (в iter-2: 32 теста; новые ветки `checkAccount`, `cause`, `clearSession` больше не импортируется).

## Files modified
- `public/dictionaries/ru.json` — `newChat.searchRestrictedError`.
- `src/types/i18n.types.ts` — `newChat.searchRestrictedError: string`.

## Verification
Команды запускались в том виде, как в задаче, без замен:
- `pnpm format` (`prettier --write src`) — без ошибок.
- `pnpm lint` — exit 0, ошибок и предупреждений нет (в baseline тоже ничего не было).
- `pnpm build` (`tsc -b && vite build`) — прошёл.
- `pnpm test` — 32/32 (в iter-1 было 29: −1 `clearSession`, +1 `cause`=`ZodError`, +3 ветки `checkAccount`; ещё одна проверка без `cause` добавлена в существующий тест не-JSON).
- Новые ветки, которые покрывают тесты:
  - `rate_limit_exceeded` → `rateLimited`/200;
  - `instance is starting or not authorized` → `invalidResponse`/200;
  - HTTP 469 → `http`/469;
  - не-JSON → `cause` нет;
  - ответ не той формы → `cause` равен `ZodError`;
  - `rateLimited` добавлен в тест «токен не попадает в message».
- Exports: новых экспортов нет. `clearSession` стал внутренним, по `src` у него нет внешних импортёров.
- Stop condition выполнен.
- Живые вызовы `checkAccount` / `getContactInfo` не делались, квоты не тратились. Runtime/browser-проверку разработчик не проводил.

## Known issues
- `status: false` с причиной `instance is starting or not authorized` уходит в `invalidResponse`, поэтому Phase 6 покажет `newChat.genericError`. Так и предписывает поправка; отдельного текста для «инстанс не готов» в словаре нет.
- `retryAfter` из ответа `rate_limit_exceeded` не разбирается и не передаётся наружу: текст `newChat.rateLimitError` фиксированный («через пару часов»).
- Planner-drift нет.
