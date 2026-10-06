Status: COMPLETED

## Phase goal
Phase 9, iter-2: исправление по итогам ревью (`phase-9/iter-1/REVIEW.md`, пункты 1–5) и поправка (20) «Phase 9 — added 2026-10-06 (20)»: 408 на пустой очереди, повтор уведомления, unit-тесты цикла poller.

## What was implemented
1. **DRY — 401.** Предикат `isUnauthorized(error: unknown)` перенесён в `src/api/greenApi/_client.ts`, рядом с `GreenApiError`. Он экспортируется через barrel. Его используют `src/app/_queryClient.ts` (локальная функция удалена) и `_poller.ts` (константа `UNAUTHORIZED_STATUS` удалена).
2. **Комментарий `hasMessages`** (`_applyNotification.ts`) переписан по существу. Запись до первой загрузки сама создала бы данные ленты. Тогда скелетон и ошибка загрузки истории с «Повторить» пропали бы.
3. **JSDoc `runLoop`** теперь соответствует коду:
   - пустая очередь (`null`, в том числе по 408) — без паузы;
   - 401 — остановка;
   - любая другая ошибка (сеть, 429, 5xx, прочие 4xx, ответ неожиданной формы, сбой удаления) — повтор с паузой 1→30 с, пауза сбрасывается после успешного цикла;
   - добавлено описание повтора того же `receiptId`.
4. **`getMessageText`** — JSDoc «Текст сообщения или правки; `null` — нетекстовое сообщение или удаление».
5. **Типы сервиса.**
   - Из `notifications.schema.ts` экспортированы `messageWebhookSchema` и новая `notificationBodySchema` — union, который использует `receiveNotificationSchema`.
   - Сигнатуры `getMessageText` / `toMessageNotification` / `toNotification` используют `z.infer<typeof …>` напрямую.
   - Алиасы `TNotificationBody` / `TMessageBody` удалены.
6. **408 → `null`** (поправка (20)).
   - Обработка — в сервисе: `receiveNotification` ловит `GreenApiError` со статусом 408 через `.catch` и возвращает `null`. Константа `EMPTY_QUEUE_TIMEOUT_STATUS` лежит в файле сервиса. Остальные ошибки пробрасываются дальше.
   - Клиент `greenApiRequest` остался общим. Для других методов 408 по-прежнему ошибка.
7. **Повтор уведомления** (поправка (20)).
   - `runLoop` хранит `lastReceiptId`. Если пришёл тот же `receiptId`, `onNotification` не вызывается, повторяется только `deleteNotification`.
   - `lastReceiptId` записывается до вызова обработчика. Поэтому исключение в обработчике тоже не приводит к повторной обработке.
8. **Unit-тесты цикла** — `src/api/poller/__tests__/_poller.test.ts`, 9 тестов.
   - Подход:
     - тестируется публичная `startPoller`;
     - сервис подменён через `vi.mock("@/api/services/notifications.service")` — так же, как в `chats.mutations.test.ts` / `chats.queries.test.ts`;
     - fake timers (`vi.useFakeTimers()` + `advanceTimersByTimeAsync`), `wait` — настоящая;
     - `navigator` подменён через `vi.stubGlobal`;
     - новых экспортов ради тестов нет.
   - Что покрыто:
     - порядок «обработка → удаление»;
     - удаление после исключения в обработчике;
     - 401 → `onUnauthorized` и остановка (за 60 с второго запроса нет);
     - пауза 1 с → 2 с и её сброс после пустого цикла (снова 1 с);
     - `null` подряд — без паузы;
     - тот же `receiptId` после сбоя удаления → обработчик вызван 1 раз, удаление — 2 раза;
     - имя Web Lock и `signal`;
     - остановка до захвата блокировки → цикл не стартует, `console.error` нет;
     - без Web Locks → `console.warn` и цикл без блокировки.
   - Проверка самих тестов: я временно отключил проверку `receiptId` и ветку 401 — два соответствующих теста упали. Код восстановлен.
   - Сама обработка 408 проверена тестами сервиса в `api.test.ts`: 408 с пустым телом → `null`; 504 → по-прежнему `GreenApiError` HTTP 504.

## Files created
Накопительно за фазу:
- `src/api/schemas/notifications.schema.ts` — `ETypeWebhook`, `EOutgoingStatusDescription`, `messageWebhookSchema`, `notificationBodySchema`, схемы `receiveNotification` / `deleteNotification`.
- `src/api/services/notifications.service.ts` — `receiveNotification` (408 → `null`), `deleteNotification`, разбор уведомления в `TNotification`.
- `src/types/notifications.types.ts` — `ENotificationKind`, `TNotification`, `IReceivedNotification`.
- `src/api/poller/index.ts` — barrel: `applyNotification`, `startPoller`.
- `src/api/poller/_poller.ts` — цикл long-polling: Web Lock, пауза между повторами, повтор по `receiptId` без повторной обработки.
- `src/api/poller/_applyNotification.ts` — применение уведомления к списку чатов и ленте.
- `src/api/poller/__tests__/_applyNotification.test.ts` — ветки `applyNotification`.
- `src/api/poller/__tests__/_poller.test.ts` — **новый в iter-2**: тесты цикла `startPoller`.
- `src/layouts/MessengerLayout/_useMessengerLayout.ts` — запуск poller'а из каркаса, `isChatOpen`.
- `src/layouts/MessengerLayout/_internal/Sidebar/_internal/SettingsWarning/{index.ts,_SettingsWarning.tsx,_styles.ts}` — предупреждение о настройках инстанса.
- `src/utils/helpers/wait.ts` — прерываемая пауза.
- `src/utils/helpers/__tests__/wait.test.ts` — тесты `wait`.

