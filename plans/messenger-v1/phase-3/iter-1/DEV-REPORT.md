Status: COMPLETED

## Phase goal

Phase 3 — «Вход и маршруты»: вход по `idInstance` + `apiTokenInstance`; защищённые роуты недоступны без сессии; 401 в любом запросе ведёт на экран входа
с сообщением. Плюс поправки «Phases 2, 3, 6, 7, 9» (п. Phase 3) и «Phase 3 — added 2026-10-05» (фавиконка, `EGreenApiMethod`, исчерпывающий выбор
причины в `GreenApiError.message`).

## What was implemented

- **Роуты (code-based, по образцу recipe-book).** `routerPaths` (`login`, `home`, `chat` — все пути сразу, как требует план). Роут логина:
  `validateSearch` → `{ reason?: ESignOutReason }` (неизвестное значение `reason` отбрасывается через guard `isSignOutReason`), `beforeLoad` — при наличии
  сессии `redirect` на `/`. Pathless layout-роут `protected-layout` с `beforeLoad` (нет `getSession()` → `redirect` на `/login`), компонент — `Outlet`.
  Корень дерева и `router` — в `AppRouter.tsx`, фабрики роутов с родителем параметром — в `_routes.tsx`.
- **Индексный роут `/`** — заглушка `HomeStub` с `<H1>{l.app.title}</H1>` (та же заглушка, что была в `App.tsx` в Phase 1). Решение разработчика:
  в плане Phase 3 нет компонента для `/`, но проверка `login_success` ждёт URL `/` — без дочернего роута на `/` роутер показал бы not-found.
  Phase 4 заменит заглушку на `NoChatSelected`.
- **`App.tsx`** — `RouterProvider` вместо заглушки (внутри `I18nProvider` / `ThemeProvider`).
- **`_queryClient.ts`** — `QueryCache.onError` и `MutationCache.onError`: `GreenApiError` со `status === 401` → `signOut(ESignOutReason.EXPIRED)`; мутации с
  `meta.skipUnauthorizedRedirect === true` пропускаются. Тип `meta` мутаций зарегистрирован через `Register.mutationMeta` (аугментация в этом же файле).
  `retry` запросов: `failureCount < 2` и без повторов для `GreenApiError` со статусом < 500 (сеть со `status: null` и 5xx повторяются).
- **`useLoginMutation`** (`meta: { skipUnauthorizedRedirect: true }`): `checkInstanceAuthorized(credentials)` → `false` → `InstanceNotAuthorizedError`;
  `true` → `saveSession(credentials)`. Ошибка «не авторизован» — отдельный класс рядом с мутацией, чтобы вся ошибка входа шла одним каналом
  (`mutateAsync` бросает → `useForm` не помечает форму «нетронутой», повтор с теми же данными возможен).
- **`LoginPage`** — карточка по центру на фоне `chatBackground` (до 767px — во весь экран на белом, без скругления), `H1` `login.title`, подзаголовок,
  два поля на `useForm`: `idInstance` (`inputMode="numeric"`, проверка «только цифры»), `apiTokenInstance` (`type="password"`, `autoComplete="off"`),
  оба `required`, formatter `trim`; ошибка поля — под полем; ошибка входа — под формой (`role="alert"`); при `reason === EXPIRED` — сверху
  плашка `login.sessionExpired`. Успех → `navigate({ to: routerPaths.home })`. Таблица ошибок: `InstanceNotAuthorizedError` → `notAuthorizedError`;
  `kind === EGreenApiErrorKind.HTTP` и статус 401/403 → `unauthorizedError`; прочее (включая `NETWORK`) → `networkError`.
- **`useForm` / `useLatest`** — перенесены из recipe-book как есть, с двумя правками: `getEntries` — неэкспортируемая функция в `useForm/_helpers.ts`,
  `TSetState` — неэкспортируемый тип в `useForm/_types.ts`; в JSDoc `useForm` добавлен абзац «Общий хук форм автора, переиспользуется между проектами;
  известные ограничения отмечены FIXME».
