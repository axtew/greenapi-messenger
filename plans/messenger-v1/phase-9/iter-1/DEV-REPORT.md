Status: COMPLETED

## Phase goal
Phase 9 — получение сообщений. Входящие сообщения появляются в открытом чате и в списке: у неоткрытых чатов растёт бейдж, от нового собеседника появляется новый чат. Статус `failed` помечает сообщение недоставленным. Очередь читает одна вкладка (Web Lock). Если настройки инстанса не дают получать сообщения, показывается предупреждение. В объём вошли поправки (8), (9), (12), (14), (16), (17), (18), (19) и пункты Phase 9 из «Phases 2, 3, 6, 7, 9» и «Phase 3 — added 2026-10-05».

## What was implemented
- **Слой GREEN-API.** Добавлены `EGreenApiMethod.RECEIVE_NOTIFICATION` / `DELETE_NOTIFICATION` и `EHttpMethod.DELETE`.
- **`notifications.schema.ts`.**
  - Строковые `enum`: `ETypeWebhook` (используемые значения `typeWebhook`) и `EOutgoingStatusDescription` (`PEER_FLOOD = "peer flood"`; поле `description` остаётся `z.string().optional()`).
  - Схема ответа `receiveNotification`: `null` при пустой очереди; иначе `{ receiptId, body }`. Тело неизвестного типа или чужой формы превращается в `null` через `.catch(null)` и не ломает ответ: `receiptId` сохраняется, уведомление удаляется.
- **`notifications.service.ts`.**
  - `receiveNotification(receiveTimeout, signal)` возвращает `{ receiptId, notification } | null`; `deleteNotification(receiptId)` отправляет `DELETE …/<receiptId>`.
  - Разбор переводит уведомление в типы проекта (`TNotification`, вид — `ENotificationKind`: `MESSAGE` / `MESSAGE_FAILED` / `IGNORED`).
  - `typeMessage` сравнивается с `ETypeMessage`, `status` — с `EStatusMessage.FAILED`. Новые члены `ETypeMessage`: `EDITED_MESSAGE`, `DELETED_MESSAGE`.
  - Уведомление об удалении (`deletedMessageData.stanzaId`) становится записью удаления: `isDeleted: true`, `text: null`, обе ссылки на удалённое. Это правило заглушки из поправки (16).
  - `failed` с `peer flood` даёт `ESendFailReason.PEER_FLOOD`, неизвестная или пустая причина — `failReason: null`. Статусы `delivered` / `read` и прочие — `IGNORED`.
- **`IMessage.deletedMessageId`** (поправка (17)): второе поле ссылки у записи удаления. Сервис истории заполняет `replacesId` (как раньше) и `deletedMessageId`, разбор уведомлений — тоже оба поля.
- **`mergeMessages`** (поправка (17)): запись удаления скрывает каждую неудалённую запись, у которой `id` или `replacesId` входит в набор её непустых ссылок. Заглушка остаётся, обычное правило правок не изменилось.
- **`markMessageFailed(messages, id, failReason | null)`** живёт в `messages.cache.ts` (поправка (18)) и заменяет `failLocalMessage` из мутации отправки. Мутация теперь использует его, poller мутацию не импортирует.
- **`_applyNotification.ts`.**
  - Сообщение попадает в список чатов, только если запрос `["chats", idInstance]` уже есть в кэше (поправка (12)). Неизвестный чат добавляется через `upsertContact(..., { isProfileLoaded: false })` с именем `chatName || senderName || chatId`, затем вызывается `enrichChat(chatId)`.
  - Дальше `applyLastMessage`. `+1` к непрочитанным получает только новое входящее (не правка и не удаление) в чате, отличном от `activeChatId`.
  - В ленту сообщение пишется, только если у неё есть данные: `getQueryData !== undefined` (поправка (19)).
  - Эхо с тем же `id` заменяет запись: время становится серверным, дубля нет. Если запись уже помечена `FAILED`, пометка сохраняется.
  - `MESSAGE_FAILED` вызывает `markMessageFailed`, тоже только при загруженной ленте.