В iter-2 из уже созданных правились: `_poller.ts`, `_applyNotification.ts`, `notifications.service.ts`, `notifications.schema.ts`.

## Files modified
Накопительно за фазу; `*` — изменён в iter-2.

- `*` `src/api/greenApi/_client.ts` — `isUnauthorized`.
- `*` `src/api/greenApi/index.ts` — экспорт `isUnauthorized`.
- `*` `src/app/_queryClient.ts` — `isUnauthorized` из клиента, локальная функция удалена.
- `src/api/greenApi/_types.ts` — методы `RECEIVE_NOTIFICATION` / `DELETE_NOTIFICATION`, `EHttpMethod.DELETE`.
- `src/api/schemas/messages.schema.ts` — `ETypeMessage.EDITED_MESSAGE` / `DELETED_MESSAGE`.
- `src/api/services/_helpers.ts` — `isPersonalChatId`.
- `src/api/services/chats.service.ts` — `getChatIds` через `isPersonalChatId`.
- `src/api/services/messages.service.ts` — история заполняет `deletedMessageId`.
- `src/types/messages.types.ts` — `IMessage.deletedMessageId`, `ESendFailReason.PEER_FLOOD`, значения `ESendFailReason` = имена членов.
- `src/api/cache/messages.cache.ts` — правило удаления в `mergeMessages`, `markMessageFailed`.
- `src/api/mutations/messages.mutations.ts` — `markMessageFailed` вместо `failLocalMessage`.
- `src/api/mutations/chats.mutations.ts` — `enrichChat`.
- `src/api/queries/account.queries.ts` — `useInstanceSettingsQuery`.
- `src/layouts/MessengerLayout/_MessengerLayout.tsx` — `useMessengerLayout()`.
- `src/layouts/MessengerLayout/_internal/Sidebar/_Sidebar.tsx` — `<SettingsWarning />`.
- `src/types/i18n.types.ts` — `sendErrors: Record<ESendFailReason, string>`.
- `public/dictionaries/ru.json` — ключи `sendErrors.*`, `PEER_FLOOD`.
- `src/pages/ChatPage/_internal/MessageList/_internal/MessageBubble/_helpers.ts` — `getFailedLabel` через словарь.
- Тесты:
  - `*` `src/api/__tests__/api.test.ts` — блок `notifications.service`; в iter-2 добавлены тесты «408 → `null`» и «504 → ошибка»;
  - `src/api/cache/__tests__/messages.cache.test.ts`;
  - `src/api/mutations/__tests__/messages.mutations.test.ts`;
  - `MessageBubble/__tests__/_helpers.test.ts`;
  - `chats.queries.test.ts`;
  - `MessageList/__tests__/_helpers.test.ts`.

## Figma extraction
Не затронуто: UI в iter-2 не менялся.

## Verification
- `pnpm format` — выполнен.
- `pnpm lint` — exit 0, без ошибок и предупреждений (baseline чистый).
- `pnpm build` — exit 0 (baseline чистый).
- `pnpm test` — 18 файлов, **230/230**. В iter-1 было 219: добавлено 9 тестов цикла и 2 теста сервиса.
- Exports — у всех новых экспортов есть импортёр вне модуля, экспортов ради тестов нет:
  - `isUnauthorized` → `_queryClient.ts`, `_poller.ts`;
  - `messageWebhookSchema`, `notificationBodySchema` → `notifications.service.ts`.
- Stop condition выполнен: пункты ревью 1–5 и пункты поправки (20) о коде и тестах. Пункт о `brainstorm.md` оркестратор уже выполнил, этот файл я не трогал.
- Runtime/browser — разработчиком не проверялось:
  - живых запусков poller'а и отправок не было;
  - запросов к GREEN-API не было, секреты не выводились;
  - папки `.playwright-mcp` нет.

## Known issues
- Обработку 408 в живом приложении после правки никто не проверял. Это задача визуального ревьюера или владельца: пустые циклы должны идти подряд, без пауз 1 и 2 с.
- `lastReceiptId` живёт только в памяти цикла. Если уведомление не удалилось, а вкладку перезагрузили или блокировка перешла к другой вкладке, его обработают ещё раз (лишний +1 к непрочитанным). Дубля в ленте не будет: слияние идёт по `id`. Поправка этого не требует.
- Planner drift: нет.
