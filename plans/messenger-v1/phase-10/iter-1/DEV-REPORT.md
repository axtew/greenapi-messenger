Status: STOPPED_ON_PLAN_GAP

## Phase goal
Phase 10 в объёме поправки (22): один e2e-сценарий ТЗ со стабом GREEN-API (`pnpm e2e` без кредов и сети) и README. Условие остановки — `pnpm e2e` зелёный локально.

## Plan gap
Сценарий найденную в продукте гонку **ловит**, поэтому `pnpm e2e` нестабилен: последний шаг («выход → `/login`») падает примерно в половине прогонов
(`--repeat-each=5`: 1 из 5 зелёных; со стабом, который держит пустой ответ 300 мс, — 4 из 8). Чтобы тест стал зелёным, нужна правка продуктового кода;
по жёстким правилам задачи — остановка.

**Что происходит.** «Выйти» → `signOut()` удаляет сессию из localStorage и вызывает `window.location.assign("/login")`. До того как навигация
завершится, страница ещё живёт: цикл получения (`src/api/poller/_poller.ts`) начинает следующий `receiveNotification` (или любой запрос
перезапрашивается). `greenApiRequest` без сессии сразу бросает `GreenApiError` со статусом 401, не выходя в сеть (`src/api/greenApi/_client.ts`),
→ `onUnauthorized` (`src/layouts/MessengerLayout/_useMessengerLayout.ts`) или обработчик 401 в `src/app/_queryClient.ts` вызывает
`signOut(ESignOutReason.EXPIRED)`, и второй `location.assign` перебивает первый. Итог: добровольный выход заканчивается на
`/login?reason=expired` с плашкой «Сессия недействительна — войдите заново».

**Наблюдения (не доказательство из ревьюерской проверки, а то, что видел разработчик).** Инструментированный прогон: после клика «Выйти» стаб
не получил ни одного нового запроса (то есть 401 — синтетический, без сети), а `framenavigated` сразу пришёл на
`http://localhost:5173/login?reason=expired`, навигации на `/login` без параметра не было. На реальном инстансе окно меньше (`receiveNotification`
висит до 20 с), но оно есть: любой запрос, начавшийся между удалением сессии и выгрузкой страницы, даёт тот же результат. Стаб по заданию
отвечает на пустую очередь `null` сразу, поэтому цикл крутится постоянно и окно попадается почти всегда.

Ослаблять проверку (`/login` с любым `?reason`) или прятать гонку задержкой в стабе я не стал: это скрыло бы реальный дефект.

## Recommended fix
1. **Продукт (рекомендую):** `signOut(EXPIRED)` ничего не делает, если сессии уже нет — значит, выход уже идёт (одна проверка `getSession() === null`
   в начале `signOut` при `reason === EXPIRED`); либо выход сначала останавливает poller и отменяет запросы (`queryClient.cancelQueries()`),
   а потом удаляет сессию. Отдельной задачей/заходом с unit-тестом на `signOut`. После этого e2e в текущем виде должен стать зелёным.
2. **Если владелец решит не трогать продукт сейчас:** проверка последнего шага — `toHaveURL(/\/login(\?|$)/)` плюс запись в «Известные ограничения» README.
   Не рекомендую: дефект останется незамеченным.

## What was implemented
- `@playwright/test` (1.63.0) в devDependencies, скрипт `"e2e": "playwright test"`; Chromium установлен через `pnpm exec playwright install chromium`.
- `playwright.config.ts`: `testDir: "e2e"`, `webServer: pnpm dev` (`reuseExistingServer` вне CI), `baseURL` `http://localhost:5173`, проект Chromium
  (Desktop Chrome), артефакты в `test-results/` и `playwright-report/` (оба уже были в `.gitignore` и в игноре eslint), trace — только при падении.
- `e2e/greenApiStub.ts` — `installGreenApiStub(page, appOrigin)`:
  - маршрут `https://api.green-api.com/**` разбирает путь `/waInstance<id>/<метод>/<токен>[/<продолжение>]`, различает HTTP-метод и имя метода;
    `OPTIONS` (preflight) → 204 с CORS-заголовками; чужие `idInstance`/токен → 401 с пустым телом;
  - 10 методов сценария, формы из `brainstorm.md`: `username` с ведущим `@` (`checkAccount`, `getContactInfo`, `getAccountSettings`), `getChats` без `type`
    (`name`/`username` пустые), пустая очередь → `200 null` сразу, `deleteNotification` — `DELETE …/<receiptId>` → `{result, reason: ""}`;
    `sendMessage` и `pushIncoming` пишут в историю (от новых к старым) и в список чатов;
  - `pushIncoming(chatId, text)` кладёт `incomingMessageReceived` полной формы (`instanceData`, `senderData`, `textMessageData`);
  - запрет сети: маршрут на всё, что не `appOrigin`, обрывает запрос и пишет его в `unexpectedRequests`; неизвестный метод GREEN-API — так же.
    Тест в конце проверяет, что список пуст. Хост инстанса (`<n>.api.green-api.com`) клиент не использует — константа `GREEN_API_HOST`;
    аватары стаб отдаёт пустыми, так что и картинки с этих хостов не запрашиваются (а если бы запросились — попали бы в запрет).
  - фейковые креды — `STUB_CREDENTIALS` (`1100000001` / `e2e-valid-token`), собеседник — `STUB_CONTACT`.
  - **Имена методов — через `EGreenApiMethod`**, импорт `../src/api/greenApi/_types` напрямую (не через barrel): в `_types.ts` из `@/` только
    `import type`, который стирается при трансформации, поэтому алиас в рантайме Playwright не нужен; barrel потянул бы в Node клиент, сессию и
    localStorage-хелперы. Для `tsc` алиас `@/*` задан в `tsconfig.e2e.json`.
