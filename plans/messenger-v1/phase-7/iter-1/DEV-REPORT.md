Status: COMPLETED

## Phase goal

Phase 7 — История переписки: экран чата показывает последние 100 сообщений (пузыри с временем, разделители дат, кликабельные ссылки,
плашка нетекстовых, пометка «не доставлено»), удалённые и заменённые правкой сообщения скрыты, лента держится внизу.
Учтены поправки: строковые `enum` для дискриминантов (2, 3, 6, 7, 9), заготовки `dateFormat.ts` из (3), `getDayKey` и заготовка `updateMessages` из (8),
общая пилюля из (9), `Skeleton` из (13), тесты в `__tests__/` из (14).

## What was implemented

- **Кэш сообщений** (`messages.cache.ts`): ключ `["messages", chatId]` (`getMessagesQueryKey`, по образцу `getChatsQueryKey`), `updateMessages`
  (заготовка для Phase 8/9) и чистая `mergeMessages`. Объединение по `id` — побеждает входящая запись; `Map.set` по существующему ключу
  сохраняет позицию, поэтому замена не сдвигает сообщение среди сообщений с тем же временем. Убираются сообщения, на чей `id` ссылается чей-либо
  `replacesId` (набор строится по всему объединению, включая записи удаления), затем записи с `isDeleted`; стабильная сортировка по `timestamp`.
  `local-*` ничем не отличаются: остаются, пока их не заменит запись с тем же `id`.
- **`useChatMessagesQuery(chatId)`**: `getChatHistory(chatId, 100)` → `mergeMessages(кэш на момент ответа, ответ)`; `staleTime` по умолчанию,
  поэтому каждое открытие чата делает свежий запрос, а закэшированная лента видна сразу.
- **`MessageList`** (`_internal/MessageList/`): скролл-контейнер (`flex: 1`, `min-height: 0`, `overflow-y: auto`), содержимое прижато к низу.
  Состояния: нет данных и идёт запрос (в т. ч. повторы) — 3 скелетона пузырей через общий `Skeleton` (слева / справа / слева); нет данных,
  запрос упал и не идёт — карточка `chat.historyError` (`role="alert"`) + `Button` `chat.retryButton` (`refetch`); пустая история — `Pill`
  `chat.emptyHistory`. Ошибка обновления при уже показанной ленте не показывается.
  `buildListItems(messages, now, labels)` — разделитель (`EListItemKind.DATE`, `key: date-<getDayKey>`, подпись `formatDayLabel`) перед первым
  сообщением каждого дня; `isLastInGroup` — следующего нет, другое направление или другой день.
  `useAutoScroll` (`useLayoutEffect`): первое получение данных — вниз; рост длины списка — вниз, только если пользователь был у низа (≤ 80px,
  положение запоминается в `onScroll` до рендера) или последнее сообщение своё `SENDING`.
- **`MessageBubble`** (`_internal/MessageList/_internal/MessageBubble/`): входящий слева `surface`, исходящий справа `bubbleOutgoing`,
  `max-width: 70%`, `white-space: pre-wrap`, `word-break: break-word`. Хвостик — `::before` с `clip-path: path(...)` только при `isLastInGroup`
  (угол со стороны хвостика без скругления); строка всегда отступает от края на ширину хвостика, так что выравнивание не прыгает. Время —
  `Caption` (`formatMessageTime`; исходящее `metaOutgoing`, входящее `textMuted`) плавает справа внизу: встаёт в последнюю строку текста, если
  там есть место, иначе — под ней (как в Telegram). `text === null` — курсивом `chat.unsupportedMessage`; `FAILED` — вместо времени `danger`
  `chat.failedLabel` + `: <failReason>` при наличии; `SENDING` — время с `opacity: 0.5`.
  `splitTextWithLinks` → части `ETextPartKind.TEXT` / `LINK`: только `http(s)://` (без учёта регистра), первый символ после схемы не знак
  препинания, хвостовые `.,!?)` уходят в текст; `javascript:` / `data:` / `ftp:` остаются текстом. Ссылки — `<a href target="_blank"
  rel="noopener noreferrer">` цвета `primary`; рендер только через React-узлы, без `dangerouslySetInnerHTML`.
- **`Pill`** (`src/components/Pill/`): общая плашка `datePill` с белым `H3` (medium) по центру — поднята из `HomePage/_styles.ts`; потребители —
  `HomePage` (пустое состояние) и `MessageList` (разделитель дат, пустая история).
- **`ChatPage`**: лента под шапкой. Рендерится только когда чат найден в списке (пока чат ищут или адрес ведёт на неизвестный чат — запрос
  `getChatHistory` не уходит); `key={chatId}` пересоздаёт ленту при смене чата (роут с параметром компонент не перемонтирует, а прокрутка и
  «первое получение данных» относятся к одному чату).

## UIKit wrappers

Новых `styled(<примитив проекта>)` нет.

## Files created

