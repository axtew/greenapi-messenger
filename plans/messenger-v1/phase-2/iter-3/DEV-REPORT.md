Status: COMPLETED

## Phase goal
Phase 2 — слой GREEN-API: клиент, сессия, сервисы. Iteration 3 — повторный прогон после поправки плана «Phases 2, 3, 6, 7, 9 — added 2026-10-05», пункт **Phase 2**: строковые литеральные union и сравнения с голыми строковыми литералами заменить строковыми `enum`. Пункты для Phase 3/6/7/9 не реализовывались.

## What was implemented
- `GreenApiError.kind` → `EGreenApiErrorKind` (`HTTP = "http"`, `NETWORK = "network"`, `INVALID_RESPONSE = "invalidResponse"`, `RATE_LIMITED = "rateLimited"`). Значения прежние. Сравнения в конструкторе и все `new GreenApiError(...)` в клиенте и `chats.service.ts` используют члены enum.
- `httpMethod` клиента → `EHttpMethod` (`GET`, `POST`). Все вызовы в сервисах переведены на члены enum.
- `signOut(reason?)` → `ESignOutReason` (`EXPIRED = "expired"`). Значение подставляется в `?reason=${reason}`, а не захардкоженной строкой `?reason=expired`. Без причины по-прежнему уходит на `/login`.
- Значения полей GREEN-API, с которыми сравнивает код, стали строковыми enum (содержат только используемые значения):
  - `EStateInstance.AUTHORIZED`: `checkInstanceAuthorized`;
  - `EIncomingWebhook.YES`: `getInstanceSettings`;
  - `ECheckAccountFailReason.RATE_LIMIT_EXCEEDED`: отказ `checkAccount`;
  - `EChatHistoryEntryType` (`INCOMING`, `OUTGOING`): поле `type` записи истории;
  - `ETypeMessage` (`TEXT_MESSAGE`, `EXTENDED_TEXT_MESSAGE`): `switch` в `getHistoryText`;
  - `EStatusMessage.FAILED`: статус исходящего в истории.
- zod-схемы: сужено только поле `type` записи истории (`z.enum(["incoming", "outgoing"])` → `z.enum(EChatHistoryEntryType)`), потому что схема его уже ограничивала. `stateInstance`, `incomingWebhook`, `data.reason`, `typeMessage`, `statusMessage` остаются `z.string()`, а код сравнивает их с членами enum. Неизвестные значения разбор не ломают: это по-прежнему покрывают тесты `notAuthorized`, `stickerMessage` и `statusMessage: "read"`.
- Тесты: проверки `kind` идут через члены `EGreenApiErrorKind`, `signOut` вызывается с `ESignOutReason.EXPIRED`, `httpMethod` задаётся через `EHttpMethod.GET`. Проверки того, что уходит в запрос и URL (`init.method === "GET"`/`"POST"`, `/login?reason=expired`, тела ответов-стабов), сознательно оставлены строками: они проверяют сырые данные на границе, а не код. Тестов по-прежнему 32.

### Где объявлены enum и почему
- `EGreenApiErrorKind`, `EHttpMethod` лежат в новом `src/api/greenApi/_types.ts`. После добавления двух enum в `_client.ts` было бы 3 объявления типов (с `IGreenApiRequestOptions`), а это порог выхода из файла (≥ 2) по `structure.md`. Поэтому в `_types.ts` переехали все типы клиента, включая `IGreenApiRequestOptions`. Через barrel `index.ts` экспортируются оба enum: их импортируют сервисы (`EHttpMethod` — все три, `EGreenApiErrorKind` — `chats.service.ts`) и тесты. `IGreenApiRequestOptions` не попал в barrel, его импортирует только `./_client`.
- `ESignOutReason` объявлен в `src/api/session.ts` — единственное объявление типа в файле, порог не превышен.
- Enum значений полей GREEN-API объявлены в файле схемы своего домена (`account.schema.ts`, `chats.schema.ts`, `messages.schema.ts`), рядом с описанием формы ответа. Это решено по ситуации, вот обоснование. `EChatHistoryEntryType` нужен и схеме, и сервису, поэтому файл схемы — нижний уровень, который покрывает обоих. Остальные enum ради единообразия положены туда же. Альтернатива — объявлять их в сервисах. Тогда в `account.service.ts` и `messages.service.ts` было бы по 2 объявления, а это порог выхода в общий `src/api/services/_types.ts`, где смешались бы домены. У каждого такого enum есть импортёр вне файла — его сервис.

