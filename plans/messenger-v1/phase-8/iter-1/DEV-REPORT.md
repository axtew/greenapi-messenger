Status: COMPLETED

## Phase goal

Phase 8 — Отправка сообщений. Цель: поле ввода отправляет текст, сообщение сразу появляется в ленте и в превью списка, после ответа получает `idMessage`, при ошибке помечается «Не доставлено» с причиной. С учётом поправок: `EKeyboardKey.ENTER` (8), `applyLastMessage` / `updateMessages` (3)/(8), Esc из поля ввода закрывает чат (15), `isDeleted: false` у снимка (16). Отдельно — замечание ревью phase-7: лента должна оставаться внизу, когда растёт поле ввода.

## What was implemented

- **`useSendMessageMutation(chatId)`** (`src/api/mutations/messages.mutations.ts`):
  - `onMutate` создаёт локальное `IMessage` (`local-<uuid>`, `OUTGOING`, `SENDING`, время — сейчас в секундах) и кладёт его в ленту через `updateMessages(mergeMessages)`, а в список чатов — `updateChats(applyLastMessage)` со снимком `{ text, timestamp, OUTGOING, isDeleted: false }` и `incrementUnread: false`.
  - `onSuccess(idMessage)`: локальная запись получает `id = idMessage` и `SENT` на своём месте. Если запись с этим `idMessage` (эхо из очереди) уже в ленте, локальная просто убирается.
  - `onError`: локальная запись получает `FAILED` и `failReason` (`getSendFailReason`): 466 → `QUOTA`, `EGreenApiErrorKind.NETWORK` → `NETWORK`, остальное → `GENERIC`. Повтора нет.
  - Сверх плана, оба пункта названы в JSDoc:
    - `scope: { id: "sendMessage:<chatId>" }`: отправки одного чата идут на сервер по очереди, порядок сообщений сохраняется. `onMutate` в TanStack Query 5.104.1 выполняется сразу и для scoped-мутаций (проверено по `query-core/build/modern/mutation.js`), так что каждое сообщение появляется в ленте мгновенно.
    - `networkMode: "always"`: при `networkMode` по умолчанию (`online`) без сети мутация встаёт на паузу до появления сети, и пузырь висел бы в `SENDING`. Сценарий `send_failed_offline` тогда не получил бы «нет связи с GREEN-API».
  - Чистые части экспортируются и покрыты тестами: `createLocalMessage`, `confirmLocalMessage`, `failLocalMessage`, `getSendFailReason`. Экспорт ради тестов сделан так же, как у `createChat` в `chats.mutations.ts`.
- **Откуда берётся текст `failReason`.** Мутация словарь не читает, как и на входе / в «Новом чате». Там текст выбирает UI по классу / `kind` / `status`. Поэтому `IMessage.failReason` стал `ESendFailReason | null` (строковый `enum` `QUOTA` / `NETWORK` / `GENERIC` в `src/types/messages.types.ts`) вместо `string | null` из «Types and interfaces». Пузырь сопоставляет код с `sendErrors.*` в `MessageBubble/_helpers.ts` → `getFailedLabel` (`Record<ESendFailReason, string>`). Ключи словаря (`sendErrors.quota` и т. д.) не менялись.
- **`Composer`** (`src/pages/ChatPage/_internal/Composer/`):
  - белая плашка, `textarea rows={1}`, высота по содержимому в `useLayoutEffect` (`auto` → `scrollHeight`), потолок `max-height` в 5 строк, `maxLength={4096}`, `font-size: 16px`, `enterKeyHint="send"`;
  - Enter отправляет, Shift+Enter переносит строку;
  - пустой после `trim` текст не отправляется, кнопка `disabled`;
  - отправляется обрезанный текст (`trim`);
  - поле не блокируется, после отправки очищается и остаётся в фокусе: `focus()` после отправки и `preventDefault` на `mousedown` кнопки, чтобы на телефоне не закрывалась клавиатура.
