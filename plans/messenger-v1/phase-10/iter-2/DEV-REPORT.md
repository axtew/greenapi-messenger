Status: COMPLETED

## Phase goal
Phase 10 в объёме поправок (22) и (23): один e2e-сценарий ТЗ со стабом GREEN-API и README; на этом заходе — однократный `signOut`
(дефект двойного выхода, найденный e2e на iter-1), кнопка Devtools в левый нижний угол, стабильный `pnpm e2e`.

## What was implemented
- `signOut` однократный: флаг уровня модуля `isSigningOut`; первый вызов ставит его, удаляет сессию и делает `location.assign`,
  повторные вызовы с любой причиной сразу возвращаются. JSDoc описывает однократность и зачем она нужна (синтетический 401 до перезагрузки).
- Unit-тест «повторный signOut не перебивает первый переход»: `signOut()` + `signOut(EXPIRED)` → `assign` вызван один раз, с `/login`.
  Состояние модуля сбрасывается без тестового API: в `describe("session")` хелпер `importFreshSignOut()` делает `vi.resetModules()`
  и динамический `import("@/api/session")`; все три теста `signOut` берут свежий экземпляр. `getSession`/`saveSession`/`ESignOutReason`
  по-прежнему импортируются статически (состояния не держат).
- `ReactQueryDevtools buttonPosition="bottom-left"`.
- E2E: отправка — кликом по «Отправить» (комментарий про перекрытие кнопки Devtools удалён); шаг выхода уже проверял
  `toHaveURL(/\/login$/)` — `$` исключает `?reason=…`, оставлено как есть.

## Files created
(кумулятивно, с iter-1)
- `e2e/greenApiStub.ts` — стаб GREEN-API через `page.route`.
- `e2e/messenger.spec.ts` — основной сценарий ТЗ.
- `playwright.config.ts` — конфиг Playwright (dev-сервер, chromium).
- `tsconfig.e2e.json` — проверка типов `e2e/*.ts` и `playwright.config.ts`.

## Files modified
(кумулятивно, с iter-1)
- `src/api/session.ts` — однократный `signOut` + JSDoc (iter-2).
- `src/api/__tests__/api.test.ts` — свежий модуль на каждый тест `signOut`, тест двойного вызова (iter-2).
- `src/app/App.tsx` — `buttonPosition="bottom-left"` у Devtools (iter-2).
- `tsconfig.json` — ссылка на `tsconfig.e2e.json` (iter-1).
- `vite.config.ts` — `test.dir`, чтобы vitest не подхватывал `e2e/` (iter-1).
- `package.json`, `pnpm-lock.yaml` — `@playwright/test`, скрипт `e2e` (iter-1).
- `README.md` — запуск, тесты, деплой, ограничения, благодарности (iter-1).

## Verification
- `pnpm format` (+ `npx prettier --write e2e/messenger.spec.ts` — скрипт `format` покрывает только `src`) — ок.
- `pnpm lint` — exit 0, без ошибок и предупреждений (baseline чистый).
- `pnpm build` — успешно.
- `pnpm test` — 232 passed.
- `pnpm e2e --repeat-each=10` — **10/10** зелёных (8 воркеров).
- `pnpm e2e --repeat-each=10 --workers=1` — **10/10** зелёных (последовательно).
- `pnpm e2e` — 1/1 зелёный.
- Итого 21 прогон сценария подряд без падений (на iter-1 — около половины падало на шаге выхода).
- Exports: новых экспортов нет (`isSigningOut` — не экспортируется).
- Stop condition: `pnpm e2e` зелёный локально и стабильно — выполнено.
- Runtime/browser: не выполнялся разработчиком вне e2e; `test-results/`, `playwright-report/` в `.gitignore`, `.playwright-mcp` не появлялся.

## Known issues
- Не коммитилось (`commit_policy: owner`).
- Кнопка «Отправить» в e2e больше не перекрыта Devtools; Enter-отправка покрыта только unit/ручными проверками прошлых фаз.
