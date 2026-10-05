MODE: review
STATUS: NEEDS_CHANGES
Issue source: both

## Summary

Перенос `declare module` в `.d.ts` в iter-5 сделан чисто и по поправке «Phases 1, 3 — added 2026-10-05 (6)», замечаний к нему нет. Разбор находки разработчика за пределами scope показал дефект Phase 3: типизация TanStack Router в этом репозитории действительно отключена. Причина не та, что предположил разработчик. Фабрики роутов возвращают кортежи `as const`, и это ни на что не влияет. Дело в типе параметра `AnyRoute` в `_routes.tsx`. Из-за него `reason` в форме входа получает тип `any`, а `to` и `search` у `navigate` / `redirect` не проверяются. Исправление занимает две строки, я проверил его на копии `src`. Отдельно для решения владельца: из-за `skipLibCheck: true` ошибки внутри новых `.d.ts` не видны `tsc` и молча превращают тему и роутер в `any`. Это тоже проверено.

## Issues

### Code issues

#### TypeScript — типизация роутера выключена через `AnyRoute`
- [code] `src/routes/_routes.tsx:25`, `src/routes/_routes.tsx:43`: у `createCommonRoutes(rootRoute: AnyRoute)` и `createProtectedRoutes(protectedLayoutRoute: AnyRoute)` тип родителя стёрт до `AnyRoute`. `getParentRoute: () => rootRoute` поэтому возвращает `AnyRoute`, и TanStack Router собирает `fullPath` / `id` детей из `any`. Это видно по зарегистрированному роутеру: в ключах `RegisteredRouter["routesByPath"]` кроме `"/"` и `"/login"` есть шаблоны `/${any}/` и `/${any}/login`, а в ключах `routesById` — те же шаблоны и `"/protected-layout"`. Что из этого следует (проверено временным файлом в `src/` и `pnpm exec tsc -p tsconfig.app.json --noEmit`, файл удалён):
  - `src/pages/LoginPage/_useLoginForm.ts:39`: у `const { reason } = useSearch({ from: routerPaths.login })` значение `reason` имеет тип **`any`**, хотя `validateSearch` возвращает `ILoginSearch`. Это нарушает `typing.md:5` («`any` … недопустимы нигде»), просто `any` здесь неявный. Сравнение на `:80` компилируется при любом типе.
  - `navigate({ to: "/no-such-route" })` проходит. `navigate({ to: "/login", search: { reason: 42 } })` тоже проходит, как и `search: { nope: true }`. То же касается `redirect` в `AppRouter.tsx:25` и `_routes.tsx:33`.
  - Phase 6 добавит `/chat/$chatId` с параметром и ссылки из `ChatListItem` на этот же механизм, то есть без исправления и они останутся без проверки типов.

  **Исправление:** сделать фабрики обобщёнными по родителю, тело и вызовы не меняются:
  `export function createCommonRoutes<TRoot extends AnyRoute>(rootRoute: TRoot)` и
  `export function createProtectedRoutes<TLayout extends AnyRoute>(protectedLayoutRoute: TLayout)`.
  Я проверил это на копии `src` + `tsconfig.app.json` в scratchpad, с junction на `node_modules` и с регистрацией через `router.d.ts`. `tsc` проходит без ошибок и без циклов вывода типов. `reason` получает тип `ESignOutReason | undefined`. `to: "/no-such-route"` даёт TS2322: допустимы только `/`, `/login`, `.` и `..`. `search: { reason: 42 }` даёт TS2322, ожидается `ESignOutReason`. Отдельный пробник с `/chat/$chatId` даёт узкий набор путей (`/login`, `/`, `/chat/$chatId`) и параметры `ResolveParams<"/chat/$chatId">`, так что Phase 6 уже ляжет на типизированную основу. Цикла импортов дженерик не создаёт: `_routes.tsx` по-прежнему ничего не берёт из `AppRouter.tsx`.

  Почему это `code`: план требует только «фабрики с корнем параметром (без цикла импортов)» (`plan.md:75`, Phase 3 п. 2). Тип `AnyRoute` перенесён из recipe-book (`recipe-book/src/routes/_routes.tsx:23,44` — там тот же дефект). Повторять нужно устройство образца, а не его долг.

### Plan issues

#### Образец с долгом без оговорки
- [plan] `plan.md:75` (таблица «Reference implementations») и Phase 3 п. 2 отсылают к recipe-book «по образцу» и не оговаривают тип параметра фабрик. Phase 4 (`plan.md:459`) и Phase 6 (`plan.md:596`) снова правят `_routes.tsx` и опять смотрят на recipe-book. Минимальная поправка: в строку `plan.md:75` или в «Potential gotchas» добавить «фабрики обобщены по родителю (`<TRoot extends AnyRoute>(rootRoute: TRoot)`). С параметром `AnyRoute`, как в recipe-book, у путей, `search` и `params` пропадают типы». Можно ещё одной строкой занести то же в `docs/agents/conventions/routing.md`, и следующая фаза не вернёт дефект.

