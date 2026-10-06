Status: COMPLETED

## Phase goal

Заход `chore-tests` вне фаз плана: перенести существующие unit-тесты в `__tests__/` рядом с проверяемыми модулями
(правило `testing.md` → «Где лежат unit-тесты») и написать тесты для `src/utils/helpers/localStorage.ts`. Phase 7 не начиналась.

## What was implemented

- Семь тест-файлов перенесены через `git mv` в `__tests__/` рядом со своими модулями; в них изменены только импорты (`./x` → `../x`,
  путь к хранилищу в памяти). Логика тестов не трогалась — `git diff -M` показывает только строки импортов.
- `src/api/__tests__/api.test.ts` оставлен на месте: проверяет client, session и services из `src/api` — ближайшая общая папка `src/api/`,
  правилу соответствует. Изменён только импорт `createMemoryStorage` (переставлен `eslint --fix` в группу `@/`).
- `_memoryStorage.ts` перенесён `src/api/__tests__/` → `src/__tests__/_memoryStorage.ts`: у него появился потребитель вне `src/api/`
  (новый `localStorage.test.ts` в `src/utils/`), самая нижняя папка, покрывающая `src/api/` и `src/utils/`, — `src/`.
  Хранилище в памяти нужно для сценариев «нет записи / битый JSON / не та форма / валидно / запись / удаление». Для недоступного хранилища —
  отдельный локальный `createThrowingStorage()` прямо в тесте (один потребитель — в общий файл не выносится).
- Новый `src/utils/helpers/__tests__/localStorage.test.ts`, 10 тестов:
  - `getLSItem`: нет ключа → `null`; битый JSON → `null`; не та форма по схеме → `null`; валидно → разобранное значение;
    хранилище бросает (`DOMException SecurityError`) → `null` без исключения.
  - `setLSItem`: пишет JSON; бросающее хранилище → без исключения; в `console.error` (spy) есть ключ и нет значения
    (`{ token: "SECRET-api-token-…" }`).
  - `removeLSItem`: удаляет запись; бросающее хранилище → без исключения, ключ в логе.
  - Сырое содержимое хранилища готовится и проверяется напрямую (`localStorage.setItem/getItem`) — исключение из `structure.md` → «Общий слой».
  - Хелпер `getLoggedText` сериализует объекты в JSON: первая версия через `String(arg)` давала `[object Object]` и не ловила утечку.
    Проверено мутацией: временно добавил `value` в `console.error` в `setLSItem` → тест «логирует ключ, но не значение» упал;
    `localStorage.ts` восстановлен (`git diff --quiet` — без изменений).

## Files created

- `src/utils/helpers/__tests__/localStorage.test.ts` — тесты `getLSItem` / `setLSItem` / `removeLSItem`.

## Files modified

Переносы (`git mv`, R в индексе) + правка импортов:

| До | После |
|---|---|
| `src/api/__tests__/_memoryStorage.ts` | `src/__tests__/_memoryStorage.ts` (без изменений содержимого) |
| `src/api/cache/chats.cache.test.ts` | `src/api/cache/__tests__/chats.cache.test.ts` |
| `src/api/mutations/chats.mutations.test.ts` | `src/api/mutations/__tests__/chats.mutations.test.ts` |
| `src/api/queries/chats.queries.test.ts` | `src/api/queries/__tests__/chats.queries.test.ts` |
| `src/components/Avatar/_helpers.test.ts` | `src/components/Avatar/__tests__/_helpers.test.ts` |
| `…/Sidebar/_internal/NewChatPanel/_helpers.test.ts` | `…/Sidebar/_internal/NewChatPanel/__tests__/_helpers.test.ts` |
| `src/utils/helpers/contactFormat.test.ts` | `src/utils/helpers/__tests__/contactFormat.test.ts` |
| `src/utils/helpers/dateFormat.test.ts` | `src/utils/helpers/__tests__/dateFormat.test.ts` |

- `src/api/__tests__/api.test.ts` — на месте; импорт `createMemoryStorage` из `@/__tests__/_memoryStorage`.

## Verification

Before (до правок): `pnpm lint` exit 0, `pnpm build` exit 0, `pnpm test` — 8 files / 105 tests passed.

After:
- `pnpm format` — exit 0.
- `pnpm lint` — exit 0 (по ходу: 1 ошибка `simple-import-sort` в `api.test.ts` после замены импорта — исправлена `eslint --fix`).
- `pnpm build` — exit 0 (по ходу: TS7006 в новом тесте — типизирован spy через `MockInstance<typeof console.error>`).
- `pnpm test` — 9 files / 115 tests passed (105 прежних + 10 новых; ни один не потерян).
- Конфиги: правка не потребовалась. Vitest без своего конфига — дефолтный include `**/*.{test,spec}.?(c|m)[jt]s?(x)` подхватывает `__tests__/`;
  `tsconfig.app.json` включает весь `src` (тесты по-прежнему проверяются `tsc -b`); eslint — `**/*.{ts,tsx}`; prettier — `src`.
- Exports: новых экспортов нет; `createMemoryStorage` импортируют 4 файла в `src/api/` и 1 в `src/utils/`.
- Runtime/browser: не требовался (чистые unit-тесты).

## Known issues

- Относительный импорт `../<module>` в тестах из `__tests__/` — прецедент `../` в `src/` уже есть (`src/hooks/useForm/`); если владелец предпочитает
  `@/`-алиас для тестов, это одна строка на файл.
- `plans/messenger-v1/EXECUTION.md` был изменён до захода (в git status на старте) — не трогал.
- Коммит не делался (`commit_policy: owner`). Предлагаемое сообщение:
  `test: перенести unit-тесты в __tests__ и покрыть хелперы localStorage`
