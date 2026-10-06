Status: COMPLETED

## Phase goal
Phase 8 — «Отправка сообщений», iter-3: FIX по `phase-8/iter-2/REVIEW.md` и поправке (19) (только пункт Phase 8). Признак «история загружена» — наличие данных ленты, а не `isSuccess`. Плюс убрать лишний комментарий у `SIZE_PX`.

## What was implemented
1. **`_useComposer.ts`** — `const { data } = useChatMessagesQuery(chatId); const isHistoryLoaded = data !== undefined;` вместо `isSuccess`. Запрос тот же, второго нет. Если поздний фоновый перезапрос падает после повторов, у запроса `status: "error"` и `isSuccess === false`, но данные остаются, поэтому отправка больше не блокируется. JSDoc хука переписан под это условие: отправки нет, пока у запроса ленты нет данных (первая загрузка идёт или упала); неудачный поздний перезапрос её не блокирует. `getMessageToSend`, его JSDoc («До загрузки истории чата…») и тесты не менялись: формулировка по-прежнему верна.
2. **`IconButton/_styles.ts`** — удалён комментарий `/** Сторона кнопки по размеру. */` у `SIZE_PX`: он повторял имя константы.

Unit-тест самого условия не добавлял. Условие — одна строка `data !== undefined` внутри хука. Проверить его через хук можно только рендером (`renderHook`), а `@testing-library/react` / `jsdom` в проекте нет, и новые зависимости запрещены. Тест через `QueryObserver` в node проверял бы поведение TanStack Query (данные остаются после неудачного перезапроса), а не наш код. Решение «отправлять или нет» уже покрыто тестами `getMessageToSend` (ветки `true` / `false`).

## UIKit wrappers
Нет.

## Files created
Итог по фазе с учётом прошлых итераций; в этой итерации новых файлов нет.
- `src/api/mutations/messages.mutations.ts`, `src/api/mutations/__tests__/messages.mutations.test.ts`
- `src/components/IconButton/_types.ts`
- `src/pages/ChatPage/_internal/Composer/` — `_Composer.tsx`, `_styles.ts`, `_useComposer.ts` (**изменён в iter-3**), `_helpers.ts`, `__tests__/_helpers.test.ts`, `index.ts`

## Files modified
Итог по фазе с учётом прошлых итераций.
- `src/components/IconButton/_styles.ts` — **iter-3:** удалён комментарий у `SIZE_PX`.
- `src/components/IconButton/_IconButton.tsx`, `src/components/icons/_icons.tsx`
- `src/layouts/MessengerLayout/_internal/Sidebar/_Sidebar.tsx`, `src/layouts/MessengerLayout/_internal/Sidebar/_styles.ts`
- `src/pages/ChatPage/_ChatPage.tsx`, `src/pages/ChatPage/_internal/MessageList/_useAutoScroll.ts`
- `src/pages/ChatPage/_internal/MessageList/_internal/MessageBubble/{_MessageBubble.tsx,_helpers.ts,__tests__/_helpers.test.ts}`
- `src/types/common.types.ts`, `src/types/messages.types.ts`

## Verification
- `pnpm format` — exit 0.
- `pnpm lint` — exit 0, чисто (baseline тоже чистый).
- `pnpm build` — exit 0.
- `pnpm test` — 15 файлов, 175/175 (как в iter-2).
- Exports: новых нет.
- Phase stop condition: обе находки iter-2 закрыты, пункт Phase 9 поправки (19) не трогал.
- Runtime/browser: разработчик не проверял, сообщения не отправлялись.

## Known issues
- Нет.