- `src/api/cache/messages.cache.ts` — `getMessagesQueryKey`, `updateMessages`, `mergeMessages`.
- `src/api/cache/__tests__/messages.cache.test.ts` — 11 тестов: дедуп, правка (в т. ч. в одном ответе с оригиналом), удаление убирает оригинал и запись,
  `isDeleted` без ссылки, порядок и равное время, замена не сдвигает позицию, `local-*` сохраняются, входные массивы не мутируются, `updateMessages`.
- `src/api/queries/messages.queries.ts` — `useChatMessagesQuery`.
- `src/components/Pill/{index.ts,_Pill.tsx,_styles.ts}` — общая пилюля.
- `src/pages/ChatPage/_internal/MessageList/{index.ts,_MessageList.tsx,_styles.ts,_types.ts,_helpers.ts,_useAutoScroll.ts}` — лента.
- `src/pages/ChatPage/_internal/MessageList/__tests__/_helpers.test.ts` — 5 тестов `buildListItems`.
- `src/pages/ChatPage/_internal/MessageList/_internal/MessageBubble/{index.ts,_MessageBubble.tsx,_styles.ts,_types.ts,_helpers.ts}` — пузырь.
- `src/pages/ChatPage/_internal/MessageList/_internal/MessageBubble/__tests__/_helpers.test.ts` — 9 тестов `splitTextWithLinks`.

## Files modified

- `src/pages/ChatPage/_ChatPage.tsx` — `MessageList` под `ChatHeader` (только при найденном чате, `key={chatId}`), JSDoc.
- `src/pages/HomePage/_HomePage.tsx` — `SPill` + `H3` заменены на `Pill`.
- `src/pages/HomePage/_styles.ts` — `SPill` удалён.

## Free choice / reference record

- Пузыри и разделители — по `02-wide-chat.png` / `05-mobile-chat.png`: отступ пузырей 2px внутри группы, 8px после группы; padding пузыря 6/8/6/10;
  радиус `theme.radii.bubble`; хвостик 9×16. Узор фона, «Unread Messages», «edited», галочки — не делаются.
- Ошибка истории — белая карточка (`radii.panel`) с текстом `B1` и `Button` по центру ленты (в референсах аналога нет).
- Скелетоны: высота 36px (одна строка пузыря), радиус `pill` у `Skeleton` оставлен — на 36px он почти совпадает с радиусом пузыря, расширять `Skeleton` не понадобилось.

## Verification

Команды фазы, дословно:

- `pnpm test` — 12 файлов, 140/140 (новые: `messages.cache` 11, `buildListItems` 5, `splitTextWithLinks` 9).
- `pnpm lint` — exit 0 (одна новая ошибка `simple-import-sort` в `_MessageList.tsx` исправлена `eslint --fix`). Перед lint — `pnpm format`.
- `pnpm build` — exit 0. Baseline (`plans/messenger-v1/baseline/`) чистый, предсуществующих ошибок нет.
- `.d.ts` не трогались — проверка `tsc --skipLibCheck false` не требуется.
- **Exports:** у всех новых экспортов есть импортёр вне своего файла, кроме заготовки ниже.
  - **Provisioned for later phases:** `updateMessages` (`messages.cache.ts`) → Phase 8 (`useSendMessageMutation`), Phase 9 (`applyNotification`);
    сейчас импортируется только тестом.
  - Заготовки Phase 5 `formatMessageTime` (`MessageBubble`), `getDayKey`, `formatDayLabel` (`buildListItems`) получили импортёров.
- **Stop condition:** код-часть выполнена (удалённое сообщение скрывает `mergeMessages`, покрыто тестами). Соответствие `02-wide-chat.png` на живом
  тестовом чате — **разработчиком не проверялось**: вход в браузере потребовал бы передать `apiTokenInstance` в параметры инструмента.
  Visual Verification фазы (`history_loaded`, `date_separators`, `deleted_hidden`, `links_clickable`, `scrolled_to_bottom`, `mobile_history`) — за визуальным ревьюером.
- Временных файлов нет; dev-сервер, поднятый для диагностики, остановлен; `.playwright-mcp` не появлялся.

## Known issues

- **Planner-drift (не блокер):**
  - `_types.ts` в `MessageList` и `MessageBubble` в плане не перечислены — созданы по порогу `structure.md` (enum дискриминанта + тип элемента + пропсы ≥ 2 объявлений).
  - В Verification плана нет `splitTextWithLinks`, в задаче оркестратора — есть; тесты написаны и проходят.
- Хвостик рисуется `clip-path: path()` (Chrome 88+, Safari 13.1+, Firefox 97+); в более старых браузерах угол просто остаётся без хвостика.
- Отступ строки скелетона (9px) повторяет ширину хвостика из `MessageBubble/_styles.ts` — у файлов разные компоненты; общая константа не заводилась.
- Автопрокрутка реагирует на рост числа сообщений; изменение высоты без роста (правка текста последнего сообщения, будущий авторазмер поля ввода)
  ленту не докручивает.
- Ошибку обновления истории при уже показанной ленте пользователь не видит — лента остаётся с кэшем (сознательно; в плане случай не описан).
- Предлагаемое сообщение коммита: `feat(chats): история переписки — лента, пузыри, разделители дат`.
