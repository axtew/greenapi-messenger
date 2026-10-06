Status: COMPLETED

## Phase goal
Phase 8 — «Отправка сообщений», iter-2 (FIX после ревью + Amendment (18), только пункты Phase 8 и Types): исправить 3 находки ревью/визуального ревью и добавить блокировку отправки до загрузки истории.

## What was implemented
1. **Дублирующийся ключ (`_ChatPage.tsx`)** — `key={chatId}` перенесён на общую обёртку `<Fragment key={chatId}>`, у `MessageList` / `Composer` ключей нет. JSDoc уточнён («ключ — на общей обёртке»). При A→B теперь размонтируется вся пара, старой ленты в DOM не остаётся.
2. **Автопрокрутка (`_useAutoScroll.ts`)** — выбран вариант «любое изменение `messages`»: условие стало `prevCount === null || isNearBottomRef.current || (hasGrown && isOwnSending)`. Проверка роста осталась только для ветки своего `SENDING`. Переход `SENDING → FAILED` (пузырь растёт без изменения числа сообщений) теперь удерживает ленту у низа. JSDoc хука объясняет, почему «любое изменение». `ResizeObserver` на контейнере не менялся.
3. **Общий `IconButton` (`primary`)** — добавлены пропы `variant: "ghost" | "primary"` (по умолчанию `ghost`), `size: "md" | "lg"` (44 / 56, по умолчанию `md`), `type: "button" | "submit"` (по умолчанию `button`). Вариант `primary`: фон `primary`, иконка `onPrimary`, `:hover:enabled` `brightness(0.92)`, `:disabled` `opacity: 0.6` + `cursor: default`, фокус `outline-offset: 2px`. У `ghost` всё как было (`outline-offset: -2px`, фон при hover и `aria-expanded`). На вариант переведены:
   - кнопка отправки в `Composer` — `type="submit"`, `variant="primary"`, остальное как было (`onMouseDown` preventDefault, `disabled`, `aria-label`); `SSendButton` удалён;
   - FAB «Новый чат» в `Sidebar` — `variant="primary" size="lg"`, `ref` (возврат фокуса) и `onClick` те же. Позиция (`absolute`, right 20px, bottom `calc(20px + env(safe-area-inset-bottom))`) — в обёртке `SNewChatButtonSlot` (простой `div`, не `styled(IconButton)`); `SNewChatButton` удалён.
4. **Отправка только после загрузки истории (Amendment 18)** — `useComposer` читает `isSuccess` из `useChatMessagesQuery(chatId)` (ключ тот же, второго запроса нет). Решение «что отправить» вынесено в чистый `getMessageToSend(text, isHistoryLoaded)` в `Composer/_helpers.ts`: текст после обрезки пробелов или `null`. `canSend = message !== null`, тот же `send()` для Enter и кнопки. Пока история грузится или упала — кнопка неактивна, Enter не отправляет, набирать можно (поле не блокируется).

Types bullet Amendment (18) (`IMessage.failReason: ESendFailReason | null`) — в коде уже так, не трогал. Phase 9 bullet (`PEER_FLOOD`, переименование `sendErrors`) — не трогал.

## UIKit wrappers
Нет: `styled(<primitive>)` не добавлялось. Для позиционирования FAB — `div`-обёртка `SNewChatButtonSlot`.

## Files created
- `src/components/IconButton/_types.ts` — `IIconButtonProps`, `TIconButtonVariant`, `TIconButtonSize` (появилось ≥ 2 объявлений → правило `_types.ts` из `structure.md`).
- `src/pages/ChatPage/_internal/Composer/_helpers.ts` — `getMessageToSend`.
- `src/pages/ChatPage/_internal/Composer/__tests__/_helpers.test.ts` — 3 теста: обрезка и отдача текста, пустой/пробельный текст, история не загружена.
- (из iter-1, без изменений) `src/api/mutations/messages.mutations.ts`, `src/api/mutations/__tests__/messages.mutations.test.ts`, `src/pages/ChatPage/_internal/Composer/index.ts`.
- (из iter-1, изменены сейчас) `Composer/_Composer.tsx` — кнопка на `IconButton variant="primary"`, JSDoc; `Composer/_styles.ts` — удалён `SSendButton`; `Composer/_useComposer.ts` — `isHistoryLoaded`, `getMessageToSend`, JSDoc.

## Files modified
- `src/pages/ChatPage/_ChatPage.tsx` — `Fragment key={chatId}` вокруг ленты и поля ввода; JSDoc.
- `src/pages/ChatPage/_internal/MessageList/_useAutoScroll.ts` — прокрутка у низа при любом изменении `messages`; JSDoc.
- `src/components/IconButton/_IconButton.tsx` — пропы `variant` / `size` / `type`, JSDoc.
- `src/components/IconButton/_styles.ts` — размеры по `size`, наборы стилей `ghost` / `primary`.
- `src/layouts/MessengerLayout/_internal/Sidebar/_Sidebar.tsx` — FAB на `IconButton`.
- `src/layouts/MessengerLayout/_internal/Sidebar/_styles.ts` — `SNewChatButton` → `SNewChatButtonSlot` (только позиционирование).
- (из iter-1, без изменений) `src/components/icons/_icons.tsx`, `src/types/common.types.ts`, `src/types/messages.types.ts`, `MessageBubble/{_MessageBubble.tsx,_helpers.ts,__tests__/_helpers.test.ts}`.

## Verification
- `pnpm format` — exit 0.
- `pnpm lint` — чисто (0 ошибок, 0 предупреждений; в baseline тоже чисто).
- `pnpm build` — успешно.
- `pnpm test` — 175/175 (было 172 + 3 новых).
- Exports: `getMessageToSend` → `_useComposer.ts` + тест; `TIconButtonVariant` / `TIconButtonSize` → `IconButton/_styles.ts`; `IIconButtonProps` → `_IconButton.tsx`; `SNewChatButtonSlot` → `_Sidebar.tsx`. Новых barrel-экспортов нет.
- Phase stop condition: все 4 находки закрыты, в объём Phase 9 ничего не попало.
- Runtime/browser: разработчик в браузере не проверял (живых отправок нет). Проверка за визуальным ревьюером: (а) A→B — одна лента в DOM, ошибки «two children with the same key» в консоли нет; (б) `FAILED` на 390px — примечание видно у низа; (в) FAB — 56px на том же месте, hover/focus как раньше; (г) кнопка отправки и Enter неактивны, пока история грузится или после её ошибки.

## Known issues
- Проверка `isSuccess`: если история загрузилась, а позже фоновый refetch упал, отправка остаётся доступной (у запроса есть данные, `isSuccess` = true). Это совпадает с поправкой: «история загружена» значит «данные ленты есть».
- `:disabled` есть только у `primary`: неактивных `ghost`-кнопок в коде нет, поведение `ghost` не менял.
- `type="submit"` оставлен (поправка это разрешает): кнопка отправляет форму через `onSubmit`, Enter вызывает тот же `send()` напрямую.