- **Esc и IME.** Обработчик поля событие Escape не останавливает: оно всплывает к слушателю на `document` в `_useChatPage`, и чат закрывается. Клавиши IME поле пропускает, если `nativeEvent.isComposing` **или** `keyCode === 229`. Второе условие нужно для Safari: отменяющее Escape и подтверждающий Enter он присылает уже после `compositionend` с `isComposing === false`, но с `keyCode` 229. Escape из IME поле отменяет (`preventDefault`), и слушатель чата пропускает его по `defaultPrevented`, как в существующем протоколе меню / панелей. Enter из IME не отправляет. `keyCode` в lib.dom помечен deprecated, но это единственный признак такого события; решение описано в комментарии константы. В Safari вживую **не проверялось**.
- **Лента внизу при росте поля.** В `_useAutoScroll` добавлен `ResizeObserver` на скролл-контейнер: когда меняется высота самой ленты (растёт поле ввода, меняется окно или появляется клавиатура телефона), лента, которая была у низа (≤ 80px), снова прокручивается вниз. Читающего старые сообщения не сдвигает.
- **`ChatPage`**: под лентой — `<Composer key={chatId} />`. Ключ сбрасывает набранный текст при смене чата (черновики в бэклоге). Пока чат ищут в списке, поля ввода нет.
- `EKeyboardKey.ENTER` добавлен в `src/types/common.types.ts`. `SendIcon` добавлен через внутреннюю базу `SvgIcon`. Путь скачан `curl`'ом с `send/materialsymbolsrounded/send_fill1_24px.svg` и совпадает с путём в `public/favicon.svg`.

## UIKit wrappers

Обёрток `styled(<примитив проекта>)` нет. Кнопка отправки — свой `styled.button` в `Composer/_styles.ts` по образцу FAB-карандаша (`SNewChatButton`). `IconButton` прозрачный, а варианта с заливкой `primary` у него нет.

## Files created

- `src/api/mutations/messages.mutations.ts` — `useSendMessageMutation` и чистые операции над локальным сообщением.
- `src/api/mutations/__tests__/messages.mutations.test.ts` — тесты `createLocalMessage`, `confirmLocalMessage` (в том числе эхо без дубля), `failLocalMessage`, `getSendFailReason` (466 / сеть / 500 / неверный ответ / не `GreenApiError`).
- `src/pages/ChatPage/_internal/Composer/index.ts` — barrel.
- `src/pages/ChatPage/_internal/Composer/_Composer.tsx` — разметка поля и кнопки.
- `src/pages/ChatPage/_internal/Composer/_styles.ts` — плашка, `textarea`, круглая кнопка `primary`.
- `src/pages/ChatPage/_internal/Composer/_useComposer.ts` — состояние текста, авто-высота, клавиши, отправка.

## Files modified

- `src/pages/ChatPage/_ChatPage.tsx` — `Composer` под лентой, JSDoc.
- `src/components/icons/_icons.tsx` — `SendIcon`.
- `src/types/common.types.ts` — `EKeyboardKey.ENTER`.
- `src/types/messages.types.ts` — `enum ESendFailReason`; `IMessage.failReason: ESendFailReason | null`.
- `src/pages/ChatPage/_internal/MessageList/_internal/MessageBubble/_MessageBubble.tsx` — подпись недоставленного через `getFailedLabel`; срез i18n `{ ...l.chat, sendErrors }`.
- `src/pages/ChatPage/_internal/MessageList/_internal/MessageBubble/_helpers.ts` — `getFailedLabel`.
- `src/pages/ChatPage/_internal/MessageList/_internal/MessageBubble/__tests__/_helpers.test.ts` — тесты `getFailedLabel`.
- `src/pages/ChatPage/_internal/MessageList/_useAutoScroll.ts` — `ResizeObserver`: лента у низа остаётся внизу, когда меняется её высота.

## Figma extraction

Figma нет. Поверхность `Composer` — `Reference: docs/design/02-wide-chat.png`, `05-mobile-chat.png`:

- белая плашка по ширине колонки, `radii.panel` (24px), отступ 8px от ленты;
- одна строка — 56px: `textarea` 44px с внутренним отступом 11px и `line-height` 22px, кнопка 44px, отступы плашки 6/6/6/20;
- при многострочном тексте кнопка прижата к низу; потолок — 5 строк (132px), дальше прокрутка внутри поля;
- кнопка отправки — круг `primary` с белой `SendIcon`, на месте микрофона из референса; скрепки и эмодзи нет.