- **`_poller.ts` — `startPoller`.**
  - Цикл идёт по псевдокоду плана под Web Lock `greenapi-messenger:poller:<idInstance>` с `signal`.
  - Обработка: `receiveNotification(20, signal)` → `onNotification` → `deleteNotification`. Исключение в обработчике пишется в `console.error`, удаление всё равно выполняется.
  - Ошибки: abort — выход; 401 — `onUnauthorized` и выход; остальные — пауза `min(max(delay*2, 1000), 30000)` через `wait(delay, signal)`.
  - Без `navigator.locks` цикл идёт без блокировки, с `console.warn`.
- **`wait(ms, signal)`** — `src/utils/helpers/wait.ts`, общий слой. JSDoc говорит, что функция заменяет и почему. Прерывание отклоняет промис с `signal.reason` и снимает таймер.
- **`useInstanceSettingsQuery()`** — `getInstanceSettings`, `staleTime` 5 минут.
- **`_useMessengerLayout.ts`.**
  - `useEffect` по `idInstance` запускает `startPoller`. Открытый чат берётся из `useParams({ strict: false }).chatId` через `useLatest`, поэтому смена чата цикл не перезапускает.
  - `onUnauthorized` вызывает `signOut(ESignOutReason.EXPIRED)`, cleanup — `stop()`.
  - Хук возвращает `isChatOpen`: `useParams` из `_MessengerLayout.tsx` переехал в хук.
- **`SettingsWarning`** стоит между шапкой и списком `Sidebar`. `webhookUrl !== ""` → `settingsWarning.webhookUrl`; `!isIncomingEnabled` → `settingsWarning.incomingDisabled`; под ними `settingsWarning.hint`. Пока нет данных (загрузка или ошибка) или проблем нет, компонент ничего не рендерит.
- **Словарь** (поправка (18)).
  - Ключи `sendErrors` переименованы в `QUOTA`, `NETWORK`, `GENERIC` и добавлен `PEER_FLOOD` = «Telegram ограничил отправку сообщений с этого аккаунта» (текст одобрен владельцем).
  - В `I18n` `sendErrors` теперь `Record<ESendFailReason, string>`, `getFailedLabel` берёт `l.sendErrors[failReason]` без промежуточного справочника.

## Files created
- `src/api/schemas/notifications.schema.ts` — `ETypeWebhook`, `EOutgoingStatusDescription`, схемы `receiveNotification` / `deleteNotification`.
- `src/api/services/notifications.service.ts` — `receiveNotification`, `deleteNotification`, разбор уведомления в `TNotification`.
- `src/types/notifications.types.ts` — `ENotificationKind`, `TNotification`, `IReceivedNotification`.
- `src/api/poller/index.ts` — barrel: `applyNotification`, `startPoller`.
- `src/api/poller/_poller.ts` — цикл long-polling с Web Lock и паузой между повторами.
- `src/api/poller/_applyNotification.ts` — применение уведомления к списку чатов и ленте.
- `src/api/poller/__tests__/_applyNotification.test.ts` — все ветки `applyNotification` (17 тестов).
- `src/layouts/MessengerLayout/_useMessengerLayout.ts` — запуск poller'а из каркаса, `isChatOpen`.
- `src/layouts/MessengerLayout/_internal/Sidebar/_internal/SettingsWarning/{index.ts,_SettingsWarning.tsx,_styles.ts}` — предупреждение о настройках инстанса.
- `src/utils/helpers/wait.ts` — прерываемая пауза.
- `src/utils/helpers/__tests__/wait.test.ts` — тесты `wait`.