- **Поправка Phase 3:** `public/favicon.svg` — путь `send_fill1_24px.svg` скачан `curl`'ом с `raw.githubusercontent.com/google/material-design-icons`
  (Material Symbols Rounded), белый, масштаб 0.6, на круге `#3390ec`; `index.html` — `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`.
  `EGreenApiMethod` (8 членов по используемым методам) — в `src/api/greenApi/_types.ts` рядом с `EHttpMethod` (самый низкий уровень, покрывающий
  клиент и сервисы), экспорт из barrel; `IGreenApiRequestOptions.method` и `GreenApiError.method` типизированы им; строки имён методов в сервисах
  заменены членами `enum`. Причина в `GreenApiError.message` выбирается справочником `ERROR_REASONS: Record<EGreenApiErrorKind, (status) => string>`
  (пропущенный член — ошибка компиляции); тексты прежние.
- **Тесты** `api.test.ts`: `method: "someMethod"` / `"receiveNotification"` → `EGreenApiMethod.GET_STATE_INSTANCE` (тип теперь `enum`; URL-ожидание
  соответственно `/getStateInstance/`), сравнения `error.method` — с членами `enum`.

## Files created

- `C:/Users/stevv/Desktop/greenapi-messenger/src/routes/_paths.ts` — `routerPaths`.
- `C:/Users/stevv/Desktop/greenapi-messenger/src/routes/_routes.tsx` — `createCommonRoutes` (логин), `createProtectedRoutes` (`/` с заглушкой).
- `C:/Users/stevv/Desktop/greenapi-messenger/src/routes/AppRouter.tsx` — корень, защищённый layout-роут, `router`, `Register`.
- `C:/Users/stevv/Desktop/greenapi-messenger/src/hooks/useForm/{_useForm.hook.ts,_helpers.ts,_types.ts,index.ts}` — перенос из recipe-book.
- `C:/Users/stevv/Desktop/greenapi-messenger/src/hooks/useLatest.hook.ts` — перенос из recipe-book без изменений.
- `C:/Users/stevv/Desktop/greenapi-messenger/src/pages/LoginPage/{index.ts,_LoginPage.tsx,_styles.ts,_useLoginForm.ts}` — экран входа.
- `C:/Users/stevv/Desktop/greenapi-messenger/src/api/mutations/session.mutations.ts` — `useLoginMutation`, `InstanceNotAuthorizedError`.
- `C:/Users/stevv/Desktop/greenapi-messenger/public/favicon.svg` — фавиконка.

## Files modified

- `src/app/App.tsx` — `RouterProvider` вместо заглушки.
- `src/app/_queryClient.ts` — обработчик 401 в `QueryCache` / `MutationCache`, `Register.mutationMeta`, правило `retry`.
- `index.html` — `<link rel="icon">`.
- `src/api/greenApi/_types.ts` — `EGreenApiMethod`; `method: EGreenApiMethod`.
- `src/api/greenApi/_client.ts` — `ERROR_REASONS` вместо вложенного тернарника; `GreenApiError.method: EGreenApiMethod`.
- `src/api/greenApi/index.ts` — экспорт `EGreenApiMethod`.
- `src/api/services/{account,chats,messages}.service.ts` — имена методов через `EGreenApiMethod`.
- `src/api/__tests__/api.test.ts` — имена методов через `EGreenApiMethod`.

## UI judgment (Free choice — экран входа)

- Карточка 400px, `radii.panel`, отступы 32/24, зазор 24 — «карточка» как боковая панель из референсов; фон страницы — `chatBackground`.
- До `breakpoints.mobileMax` — во весь экран без скругления (как мобильная панель в референсах), отступы с `env(safe-area-inset-*)`.
- Поля: высота 48, `radii.item`, рамка `border`, фокус — `primary`, `aria-invalid` — `danger`, `font-size: 16px` с комментарием (Safari iOS).
- Кнопка: `primary` / `onPrimary`, высота 48, текст `H3 as="span"` (16/500); disabled — `opacity 0.6`.

