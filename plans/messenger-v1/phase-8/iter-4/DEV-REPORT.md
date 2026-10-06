Status: COMPLETED

## Phase goal
Phase 8 — Отправка сообщений. Итерация 4 — правка владельца после одобрения iter-3: убрать особый случай Safari/CJK IME (`keyCode` 229) из `useComposer`, оставить только стандартную проверку `event.nativeEvent.isComposing`, как в тексте фазы плана.

## What was implemented
- Удалена константа `IME_PROCESS_KEY_CODE` (229) вместе с JSDoc.
- `onKeyDown`: пока `event.nativeEvent.isComposing`, обработчик сразу выходит — Enter не отправляет. Особая обработка Escape во время композиции (`preventDefault`) удалена: Escape теперь просто всплывает к document-слушателю чата, а тот сам пропускает события с `isComposing` (`src/pages/ChatPage/_useChatPage.ts` не менялся).
- Enter → отправка и Shift+Enter → перенос строки работают как раньше.
- JSDoc хука переписан: последний абзац теперь «Во время IME-ввода (`isComposing`) клавиша принадлежит вводу: Enter не отправляет.» Safari, `keyCode` и IME для иероглифов больше не упоминаются.

## Files created
Накопительно за фазу 8 (новые файлы этой итерации не появились):
- `src/api/mutations/messages.mutations.ts` — мутация отправки сообщения.
- `src/api/mutations/__tests__/messages.mutations.test.ts` — тесты мутации.
- `src/components/IconButton/_types.ts` — типы `IconButton`.
- `src/pages/ChatPage/_internal/Composer/` (`index.ts`, `_Composer.tsx`, `_styles.ts`, `_helpers.ts`, `__tests__/_helpers.test.ts`, `_useComposer.ts`) — поле ввода сообщения.

## Files modified
Накопительно за фазу 8 (по рабочему дереву):
- `src/pages/ChatPage/_internal/Composer/_useComposer.ts` — **эта итерация**: удалён особый случай IME через `keyCode` 229 и `preventDefault` для Escape, JSDoc обновлён.
- `src/components/IconButton/_IconButton.tsx`, `src/components/IconButton/_styles.ts`, `src/components/icons/_icons.tsx`, `src/layouts/MessengerLayout/_internal/Sidebar/_Sidebar.tsx`, `src/layouts/MessengerLayout/_internal/Sidebar/_styles.ts`, `src/pages/ChatPage/_ChatPage.tsx`, `src/pages/ChatPage/_internal/MessageList/_internal/MessageBubble/_MessageBubble.tsx`, `.../MessageBubble/_helpers.ts`, `.../MessageBubble/__tests__/_helpers.test.ts`, `src/pages/ChatPage/_internal/MessageList/_useAutoScroll.ts`, `src/types/common.types.ts`, `src/types/messages.types.ts` — изменения фазы 8 из iter-1..3, в этой итерации не трогались.

## Verification
- Baseline: использованы существующие логи `plans/messenger-v1/baseline/`, заново не снимались.
- `pnpm format` — exit 0, файлы без изменений.
- `pnpm lint` — exit 0, без ошибок и предупреждений.
- `pnpm build` — exit 0.
- `pnpm test` — exit 0: 15 файлов, 175 тестов пройдено. Тестов на `onKeyDown` нет, так что тесты в этой итерации не менялись.
- Exports: новых экспортов нет.
- Phase stop condition: выполнено. Поиск `keyCode|229` по `src/` даёт 0 совпадений.
- Runtime/browser: разработчик не проверял.

## Known issues
- Нет. Поведение мобильной клавиатуры владелец записал в `BACKLOG.md`.
