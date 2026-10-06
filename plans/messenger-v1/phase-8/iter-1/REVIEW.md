MODE: review
STATUS: NEEDS_CHANGES
Issue source: both

## Summary

Phase 8, iter-1: мутация отправки, `Composer`, `SendIcon`, `ESendFailReason`, `ResizeObserver` в автопрокрутке. Логика мутации сделана аккуратно: локальная запись заменяется на своём месте, эхо не дублируется, снимок `isDeleted: false`, `applyLastMessage` получил импортёра. `scope` и `networkMode` проверены по исходникам `query-core@5.104.1`. Перезапуск Verification совпал с отчётом: `pnpm lint` 0, `pnpm build` 0, `pnpm test` 14 файлов / 172 теста, `prettier --check src` чисто. Блокирует одна ошибка с заметными последствиями: у `MessageList` и `Composer` одинаковый `key`. Я воспроизвёл её: после переключения чата старая лента остаётся в DOM. Остальное — догонка ленты при пометке «Не доставлено», общий слой для кнопки отправки и две дыры в плане.

## Issues

### Code issues

#### React: одинаковые ключи у соседей

- [code] `src/pages/ChatPage/_ChatPage.tsx:28-33` — `<MessageList key={chatId} />` и `<Composer key={chatId} />` — соседи в одном фрагменте с одинаковым ключом. React строит карту старых детей по ключу (`mapRemainingChildren`, `react-dom-client.development.js:6549`). При смене `chatId` (переход из чата A в чат B через список на десктопе, `ChatPage` при этом не перемонтируется) старый `MessageList` в карту не попадает и не удаляется. Воспроизведено на `react-dom@19.3.0` + jsdom с той же структурой:
  после A→B получается `<header/><section>list A</section><section>list B</section><form>composer B</form>`.
  Кроме того, на каждом рендере в консоль идёт `console.error("Encountered two children with the same key …")`. Последствия: две ленты делят колонку; у осиротевшей ленты не снимаются наблюдатель запроса и `ResizeObserver`; проверки «консоль чистая» падают. Заодно неверен новый JSDoc `ChatPage` («Лента и поле ввода пересоздаются при смене чата»): лента не пересоздаётся, а дублируется.
  Исправление: один ключ на обёртке — `<Fragment key={chatId}><MessageList chatId={chatId} /><Composer chatId={chatId} /></Fragment>` (дети без `key`), либо разные ключи (`messages-${chatId}` / `composer-${chatId}`). После этого JSDoc снова верен.

#### Автопрокрутка: пузырь растёт при «Не доставлено»

- [code] `src/pages/ChatPage/_internal/MessageList/_useAutoScroll.ts:37-41, 51-57` — лента догоняет низ только в двух случаях: выросло число сообщений (`hasGrown`) или изменилась высота самого контейнера (`ResizeObserver` на `containerRef`). Когда своё сообщение переходит из `SENDING` в `FAILED`, число записей не меняется, а контейнер не меняет размер. Зато `SMeta` (`float: right`, `MessageBubble/_styles.ts:72-76`) вместо «12:34» показывает «Не доставлено: нет связи с GREEN-API». На 390px пузырь ограничен 70% ширины, подпись перестаёт помещаться в последнюю строку текста, и пузырь вырастает на строку. Эта нижняя строка — сама пометка о недоставке — уходит под край ленты. Сценарий фазы `send_failed_offline` — ровно этот случай. Замечание ревью phase-7 (iter-1, `REVIEW.md:23`) называло его прямо: «`FAILED` с длинной причиной (Phase 8/9)». Закрыта только часть про рост поля ввода.
  Исправление (одно из двух): в `useLayoutEffect` докручивать вниз при **любой** смене `messages`, если `isNearBottomRef.current` (рост числа нужен только для ветки `isOwnSending`); или наблюдать тем же `ResizeObserver` ещё и содержимое ленты (`SContent`) — тогда покрывается любой рост пузыря. JSDoc хука дополнить.

#### Общий слой: кнопка отправки повторяет `IconButton` и FAB

