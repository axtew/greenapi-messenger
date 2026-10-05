MODE: review
STATUS: NEEDS_CHANGES
Issue source: both

## Summary
Проверена Phase 2: клиент GREEN-API, сессия, zod-схемы, сервисы, типы и `api.test.ts`. Работа аккуратная. `apiTokenInstance` не попадает ни в `message`, ни в `cause` сетевой ошибки. Схемы совпадают с `brainstorm.md` и с документацией Telegram-версии GREEN-API: её страницы CheckAccount, GetAccountSettings и GetChatHistory я перечитал. `pnpm test` (29/29), `pnpm lint`, `pnpm build`, `prettier --check src` перезапущены, все зелёные, отчёт разработчика подтверждается.

Блокеров два:
- пробел в плане: лимит `checkAccount` (`rate_limit_exceeded`) по документации приходит ответом 200, а не 469, и он ложится на контракт сервиса этой фазы;
- неверный комментарий в схеме `checkAccount`.

## Issues

### Code issues
#### Comments
- [code] `src/api/schemas/chats.schema.ts:3` — комментарий говорит, что при `exist: false` «остальных полей нет». Документация CheckAccount даёт для этого случая `{"exist": false, "chatId": ""}`. Собственная фикстура разработчика (`src/api/__tests__/api.test.ts:283`) отвечает так же. Комментарий описывает свойство, которого у ответа нет (`code-style.md` → «Комментарии»). Предлагаемая формулировка: «`exist: false` — аккаунта нет или номер скрыт настройками приватности; `chatId` тогда пустой, остальные поля не используются».

### Plan issues
#### Missing requirement — ответ `checkAccount` со статусом 200 и `status: false`
- [plan] Документация CheckAccount (Telegram): лимит Telegram на поиск по номеру, «рекомендуется повторить через 2 часа», приходит **HTTP 200** с телом `{"status": false, "data": {"status": "fail", "reason": "rate_limit_exceeded", "retryAfter": …}}`. HTTP 469 — другой лимит, короткий («повторите через некоторое время»). Неавторизованный или стартующий инстанс тоже отвечает 200: `{"status": false, "reason": "instance is starting or not authorized"}`.

  План смешивает оба лимита:
  - `brainstorm.md:111`: «469 / `rate_limit_exceeded` → пауза ~2 ч»;
  - Phase 6, `plan.md:604`: с `newChat.rateLimitError` сопоставлен только HTTP 469;
  - но текст `newChat.rateLimitError` (`plan.md:293`, «попробуйте через пару часов») описывает именно 200 / `rate_limit_exceeded`.

  Сейчас `checkAccountSchema` (`src/api/schemas/chats.schema.ts:4`) такой ответ не принимает, сервис бросает `invalidResponse`, и Phase 6 покажет `newChat.genericError`. Явное требование «понятные ошибки `exist:false` / 469» (`plan.md:26`) молча не выполняется для самого вероятного лимита. Разработчик это нашёл и не стал обходить — так и нужно (AGENTS.md → «Расхождение плана с реальностью»).

  Минимальная поправка (решает владелец):
  1. Записать в Amendments, что `checkAccount` распознаёт тело `{status: false, data?: {reason}}`. Вариант: отдельная схема-ветка → `GreenApiError` с отличимым признаком лимита, либо вариант `TCheckAccountResult`.
  2. Исправить таблицу ошибок Phase 6: `rate_limit_exceeded` (200) → `rateLimitError`; 469 → тот же текст или `genericError`.
  3. Поправить `brainstorm.md:111`.

  Если это решение переносится в Phase 6, пусть план прямо скажет, что сервис `checkAccount` меняется там.

## Notes

**Отклонения разработчика от плана**

| Отклонение | Оценка |
|---|---|
| `src/api/services/_helpers.ts` (нет в плане) | Приемлемо. Три нормализатора нужны двум сервисам одной папки. Это ступень «уровень модуля» из `structure.md`: свой файл с подчёркиванием, экспорт ради соседей. |
| `IChat` / `IChatLastMessage` не объявлены | Приемлемо по дисциплине экспорта: у типа нет импортёра до Phase 5. Но `plan.md:148`, `:172–174` относит их к контракту Phase 2. Чтобы разработчик Phase 5 их не пропустил, стоит добавить поправку в Amendments: «объявляются в Phase 5 в `src/types/chats.types.ts` по форме из Types and interfaces». |
| `GreenApiError.kind` и `signOut(reason?: "expired")` — литеральные union, а не enum | Приемлемо: шаг 1 и шаг 2 Phase 2 задают их именно так. `plan.md:148` («ограниченные наборы — строковые enum») относится к сущностям из раздела Types. Конвенции enum для таких union не требуют. Противоречие внутри плана — на усмотрение владельца. Если нужен enum, решать до Phase 3: там появятся первые сравнения `error.kind === …`. Учесть: enum в `_client.ts` дал бы второе объявление типа в файле, то есть `_types.ts` по лестнице. |
| `httpMethod: "GET" \| "POST"` без `DELETE` | Приемлемо (YAGNI): `DELETE` добавит Phase 9 вместе с потребителем. |
| `username` без ведущего `@`, в имени-фолбэке — `@${username}` | Приемлемо и последовательно: `@` срезается во всех трёх сервисах, тип это документирует. Phase 4 и Phase 6 выводят `@${username}`. |
| `IAccount.phone: string \| null` (в плане `phone: string`) | Приемлемо. В отчёте не названо как отклонение, но обосновано документацией GetAccountSettings: при `notAuthorized` / `blocked` / `starting` поле пустое. Phase 4 (`AccountMenu`) должна учитывать `null` у обоих полей. |
| `getAccountSettings` живьём не проверен | Схема (`phone` — строка, `username` с `@`, `avatar`) совпадает с документацией. Подтвердит проверка `account_menu` в Phase 4. |

**Токен**
- В `message` его нет ни в одной ветке, у `network` нет `cause`. Тест `api.test.ts:213` это закрепляет.
- Остаточный риск, не блокер. У `invalidResponse` в `cause` уходит исходная ошибка (`src/api/greenApi/_client.ts:111`). При не-JSON ответе это `SyntaxError` из `JSON.parse`, а V8 кладёт в его текст фрагмент тела ответа. Токен там не появится, если только сервер не вернёт сам URL. По логике комментария на `_client.ts:100` безопаснее не прикладывать `cause` и здесь, либо прикладывать только `ZodError`.

**Прочие наблюдения**
- `src/api/schemas/messages.schema.ts:16` — `extendedTextMessage: z.object({ text: z.string() })`. В документации GetChatHistory для Telegram этого поля нет. Если оно придёт в другой форме, упадёт разбор **всей** истории чата, а не одной записи. Безопаснее `text: z.string().optional()`: текст и так берётся сначала из `textMessage`.
- `src/api/greenApi/_client.ts:23` — `options?: { cause?: unknown }` повторяет встроенный `ErrorOptions`. Можно взять его.
- `src/api/session.ts:41` — у `clearSession` вне модуля только один импортёр, тест. Ни одна фаза плана не вызывает её снаружи: все выходы идут через `signOut`. План сам перечисляет её в API сессии, поэтому это не находка. Можно не экспортировать, а в тесте обойтись `signOut` / `localStorage`.
- Хорошо сделано: разворот истории перед стабильной сортировкой сохраняет порядок записей с одинаковым временем; ветка `AbortError` проверяется по `signal.aborted`, а не по имени ошибки; тест на утечку токена подаёт токен прямо в текст `TypeError`.