#### `.d.ts` под `skipLibCheck: true`: ошибки в объявлениях не видны (решение владельца)
- [plan] Поправка (6) говорит «Поведение и типы не меняются», и для текущего кода это верно. Но изменилась гарантия проверки. `tsconfig.app.json:9` содержит `skipLibCheck: true`, а этот флаг пропускает проверку **всех** `.d.ts`, включая свои. Проверка на копии `src`: в `styled.d.ts` переименовал импорт в несуществующий `themeRenamed`, в `router.d.ts` — в `appRouter`. `tsc -p tsconfig.app.json --noEmit` завершился с exit 0, и при этом компилировались `t.palette.nope.deeper` на `DefaultTheme` и `useSearch({ from: "/whatever" }).anything`. Тема и роутер молча стали `any`. Пока объявления были в `_theme.ts` / `AppRouter.tsx`, такое переименование ломало сборку. Пустить ошибку можно, переименовав или перенеся `theme` / `router`, и `pnpm build` её не поймает. Если бы ошибку проверял `tsc --skipLibCheck false`, он бы показал обе (TS2305, TS2724), но вместе с тремя ошибками в `node_modules/styled-components`. Варианты для владельца:
  1. Оставить `.d.ts` и дописать в правило `typing.md` оговорку: после переименования экспорта, на который ссылается `.d.ts`, проверить `pnpm exec tsc -p tsconfig.app.json --noEmit --skipLibCheck false`. Это дёшево, но держится на памяти.
  2. Выделить объявления в отдельные **`.ts`**-файлы, а не `.d.ts`. Логика отделена так же, а проверка остаётся полной, потому что `skipLibCheck` на `.ts` не действует. Это расходится с формулировкой нового правила.
  3. Выключить `skipLibCheck`. Тогда нужно закрыть 3 ошибки в типах `styled-components`: `stylis`, судя по подсказке `tsc`, требует `@types/stylis`, а это новая зависимость и нужно разрешение владельца.

  Код iter-5 корректен при любом выборе. Вопрос только в том, какая страховка нужна.

## Notes

- **iter-5 delta проверена, замечаний нет.**
  - `src/theme/styled.d.ts`: набор полей тот же, что был в `_theme.ts` у `HEAD`, только через `TTheme["…"]`. Файл делает модулем `import type`. Явные поля вместо `extends TTheme {}` выбраны разумно: `tseslint.configs.recommended` → `no-empty-object-type`.
  - `src/app/react-query.d.ts`: комментарий на строке 1 проверен как утверждение о коде. Без `import "@tanstack/react-query"` `tsc` падает с TS2305: у пакета «нет» `QueryClient`, `useMutation` и т. п. В `tsconfig` стоит `moduleDetection: "force"`, но на `.d.ts` он не действует. Первая строка комментария объясняет назначение, следов пайплайна нет. `TMutationMeta` не экспортируется, и снаружи он не нужен (grep).
  - `src/routes/router.d.ts`: соответствует поправке.
  - Блоки `declare module` из `_theme.ts`, `_queryClient.ts` и `AppRouter.tsx` удалены, вне `.d.ts` в `src/` их нет. Экспорты и импорты не менялись. Расположение и имена (`<тема>.d.ts` без `_`) совпадают с прецедентом `recipe-book/src/theme/styled.d.ts`.
- **Verification.** `pnpm lint`, `pnpm build`, `pnpm test` (32/32) и `prettier --check src` я перезапустил сам, у всех exit 0. Совпадает с отчётом, команды не подменены. Временные пробники из `src/` и копии в scratchpad удалены. `git status` по неотслеживаемым файлам тот же, что до ревью.
- **Гипотеза разработчика про массивы неверна.** В обобщённом пробнике фабрики так же возвращают `[...] as const` и дают узкие типы. Причина только в `AnyRoute`. Разработчик правильно не стал чинить это в iter-5: поправка (6) этого не касалась.
- Дефект появился ещё в iter-1 этой фазы, и ревью iter-1–4 его пропустили. Фаза не закоммичена, поэтому исправлять стоит сейчас, до Phase 4 / 6. Не надо откладывать в `BACKLOG.md`.
- recipe-book содержит тот же `AnyRoute` (`src/routes/_routes.tsx:23,44`). Это за пределами репозитория. Если владелец захочет, исправление там такое же.
