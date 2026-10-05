Status: COMPLETED

## Phase goal

Phase 5 — список чатов и синхронизация с сервером. Левая панель сразу показывает чаты из localStorage, а при входе обновляет их с сервера: имя, аватар, последнее сообщение, время, бейдж непрочитанных. Учтены все поправки, касающиеся Phase 5, в том числе «Phase 5 — added 2026-10-05 (11)»:

- `staleTime` — 5 часов;
- признак «профиль не загружен»;
- `keyframes` скелетона перенесены в `Sidebar/_styles.ts`.

Условие остановки: после входа в новом браузере тестовый чат появляется с именем, аватаром и последним сообщением; после перезагрузки — сразу, без `getContactInfo`.

## What was implemented

- **Кэш списка чатов** (`src/api/cache/chats.cache.ts`):
  - ключ `["chats", idInstance]`, хранилище `greenapi-messenger:chats:<idInstance>`;
  - работает через `getLSItem` / `setLSItem` с локальной zod-схемой `z.ZodType<IChat[]>`;
  - `updateChats` — единственная точка записи: применяет updater к текущему кэшу (без кэша — к localStorage), сортирует и пишет в кэш и в localStorage;
  - чистые операции: `upsertContact`, `applyLastMessage` (снимок меняется, только если сообщение не старее), `resetUnread`, `sortChats` (чаты без сообщений — в конце, в прежнем порядке).
- **Признак «профиль не загружен»** — поле `IChat.isProfileLoaded: boolean`, хранится в localStorage (оно есть в схеме), в UI не показывается.
  - `upsertContact(chats, contact, { isProfileLoaded })` — опция обязательная, по образцу `{ incrementUnread }` у `applyLastMessage`.
  - Временный профиль не перетирает уже загруженный.
- **`useChatsQuery`** (`src/api/queries/chats.queries.ts`):
  - опции: `initialData: () => readStoredChats(id)`, `initialDataUpdatedAt: 0`, `staleTime: CHATS_SYNC_INTERVAL_MS` (5 ч);
  - опции вынесены в `getChatsQueryOptions(queryClient, idInstance)`, чтобы их можно было проверить тестом через `QueryObserver` (в проекте нет DOM-окружения для тестов);
  - `idInstance` хук берёт из `getSession()`; если сессии нет, бросает ошибку — защищённый роут не должен этого допускать.
- **Синхронизация `syncChats`** — запросы строго последовательные:
  1. `getChatIds()`, из ответа берутся первые `CHATS_SYNC_LIMIT = 10` чатов.
  2. `getContact` — для новых чатов и чатов с `isProfileLoaded: false`. Если запрос упал, создаётся временный профиль: `name = chatId`, `isProfileLoaded: false`.
  3. `getChatHistory(id, 1)` — для всех 10 чатов. Удалённая запись снимком не становится; ошибка по одному чату синхронизацию не прерывает.
  4. Результат сливается с кэшем на момент окончания через `updateChats`. Локальные чаты, которых нет в ответе, сохраняются.
- **`Avatar`** (`src/components/Avatar/`):
  - круг заданного `size`, фото, при `onError` — инициалы;
  - `getInitials` — регулярка `/(?<![\p{L}\p{N}])[\p{L}\p{N}]/gu`, без `\b`;
  - `getAvatarColor(chatId, colors)` — детерминированный хеш, палитру передаёт компонент из `palette.avatarColors` (`useTheme`);
  - корень `aria-hidden`: имя всегда стоит рядом текстом.
- **`ChatListItem`** (`div`, только отображение):
  - `Avatar` 54px, имя `H3` и превью `B1 textMuted` — в одну строку с многоточием;
  - нетекстовое сообщение — `chat.unsupportedMessage`;
  - время — `Caption`, через `formatChatListTime`;
  - бейдж при `unreadCount > 0`: `99+` при значении больше 99, `min-width` + `padding`, текст — `B2 onPrimary`.
