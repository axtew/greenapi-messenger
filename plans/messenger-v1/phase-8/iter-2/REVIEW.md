MODE: review
STATUS: NEEDS_CHANGES
Issue source: both

## Summary

Phase 8, iter-2. Три находки `[code]` из iter-1 исправлены, обе `[plan]` закрыты поправкой (18):
- `<Fragment key={chatId}>`: у детей ключей нет, JSDoc `ChatPage` теперь верен;
- автопрокрутка у низа срабатывает на любое изменение `messages`;
- `IconButton` получил `variant` / `size` / `type`, на него переведены кнопка отправки и FAB.

Перезапуск Verification совпал с отчётом. Осталась одна ошибка. Признак «история загружена» сделан через `isSuccess`, а в TanStack Query v5 `isSuccess` становится `false` после неудачного фонового перезапроса, даже когда данные есть. Пользователь видит ленту без ошибки и неактивную кнопку отправки, и повторить запрос ему нечем. Отчёт разработчика утверждает обратное. `isSuccess` назвала сама поправка (18), а её подсказал мой iter-1. Поэтому источник — `both`.

## Issues

### Code issues

#### Отправка: «история загружена» ≠ `isSuccess`

- [code] `src/pages/ChatPage/_internal/Composer/_useComposer.ts:40`: `const { isSuccess: isHistoryLoaded } = useChatMessagesQuery(chatId)`.
  - **Как работает `query-core@5.104.1`.** Редьюсер `case "error"` (`query.js:450-462`) ставит `status: "error"` и данные не смотрит. `isSuccess` — это `status === "success"` (`queryObserver.js:354`). После загрузки истории любой неудачный перезапрос (после повторов `retry`) делает `isHistoryLoaded === false`.
  - **Когда это случается здесь.** `staleTime` по умолчанию 0, `refetchOnMount` и `refetchOnReconnect` по умолчанию включены (`src/app/_queryClient.ts` отключает только `refetchOnWindowFocus`). Пример: пользователь возвращается в чат, история которого ещё в кэше, и перезапрос при монтировании получает 429 / 5xx / сбой сети три раза подряд.
  - **Что видит пользователь.** `MessageList` показывает сообщения из кэша без ошибки: по контракту Phase 7 ошибка обновления при показанных сообщениях не показывается (`_MessageList.tsx:33`). Кнопка отправки неактивна, Enter не отправляет, объяснения и «Повторить» нет. Выход — только закрыть и заново открыть чат.
  - **Расхождения с текстом.** JSDoc хука (`_useComposer.ts:27-28`: «пока история чата не загружена (грузится или упала)») и JSDoc `Composer` (`_Composer.tsx:16`) обещают проверку «история загружена», а код проверяет «последний запрос успешен». Пункт «Known issues» в `DEV-REPORT.md` («после неудачного фонового refetch отправка остаётся доступной… `isSuccess` = true») неверен: поведение обратное.
  - **Исправление** (после правки плана ниже): `const { data } = useChatMessagesQuery(chatId)` и `isHistoryLoaded = data !== undefined`. До первой успешной загрузки данных нет: мутация заблокирована, другого писателя в кэш ленты в Phase 8 нет. После загрузки данные не пропадают. `getMessageToSend` и его тесты не меняются, JSDoc остаются верными.

### Plan issues

#### Поправка (18): механизм противоречит её же цели

- [plan] `plan.md:1066`. Поправка (18), пункт «Phase 8 — отправка», задаёт цель «только когда история чата загружена» и механизм «`isSuccess` у `useChatMessagesQuery(chatId)`». Механизм цели не соответствует (подробности — в находке `[code]` выше). Ошибка пришла из моей рекомендации (а) в iter-1.
  Минимальная правка поправки: заменить «`isSuccess` у `useChatMessagesQuery(chatId)`» на «данные ленты есть (`data !== undefined` у `useChatMessagesQuery(chatId)`); неудача позднего перезапроса отправку не блокирует». Остальной текст пункта не меняется.

## Notes

