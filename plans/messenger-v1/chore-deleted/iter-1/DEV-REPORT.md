Status: COMPLETED

## Phase goal
Заход `chore-deleted` (вне фаз, перед Phase 8) по поправке (16) «Сообщение удалено»: запись удаления не скрывается, а показывается заглушкой
`chat.deletedMessage` курсивом цветом `textMuted` — в ленте (Phase 7) и в превью списка чатов (Phase 5). Старый текст из записи удаления нигде
не отображается. Пункт поправки про Phase 9 (`applyNotification`) — на потом, не тронут.

## What was implemented
- Ключ словаря `chat.deletedMessage` = «Сообщение удалено» (`ru.json` — единственный словарь в `public/dictionaries/`, + интерфейс `I18n`).
- **Сервис (выбор по п. 3 задания):** `getHistoryText` в `messages.service.ts` возвращает `null` для записи с `isDeleted: true`.
  Старый текст удалённого сообщения отбрасывается на границе API и не может попасть ни в ленту, ни в превью, ни в localStorage.
  UI при этом не полагается на `text === null`: и пузырь, и превью сначала проверяют `isDeleted`. Это задел на будущие пути данных
  (уведомления Phase 9).
- `mergeMessages`: оригинал по `replacesId` по-прежнему убирается. Запись удаления больше не выбрасывается и встаёт в ленту по своему `timestamp`.
  Правки не изменились. JSDoc обновлён.
- `MessageBubble`: удалённая запись — `SNotice` (курсив) с `chat.deletedMessage`, цвет `textMuted` через проп `color` у `B1`, время как у обычного
  сообщения. Кнопки «Показать» нет. `SUnsupported` переименован в `SNotice`: курсивная пометка теперь общая для удалённых и неподдерживаемых.
- `buildListItems` не менялся. У заглушки сохраняется направление записи удаления (в живых данных `type` бывает и `incoming`, и `outgoing`),
  поэтому она входит в группу своего отправителя и хвостик ставится как у обычного пузыря. На это добавлен тест.
- Превью списка: у `IChatLastMessage` новое поле `isDeleted: boolean`. `fetchLastMessage` больше не отбрасывает запись удаления, она становится
  снимком (`text: null`, `isDeleted: true`). Правило «запись `isDeleted` не берётся» отменено, по поправке.
  `ChatListItem` показывает `chat.deletedMessage` курсивом: transient-проп `$isItalic` у `SPreview`. Курсив стоит на самом элементе с обрезкой,
  поэтому многоточие тоже курсивное. Цвет прежний: `textMuted`, у выбранного чата — `onPrimary`.
- Схема хранилища списка: `lastMessage.isDeleted: z.boolean().default(false)`. Старые записи без поля читаются как неудалённые.
- `applyLastMessage` не менялся. Правило «не старее» (`>=`) работает и для заглушки: удаление с тем же или более поздним временем заменяет снимок.

### UIKit wrappers
- `SPreview` (`styled(B1)`, существовал): добавлен `font-style` по `$isItalic`. У `B1` нет пропа начертания, а курсив должен стоять на элементе
  с `text-overflow`.

## Files created
- `plans/messenger-v1/chore-deleted/iter-1/DEV-REPORT.md` — этот отчёт.

## Files modified
- `public/dictionaries/ru.json` — ключ `chat.deletedMessage`.
- `src/types/i18n.types.ts` — `chat.deletedMessage`.
- `src/types/messages.types.ts` — JSDoc `text` (null и у записи удаления) и `isDeleted`.
- `src/types/chats.types.ts` — `IChatLastMessage.isDeleted`, JSDoc `text`.
- `src/api/services/messages.service.ts` — текст записи удаления → `null`, JSDoc.
- `src/api/cache/messages.cache.ts` — запись удаления остаётся в результате `mergeMessages`, JSDoc.
- `src/api/cache/chats.cache.ts` — схема хранилища: `lastMessage.isDeleted` с `default(false)`.
- `src/api/queries/chats.queries.ts` — `fetchLastMessage` берёт и запись удаления, снимок с `isDeleted`; JSDoc.
- `src/pages/ChatPage/_internal/MessageList/_internal/MessageBubble/_MessageBubble.tsx` — заглушка удалённого, JSDoc.
- `src/pages/ChatPage/_internal/MessageList/_internal/MessageBubble/_styles.ts` — `SUnsupported` → `SNotice` с JSDoc.
- `src/layouts/MessengerLayout/_internal/Sidebar/_internal/ChatListItem/_ChatListItem.tsx` — превью удалённого.
- `src/layouts/MessengerLayout/_internal/Sidebar/_internal/ChatListItem/_styles.ts` — `SPreview` с `$isItalic`.
- Тесты:
  - `src/api/cache/__tests__/messages.cache.test.ts` — заглушка вместо скрытия; удаление в одном ответе с оригиналом; удаление без оригинала;
    повторное слияние без дублей.
  - `src/api/__tests__/api.test.ts` — у записи удаления `text: null`.
  - `src/api/cache/__tests__/chats.cache.test.ts` — чтение старого снимка без `isDeleted`; удаление с тем же временем становится снимком;
    `makeLastMessage` с `isDeleted`.
  - `src/api/queries/__tests__/chats.queries.test.ts` — запись удаления становится снимком, порядок списка; фикстуры с `isDeleted`.
  - `src/pages/ChatPage/_internal/MessageList/__tests__/_helpers.test.ts` — заглушка в группе своего отправителя.

