Status: COMPLETED

## Phase goal

Phase 6 — «Новый чат и экран переписки». Итерация 3 — FIX по `plans/messenger-v1/phase-6/iter-2/REVIEW.md`: два замечания `[code]`, план не менялся.

## What was implemented

1. **Общий `Skeleton` (замечание 1, Placement).** Форма скелетона была объявлена трижды. Теперь она живёт в `src/components/Skeleton/` (`index.ts` + `_Skeleton.tsx` + `_styles.ts`, по образцу `IconButton`). Компонент задаёт `flex-shrink: 0`, радиус `radii.pill`, фон `palette.surfaceMuted` и анимацию пульсации `1.5s ease-in-out infinite`. Размеры приходят через пропсы `width` / `height` — это CSS-длины строкой. Keyframes пульсации теперь лежат в `_styles.ts` компонента и не экспортируются. Файл `src/theme/_animations.ts` удалён, строка `export { skeletonPulse }` убрана из `src/theme/index.ts`: он снова совпадает с HEAD. На `Skeleton` переведены:
   - `ChatPage/_ChatHeader.tsx`: аватар `42px × 42px` и имя `min(160px, 50%) × 14px`. Это то же, что раньше давали `width: 160px; max-width: 50%`. Диаметр 42 вынесен в константу модуля `AVATAR_SIZE`, её используют и `Avatar`, и плейсхолдер: так связь «тот же диаметр» осталась в коде, раньше она была только в комментарии. Из `_styles.ts` удалены `SSkeletonShape` / `SSkeletonAvatar` / `SSkeletonName`.
   - `Sidebar/_Sidebar.tsx`: аватар `54px × 54px` и строки `45%` / `75%` × `14px`. `SSkeletonRow` / `SSkeletonLines` — это раскладка строки, а не форма скелетона, поэтому они остались в `Sidebar/_styles.ts`. `SSkeletonShape` / `SSkeletonAvatar` / `SSkeletonLine` удалены.
   - `AccountMenu/_AccountMenu.tsx`: `60% × 22px`. `SAccountSkeleton` удалён.
   - Как выглядят скелетоны, не изменилось: размеры, радиусы, цвет и анимация прежние. Единственное отличие — `flex-shrink: 0` теперь стоит и у строк списка и у строки аккаунта. Обе лежат в колонке с автоматической высотой, поэтому по высоте они и раньше не сжимались, и раскладка не меняется. `aria-hidden` у скелетонов не было и сейчас нет: это пустые `div`, скринридер их не озвучивает.
2. **JSDoc `focusAfterNewChat` (замечание 2, Comments).** Комментарий теперь начинается с назначения: «Возвращает фокус на кнопку нового чата после закрытия панели «Новый чат».». Отдельным абзацем идёт механизм: «Ref-callback, а не эффект: кнопка монтируется заново при каждом возврате к списку.»

## UIKit wrappers

Новых обёрток `styled(<primitive>)` нет.

## Files created

Список накопительный (iter-1..3).

- `src/components/Skeleton/index.ts` — barrel. *(iter-3)*
- `src/components/Skeleton/_Skeleton.tsx` — компонент-плейсхолдер с пропсами `width` / `height`. *(iter-3)*
- `src/components/Skeleton/_styles.ts` — форма, фон и keyframes пульсации. *(iter-3)*
- `src/api/mutations/chats.mutations.ts` и `chats.mutations.test.ts` *(iter-1/2)*
- `src/components/Button/*`, `src/components/IconButton/*` *(iter-1/2)*
- `src/layouts/MessengerLayout/_internal/Sidebar/_internal/NewChatPanel/*` *(iter-1/2)*
- `src/pages/ChatPage/*` *(iter-1/2; в iter-3 изменены `_ChatHeader.tsx` и `_styles.ts`)*
- `src/utils/helpers/contactFormat.ts` и `contactFormat.test.ts` *(iter-1/2)*
- ~~`src/theme/_animations.ts`~~ — создан в iter-1/2, **удалён** в iter-3.

## Files modified

Список накопительный.

- `src/routes/_routes.tsx` *(iter-1/2)*
- `ChatListItem/*` *(iter-1/2)*
- `Sidebar/_Sidebar.tsx`: iter-3 — скелетоны переведены на `Skeleton`, исправлен JSDoc `focusAfterNewChat`.
- `Sidebar/_styles.ts`: iter-3 — удалены `SSkeletonShape` / `SSkeletonAvatar` / `SSkeletonLine` и импорт `skeletonPulse`.
- `AccountMenu/_AccountMenu.tsx`: iter-3 — `SAccountSkeleton` заменён на `Skeleton`.
- `AccountMenu/_styles.ts`: iter-3 — удалены `SAccountSkeleton` и импорт `skeletonPulse`.
- `src/layouts/MessengerLayout/_MessengerLayout.tsx`, `_styles.ts` *(iter-1/2)*
- `src/components/Avatar/_styles.ts`, `src/components/icons/_icons.tsx` *(iter-1/2)*
- `LoginPage/*`, `src/api/services/chats.service.ts` *(iter-1/2)*
- `src/theme/index.ts`: iter-3 — убран реэкспорт `skeletonPulse`, файл совпадает с HEAD.

## Verification

Все команды запущены дословно:

- `pnpm format` — прошёл. Prettier свернул импорт `_styles` в `_ChatHeader.tsx` в одну строку.
- `pnpm lint` — exit 0, без предупреждений. Baseline тоже чистый.
- `pnpm build` — exit 0.
- `pnpm test` — 8 файлов, 105 тестов, все прошли.
- **Exports:** `Skeleton` импортируют три места — `_ChatHeader.tsx`, `_Sidebar.tsx`, `_AccountMenu.tsx`. Keyframes не экспортируются. `grep -rn "skeletonPulse\|_animations" src` — 0 совпадений.
- **Stop condition:** оба замечания ревью закрыты, за пределы списка изменения не выходили.
- **Runtime / browser:** разработчик проверку в браузере не проводил. Визуальная проверка — за visual reviewer.
- Временных файлов и папки `.playwright-mcp` нет.

## Known issues

- Нет.