Радиус выбран `panel`, а не `pill`, как у шапки: стадион-форма на многострочном поле смотрится плохо. Это решение на моё усмотрение.

## Verification

Команды Verification фазы — дословно:

- `pnpm format` (prettier по `src`).
- `pnpm lint` — exit 0, без ошибок и предупреждений. Базовая линия (`plans/messenger-v1/baseline/`) тоже чистая.
- `pnpm build` — exit 0 (`tsc -b && vite build`).
- `pnpm test` — 14 файлов, 172 теста, все прошли.
- **Экспорты:**

  | Символ | Импортёр |
  |---|---|
  | `useSendMessageMutation` | `_useComposer.ts` |
  | `ESendFailReason` | мутация, `MessageBubble/_helpers.ts`, тесты |
  | `getFailedLabel` | `_MessageBubble.tsx`, тест |
  | `SendIcon` | `_Composer.tsx` |
  | `Composer` | `_ChatPage.tsx` |
  | `createLocalMessage` / `confirmLocalMessage` / `failLocalMessage` / `getSendFailReason` | хук в том же модуле (вне модуля — тест), как `createChat` |

  У заготовки `applyLastMessage` (поправка (3)) теперь есть импортёр — мутация. `updateMessages` уже использовался.
- **Stop condition:**
  - «сообщение видно сразу»: локальная запись в `onMutate`, автопрокрутка по своему `SENDING`;
  - «при сетевой ошибке — "Не доставлено: нет связи с GREEN-API"»: `NETWORK` → `sendErrors.network`, `networkMode: "always"`;
  - выполнено по коду и unit-тестам. Доставку получателю подтверждает владелец.
- **Runtime / браузер:** разработчик **не проверял**. Реальных сообщений не отправлял, креды и браузер не трогал. Visual Verification (`send_appears`, `shift_enter_newline`, `empty_disabled`, `send_failed_offline`, `list_preview_updated`) — за визуальным ревьюером. Секреты в вывод инструментов не попадали. `.playwright-mcp/` нет.

## Known issues

- **Budget.** Operation budget 7 превышен: 6 файлов создано, 8 изменено. Сверх плана — поправки и замечание ревью: тип `failReason` → `enum` с правкой пузыря и его тестов, `ResizeObserver` в `_useAutoScroll`.
- **Расхождение с планом: тип `IMessage.failReason`.** Было `string | null`, стало `ESendFailReason | null`, по паттерну «текст выбирает UI» (мутация словарь не читает). Влияние на **Phase 9**: п. 2 говорит «`outgoingMessageStatus` failed → `failReason = description`», а свободный текст `description` в `enum` не ложится. Phase 9 нужно решение планировщика / владельца, варианты:
  - `failReason: null` (только «Не доставлено»);
  - новый член `enum` (например, `PEER_FLOOD`) с новым ключом словаря.

  Описывать это нужно в поправке к Phase 9.
- **Safari IME.** Обработка по `keyCode === 229` не проверена в живом Safari: ни Escape отмены композиции, ни Enter подтверждения. В Chrome / Firefox такие нажатия отсекает `isComposing`. Остаточный риск: если какая-то версия Safari пришлёт эти события с реальным `keyCode`, Escape закроет чат, а Enter отправит недописанное.
- **Enter на мобильной** тоже отправляет (по плану). Перенос строки с экранной клавиатуры без Shift недоступен.
- **Кандидат на подъём в общий слой.** У `SSendButton` (Composer) и `SNewChatButton` (Sidebar) одинаковые цвета, hover и focus, отличаются размер и позиционирование. Общий компонент «круглая кнопка `primary`» можно поднять в `src/components/`. В этой фазе не делал, чтобы не трогать `Sidebar` вне scope; решение за владельцем.
- **Локальное время сообщения** — часы браузера. Сервер может дать другое `timestamp`; эхо из очереди (Phase 9) заменит запись серверной.