- **Verification перезапущена**: `pnpm lint` — exit 0, `pnpm build` — exit 0, `pnpm test` — 175/175, `pnpm exec prettier --check src` — чисто. Совпадает с отчётом, команды не подменены.
- **Находки iter-1 — проверено:**
  - **Ключи.** `_ChatPage.tsx:31-36`: один `key` на `Fragment`, у `MessageList` / `Composer` ключей нет. Соседний `ChatHeader` без ключа, конфликта нет. JSDoc верен: «поля ввода нет», пока чат ищут, — `chat !== undefined &&` на строке 31.
  - **Автопрокрутка.** `_useAutoScroll.ts:43`: условие `prevCount === null || isNearBottomRef.current || (hasGrown && isOwnSending)`. Регрессий не нашёл:
    - кто читает старые сообщения (`isNearBottomRef === false`), того сдвигает только появление своего `SENDING`, как раньше;
    - при повторном открытии чата `Fragment` перемонтирует ленту, `prevCountRef` — `null`. Первый рендер из кэша прокручивает вниз, слияние свежей истории — тоже, пока пользователь у низа. Если он успел прокрутить вверх, его не трогают;
    - при `structuralSharing` перезапрос с теми же данными сохраняет ссылку на массив, лишнего эффекта нет.

    Переход `SENDING → FAILED` меняет ссылку, `useLayoutEffect` докручивает уже с новой высотой пузыря. JSDoc точен.
  - **`IconButton`**:
    - `variant` / `size` / `type` — union литералов в пропсах (исключение в `typing.md`);
    - `SIZE_PX` — `Record<TIconButtonSize, number>`;
    - три объявления → `_types.ts`, в TSX типов нет (`structure.md`);
    - `T*` экспортированы, их импортёр — `_styles.ts`; barrel не менялся;
    - стили `primary` повторяют общий `Button` (`Button/_styles.ts:12-25`): `:hover:enabled` `brightness(0.92)`, `:disabled` `opacity: 0.6` + `cursor: default`, `outline-offset: 2px`;
    - `ghost` не изменился (`outline-offset: -2px`, фон при hover и `aria-expanded`);
    - существующие вызовы (`AccountMenu`, `NewChatPanel`) значений по умолчанию не передают.
  - **FAB.** Размер прежний: `lg` = 56. Позиция прежняя: `SNewChatButtonSlot` — `absolute`, `right: 20px`, `bottom: calc(20px + env(safe-area-inset-bottom))`, как у старого `SNewChatButton`, `z-index` не было ни там, ни здесь. Внутри слота кнопка с `display: flex`, высота слота — 56. Ссылок на `SNewChatButton` не осталось. `ref` возврата фокуса проходит через `rest`. Наведение на нём ведёт себя как раньше: `:hover:enabled` на всегда активной кнопке.
  - **Кнопка отправки.** `type="submit"`, `SSendButton` удалён, `onMouseDown` с `preventDefault` сохранён. Enter в `textarea` форму не отправляет, поэтому двойной отправки нет.
- **Два наблюдателя одного запроса** (`MessageList` и `Composer`) — нормально: ключ и опции одинаковые, `select` нет. Оба подписываются в одном коммите, второй `executeFetch` получает уже идущий запрос (`fetchStatus: "fetching"`), второго сетевого запроса нет.
- **`getMessageToSend` + 3 теста** в `Composer/__tests__/` — по поправке (14). Тесты покрывают обрезку, пустой текст и незагруженную историю.
- **На Phase 9 (вне объёма фазы).** Phase 9 п. 2 говорит: «кэш `["messages", chatId]` существует → `updateMessages`». Запрос существует и тогда, когда история ещё грузится и данных нет. Если poller запишет туда входящее, повторится дыра из iter-1: `setQueryData` переводит запрос в `success`, скелетоны пропадают, а при неудаче загрузки ошибка с «Повторить» не покажется. При планировании Phase 9 условие стоит сформулировать как «данные ленты есть» (`getQueryData(...) !== undefined`), а не «запрос существует».
- Мелочь: комментарий `/** Сторона кнопки по размеру. */` у `SIZE_PX` (`IconButton/_styles.ts:5`) почти повторяет имя. Его смысл и так есть у `TIconButtonSize` в `_types.ts` («`md` — 44×44, `lg` — 56×56»). Можно убрать, не блокирует.
