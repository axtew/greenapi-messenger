Status: COMPLETED

## Phase goal

Phase 3 «Вход и маршруты», повторный прогон после поправки плана «Phases 1, 3 — added 2026-10-05 (6)». Нужно вынести
аугментации модулей (`declare module`) из файлов с логикой в отдельные `.d.ts` рядом с тем, что они описывают
(правило `typing.md` «Объявления для компилятора — в `.d.ts`»). Типы и поведение при этом не меняются.

## What was implemented

- **`src/theme/styled.d.ts`**: аугментация `DefaultTheme` для `styled-components`. `theme` подключается через `import type`,
  `type TTheme = typeof theme`. Интерфейс оставлен в прежнем виде, с явными полями `palette` / `typography` / `radii` /
  `breakpoints` типа `TTheme["…"]`. Вариант `interface DefaultTheme extends TTheme {}` не взял: пустой интерфейс
  ловит `@typescript-eslint/no-empty-object-type` из `tseslint.configs.recommended`, а ради него пришлось бы менять
  конфиг или ставить disable-комментарий. Для существующих полей `theme` тип тот же, что раньше: `typeof palette` и т. д.
- **`src/app/react-query.d.ts`**: `Register.mutationMeta` для `@tanstack/react-query` и тип `TMutationMeta` (перенесён
  со своими JSDoc). Файл ничего локального не импортирует, поэтому модулем его делает `import "@tanstack/react-query";`.
  Строка нужна, проверено: без неё `declare module` заменяет типы пакета, и `tsc` падает
  (`Module '"@tanstack/react-query"' has no exported member 'QueryClient'` и т. п.). Над импортом стоит комментарий
  с назначением.
- **`src/routes/router.d.ts`**: `Register.router` для `@tanstack/react-router`, `router` подключается через `import type`
  из `./AppRouter`.
- Из `_theme.ts`, `_queryClient.ts` и `AppRouter.tsx` убраны блоки `declare module` (и `TMutationMeta`). Экспорты и
  импорты не изменились: `theme` и `router` экспортировались и раньше, и у них есть потребители (`App.tsx`,
  `theme/index.ts`), а `.d.ts` берут их только как типы.

## Files created

Накопительно (iter-1 и iter-2, а также iter-5; отчёты пайплайна не в счёт):
- `C:/Users/stevv/Desktop/greenapi-messenger/src/routes/_paths.ts`, `_routes.tsx`, `AppRouter.tsx`.
- **iter-5:** `C:/Users/stevv/Desktop/greenapi-messenger/src/routes/router.d.ts`: `Register.router` TanStack Router.
- **iter-5:** `C:/Users/stevv/Desktop/greenapi-messenger/src/app/react-query.d.ts`: `Register.mutationMeta` + `TMutationMeta`.
- **iter-5:** `C:/Users/stevv/Desktop/greenapi-messenger/src/theme/styled.d.ts`: `DefaultTheme` styled-components.
- `C:/Users/stevv/Desktop/greenapi-messenger/src/hooks/useForm/{_useForm.hook.ts,_helpers.ts,_types.ts,index.ts}`.
- `C:/Users/stevv/Desktop/greenapi-messenger/src/hooks/useLatest.hook.ts`.
- `C:/Users/stevv/Desktop/greenapi-messenger/src/pages/LoginPage/{index.ts,_LoginPage.tsx,_styles.ts,_useLoginForm.ts}`.
- `C:/Users/stevv/Desktop/greenapi-messenger/src/api/mutations/session.mutations.ts`.
- `C:/Users/stevv/Desktop/greenapi-messenger/public/favicon.svg`.
- `C:/Users/stevv/Desktop/greenapi-messenger/src/components/Input/{index.ts,_Input.tsx,_styles.ts}`.
- `C:/Users/stevv/Desktop/greenapi-messenger/src/utils/helpers/objectGetters.ts`.
- `C:/Users/stevv/Desktop/greenapi-messenger/src/utils/helpers/localStorage.ts`.
- `C:/Users/stevv/Desktop/greenapi-messenger/src/types/common.types.ts`.

`AppRouter.tsx` (iter-5): убран `declare module "@tanstack/react-router"`.

## Files modified

Накопительно:
- `src/app/App.tsx`: `RouterProvider`.
- `src/app/_queryClient.ts`: 401 → `signOut`, `retry`, JSDoc. **iter-5:** `TMutationMeta` и `declare module`
  перенесены в `react-query.d.ts`.
- `src/theme/_theme.ts`: **iter-5** (Phase 1): `declare module "styled-components"` перенесён в `styled.d.ts`.
- `index.html`: `<link rel="icon">`.
- `src/api/greenApi/_types.ts`: `EGreenApiMethod`.
- `src/api/greenApi/_client.ts`: `GreenApiError.method: EGreenApiMethod`, `getEntries`, `message` собирается из кодов.
- `src/api/greenApi/index.ts`: экспорт `EGreenApiMethod`.
- `src/api/services/{account,chats,messages}.service.ts`: имена методов через `EGreenApiMethod`.
- `src/api/__tests__/api.test.ts`: имена методов через `EGreenApiMethod`, тест формата `message`.
- `src/api/session.ts`: хранилище через `getLSItem` / `setLSItem` / `removeLSItem`, путь входа из `routerPaths.login`.
- `src/theme/_GlobalStyle.ts`: `button, input, textarea { font: inherit; }`.

Конфиги (eslint, prettier, tsconfig) не менялись.

## Verification

Baseline переиспользован (`plans/messenger-v1/baseline/`: lint и build чистые, exit=0).

- `pnpm format`: выполнен. Prettier обработал все три `.d.ts` (`src/**` → `unchanged`), `prettier --check src` → exit 0.
- `pnpm lint`: exit 0, ошибок и предупреждений нет. ESLint покрывает `.d.ts` через `files: ["**/*.{ts,tsx}"]`.
  Отдельный `eslint --max-warnings 0` по трём файлам → exit 0.
- `pnpm build` (`tsc -b && vite build`): успешно.
- `pnpm test`: 1 файл, 32 теста, все прошли.
- Аугментации работают. `tsconfig.app.json` содержит `skipLibCheck: true`, поэтому ошибки *внутри* своих `.d.ts`
  `tsc` не показывает. Проверил отдельно на временном файле, потом удалил его:
  - `t.palette.nope` на `DefaultTheme` даёт TS2339 с конкретным типом палитры;
  - `meta: { skipUnauthorizedRedirect: "x" }` даёт TS2322 (`boolean | undefined`);
  - `RegisteredRouter["routeTree"]` выводится в конкретное дерево роутов, а не в `AnyRoute`.
  Кроме того, `tsc -p tsconfig.app.json --noEmit --skipLibCheck false` не находит ошибок в `src/`. Есть 3 ошибки
  в `node_modules/styled-components`, к задаче не относятся.
- Exports: новых экспортов нет.
- Phase stop condition: выполнено. В `src/` больше нет `declare module` вне `.d.ts`, поведение не менялось.
- Runtime/browser: разработчик не проверял. Правка только на уровне типов, в бандл не попадает.

## Known issues

- Наблюдение вне scope, не исправлял: `useNavigate()({ to: "/no-such-route" })` проходит `tsc`. Так было и до переноса:
  возвращал `declare module` в `AppRouter.tsx`, результат тот же. Вероятная причина в том, что `createCommonRoutes` /
  `createProtectedRoutes` возвращают массивы, и союз путей получается широким. Если нужна строгая типизация `to`,
  кандидат в `BACKLOG.md`.
- Коммит не делался (`commit_policy: owner`).