## Verification

- `pnpm format` — выполнено (`prettier --write src`).
- `pnpm lint` — exit 0, ошибок и предупреждений нет (baseline тоже чистый).
- `pnpm build` — exit 0 (`tsc -b && vite build`), ошибок нет.
- `pnpm test` — 1 файл, 32 теста, все зелёные.
- Exports: у всех новых экспортов есть импортёр — `EGreenApiMethod` (сервисы, тест), `routerPaths` (`AppRouter`, `_routes`, `_useLoginForm`),
  фабрики роутов и `router`, `useLoginMutation` и `InstanceNotAuthorizedError` (`_useLoginForm`), `LoginPage`, `useForm`, `useLatest`.
  Внутренние экспорты `useForm/_types.ts` / `_helpers.ts` используются соседями по папке. Исключение — ключ `routerPaths.chat` без читателя до Phase 6:
  план прямо требует «все пути сразу — объект один».
- Phase stop condition: роутинг и форма реализованы; вход с реальными кредами — не проверялся разработчиком (reviewer-owned, `login_success`).
- Runtime/browser — **не является верификацией разработчика**; Visual Verification фазы выполняет визуальный ревьюер. Наблюдалось при самопроверке
  на `pnpm dev` (порт 5199, затем остановлен; `.playwright-mcp` удалена):
  - `/` без сессии → URL `/login`; заголовок «Вход», два поля, кнопка disabled; консоль без ошибок, 404 на `/favicon.ico` нет.
  - Фиктивные креды (не из `.env.local`) → `getStateInstance` 401 → под формой «Неверный idInstance или apiTokenInstance», URL остаётся `/login`.
    Браузер сам пишет в консоль `Failed to load resource: 401` для этого запроса — это сетевой лог браузера, не код приложения; для проверки
    `login_invalid` (условие «консоль без ошибок» относится только к `app_boots`) это ожидаемо.
  - `/login?reason=expired` → плашка «Сессия недействительна — войдите заново»; горизонтального скролла нет.
  - Фиктивная сессия в localStorage → `/login` уводит на `/` (заглушка с `H1`), localStorage после проверки очищен.
  - Креды из `.env.local` не использовались; токен нигде не выводился.

## Known issues / follow-ups

- **Перенесённые «как есть» комментарии `useForm` описывают recipe-book:** JSDoc упоминает «лист (`isOpened`)» и «редактор рецепта (`recipeId`)»,
  а комментарий в `catch` у `onSubmit` утверждает, что сообщение об ошибке показывает общий `MutationCache` — здесь ошибку входа показывает форма,
  а `MutationCache` только обрабатывает 401. Оставлено по решению «перенос как есть» (brainstorm 15); владельцу решить, править ли (`code-style.md`
  запрещает вводящие в заблуждение комментарии).
- **Заглушка `HomeStub` на `/`** не описана в плане (см. выше) — Phase 4 её заменяет.
- **`EGreenApiMethod` в слое клиента:** `architecture.md` называет сервисы единственным местом, знающим имена методов; `enum` лежит в
  `src/api/greenApi/_types.ts`, потому что им типизирован и клиент — по лестнице `structure.md` это нижний общий уровень. Значения по-прежнему
  указывают только сервисы.
- Phase 9 добавит `RECEIVE_NOTIFICATION` / `DELETE_NOTIFICATION` в `EGreenApiMethod` (и `DELETE` в `EHttpMethod`).
- Ошибка для несуществующего `idInstance` не проверялась отдельно: если GREEN-API ответит не 401/403, форма покажет `networkError`.
- Planner-drift: нет.