- [code] `src/pages/ChatPage/_internal/Composer/_styles.ts:46-74` — `SSendButton` написан с нуля. При этом он повторяет общий `IconButton` (`src/components/IconButton/_styles.ts`: 44×44, `radii.pill`, `flex` по центру, `padding: 0`, `border: none`, `:focus-visible`) и дословно — заливку FAB-карандаша (`src/layouts/MessengerLayout/_internal/Sidebar/_styles.ts:90-115`: `onPrimary` / `primary`, `filter: brightness(0.92)`, outline, даже комментарий тот же). Потребители «круглой кнопки `primary`» теперь в двух фичах (`ChatPage` и `MessengerLayout`). По `structure.md` (лестница, ступень 5) общее поднимается в `src/components/`, а не копируется; так же поступили с `IconButton` и `Pill` (поправка (9)). Отсутствие варианта у `IconButton` — повод добавить вариант, а не причина копировать.
  Минимальное исправление: проп `variant?: "default" | "primary"` у `IconButton` (union литералов для пропа допустим по `typing.md`). Стили `primary`: заливка `primary`, иконка `onPrimary`, `:hover:enabled` → `brightness(0.92)`, `:disabled` → `opacity`, `outline-offset: 2px`, потому что внутренний outline цвета `primary` на заливке `primary` не виден. Кроме того, `IconButton` должен принимать `type` (сейчас `type` вырезан из пропсов и всегда `"button"`) — либо кнопка остаётся `type="button"` с `onClick` → `send`. `Composer` переходит на `<IconButton variant="primary" …>`. Переводить ли FAB на тот же вариант (обёртка — только размер 56 и позиционирование), решает владелец: по поправке (13) карандаш не считался потребителем кнопки 44×44.

### Plan issues

#### Контракт `failReason` и Phase 9

- [plan] Разработчик заменил `IMessage.failReason: string | null` на `ESendFailReason | null` и выбирает текст в пузыре (`getFailedLabel`). Это правильно: так устроены вход и «Новый чат» (UI выбирает текст по коду), а `i18n.md` требует, чтобы весь видимый текст шёл через словарь. Но план это пока не отражает:
  «Types and interfaces» (`failReason: string | null`), Phase 9 п. 2 (`outgoingMessageStatus` failed → `failReason = description`) и `brainstorm.md` решение 6a («с причиной из `description`»).
  `description` — свободный английский текст API (у свежего аккаунта `"peer flood"`, `brainstorm.md:135`). Показ его как есть нарушает `i18n.md` и постоянную проверку `raw_values_in_ui`.
  **Рекомендуемая поправка (Phase 9 + Types and interfaces):**
  - `failReason: ESendFailReason | null` закрепить в «Types and interfaces».
  - Phase 9: значения `description`, с которыми сравнивает код, — строковый `enum` в `notifications.schema.ts` (`typing.md`: значения полей GREEN-API — `enum` в `*.schema.ts`; поле в схеме остаётся `z.string().optional()`).
  - Известное значение (`peer flood`) → новый член `ESendFailReason` (например, `PEER_FLOOD`) + ключ словаря в `ru.json` и `I18n`; текст — на решение владельца, по смыслу «Telegram ограничил сообщения новым собеседникам».
  - Неизвестное или пустое `description` → `null` → голое «Не доставлено». `GENERIC` («ошибка отправки») для этого случая хуже: он описывает отказ нашего запроса, а здесь запрос прошёл и сообщение не доставил сам Telegram.
  - Отдельное поле со свободным текстом — **не** брать: это тот же сырой английский текст в русском интерфейсе.
  - Тест `_applyNotification`: `failed` + известное `description` → член `enum`; неизвестное → `null`.

#### Отправка до загрузки истории

- [plan] Phase 8 п. 1 велит в `onMutate` писать локальную запись через `updateMessages`. `updateMessages` создаёт данные запроса, даже если истории ещё нет (`messages.cache.ts:19-21`). `setQueryData` переводит запрос в `status: "success"` с `error: null` (`query-core` `query.js:437-449`, `successState`). Взаимодействие с состояниями ленты из Phase 7 план не описал, и `MessageList` (`_MessageList.tsx:33`, ошибка показывается только при `messages === undefined`) ведёт себя так:
  - история не загрузилась (на экране ошибка + «Повторить») → пользователь отправляет → ошибка и кнопка повтора исчезают, в ленте одно своё сообщение, история в этом заходе в чат не загрузится;
  - история ещё грузится → отправка → скелетоны пропадают; если загрузка потом упадёт, ошибку не покажут («ошибка обновления при показанных сообщениях не показывается»), и чат выглядит пустым.
  Наиболее вероятно это при плохой сети: тот же сценарий, что `send_failed_offline`.
  Минимальная поправка — выбрать одно:
  - (а) отправка доступна только после загрузки истории. Набирать можно, кнопка и Enter неактивны, пока запрос ленты не `isSuccess`. `Composer` читает тот же `useChatMessagesQuery(chatId)`: ключ общий, второго запроса не будет;
  - (б) `MessageList` показывает ошибку с повтором, пока история ни разу не загрузилась, независимо от локальных записей в кэше. Признак «история загружена» хранится отдельно: по состоянию запроса после `setQueryData` его уже не восстановить.

  Вариант (а) проще и не трогает Phase 7.

## Notes

