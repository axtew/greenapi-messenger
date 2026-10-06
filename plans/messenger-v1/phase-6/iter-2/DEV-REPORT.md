Status: COMPLETED

## Phase goal
Phase 6 — «Новый чат и экран переписки», FIX-итерация 2 по `phase-6/iter-1/REVIEW.md` и поправке «Phase 6 — added 2026-10-05 (13)»: обёртка роута на уровне модуля, заглушка шапки на время поиска чата, честный JSDoc `createChat` и одобренные владельцем необязательные правки (4a–4e).

## What was implemented
По пунктам задания:

1. **`ChatRoute` на уровне модуля** (`src/routes/_routes.tsx`). Обёртка вынесена из тела `createProtectedRoutes`. Параметры по-прежнему читаются через `useParams({ from: "/protected-layout/chat/$chatId" })` и уходят в `ChatPage` пропсом `chatId`. В JSDoc вместо `chatRoute.useParams()` теперь `route.useParams()`: на уровне модуля `chatRoute` вне области видимости.
2. **Состояние «ищем чат»** (`src/pages/ChatPage/`).
   - `_useChatPage` возвращает `{ chat, isChatPending }`, где `isChatPending = chat === undefined && isFetching`. Отложенный редирект (`isMissing` → `navigate(home, replace)`) и сброс непрочитанных не менялись.
   - `ChatPage` возвращает `null` только если чата нет и синхронизация не идёт. Это один кадр до срабатывания редиректа. В остальных случаях рендерится `ChatHeader`.
   - `ChatHeader` принимает `chat: IChat | undefined`. При `undefined` вместо аватара и имени он показывает скелетоны `SSkeletonAvatar` (42×42, как `Avatar` в шапке) и `SSkeletonName` (160px, но не шире 50%, высота 14px, как строки скелетона панели). Кнопка «назад» общая для обоих состояний и видна на мобильной. Анимация та же: `skeletonPulse 1.5s ease-in-out infinite`, фон `surfaceMuted`, радиус `pill`.
   - **Перенос keyframes.** У `skeletonPulse` появился потребитель во второй фиче: страница `ChatPage` наряду с каркасом `MessengerLayout`. По ступени 5 `structure.md` keyframes перенесены из `Sidebar/_styles.ts` в `src/theme/_animations.ts` и экспортируются из barrel `@/theme`. Почему `src/theme`, а не `src/components`: это стилевой примитив, а не компонент, и он лежит рядом с `GlobalStyle` и токенами. Импорты в `Sidebar/_styles.ts` и `AccountMenu/_styles.ts` переведены на `@/theme`.
3. **JSDoc `createChat`** (`src/api/mutations/chats.mutations.ts`) теперь звучит так: «…помечается временным (`isProfileLoaded: false`): синхронизация списка перезапросит профиль, если чат окажется среди синхронизируемых».
4. Необязательные правки, одобренные владельцем:
   - a. **Размер инициалов `Avatar`** (`src/components/Avatar/_styles.ts`). Формула: `font-size: calc(theme.typography.fontSizes.lg * size / 54)`, базовый диаметр — константа `INITIALS_BASE_SIZE = 54` с JSDoc. При 54px получается ровно 20px, как раньше; при 42px (шапка) — ≈15.6px.
   - b. **«Назад» в `ChatHeader`** вызывает `navigate({ to: routerPaths.home, replace: true })`. Это отражено во второй строке JSDoc компонента.
   - c. **Фокус на карандаш после закрытия панели «Новый чат»** (`Sidebar/_Sidebar.tsx`). Флаг `isNewChatClosedRef` выставляется в обработчике `closeNewChat`. Ref-callback `focusAfterNewChat` на FAB при монтировании ставит фокус и сбрасывает флаг. `useEffect` не понадобился. Флаг выставляется при любом закрытии: и по «назад», и после успешного создания чата (`useNewChatForm` вызывает тот же `onClose`). На мобильной после создания панель скрыта `display: none`, и `focus()` ничего не делает. На десктопе фокус уходит на FAB, а не теряется на `body`.
   - d. **`:hover` у FAB** (`Sidebar/_styles.ts`) — `filter: brightness(0.92)`. В палитре нет отдельного оттенка наведения для `primary`, а новый hex в тему без отметки плана добавлять нельзя (`styling.md`). Поэтому затемняется сам токен `primary`, это объяснено комментарием. Стиль наведения при этом отличается от `IconButton`, у которого `surfaceMuted` на прозрачном фоне.
   - e. **Селектор `data-chat-open`** в `Sidebar/_styles.ts` теперь `${SLayout}[data-chat-open="true"] > &`, импорт `SLayout` из `../../_styles`. Цикла нет: `MessengerLayout/_styles.ts` ничего не импортирует из `Sidebar`.

## UIKit wrappers
Новых `styled(<primitive>)` не добавлялось (`SBackButton = styled(IconButton)` остался с iter-1).