## Files modified
- `src/api/greenApi/_types.ts` — методы `RECEIVE_NOTIFICATION` / `DELETE_NOTIFICATION`, `EHttpMethod.DELETE`.
- `src/api/schemas/messages.schema.ts` — `ETypeMessage.EDITED_MESSAGE` / `DELETED_MESSAGE`, JSDoc.
- `src/api/services/_helpers.ts` — `isPersonalChatId`; общий с `getChatIds`.
- `src/api/services/chats.service.ts` — `getChatIds` использует `isPersonalChatId`.
- `src/api/services/messages.service.ts` — история заполняет `deletedMessageId`.
- `src/types/messages.types.ts` — `IMessage.deletedMessageId`; `ESendFailReason.PEER_FLOOD`; значения `ESendFailReason` совпадают с именами членов (это ключи словаря).
- `src/api/cache/messages.cache.ts` — новое правило удаления в `mergeMessages`, `markMessageFailed`.
- `src/api/mutations/messages.mutations.ts` — `failLocalMessage` удалён, используется `markMessageFailed`; у локального сообщения есть `deletedMessageId: null`.
- `src/api/mutations/chats.mutations.ts` — `enrichChat(queryClient, idInstance, chatId)`: `getContact` + `updateChats(upsertContact, { isProfileLoaded: true })`; при сбое запись не трогается.
- `src/api/queries/account.queries.ts` — `useInstanceSettingsQuery`.
- `src/layouts/MessengerLayout/_MessengerLayout.tsx` — вызов `useMessengerLayout()`.
- `src/layouts/MessengerLayout/_internal/Sidebar/_Sidebar.tsx` — `<SettingsWarning />` под шапкой, JSDoc.
- `src/types/i18n.types.ts` — `sendErrors: Record<ESendFailReason, string>`.
- `public/dictionaries/ru.json` — ключи `sendErrors.*` в `UPPER_SNAKE_CASE`, `PEER_FLOOD`.
- `src/pages/ChatPage/_internal/MessageList/_internal/MessageBubble/_helpers.ts` — `getFailedLabel` берёт причину из словаря напрямую.
- Тесты:
  - `src/api/__tests__/api.test.ts`: блок `notifications.service` (17 тестов); запись удаления в истории с обеими ссылками.
  - `src/api/cache/__tests__/messages.cache.test.ts`: 4 новых случая `mergeMessages` и блок `markMessageFailed`.
  - `src/api/mutations/__tests__/messages.mutations.test.ts`: блок `failLocalMessage` перенесён как `markMessageFailed`.
  - `MessageBubble/__tests__/_helpers.test.ts`: ветка `PEER_FLOOD`.
  - `chats.queries.test.ts`, `MessageList/__tests__/_helpers.test.ts`: в фабрики добавлено `deletedMessageId: null`.

## Figma extraction
Figma нет. `SettingsWarning` — Free choice: плашка на `surfaceMuted` с полосой `danger` 3px слева, радиус `radii.item`, отступы 8/12, поле 16px по бокам (как у шапки панели). Строки о проблемах — `B2` цветом `danger`, подсказка — `Caption` `textMuted`, `role="status"`. Только токены темы.

## Verification
- Baseline: использованы существующие логи `plans/messenger-v1/baseline/`, заново не снимались. До начала работы проверено, что дерево зелёное: `pnpm test` 175/175, `pnpm lint` exit 0.
- `pnpm format` — выполнено (prettier переформатировал 4 новых файла).
- `pnpm lint` — exit 0, без ошибок и предупреждений.
- `pnpm build` (`tsc -b && vite build`) — exit 0.
- `pnpm test` — exit 0: 17 файлов, 219 тестов. Новые: `applyNotification` (17), разбор уведомлений и `deleteNotification` (17), `mergeMessages` (4), `markMessageFailed` (3), `wait` (3), `getFailedLabel` `PEER_FLOOD` (1). Проверка `tsc --skipLibCheck false` не нужна: `.d.ts` не менялись.
- Exports: у всех новых экспортов есть импортёр вне модуля:
  - `startPoller`, `applyNotification`, `enrichChat`, `useMessengerLayout` → `_useMessengerLayout.ts` / `_MessengerLayout.tsx`;
  - `markMessageFailed` → мутация и poller;
  - `wait` → `_poller.ts`;
  - `isPersonalChatId` → два сервиса;
  - схемы и `enum` уведомлений → сервис;
  - типы уведомлений → сервис и poller;
  - `useInstanceSettingsQuery` → `SettingsWarning`.

  `IApplyNotificationContext` не экспортируется. Заготовок нет.
