MODE: review
STATUS: APPROVED
Issue source: none

## Summary

В iter-6 код меняется в одном месте: обобщены фабрики роутов в `src/routes/_routes.tsx`. Находка [code] из iter-5 закрыта. Это видно по зарегистрированному роутеру: он теперь типизирован полностью, я перепроверил собственным пробником. Обе находки [plan] из iter-5 закрыты поправкой (7) с уточнением владельца, новым правилом в `routing.md` и проверкой `--skipLibCheck false` в `typing.md`. `package.json`, `pnpm-lock.yaml` и `tsconfig*.json` совпадают с `HEAD`. В `src/` под `--skipLibCheck false` ошибок нет.

## Notes

- **Находка [code] из iter-5 исправлена.** `_routes.tsx:25`: `createCommonRoutes<TRoot extends AnyRoute>(rootRoute: TRoot)`. `_routes.tsx:43`: `createProtectedRoutes<TLayout extends AnyRoute>(protectedLayoutRoute: TLayout)`. Тела не тронуты, вызовы в `AppRouter.tsx:31-34` тоже. Цикла импортов нет: `_routes.tsx` по-прежнему ничего не импортирует из `AppRouter.tsx`, поэтому комментарий на `_routes.tsx:19-24` остаётся верным. Я проверил это отдельно от отчёта разработчика, своим пробником: временный `src/__review_probe_iter6.ts`, `pnpm exec tsc -p tsconfig.app.json --noEmit`, exit 0, файл удалён. Пробник подтвердил:
  - тип `reason` из `useSearch({ from: "/login" })` в точности равен `ESignOutReason | undefined`, проверка через строгое равенство типов. Значит, `_useLoginForm.ts:39` больше не `any`;
  - ключи `RegisteredRouter["routesByPath"]` в точности равны `"/" | "/login"`. Шаблонов `/${any}/…`, как в iter-5, больше нет;
  - строки с `@ts-expect-error` действительно дают ошибку: `navigate({ to: "/no-such-route" })`, `search: { reason: 42 }`, `search: { nope: true }`, `redirect({ to: "/nowhere" })`, `useSearch({ from: "/whatever" })`. Корректный вызов `search: { reason: ESignOutReason.EXPIRED }` компилируется.

  Результат совпадает с доказательством 3(a) в `DEV-REPORT.md`.
- **Находки [plan] из iter-5 закрыты.**
  - Образец с долгом закрыт так: в `docs/agents/conventions/routing.md` появилось правило про обобщённые фабрики. Оно сформулировано через форму, без привязки к идентификаторам, и объясняет, почему `AnyRoute` нельзя. Поправка (7) в `plan.md:985-991` распространяет это на Phase 4 и Phase 6, включая `useParams({ from })` для `/chat/$chatId`.
  - Проблема `.d.ts` под `skipLibCheck: true` закрыта вариантом 1 из iter-5. По уточнению владельца в `plan.md:990`, `skipLibCheck: true` остаётся. В `docs/agents/conventions/typing.md` записана ручная проверка с объяснением, зачем она нужна, и с оговоркой про ожидаемые ошибки в `styled-components`.
- **Проверку из `typing.md` я запустил сам.** `pnpm exec tsc -p tsconfig.app.json --noEmit --skipLibCheck false` завершился с exit 2. Все три ошибки находятся в `node_modules/.pnpm/styled-components@6.5.3_…/dist/`: TS2694 `NodeJS.ReadWriteStream` в `models/ServerStyleSheet.d.ts`, TS7016 `stylis` в `models/StyleSheetManager.d.ts` и в `utils/stylisPluginRSC.d.ts`. **В `src/` ошибок нет.** TS7016 заодно показывает, что `@types/stylis` в зависимостях действительно нет.
- **Конфиги и зависимости.** `git diff --exit-code HEAD -- package.json pnpm-lock.yaml tsconfig.json tsconfig.app.json tsconfig.node.json` даёт exit 0. У `package.json` и `pnpm-lock.yaml` mtime новее iter-5, это след `git checkout` после пробной установки, содержимое совпадает с `HEAD`. После `REVIEW.md` из iter-5 в `src/` менялся только `src/routes/_routes.tsx`.
- **Verification.** Я перезапустил сами команды из плана, без подмен: `pnpm lint` exit 0, `pnpm build` exit 0, `pnpm test` 32/32, `prettier --check src` exit 0. Всё совпадает с отчётом.
- **Остановка на `skipLibCheck`.** Разработчик остановился в STOPPED_ON_PLAN_GAP, как требовало стоп-условие поправки (7). Обходить ошибку типами `node` в браузерном конфиге или заглушкой `NodeJS` он не стал, это правильно. Диагностика в `DEV-REPORT.md` (откуда берётся `NodeJS` и что `--types vite/client,node` даёт 0 ошибок) точная и помогла владельцу решить.
- **Комментарий о причине дженериков в коде.** Разработчик сознательно его не добавил, потому что правило уже есть в `routing.md`. Я согласен: сигнатура не выглядит лишней, а у правила одно место.
- **`.playwright-mcp/` в корне.** Папка появилась в 20:24, позже `DEV-REPORT.md` (20:15). Похоже, её создал визуальный ревьюер, который работает параллельно, а не разработчик. В `.gitignore` её нет, перед коммитом её стоит удалить.
- **На будущее (Phase 6, не блокирует).** `plan.md:596` по-прежнему говорит «параметр — пропсом, как `ProductCardRoute` в recipe-book». Поправка (7) уточняет, что обёртка читает `useParams({ from: <id роута> })`, а не `chatRoute.useParams()`, и у поправок приоритет. Строка таблицы образцов `plan.md:75` не изменилась, но теперь её перекрывает правило в `routing.md`.