- **`dateFormat.ts`**: `formatChatListTime`, `formatMessageTime`, `getDayKey`, `formatDayLabel`. Форматтеры `Intl.DateTimeFormat("ru")` создаются один раз на модуль; календарная разница дней считается по полуночам.
- **`Sidebar`** — тело панели:
  - есть данные — список `ul/li` с `ChatListItem`;
  - список пуст, идёт синхронизация — 3 скелетона строк;
  - список пуст, синхронизация закончилась — `sidebar.emptyTitle` + `sidebar.emptyHint` по центру;
  - `isError` — `Caption danger` `sidebar.syncError` (`role="alert"`) над списком.
- **`keyframes` скелетона** перенесены из `AccountMenu/_styles.ts` в `Sidebar/_styles.ts` (`skeletonPulse`); `AccountMenu` импортирует его оттуда.
- **`createMemoryStorage`** вынесен из `api.test.ts` в `src/api/__tests__/_memoryStorage.ts`: у него появилось три потребителя-теста в `src/api/`.

## Files created

- `src/api/cache/chats.cache.ts` — ключ, хранилище, `updateChats`, чистые операции над списком чатов.
- `src/api/cache/chats.cache.test.ts` — хранилище (битые данные, чужая форма, другой инстанс), `updateChats` и все операции, в том числе «не старее», сохранение `unreadCount` и признак временного профиля.
- `src/api/queries/chats.queries.ts` — `syncChats`, `getChatsQueryOptions`, `useChatsQuery`.
- `src/api/queries/chats.queries.test.ts` — фиксирует опции запроса:
  - при сохранённых данных первый наблюдатель вызывает `queryFn` один раз, второй в пределах `staleTime` — ни разу;
  - пустое хранилище тоже синхронизируется.

  Проверяет и саму синхронизацию: `getContact` только для новых и временных профилей, фолбэк при сбое, лимит 10 и `count: 1`, пропуск удалённой записи, слияние с кэшем на момент окончания, ошибка `getChats` сохраняет данные.
- `src/api/__tests__/_memoryStorage.ts` — `Storage` в памяти для тестов.
- `src/components/Avatar/{index.ts,_Avatar.tsx,_styles.ts,_helpers.ts,_helpers.test.ts}` — аватар; тесты: `"Иван Петров" → "ИП"`, `"John" → "J"`, `"" → ""`, стабильность цвета.
- `src/layouts/MessengerLayout/_internal/Sidebar/_internal/ChatListItem/{index.ts,_ChatListItem.tsx,_styles.ts}` — строка списка.
- `src/utils/helpers/dateFormat.ts`, `dateFormat.test.ts` — форматтеры; тесты на полночь, вчера, 6 и 7 дней назад, прошлый год и время в будущем, с фиксированным `now`.

## Files modified

- `src/types/chats.types.ts` — `IChatLastMessage`, `IChat` (с `isProfileLoaded`).
- `src/layouts/MessengerLayout/_internal/Sidebar/_Sidebar.tsx` — тело панели: список, скелетоны, пустое состояние, ошибка синхронизации.
- `src/layouts/MessengerLayout/_internal/Sidebar/_styles.ts` — `skeletonPulse`, стили тела, списка, скелетонов, пустого состояния и ошибки.
- `src/layouts/MessengerLayout/_internal/Sidebar/_internal/AccountMenu/_styles.ts` — локальный `keyframes` удалён, используется `skeletonPulse`.
- `src/api/__tests__/api.test.ts` — `createMemoryStorage` импортируется из `./_memoryStorage`; сами тесты не менялись.

## Figma extraction

Figma нет. Поверхности сделаны по `Reference: docs/design/06-unread-badge.png`, `04-mobile-list.png` и решениям в рамках `Free choice`:

- `ChatListItem`: высота строки не меньше 72px, `padding` 9px, `gap` 12px, ховер — `surfaceMuted` с `radii.item`. Время справа сверху, бейдж справа снизу.
- Скелетон повторяет раскладку строки: круг 54px и две полосы (45% и 75%), та же пульсация, что у скелетона аккаунта.
- Пустое состояние — `H3` + `B1 textMuted` по центру области списка.
- Инициалы аватара — `fontSizes.lg` (20px), `medium`, `onPrimary`.

