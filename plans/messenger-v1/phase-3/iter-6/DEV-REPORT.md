Status: STOPPED_ON_PLAN_GAP

## Phase goal

Phase 3, «Вход и маршруты», FIX-итерация 6 по `phase-3/iter-5/REVIEW.md` и поправке «Phases 3, 4, 6 — added 2026-10-05 (7)». В scope только пункты Phase 3:
1. обобщить фабрики роутов по родителю;
2. включить `skipLibCheck: false`; разрешена devDependency `@types/stylis`;
3. доказать оба исправления временными пробниками.

## Plan gap

Пункт 2 упирается в стоп-условие поправки (7): «если после этого остаются ошибки в чужих типах, которые `@types/stylis` не закрывает, — остановиться и сообщить, не обходить».

Команда `pnpm exec tsc -p tsconfig.app.json --noEmit --skipLibCheck false` без `@types/stylis` даёт 3 ошибки в `styled-components@6.5.3`:
- `dist/models/StyleSheetManager.d.ts(2,25)` — TS7016, нет деклараций для `stylis`;
- `dist/utils/stylisPluginRSC.d.ts(1,33)` — TS7016, то же;
- `dist/models/ServerStyleSheet.d.ts(14,85)` — **TS2694: `Namespace 'global.NodeJS' has no exported member 'ReadWriteStream'`**.

Я временно поставил `@types/stylis@4.2.7` и проверил. Версию выбрал так: `styled-components@6.5.3` сам пинует ровно её в своих devDependencies, в проекте установлен `stylis@4.3.6`, а последняя опубликованная версия `@types/stylis` — 4.2.7. Обе TS7016 исчезли. **TS2694 осталась** (exit=2).

Откуда TS2694. `ServerStyleSheet.interleaveWithNodeStream` объявлен как возвращающий `NodeJS.ReadWriteStream`. В `tsconfig.app.json` стоит `types: ["vite/client"]`, без `node`, поэтому пространство `NodeJS` берётся из заглушки в `@types/react-dom/server.d.ts` / `static.d.ts`. В этой заглушке есть только `ReadableStream`, а `ReadWriteStream` нет. Диагностика флагом CLI, конфиг не менялся: `--types vite/client,node` даёт exit=0. Значит, ошибку закрывают только варианты из запрещённого класса, то есть правки конфига или локальные заглушки:
- добавить `node` в `types` у `tsconfig.app.json`. Тогда в браузерный код попадут глобалы Node (`process`, `Buffer`, `require`), и их случайное использование перестанет ловиться;
- объявить свою заглушку `declare global { namespace NodeJS { interface ReadWriteStream … } }`.

После проверки `package.json` и `pnpm-lock.yaml` восстановлены из git (`git checkout` + `pnpm install --frozen-lockfile`). `@types/stylis` в проекте нет, `skipLibCheck` в обоих tsconfig по-прежнему `true`. Пункт 3(b), где сломанный импорт в `styled.d.ts` должен ронять сборку, поэтому не выполнялся.

`tsconfig.node.json` проверяет только `vite.config.ts`, не `src`. При `--skipLibCheck false` он и так даёт exit=0, менять его не требовалось.

## Recommended fix

Решает владелец, выбрать одно:
1. Разрешить `@types/stylis@4.2.7` и `node` в `types` у `tsconfig.app.json`. Цена: глобалы Node видны в браузерном коде.
2. Разрешить `@types/stylis@4.2.7` и локальную заглушку `NodeJS.ReadWriteStream` в отдельном `.d.ts` с комментарием, откуда она взялась. Это обход ошибки в чужих типах, поэтому нужно явное разрешение.
3. Оставить `skipLibCheck: true` и выбрать один из других вариантов ревьюера: оговорку в `typing.md` с ручной проверкой `--skipLibCheck false` или объявления в `.ts` вместо `.d.ts`.

## What was implemented

Пункт 1 сделан полностью и проверен:
- `createCommonRoutes<TRoot extends AnyRoute>(rootRoute: TRoot)` и `createProtectedRoutes<TLayout extends AnyRoute>(protectedLayoutRoute: TLayout)`. Тела и вызовы не менялись.
- Кода, который опирался на `any`, не нашлось: приведений и лишних guard'ов нет. Проверил всех потребителей роутера: `_useLoginForm.ts` (`useSearch` / `navigate`), `redirect` в `AppRouter.tsx` и `_routes.tsx`, `session.ts` (`window.location.assign`, вне типов роутера).

Доказательство 3(a). Временный `src/__probe_router.ts` (удалён), `pnpm exec tsc -p tsconfig.app.json --noEmit`, exit=2, ровно ожидаемые ошибки:
- `const exact: ESignOutReason | undefined = reason` — компилируется, то есть `reason` больше не `any`;
- `const notAny: number = reason` — TS2322 `ESignOutReason | undefined` → `number`;
- `navigate({ to: "/no-such-route" })` — TS2322, допустимы только `"/login" | "/" | "." | ".."`;
- `search: { reason: 42 }` — TS2322 `number` → `ESignOutReason`;
- `search: { nope: true }` — TS2353, у `nope` нет такого свойства;
- `redirect({ to: "/nowhere" })` — TS2322, тот же набор путей;
- `search: { reason: ESignOutReason.EXPIRED }` — компилируется.

## Files created

- нет (временный пробник удалён).

## Files modified

- `src/routes/_routes.tsx` — фабрики `createCommonRoutes` / `createProtectedRoutes` обобщены по родителю (`<TRoot extends AnyRoute>`, `<TLayout extends AnyRoute>`).
- Остальные файлы фазы из прошлых итераций не трогал. `tsconfig.app.json`, `package.json` и `pnpm-lock.yaml` не изменены: после пробной установки возвращены к состоянию из git.

## Verification

Выполнено только с пунктом 1, дерево в рабочем состоянии:
- `pnpm format` — exit 0, prettier переформатировал `src/routes/_routes.tsx` (сигнатура в одну строку);
- `pnpm lint` — exit 0;
- `pnpm build` — exit 0;
- `pnpm test` — exit 0, 32/32.

Новых экспортов нет. Временные файлы удалены, `.playwright-mcp` нет. Проверка в рантайме / браузере разработчиком не выполнялась.

## Known issues

- Пункты 2 и 3(b) заблокированы, см. Plan gap.
- Фабрики без комментария о том, почему они обобщённые: правило записано в `docs/agents/conventions/routing.md`, дублировать его в коде не стал.
- recipe-book содержит тот же `AnyRoute`. Он вне репозитория, не трогал.
