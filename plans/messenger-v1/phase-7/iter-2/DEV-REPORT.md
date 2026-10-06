Status: COMPLETED

## Phase goal

Phase 7 — История переписки. Итерация 2 — исправление четырёх замечаний ревью `phase-7/iter-1/REVIEW.md` (визуальный проход iter-1 — APPROVED).
План не менялся.

## What was implemented

1. **Единая точка записи сообщений.** `queryFn` в `useChatMessagesQuery` теперь возвращает
   `updateMessages(client, chatId, (cached) => mergeMessages(cached, history))` — по образцу `syncChats` → `updateChats`. Слияние с кэшем
   на момент ответа сохранено; `updateMessages` возвращает слитый список и записывает его в кэш, данные запроса те же (после `queryFn`
   TanStack Query сравнивает результат с уже записанным и по structural sharing оставляет его). JSDoc «единственная точка записи» теперь верен.
   Неиспользуемый импорт `IMessage` из `messages.queries.ts` убран.
2. **Комментарий `mergeMessages`:** «исходное убирается, правка встаёт в ленту по времени правки (исходное время API не отдаёт)…» —
   совпадает с кодом и тестом «правка заменяет оригинал и встаёт по своему времени».
3. **JSDoc `Pill`:** «Полупрозрачная» убрано — фон непрозрачный `palette.datePill`.
4. **`TAIL_WIDTH`** перенесена в `src/pages/ChatPage/_internal/MessageList/_constants.ts` (два потребителя в поддереве `MessageList`);
   её импортируют `MessageList/_styles.ts` (`SSkeletonRow`: `padding: 0 ${TAIL_WIDTH}px` вместо литерала `9px`) и
   `MessageBubble/_styles.ts` (локальное объявление удалено). Относительный импорт `../../_constants` — по образцу
   `Sidebar/_styles.ts` → `../../_styles`.

Тест: в `describe("updateMessages")` добавлен случай ровно той композиции, что в `queryFn` — история сливается с кэшем (запись из истории
побеждает, `local-*` остаётся), возвращённый список равен записанному в кэш.

## UIKit wrappers

Новых `styled(<примитив проекта>)` нет.

## Files created

Кумулятивно (фаза):

- `src/api/cache/messages.cache.ts` — `getMessagesQueryKey`, `updateMessages`, `mergeMessages`.
- `src/api/cache/__tests__/messages.cache.test.ts` — 12 тестов (iter-2: + слияние истории с кэшем через `updateMessages`).
- `src/api/queries/messages.queries.ts` — `useChatMessagesQuery` (iter-2: запись через `updateMessages`).
- `src/components/Pill/{index.ts,_Pill.tsx,_styles.ts}` — общая пилюля (iter-2: JSDoc).
- `src/pages/ChatPage/_internal/MessageList/{index.ts,_MessageList.tsx,_styles.ts,_types.ts,_helpers.ts,_useAutoScroll.ts}` — лента
  (iter-2: `_styles.ts` берёт `TAIL_WIDTH`).
- `src/pages/ChatPage/_internal/MessageList/_constants.ts` — **новый в iter-2**: `TAIL_WIDTH`.
- `src/pages/ChatPage/_internal/MessageList/__tests__/_helpers.test.ts` — тесты `buildListItems`.
- `src/pages/ChatPage/_internal/MessageList/_internal/MessageBubble/{index.ts,_MessageBubble.tsx,_styles.ts,_types.ts,_helpers.ts}` — пузырь
  (iter-2: `_styles.ts` импортирует `TAIL_WIDTH`).
- `src/pages/ChatPage/_internal/MessageList/_internal/MessageBubble/__tests__/_helpers.test.ts` — тесты `splitTextWithLinks`.

## Files modified

Кумулятивно (фаза), в iter-2 не менялись:

- `src/pages/ChatPage/_ChatPage.tsx` — `MessageList` под `ChatHeader` (только при найденном чате, `key={chatId}`).
- `src/pages/HomePage/_HomePage.tsx` — `SPill` + `H3` заменены на `Pill`.
- `src/pages/HomePage/_styles.ts` — `SPill` удалён.

## Verification

Команды, дословно:

- `pnpm format` — exit 0.
- `pnpm lint` — exit 0; baseline чистый, новых ошибок нет.
- `pnpm build` — exit 0; baseline чистый.
- `pnpm test` — 12 файлов, 141/141 (было 140 + 1 новый тест `updateMessages`). Первый прогон нового теста упал на `toBe` (ссылочное
  равенство): `setQueryData` применяет structural sharing, записанное значение — глубоко равная копия; проверка заменена на `toEqual`,
  как в соседнем тесте `updateMessages` и как у `updateChats`.
- **Exports:** `updateMessages` больше не заготовка — production-импортёр `src/api/queries/messages.queries.ts` (дальше его используют
  Phase 8 / Phase 9). Новый экспорт `TAIL_WIDTH` — импортёры `MessageList/_styles.ts` и `MessageBubble/_styles.ts`.
- **Stop condition:** все четыре замечания закрыты; за рамки замечаний не выходил. `getChatHistory` в циклах не вызывается, `sendMessage` нет.
- **Runtime/browser:** разработчиком не проверялось; Visual Verification фазы — за визуальным ревьюером (iter-1 APPROVED, правки iter-2 визуально
  нейтральны: отступ скелетона остался 9px).
- Временных файлов нет, `.playwright-mcp` нет. Коммит не делался (`commit_policy: owner`).

## Known issues

- Пункт iter-1 «отступ строки скелетона повторяет ширину хвостика… общая константа не заводилась» снят — константа общая.
- Остальные известные ограничения iter-1 без изменений: `clip-path: path()` в старых браузерах, автопрокрутка только на рост числа сообщений,
  ошибка обновления при показанной ленте не отображается.
- Предлагаемое сообщение коммита: `fix(chats): запись истории через updateMessages, общая ширина хвостика пузыря`.