## Verification

Команды фазы выполнены как указано, без замен:

- `pnpm format` — затем
- `pnpm lint` — passed: 0 ошибок и 0 предупреждений, в baseline их тоже нет.
- `pnpm test` — passed: 5 файлов, 79 тестов (cache, queries, avatar, dates, api).
- `pnpm build` — passed (`tsc -b && vite build`).

**Тест опций запроса проверен подменой:**

- `staleTime: Infinity` (как в исходном плане) — падают все 8 тестов `chats.queries.test.ts`;
- `staleTime: 0` — падает тест второго наблюдателя.

После проверки файл восстановлен.

**Exports** — у всех новых экспортов есть импортёр, кроме оговорённых ниже.

- Provisioned (раздел плана «Phases 3, 5 — (3)»):
  - `resetUnread` → Phase 6;
  - `formatMessageTime`, `getDayKey`, `formatDayLabel` → Phase 7;
  - `applyLastMessage` уже используется в `syncChats`.
- Экспорты, у которых импортёр только тест:
  - `sortChats` — используется внутри `updateChats`; экспорт оставлен по формулировке плана «экспорт — для тестов и потребителей фаз 6/9»;
  - `getChatsQueryOptions` — нужен тесту опций, которого требует задача (без DOM-окружения `useQuery` не протестировать).

**Phase stop condition** — на уровне unit-тестов выполнено: синхронизация при монтировании, `getContactInfo` не запрашивается для известных чатов с загруженным профилем, список из хранилища виден сразу.

**Runtime/browser** — разработчиком не проверялось. Дев-сервер не был запущен, а войти в браузере, не передавая `apiTokenInstance` через параметры инструментов, нельзя. Проверки `list_synced` / `list_from_storage` / `avatar_rendered` / `mobile_list` выполняет визуальный ревьюер. Квота `getContactInfo` разработчиком не расходовалась; `.playwright-mcp` не создавался.

## Known issues

- **Планы Phase 6 / 9 — сигнатура `upsertContact`.** В тексте плана вызов записан как `upsertContact(chats, contact)`, а теперь опция `{ isProfileLoaded }` обязательна:
  - Phase 6, фолбэк из `checkAccount` после сбоя `getContact` — `false`, успешный `getContact` — `true`;
  - Phase 9, чат от неизвестного отправителя — `false`, затем `enrichChat` → `true`.

  Планировщику стоит дописать это в поправку к Phase 6 / 9.
- **`updateChats` возвращает новый список.** `syncChats` отдаёт его как результат `queryFn`. Это расширение сигнатуры из плана, которая возвращаемое значение не оговаривала.
- **Пустой список с ошибкой синхронизации.** План описывает только ошибку при непустом списке. При пустом показываются и `sidebar.syncError`, и пустое состояние — это моё решение, другого текста в словаре нет.
- **Время в строке списка пересчитывается только при рендере.** `formatChatListTime(…, new Date())` вызывается в рендере, поэтому подпись «сегодня → день недели» после полуночи обновится лишь при следующем рендере. Линтер (react-hooks v7) не возражает.
- **`getInitials("@ivan_petrov")` → `"IP"`.** Слово начинается после любого символа, который не буква и не цифра, включая `_`. Тест фиксирует это поведение.
- **Размер шрифта инициалов `Avatar` задан токеном `fontSizes.lg` прямо в `_styles.ts`.** В шкале `Typography` нет варианта на 20px: `H2` удалён поправкой Phase 1. Для аватара 42px в Phase 6 размер может оказаться крупноват.
- **`useChatsQuery` бросает ошибку без сессии.** Это недостижимо за guard'ом защищённого роута.
- **Вне списка файлов плана:** `src/api/__tests__/_memoryStorage.ts` (вынос по лестнице `structure.md`) и `src/api/queries/chats.queries.test.ts` (его требует задача).