- `e2e/messenger.spec.ts` — один `test` с шагами `test.step`: неверный токен → `role="alert"` с `login.unauthorizedError`; вход → `sidebar.emptyTitle`;
  «Новый чат» → номер → `/chat/<id>`, заголовок с именем, `@username`, `chat.emptyHistory`; отправка → пузырь в `main`, правее середины колонки,
  поле очищено; `pushIncoming` → пузырь левее середины колонки, событий `load` не было (без перезагрузки); «Меню» → «Выйти» → `/login`.
  Все тексты — из `public/dictionaries/ru.json` (импорт JSON), локаторы — роли, подписи, тексты; сторона пузыря — по `boundingBox` относительно
  поля ввода (доступного признака направления в разметке нет).
  - Отправка — по Enter, а не кликом: в dev-сборке плавающая кнопка TanStack Query Devtools перекрывает кнопку «Отправить» (клик Playwright
    упирается в перехват указателя). Перед Enter проверяется, что кнопка активна.
- `tsconfig.e2e.json` (e2e + `playwright.config.ts`, `types: ["node"]`, `resolveJsonModule`, алиас `@/*`) добавлен в `references` `tsconfig.json` —
  `pnpm build` (`tsc -b`) проверяет типы e2e; eslint покрывает их общим конфигом `**/*.{ts,tsx}`.
- `vite.config.ts`: `test.dir: "src"` (+ `/// <reference types="vitest/config" />`) — без этого `pnpm test` (vitest) подхватывал `e2e/messenger.spec.ts`
  и падал («Playwright Test did not expect test() to be called here»). В «Files to modify» фазы файла нет — правка конфигурации, не продукта.
- `README.md`: строка-заглушка «Демо: _ссылка появится после деплоя_»; вход по кредам инстанса; раздел «Тесты» (`pnpm test`, `pnpm e2e` +
  `pnpm exec playwright install chromium`); раздел «Деплой» по поправке координатора (Cloudflare Workers Builds: `pnpm run build` /
  `npx wrangler deploy`, имя Worker'а = `name` в `wrangler.jsonc`; вручную — `pnpm exec wrangler login` + `pnpm run deploy`, почему с `run`),
  ссылки на `deploy-steps.md` нет (файл удалён); в подготовке инстанса — `editedMessageWebhook` / `deletedMessageWebhook`; исправлено «предупредит на
  экране входа» → «в списке чатов» (предупреждение показывает `SettingsWarning` в сайдбаре); «Известные ограничения»; «Благодарности» (Material Symbols —
  Apache 2.0, Roboto — SIL OFL 1.1). Остальное (Node 22+, pnpm 10+, подготовка инстанса, стек, документация) — без изменений.

## Files created
- `e2e/greenApiStub.ts` — стаб GREEN-API в `page.route`, `pushIncoming`, запрет внешних запросов.
- `e2e/messenger.spec.ts` — сценарий ТЗ одним тестом с шагами.
- `playwright.config.ts` — конфиг Playwright.
- `tsconfig.e2e.json` — проверка типов e2e и конфига Playwright.

## Files modified
- `package.json`, `pnpm-lock.yaml` — `@playwright/test`, скрипт `e2e`.
- `tsconfig.json` — ссылка на `tsconfig.e2e.json`.
- `vite.config.ts` — vitest ищет тесты только в `src`.
- `README.md` — см. выше.

## Verification
- `pnpm lint` — passed (0 ошибок/предупреждений; baseline чистый).
- `pnpm build` — passed (`tsc -b` включает `tsconfig.e2e.json`; `tsc -p tsconfig.e2e.json --listFilesOnly` подтверждает, что e2e, конфиг и `ru.json` в проверке).
- `pnpm test` — 18 файлов, 231 тест, passed.
- `pnpm e2e` — **нестабилен**: первые пять шагов проходят всегда; шаг выхода падает ~50% (`/login?reason=expired`), см. Plan gap.
  Один одиночный прогон был зелёным, `--repeat-each=5` — 1/5.
- Prettier — `npx prettier --write` на e2e, конфигах, `vite.config.ts` (скрипт `pnpm format` покрывает только `src`).
- Exports: `installGreenApiStub`, `STUB_CREDENTIALS`, `STUB_CONTACT` используются в `messenger.spec.ts`; `IGreenApiStub` — тип возвращаемого значения
  экспортируемой функции (контракт модуля).
- Runtime: браузерная проверка — это и есть фаза; Visual Verification — N/A. Временная отладочная инструментовка стаба/теста удалена,
  `test-results/` и `playwright-report/` удалены, `.playwright-mcp` нет. Секреты в вывод не попадали (реальные креды не использовались).
- Operation budget: 5 → фактически 6 (конфиг, стаб, сценарий, tsconfig, README, `vite.config.ts`).

## Known issues
- Гонка выхода — см. Plan gap (продуктовый дефект, не в скоупе фазы).
- Планнер-дрейф: (1) план не учёл, что vitest без `test.dir`/`include` подхватит `e2e/*.spec.ts`; (2) кнопку отправки в dev перекрывает
  TanStack Query Devtools — e2e на `pnpm dev` обходит это Enter'ом.
- `@playwright/test` добавлен с `^1.63.0`; браузер ставится отдельно (`pnpm exec playwright install chromium`).