- **Verification перезапущена**: `pnpm lint` (exit 0), `pnpm build` (exit 0), `pnpm test` (14 / 172), `pnpm exec prettier --check src` — всё совпадает с отчётом, команды не подменены.
- **`scope` + `networkMode: "always"` (вопрос 2) — корректно для 5.104.1.** `Mutation.execute` (`mutation.js:160-176`) сначала выполняет `dispatch("pending")` и `onMutate` и только потом `await retryer.start()`. Сообщение, стоящее в очереди `scope`, считается `isPaused` (`mutationCache.canRun`, `:77-83`) и всё равно сразу попадает в ленту. Следующее в очереди продолжает `runNext` (`:85-88`) после `finally`, в том числе после ошибки. С `networkMode: "always"` офлайн-запрос сразу падает с `NETWORK`, не уходя в паузу. Оговорки для бэклога, не находки:
  1. `canContinue` в `retryer.js:69` требует `focusManager.isFocused()`. Если вкладку скрыть сразу после отправки нескольких сообщений, ждущие в очереди уйдут, только когда она снова станет видимой.
  2. У клиента нет таймаута. Повисший `sendMessage` держит всю очередь чата, и следующие сообщения висят в `SENDING`.
- **IME (вопрос 3).** `nativeEvent.keyCode` в lib.dom типизирован как `number` и помечен только `@deprecated`: без `as`, lint чистый. Константа с объяснением — приемлемо. Отмена IME-Escape через `preventDefault` и пропуск по `defaultPrevented` в `_useChatPage.ts:51-57` согласованы с существующим протоколом. Остаточный риск, кроме Safari: на Android (Gboard) `keydown` во время композиции слова часто приходит с `keyCode` 229. Первый Enter тогда может только подтвердить слово, не отправив сообщение (кнопка отправки работает). Стоит проверить на устройстве.
- **`ResizeObserver` (вопрос 4).** Cleanup есть (`disconnect`). Цикла нет: размер контейнера от `scrollTop` не зависит. Докрутка — только у низа. Первый вызов сразу после `observe` безвреден. Пробел — рост содержимого (см. Issues).
- **Экспорт ради тестов (вопрос 7)** — как у `createChat` (импортёр — `__tests__`), находкой не считаю. На Phase 9: `failLocalMessage` / `confirmLocalMessage` — чистые операции над списком сообщений, как `mergeMessages`. Когда циклу получения понадобится «пометить `FAILED` по id» (`outgoingMessageStatus`), операцию стоит перенести в `messages.cache.ts` (имя без `Local`), а не импортировать модуль мутации в poller.
- **Бюджет (вопрос 6).** Минимальный набор самого плана — 5 созданных файлов + `_ChatPage.tsx`, `_icons.tsx`, `common.types.ts` (поправка (8)) = 8 при бюджете 7. Перерасход заложен в плане; остальные файлы объяснены отклонением `failReason` и замечанием ревью phase-7. Действий не требует.
- **Ключи `sendErrors`.** Теперь это словарь значений `enum`. `i18n.md`: «ключи для значений enum — `UPPER_SNAKE_CASE` и совпадают с членом enum», а ключи остались `quota` / `network` / `generic`, и соответствие задано отдельным `Record<ESendFailReason, string>`. Оно исчерпывающее, так что риска нет. Если Phase 9 добавит член, можно заодно привести ключи к правилу — решает владелец.
- **Ключ пузыря меняется при подтверждении** (`local-…` → `idMessage`): пузырь перемонтируется. На вид ничего не меняется, теряется только выделение текста внутри пузыря.
- **Часы браузера.** Время локальной записи и снимка превью берётся из `Date.now()`. Если часы отстают от сервера, `applyLastMessage` (`isNotOlder`) может не обновить превью, а сообщение встанет в ленте выше последних входящих. Эхо Phase 9 заменит запись серверным временем.
- **Проверено и в порядке:**
  - `SendIcon`: `d` совпадает с `send/materialsymbolsrounded/send_fill1_24px.svg` (скачано `curl`) и с `public/favicon.svg`.
  - `EKeyboardKey.ENTER` (поправка (8)).
  - `applyLastMessage`: заготовка из поправки (3) получила импортёра — четвёртый пункт проверки заготовок выполнен; `updateMessages` уже использовался.
  - Esc из поля закрывает чат (15); `isDeleted: false` в снимке (16).
  - Весь список поведения `Composer` из плана: `rows=1`, авто-высота с `border-box`, потолок 5 строк, `maxLength` 4096, 16px с комментарием, как в `Input`, Enter / Shift+Enter, `trim`, `disabled`, поле не блокируется, очистка, фокус.
  - Новых строк вне словаря нет. `ESendFailReason` лежит в `src/types/messages.types.ts`: потребители в `src/api/` и в странице. Комментарии без следов пайплайна.
- Радиус плашки — `panel`, а не «пилюля» из плана; разработчик это обосновал, оценка за визуальным ревьюером.