## Figma extraction
Figma нет (`design.source: none`), поверхности — `Free choice` по поправке (16).
- Пузырь удалённого: пометка курсивом в `textMuted` на фоне пузыря своего направления, время справа как обычно; по образцу пометки
  о неподдерживаемом типе.
- Превью удалённого в списке: курсив, цвет как у обычного превью (`textMuted` / `onPrimary` у выбранного).

## Verification
Baseline: `plans/messenger-v1/baseline/` — снят перед Phase 1. На HEAD `7e396c9` перед правками перепроверен: `pnpm lint` 0, `pnpm build` 0,
`pnpm test` 152/152.
- `pnpm format` — exit 0.
- `pnpm lint` — exit 0, ошибок и предупреждений нет.
- `pnpm build` — exit 0.
- `pnpm test` — 13 файлов, 157/157.
- Экспорты: новых нет. `SNotice` — переименованный `SUnsupported`, его импортирует `_MessageBubble.tsx`.
- Stop condition (пункты 1–5 задания): выполнены. Phase 8 и пункт поправки про Phase 9 не тронуты.
- Runtime / браузер: разработчиком не проверялось. Визуальная проверка — за ревьюером, если она будет назначена.
- `.playwright-mcp/` нет. Временный скрипт живой проверки (в scratchpad, вне репозитория) удалён.

### Живая проверка: `timestamp` записи удаления
Один `getChatHistory` (count 100) на тестовый чат из `.env.local`, через локальный Node-скрипт. В вывод попали только статус, `type`,
`typeMessage`, `timestamp`, флаги и совпадения id. Токен, `idInstance`, `chatId` и тексты в вывод не попадали.
- Статус 200. 11 записей, от новых к старым:
  `1791265462[DEL+EDIT] 1791265448[EDIT] 1791100144 1791096851[EDIT] 1791096839[DEL] 1791095493 1791095480 1791095467 1791043517 1791042289 1791042277`.
- В истории две записи удаления (`isDeleted: true`, `textMessage`, `deletedMessageId` непустой):
  - индекс 4, `outgoing`, ts `1791096839`;
  - индекс 0, `incoming`, ts `1791265462`.
  У обеих **`deletedMessageId` не совпадает ни с одним `idMessage` в истории**: оригинал из истории пропадает, как и записано в `brainstorm.md`.
  Поэтому сравнить время напрямую нельзя: времени оригинала в ответе нет.
- Косвенный признак — время удаления, а не время оригинала. Запись удаления с индексом 0 идёт через 14 с после записи правки
  `1791265448`. Если обе относятся к одному сообщению (правка, затем удаление), то время оригинала не позже времени правки,
  а у записи удаления время больше. Значит, это время удаления.
- Вывод: по-видимому, `timestamp` записи удаления — время удаления, но это не доказано напрямую. Код от этого не зависит:
  заглушка стоит по `timestamp` записи удаления.

## Known issues
1. **Удаление отредактированного сообщения — правка может остаться видимой (не исправлено, нужно решение владельца).**
   У новейшей записи удаления (индекс 0) непустой не только `deletedMessageId`, но и `editedMessageId`. Сервис берёт
   `replacesId = editedMessageId || deletedMessageId`, то есть у такой записи ссылка идёт по `editedMessageId`.
   Запись правки (индекс 1, `replacesId` = id оригинала) убирается, только если `replacesId` записи удаления указывает на неё
   или на тот же оригинал. Если ссылки расходятся, в ленте останутся и отредактированный текст, и заглушка.
   Чтобы понять, какой это случай, нужно сравнить `editedMessageId` / `deletedMessageId` записи удаления с `idMessage` и `editedMessageId`
   записи правки. Для этого нужен второй вызов, а задание разрешало один.
   Это тот самый вопрос из `phase-7/iter-1/REVIEW.md`. Возможная правка: запись удаления убирает и записи с тем же `replacesId`
   (все версии сообщения) и/или учитывает обе ссылки. Нужны решение владельца и одна дополнительная живая проверка.
2. **Удаление старого (не последнего) сообщения.** Если `timestamp` записи удаления — время удаления, такая запись становится самой новой.
   Тогда превью списка покажет «Сообщение удалено», хотя последнее видимое сообщение другое, а заглушка в ленте встанет в конец, а не на место
   оригинала. Это следует из поправки («заглушка встаёт по нему, без доработок») и записано для сведения.
3. Планировщик: поправка (16) не уточняет, нужен ли курсив пометке о неподдерживаемом типе в превью списка. Она осталась прямым шрифтом,
   как было. В пузыре она курсивная, как и раньше.
4. Секреты в вывод инструментов не попадали.