## Files created
Список накопительный.
- `src/api/greenApi/_client.ts` — `greenApiRequest` и `GreenApiError`. В iter-3: `kind` типа `EGreenApiErrorKind`, `IGreenApiRequestOptions` переехал в `_types.ts`.
- `src/api/greenApi/_types.ts` (новый в iter-3) — `EGreenApiErrorKind`, `EHttpMethod`, `IGreenApiRequestOptions`.
- `src/api/greenApi/index.ts` — barrel клиента. В iter-3 добавлен экспорт `EGreenApiErrorKind`, `EHttpMethod`.
- `src/api/session.ts` — `getSession` / `saveSession` / `signOut`. В iter-3 добавлен `ESignOutReason`.
- `src/api/schemas/account.schema.ts` — схемы `getStateInstance` / `getSettings` / `getAccountSettings`. В iter-3 добавлены `EStateInstance`, `EIncomingWebhook`.
- `src/api/schemas/chats.schema.ts` — схемы `checkAccount` / `getContactInfo` / `getChats`. В iter-3 добавлен `ECheckAccountFailReason`.
- `src/api/schemas/messages.schema.ts` — схемы `getChatHistory` / `sendMessage`. В iter-3 добавлены `EChatHistoryEntryType`, `ETypeMessage`, `EStatusMessage`; `type` проверяется через `z.enum(EChatHistoryEntryType)`.
- `src/api/services/account.service.ts` — `checkInstanceAuthorized`, `getInstanceSettings`, `getAccount`. В iter-3 переведён на enum.
- `src/api/services/chats.service.ts` — `checkAccount`, `getContact`, `getChatIds`. В iter-3 переведён на enum, в JSDoc имена kind заменены на члены enum.
- `src/api/services/messages.service.ts` — `getChatHistory`, `sendMessage`. В iter-3 переведён на enum.
- `src/api/services/_helpers.ts` — `toNullable` / `toUsername` / `toPhone`. В iter-3 не менялся.
- `src/types/account.types.ts`, `src/types/chats.types.ts`, `src/types/messages.types.ts` — доменные типы. В iter-3 не менялись.
- `src/api/__tests__/api.test.ts` — unit-тесты слоя, 32 шт. В iter-3 kind, причина выхода и `httpMethod` задаются через enum.

## Files modified
- `public/dictionaries/ru.json` — `newChat.searchRestrictedError`. В iter-3 не менялся.
- `src/types/i18n.types.ts` — `newChat.searchRestrictedError: string`. В iter-3 не менялся.

## Verification
Команды запускались в том виде, как в задаче, без замен:
- `pnpm format` — exit 0.
- `pnpm lint` — ошибок и предупреждений нет; в baseline тоже ничего не было.
- `pnpm build` (`tsc -b && vite build`) — прошёл.
- `pnpm test` — 1 файл, 32/32 passed.
- Экспорты: у каждого нового экспорта есть импортёр вне своего модуля, кроме `ESignOutReason` (см. Known issues).
- Условие остановки поправки: в `src/api` и `src/types` (без тестов) нет `=== "…"`, `case "…"` и строковых литеральных union. Grep нашёл только `z.literal(true/false)`: это булевы дискриминанты, а не строки.
- Runtime/browser: не запускался, слой без UI. Живых вызовов `checkAccount` / `getContactInfo` не было.
- Временных файлов и `.playwright-mcp` нет.

## Known issues / follow-ups
- **`ESignOutReason` экспортирован, но вне тестов импортёров нет.** Это исключение из дисциплины экспорта: символ завершает контракт фазы. `signOut` экспортирован и принимает `ESignOutReason`, а строковый литерал строковому enum не присваивается. Без экспорта причину выхода нельзя передать вообще. Первыми потребителями будут `_queryClient` и `validateSearch` роута логина в Phase 3.
- **Найдено при проверке, но не изменено (решение за владельцем):**
  - Имена методов GREEN-API (`method: "getStateInstance"`, `"checkAccount"` и т. д.) — это параметр `method: string` в `IGreenApiRequestOptions` и поле `GreenApiError.method`. Набор методов закрыт, и из него мог бы получиться `EGreenApiMethod`. Но это не литеральный union и не сравнение: каждое имя используется один раз, и поправка Phase 2 его не перечисляет. Если владелец хочет и это, понадобится поправка плана, потому что Phase 9 добавит `receiveNotification` / `deleteNotification`. Мелочь в том же месте: в `chats.service.ts` имя `"checkAccount"` повторено в `new GreenApiError(...)`.
  - `exist: z.literal(true/false)`, `status: z.literal(false)` и `TCheckAccountResult.exists` — булевы дискриминанты, enum к ним не применим.
  - `"status" in result` — это проверка наличия ключа, а не сравнение значения.
- Код Phase 1 (пропсы `Typography`) не трогался, как требует исключение для пропсов компонентов.
