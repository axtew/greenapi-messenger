Status: COMPLETED

## Phase goal
Phase 10, iter-3 (решение владельца): только README — убрать раздел «Деплой», вписать ссылку на демо, не оставить ссылок на удалённый раздел.

## What was implemented
- Раздел `## Деплой` удалён целиком (Workers Builds, `pnpm run deploy`, ссылка на ADR 0006 внутри него).
- Заглушка «Демо: _ссылка появится после деплоя_.» заменена строкой
  «Демо: https://greenapi-messenger.stevvy1122.workers.dev/ (Cloudflare Workers, конфиг — `wrangler.jsonc`).»
- Поиск `деплой|deploy|wrangler|ниже|выше` по README: остались только строка демо и «(как его подготовить — ниже)» — она про раздел
  «Подготовка инстанса GREEN-API», который на месте. «Хостинг — Cloudflare Workers» в «Стек» — не ссылка на раздел, оставлено.

## Files created
(кумулятивно) `e2e/greenApiStub.ts`, `e2e/messenger.spec.ts`, `playwright.config.ts`, `tsconfig.e2e.json`.

## Files modified
(кумулятивно) `README.md` (iter-1, iter-3), `src/api/session.ts`, `src/api/__tests__/api.test.ts`, `src/app/App.tsx` (iter-2),
`tsconfig.json`, `vite.config.ts`, `package.json`, `pnpm-lock.yaml` (iter-1). На iter-3 менялся только `README.md`.

## Verification
- `pnpm lint` — exit 0.
- `npx prettier --check README.md` — warn (exit 1). Предсуществующее: версия README в `HEAD` даёт тот же результат; проект markdown не
  форматирует (`pnpm format` = `prettier --write src`). `--write` не запускал, чтобы не трогать остальной текст README.
- build/test/e2e не перезапускались — код не менялся.

## Known issues
- Не коммитилось (`commit_policy: owner`).