## Files created
- `src/theme/_animations.ts` — keyframes `skeletonPulse`, перенесены из `Sidebar/_styles.ts` (iter-2).
- Из iter-1, без изменений (кроме перечисленных ниже): `src/api/mutations/chats.mutations.ts`, `src/api/mutations/chats.mutations.test.ts`, `src/components/Button/*`, `src/components/IconButton/*`, `src/layouts/MessengerLayout/_internal/Sidebar/_internal/NewChatPanel/*`, `src/pages/ChatPage/*` (`_ChatPage.tsx`, `_ChatHeader.tsx`, `_styles.ts`, `_useChatPage.ts`, `index.ts`), `src/utils/helpers/contactFormat.ts`, `src/utils/helpers/contactFormat.test.ts`.

## Files modified
Изменено в iter-2:
- `src/routes/_routes.tsx` — `ChatRoute` перенесён на уровень модуля.
- `src/pages/ChatPage/_useChatPage.ts` — возвращает `{ chat, isChatPending }`.
- `src/pages/ChatPage/_ChatPage.tsx` — `null` только при `!chat && !isChatPending`, иначе шапка.
- `src/pages/ChatPage/_ChatHeader.tsx` — `chat: IChat | undefined` со скелетоном, «назад» с `replace: true`.
- `src/pages/ChatPage/_styles.ts` — `SSkeletonAvatar`, `SSkeletonName` (база `SSkeletonShape` в файле).
- `src/api/mutations/chats.mutations.ts` — JSDoc `createChat`.
- `src/components/Avatar/_styles.ts` — размер шрифта инициалов зависит от диаметра.
- `src/layouts/MessengerLayout/_internal/Sidebar/_Sidebar.tsx` — возврат фокуса на FAB.
- `src/layouts/MessengerLayout/_internal/Sidebar/_styles.ts` — `skeletonPulse` из `@/theme`, селектор через `SLayout`, `:hover` у FAB.
- `src/layouts/MessengerLayout/_internal/Sidebar/_internal/AccountMenu/_styles.ts` — `skeletonPulse` из `@/theme`.
- `src/theme/index.ts` — экспорт `skeletonPulse`.

Из iter-1, без изменений: `src/api/services/chats.service.ts`, `src/components/icons/_icons.tsx`, `src/layouts/MessengerLayout/_MessengerLayout.tsx`, `src/layouts/MessengerLayout/_styles.ts`, `AccountMenu/_AccountMenu.tsx`, `ChatListItem/_ChatListItem.tsx`, `ChatListItem/_styles.ts`, `src/pages/LoginPage/_LoginPage.tsx`, `src/pages/LoginPage/_styles.ts`.

## Figma extraction
Figma нет (`design.source: none`). Free choice:
- Заглушка шапки повторяет раскладку настоящей шапки: пилюля 56px, кружок 42px, рядом полоса имени 14px. Палитра и анимация взяты у скелетонов панели. Строку подзаголовка не рисовал: в задании только аватар и имя.

## Verification
Команды выполнены дословно:
- `pnpm format` — exit 0.
- `pnpm lint` — 0 ошибок и 0 предупреждений, совпадает с baseline.
- `pnpm build` — OK.
- `pnpm test` — 8 файлов, 105/105.

Экспорты:
- `skeletonPulse` из `@/theme` импортируют `Sidebar/_styles.ts`, `AccountMenu/_styles.ts` и `ChatPage/_styles.ts`.
- `SSkeletonAvatar` и `SSkeletonName` импортирует `_ChatHeader.tsx`.
- `SSkeletonShape` не экспортируется.
- Новых экспортов без импортёров нет.

Квота: `checkAccount` и `getContactInfo` не вызывались, браузер не открывался. Runtime-проверку разработчик не выполнял, она за визуальным ревьюером. Что стоит перепроверить:
- заглушку на `/chat/1` (на мобильной видна кнопка «назад»);
- `replace` у «назад»: после неё системная «назад» не открывает чат;
- фокус на FAB после «назад» из панели;
- `:hover` у FAB;
- инициалы при 42px.

Временных файлов и `.playwright-mcp` нет.

## Known issues
- Скелетон-фигура (`pill` + `surfaceMuted` + `skeletonPulse`) теперь объявлена в трёх местах: `Sidebar/_styles.ts`, `AccountMenu/_styles.ts` и `ChatPage/_styles.ts`. Поднять её в общий примитив `src/components/Skeleton` — кандидат в `BACKLOG.md`. В этой итерации не делал, потому что в задании только перенос keyframes.
- У `Button` (`primary`) по-прежнему нет `:hover`, а у FAB он теперь есть. Если нужна полная согласованность, тот же `brightness` можно добавить в `Button`. Это вне задания.
- Фокус возвращается на FAB при любом закрытии панели, в том числе после успешного создания чата (п. 4c).
