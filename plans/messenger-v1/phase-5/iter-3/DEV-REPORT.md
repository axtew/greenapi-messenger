Status: COMPLETED

## Phase goal

Phase 5 — «Список чатов и синхронизация с сервером». Итерация 3 — исправления по `phase-5/iter-2/REVIEW.md` и пять пунктов, одобренных владельцем. Пункт про Phase 5 из поправки (12) тоже входит.

## What was implemented

1. **Запасной профиль не затирает известный чат** (`[code]`, поправка (12)).
   - `fetchContact` при сбое возвращает `null`. Интерфейс `IContactResult` удалён.
   - Синхронизация собирает пары `{ chatId, contact: IContact | null }`.
   - Внутри апдейтера `updateChats`:
     - успешный профиль записывается через `upsertContact(..., { isProfileLoaded: true })`;
     - `null` у чата, который уже есть в списке **на момент слияния**, оставляет запись как есть, включая прежний `isProfileLoaded`;
     - `null` у чата, которого в списке нет, добавляет заглушку `name = chatId` с `isProfileLoaded: false`.
   - JSDoc `syncChats` дополнен этим правилом.
   - Новый тест в `chats.queries.test.ts`: «сбой профиля у известного чата с временным профилем оставляет его имя, phone и username». В нём известный чат `@ivan` с `phone`, `username` и `isProfileLoaded: false`, `getContact` падает. Проверяется:
     - `getContact` вызван один раз;
     - запись в кэше и в localStorage не изменилась.
2. **Многоточие тем же цветом и шрифтом, что текст** (`[code]`).
   - Обёртка `SEllipsis` удалена.
   - Правила обрезки вынесены в фрагмент `css` `ellipsis` и стоят на самих текстовых элементах: `SName = styled(H3)`, `SPreview = styled(B1)`.
   - В `ChatListItem` используется `forwardedAs="span"`. Обычный `as` на `styled(H3)` подменил бы сам `H3`, и стили шрифта потерялись бы.
   - Цвет `textMuted` у превью передаётся пропом `color` в `B1`. Теперь `color`, `font-*` и `text-overflow` заданы на одном элементе.
3. **Комментарий `chatsSchema`** (владелец). Новый текст: берётся только `chatId`; поле `type` реальный инстанс присылал не всегда; личный чат отличается от группы знаком `chatId`. Это сходится с отбором `Number(chatId) > 0` в `getChatIds` и с наблюдением визуального ревьюера, что сейчас `type` приходит.
4. **Пустой список при ошибке синхронизации** (владелец, поправка (12)). Пустое состояние в `Sidebar` рендерится только при `!isError`. При ошибке остаётся один `sidebar.syncError`.
5. **`client` из `QueryFunctionContext`** (владелец).
   - `queryFn: ({ client }) => syncChats(client, idInstance)`.
   - `getChatsQueryOptions(idInstance)` больше не принимает `queryClient`; из хука убран `useQueryClient`.
   - В тесте опций `QueryObserver` по-прежнему создаётся на тестовом `QueryClient`, так что `client` в контексте — тот же клиент, и тест проверяет то же поведение.

### UIKit wrappers

- `SName` (`styled(H3)`): добавляет `overflow` / `text-overflow: ellipsis` / `white-space` / `flex` / `min-width`. Пропами `Typography` это не выражается, а на внешнем элементе многоточие получает чужой цвет и шрифт.
- `SPreview` (`styled(B1)`): то же для превью.

## Files created

Список накопительный.

- `src/api/cache/chats.cache.ts` — ключ, хранилище, `updateChats`, чистые операции над списком чатов.
- `src/api/cache/chats.cache.test.ts` — тесты хранилища, `updateChats` и операций.
- `src/api/queries/chats.queries.ts` — `syncChats`, `getChatsQueryOptions(idInstance)`, `useChatsQuery`. В iter-3:
  - сбой `getContact` → `null`;
  - заглушка только для чата, которого нет в списке;
  - `client` из контекста `queryFn`.
- `src/api/queries/chats.queries.test.ts` — опции запроса и синхронизация. В iter-3 добавлен тест про известный чат с временным профилем, вызов опций приведён к новой сигнатуре.
- `src/api/__tests__/_memoryStorage.ts` — `Storage` в памяти для тестов.
- `src/components/Avatar/{index.ts,_Avatar.tsx,_styles.ts,_helpers.ts,_helpers.test.ts}` — аватар.
- `src/layouts/MessengerLayout/_internal/Sidebar/_internal/ChatListItem/{index.ts,_ChatListItem.tsx,_styles.ts}` — строка списка. В iter-3 `SEllipsis` заменён на `SName` / `SPreview`.
- `src/utils/helpers/dateFormat.ts`, `dateFormat.test.ts` — форматтеры даты и тесты к ним.

## Files modified

Список накопительный.

- `src/types/chats.types.ts` — `IChatLastMessage`, `IChat` (с `isProfileLoaded`).
- `src/layouts/MessengerLayout/_internal/Sidebar/_Sidebar.tsx` — тело панели. В iter-3 пустое состояние не показывается при `isError`.
- `src/layouts/MessengerLayout/_internal/Sidebar/_styles.ts` — `skeletonPulse`, стили тела, списка, скелетонов, пустого состояния и ошибки.
- `src/layouts/MessengerLayout/_internal/Sidebar/_internal/AccountMenu/_styles.ts` — используется общий `skeletonPulse`.
- `src/api/__tests__/api.test.ts` — `createMemoryStorage` импортируется из `./_memoryStorage`.
- `src/api/schemas/chats.schema.ts` — в iter-3 исправлен комментарий `chatsSchema` (пункт 3).

## Figma extraction

Figma нет. В iter-3 визуально меняется только цвет и начертание «…»: у превью оно серое (`textMuted`), у имени — `medium`, как текст. Раскладка не менялась.

## Verification

Команды запущены дословно, без подмен:

- `pnpm format` — прошёл. Затронуты только `src`; новых изменений вне файлов этой итерации нет (сверено по `git status`).
- `pnpm lint` — exit 0, без замечаний. В baseline замечаний тоже нет.
- `pnpm build` — exit 0.
- `pnpm test` — 5 файлов, 80/80: 79 прежних и 1 новый.

Остальные проверки:

- **Exports.** Новых экспортов нет: `SName` и `SPreview` заменили `SEllipsis` и импортируются в `_ChatListItem.tsx`, фрагмент `ellipsis` не экспортируется. У `getChatsQueryOptions` сменилась только сигнатура, импортёры — `useChatsQuery` и тест.
- **Phase stop condition.** Выполнено: все пять пунктов закрыты, в файлы следующих фаз изменения не вносились.
- **Квота.** `getContactInfo` не тратилась: только unit-тесты со стабами.
- **Runtime / browser.** Разработчик не проверял. Визуальная проверка — за визуальным ревьюером. Перепроверить стоит:
  - цвет «…» у длинного превью;
  - пустой список при ошибке синхронизации: только `syncError`.

## Known issues

- Пункты Phase 6 / 9 из поправки (12) — `isProfileLoaded` для `upsertContact`, неудачный `enrichChat` и порядок записи poller-а — к этой фазе не относятся и не трогались.
- Для `ru.json` новых ключей нет.
