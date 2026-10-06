Status: COMPLETED

## Phase goal
Phase 9, iter-3 (повторный запуск после поправки (21) «Phase 9 — added 2026-10-06 (21): сброс `lastReceiptId` после удаления»). После **успешного** `deleteNotification` poller забывает номер последнего обработанного уведомления. Если удаление не прошло, номер сохраняется. Область — только `src/api/poller/_poller.ts` и его тесты.

## What was implemented
- `runLoop` (`src/api/poller/_poller.ts`): после `await deleteNotification(item.receiptId)` выполняется `lastReceiptId = null`.
  - Сброс стоит после `await`. Если удаление бросило ошибку, до него дело не доходит, номер остаётся. При повторной выдаче того же уведомления обработчик не вызывается, повторяется только удаление — как в iter-2.
- JSDoc `runLoop` дополнен: после успешного удаления номер забывается, и уведомление с тем же `receiptId` дальше обрабатывается как новое (нумерация в GREEN-API могла начаться заново).
- Новый тест цикла «после успешного удаления уведомление с тем же receiptId обрабатывается как новое»: два `received(5)` подряд, оба удаления успешны → `onNotification` 2 раза, `deleteNotification` 2 раза.
  - Тест «то же уведомление после неудачного удаления не обрабатывается снова — повторяется только удаление» не менялся и проходит.
  - Проверка самого теста: я временно убрал строку сброса — новый тест упал (1 failed / 26 passed). Строку вернул, все тесты снова зелёные.

## Files created
Накопительно за фазу (в iter-3 новых файлов нет):
- `src/api/schemas/notifications.schema.ts` — `ETypeWebhook`, `EOutgoingStatusDescription`, `messageWebhookSchema`, `notificationBodySchema`, схемы `receiveNotification` / `deleteNotification`.
- `src/api/services/notifications.service.ts` — `receiveNotification` (408 → `null`), `deleteNotification`, разбор уведомления в `TNotification`.
- `src/types/notifications.types.ts` — `ENotificationKind`, `TNotification`, `IReceivedNotification`.
- `src/api/poller/index.ts` — barrel: `applyNotification`, `startPoller`.
- `src/api/poller/_poller.ts` — цикл long-polling: Web Lock, пауза между повторами, повтор по `receiptId` без повторной обработки; **iter-3** — сброс номера после успешного удаления.
- `src/api/poller/_applyNotification.ts` — применение уведомления к списку чатов и ленте.
- `src/api/poller/__tests__/_applyNotification.test.ts` — ветки `applyNotification`.
- `src/api/poller/__tests__/_poller.test.ts` — тесты цикла `startPoller`; **iter-3** — добавлен тест сброса номера (всего 10).
- `src/layouts/MessengerLayout/_useMessengerLayout.ts` — запуск poller'а из каркаса, `isChatOpen`.
- `src/layouts/MessengerLayout/_internal/Sidebar/_internal/SettingsWarning/{index.ts,_SettingsWarning.tsx,_styles.ts}` — предупреждение о настройках инстанса.
- `src/utils/helpers/wait.ts` — прерываемая пауза.
- `src/utils/helpers/__tests__/wait.test.ts` — тесты `wait`.

## Files modified
Накопительно за фазу; в iter-3 не менялись:
- `src/api/greenApi/_client.ts` — `isUnauthorized`.
- `src/api/greenApi/index.ts` — экспорт `isUnauthorized`.
- `src/app/_queryClient.ts` — `isUnauthorized` из клиента.
- `src/api/greenApi/_types.ts` — методы `RECEIVE_NOTIFICATION` / `DELETE_NOTIFICATION`, `EHttpMethod.DELETE`.
- `src/api/schemas/messages.schema.ts` — `ETypeMessage.EDITED_MESSAGE` / `DELETED_MESSAGE`.
- `src/api/services/_helpers.ts` — `isPersonalChatId`.
- `src/api/services/chats.service.ts` — `getChatIds` через `isPersonalChatId`.
- `src/api/services/messages.service.ts` — история заполняет `deletedMessageId`.
- `src/types/messages.types.ts` — `IMessage.deletedMessageId`, `ESendFailReason.PEER_FLOOD`.
- `src/api/cache/messages.cache.ts` — правило удаления в `mergeMessages`, `markMessageFailed`.
- `src/api/mutations/messages.mutations.ts` — `markMessageFailed`.
- `src/api/mutations/chats.mutations.ts` — `enrichChat`.
- `src/api/queries/account.queries.ts` — `useInstanceSettingsQuery`.
- `src/layouts/MessengerLayout/_MessengerLayout.tsx` — `useMessengerLayout()`.
- `src/layouts/MessengerLayout/_internal/Sidebar/_Sidebar.tsx` — `<SettingsWarning />`.
- `src/types/i18n.types.ts` — `sendErrors: Record<ESendFailReason, string>`.
- `public/dictionaries/ru.json` — ключи `sendErrors.*`.
- `src/pages/ChatPage/_internal/MessageList/_internal/MessageBubble/_helpers.ts` — `getFailedLabel` через словарь.
- Тесты: `src/api/__tests__/api.test.ts`, `src/api/cache/__tests__/messages.cache.test.ts`, `src/api/mutations/__tests__/messages.mutations.test.ts`, `MessageBubble/__tests__/_helpers.test.ts`, `chats.queries.test.ts`, `MessageList/__tests__/_helpers.test.ts`.

## Figma extraction
Не затронуто: UI не менялся.

## Verification
- `pnpm format` — exit 0.
- `pnpm lint` — exit 0, без ошибок и предупреждений (baseline чистый).
- `pnpm build` — exit 0 (baseline чистый).
- `pnpm test` — 18 файлов, **231/231** (в iter-2 было 230, добавлен 1 тест).
- Exports — новых экспортов нет.
- Stop condition поправки (21) выполнен: сброс только после успешного удаления, тест сброса, старый тест неудачного удаления зелёный, JSDoc соответствует коду. Другие файлы не трогались.
- Runtime/browser — разработчиком не проверялось: живых запусков не было, запросов к GREEN-API не было, папки `.playwright-mcp` нет.

## Known issues
- Ограничение из iter-2 сохраняется: `lastReceiptId` живёт только в памяти цикла. Если удаление не прошло и после этого вкладку перезагрузили или блокировка перешла к другой вкладке, уведомление обработают ещё раз (лишний +1 к непрочитанным; дубля в ленте нет — слияние идёт по `id`). Поправка (21) этого не касается.
- Planner drift: нет.