- Phase stop condition:
  - на уровне кода выполнено: входящее пишется в загруженную ленту открытого чата; вторая вкладка ждёт Web Lock;
  - **в рантайме разработчик не проверял**: живой poller не запускался, сообщения не отправлялись, `getContactInfo` / `checkAccount` не вызывались;
  - Visual Verification (`poller_running`, `send_no_duplicate`, `single_consumer`, `no_settings_warning`, `logout_stops_poller`) — за визуальным ревьюером, ответ собеседника — за владельцем.
- Секреты: живых запросов к GREEN-API не было, `.env.local` не читался. Документация GREEN-API скачивалась `curl` по публичным адресам — без кредов.
- Бюджет: план — 13 операций. Фактически — 14 созданных файлов (с тестами и 3 файлами `SettingsWarning`) и 21 изменённый, около 35 файловых операций. Основную часть добавили поправки (17), (18), (19) и обновление фабрик `IMessage` в тестах.

## Known issues
- **Правки из уведомлений (`typeMessage: editedMessage`) разбираются, хотя план их прямо не называет.** Документация Telegram описывает `editedMessageData.{textMessage, stanzaId}` рядом с `deletedMessage` — формой, которую поправка (16) велела сверить. Без разбора правка пришла бы пузырём «не поддерживается» рядом с исходным текстом. Сделано тем же правилом, что в истории: `replacesId = stanzaId`, текст правки. Оба вида уведомлений GREEN-API шлёт, только если в инстансе включены `editedMessageWebhook` / `deletedMessageWebhook`.
- **Уведомления из групп и каналов (chatId ≤ 0) разбираются в `IGNORED`** (удаляются, в список не попадают). Это то же правило «только личные», что у синхронизации списка (`isPersonalChatId` теперь общий с `getChatIds`). План этот случай не оговаривал.
- **Правка и удаление не увеличивают счётчик непрочитанных** — это не новое сообщение. Требование плана «+1 только для INCOMING вне активного чата» соблюдено, правило лишь строже.
- **Отклонение от плана по месту `enrichChat`.** План описывает его как `getContact` + `updateChats(upsertContact)` внутри `_useMessengerLayout`. Тело вынесено в `src/api/mutations/chats.mutations.ts` (рядом с `createChat`, той же природы), хук передаёт замыкание. Причина — путь данных из `architecture.md`: каркас не вызывает сервис напрямую.
- **Типы уведомлений лежат в `src/types/notifications.types.ts`**, а не в файлах, перечисленных в плане. Сервис — граница типов, а потребитель — poller (`typing.md`, `structure.md`).
- **Документация GREEN-API показывает примеры `failed` без `idMessage`.** В `brainstorm.md` проверена на живом инстансе форма с `idMessage`, и схема требует это поле. Уведомление без `idMessage` уходит в `IGNORED`: без id помечать нечего.
- **Статус `noAccount`** документация требует обрабатывать. По плану («прочие статусы — без изменений») он сейчас `IGNORED`. Наши chatId приходят из `checkAccount` и входящих, так что на практике статус маловероятен; если его стоит показывать как «Не доставлено», это решение для плана или бэклога.
- **Если `deleteNotification` упал после обработки**, очередь отдаст то же уведомление снова. Сообщение не задвоится (слияние по `id`), но непрочитанные могут получить ещё `+1`.
- **Обобщённый guard принадлежности к `enum` не понадобился**: тело уведомления сужается zod-схемой. `isSignOutReason` не трогался.
- Planner-drift:
  - в таблицах «Files to create / Files to modify» остались старые пути (`src/routes/layouts/…`, `src/components/Sidebar/…`) — использованы пути из поправки (9);
  - Verification фазы называет только `applyNotification`, а поправки добавили тесты `mergeMessages`, `wait` и разбора уведомлений — сделаны все.
