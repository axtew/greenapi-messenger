Status: COMPLETED

# DEV-REPORT — messenger-v1 / phase-4 / iter-1

## Phase goal

После входа — каркас из двух колонок (на мобильной — одна панель), левая панель с меню аккаунта и выходом, справа — пилюля
«Выберите, кому хотели бы написать». Stop condition: меню показывает аккаунт, «Выйти» возвращает на `/login`; раскладка переключается на 767px.

## What was implemented

- **Каркас `MessengerLayout`** — компонент защищённого pathless layout-роута вместо `Outlet`. Это flex-строка на `100dvh` на фоне `chatBackground`:
  `<Sidebar />` и `<main>` с `<Outlet />` (`min-width: 0; min-height: 0`). До `breakpoints.mobileMax` правая колонка скрыта (`display: none`),
  видна только панель. `data-chat-open` и чтение `chatId` не делались — по поправке (8) они перенесены в Phase 6.
- **`NoChatSelected`** — индексный роут `/` вместо заглушки `HomeStub` из Phase 3. Роут остаётся в обобщённой фабрике `createProtectedRoutes`
  (поправка (7)). Пилюля `palette.datePill`, текст `H3` `onPrimary` по центру.
- **`Sidebar`** — `aside`-карточка. На десктопе: 420px, отступ 18px сверху, слева и снизу (справа 0 — панель примыкает к правой колонке, как в
  `01-wide-empty.png`), `radii.panel`. На мобильной: вся ширина, без скругления, `env(safe-area-inset-*)`. Шапка: `AccountMenu` и `H3 as="h2"` с `sidebar.title`.
- **`AccountMenu`** — кнопка-гамбургер (`MenuIcon`, `aria-label={l.menuButton}`, `aria-expanded`, `aria-controls`) с выпадающим меню.
  - Блок аккаунта: `Caption` «Аккаунт» и строка `"@" + username`, иначе `"+" + phone`. Пока идёт загрузка — пульсирующая плашка-скелетон
    `surfaceMuted` высотой в строку `B1`. При ошибке или когда оба поля `null`, блока аккаунта нет целиком (подпись «Аккаунт» тоже не показывается).
  - «Выйти» (`LogoutIcon` + `B1`) вызывает `signOut()`.
  - Закрытие меню: клик по прозрачной кнопке-подложке (`position: fixed; inset: 0`, `aria-hidden`, `tabIndex={-1}`) или `Escape`.
    `Escape` ловится `onKeyDown` на корне меню (без `useEffect`-слушателей), сравнивается с `EKeyboardKey.ESCAPE`, фокус возвращается на гамбургер.
  - Состояние `isOpen` живёт в самом `AccountMenu` — у него один потребитель.
- **`useAccountQuery`** (`getAccount`, `staleTime: Infinity`). Ключ `["account"]` — константа модуля без экспорта: импортёров нет.
  Вызывается при монтировании меню, поэтому при первом открытии строка обычно уже загружена. Других запросов, кроме `getAccountSettings`, фаза не делает.
- **`EKeyboardKey`** (`ESCAPE = "Escape"`) — в `src/types/common.types.ts` (общий слой, решение владельца в поправке (8)).
- **Иконки** `MenuIcon` и `LogoutIcon`: `d` путей скачан `curl`'ом из `menu/…/menu_24px.svg` и `logout/…/logout_24px.svg`
  (Material Symbols Rounded). Разметка: `viewBox="0 -960 960 960"`, `fill="currentColor"`, `aria-hidden`, проп `size` (по умолчанию 24).
  `index.ts` — `export * from "./_icons"`, как требует план.

## UIKit wrappers

Обёрток `styled(<примитив проекта>)` нет. Внутри `AccountMenu/_styles.ts` есть локальная база `SBareButton` (сброс стилей кнопки и `focus-visible`):
от неё через `styled(...)` наследуются `SMenuButton`, `SBackdrop` и `SLogoutButton`. Это локальные стили компонента, а не примитив проекта.

## Files created

- `src/routes/layouts/MessengerLayout/index.ts` — экспорт `MessengerLayout` и `NoChatSelected`.
- `src/routes/layouts/MessengerLayout/_MessengerLayout.tsx` — каркас: панель и `Outlet`.
- `src/routes/layouts/MessengerLayout/_NoChatSelected.tsx` — пустое состояние справа.
- `src/routes/layouts/MessengerLayout/_styles.ts` — `SLayout`, `SContent` (скрыт на мобильной), `SNoChatSelected`, `SPill`.
- `src/components/Sidebar/index.ts`, `_Sidebar.tsx`, `_styles.ts` — левая панель с шапкой.
- `src/components/Sidebar/_internal/AccountMenu/index.ts`, `_AccountMenu.tsx`, `_styles.ts` — меню аккаунта и выход.
- `src/components/icons/index.ts`, `_icons.tsx` — `MenuIcon`, `LogoutIcon`.
- `src/api/queries/account.queries.ts` — `useAccountQuery`.

## Files modified

- `src/routes/AppRouter.tsx` — компонент защищённого layout-роута: `Outlet` → `MessengerLayout`; JSDoc уточнён (роут теперь рендерит каркас).
- `src/routes/_routes.tsx` — индексный роут: `HomeStub` → `NoChatSelected`; `HomeStub` и его импорты (`H1`, `useI18nSelector`) удалены.
- `src/types/common.types.ts` — добавлен `enum EKeyboardKey { ESCAPE = "Escape" }`.

## Figma extraction

Figma в проекте нет (`design.source: none`). Решения по референсам и в режиме Free choice:

- **Каркас и панель (Reference `01-wide-empty.png`, `04-mobile-list.png`):**
  - панель 420px, отступ 18px, скругление `radii.panel`; правая часть начинается сразу за панелью;
  - на мобильной панель занимает весь экран без скругления;
  - шапка: гамбургер 44×44 и заголовок «Чаты» вместо поиска (поиск не делаем).
- **Пустое состояние справа:** пилюля `datePill`, белый текст `H3` (16px medium), отступы 4/12 — по стилю разделителя дат из плана.
- **Меню аккаунта (Free choice):**
  - выпадает под гамбургером, ширина от 240px, белый фон;
  - рамка 1px `palette.border` вместо тени: токена тени в теме нет, литеральный rgba был бы цветом вне темы;
  - разделитель между блоком аккаунта и «Выйти»;
  - строка «Выйти» высотой 44px (тап-цель), иконка `textMuted`, ховер `surfaceMuted`.

## Verification

Запускались ровно команды фазы и профиля, без замен.

- **`pnpm format`, `pnpm exec prettier --check src`** — все файлы отформатированы.
- **`pnpm lint`** — exit 0. Две ошибки `simple-import-sort` в моих правках роутов исправлены (`eslint --fix`). В baseline предсуществующих нет.
- **`pnpm build`** — exit 0, ошибок нет.
- **`pnpm test`** — 32/32.
- **`.d.ts`** не трогались, поэтому проверка `tsc --skipLibCheck false` не требовалась.
- **Экспорты.** У каждого нового экспорта есть импортёр вне модуля:
  - `EKeyboardKey`, `useAccountQuery`, `MenuIcon`, `LogoutIcon` → `_AccountMenu.tsx`;
  - `AccountMenu` → `_Sidebar.tsx`;
  - `Sidebar` → `_MessengerLayout.tsx`;
  - `MessengerLayout` → `AppRouter.tsx`;
  - `NoChatSelected` → `_routes.tsx`.

  Заготовок нет.
- **Phase stop condition** — выполнено: все файлы из плана созданы, роуты заменены, работа следующих фаз не захвачена.
- **Runtime / браузер.** Короткая самопроверка разработчика на `pnpm dev`. Это наблюдения, а не доказательства: проверки Visual Verification
  ведёт визуальный ревьюер.
  - Сессия засеяна временной страницей из `.env.local`: токен не выводился, страница удалена сразу после загрузки.
  - На 1044px панель занимает 18/18/420×620 с радиусом 24px, справа пилюля, текст «Чаты» и «Выберите, кому хотели бы написать».
  - Меню показывает «Аккаунт» и `@username` тестового аккаунта. `Escape` закрывает меню, фокус возвращается на гамбургер; клик по подложке тоже закрывает.
  - На 390px (проверено в iframe) панель во всю ширину, радиус 0, `main` скрыт, горизонтального скролла нет.
  - «Выйти» ведёт на `/login`; повторное открытие `/` снова даёт `/login`. Ошибок и предупреждений в консоли нет.
  - Dev-сервер остановлен, `.playwright-mcp` удалён.

## Known issues

- **Ключ `app.title`** после удаления `HomeStub` не используется в коде. Он остаётся в словаре и в `I18n`: словарь — общий контракт всех фаз (Phase 1).
- **Трактовка «строки нет».** При ошибке запроса или когда оба поля аккаунта `null`, скрывается весь блок аккаунта вместе с подписью «Аккаунт»:
  подпись без значения ничего не сообщает. Если имелось в виду «подпись остаётся, значения нет» — это правка в одну строку.
- **Запрос аккаунта при монтировании.** `useAccountQuery` вызывается при монтировании `AccountMenu`, а не при первом открытии меню. Поэтому 401 от
  `getAccountSettings` уводит на вход с `?reason=expired` сразу после загрузки каркаса — так же, как любой другой запрос.
- **Нет ARIA-паттерна `menu`.** У меню нет `role="menu"` / `menuitem` и навигации стрелками: роли без полной клавиатурной модели хуже их отсутствия.
  Сейчас это обычные кнопки с `aria-expanded` / `aria-controls`.
- **Плагин `jsx-a11y` не подключён.** Подложка — кнопка с `aria-hidden` и `tabIndex={-1}`. Доступного имени у неё нет — для него понадобился бы новый
  текст, а это стоп-и-вопрос. С клавиатуры меню закрывается по `Escape`.
- **Planner-drift:** нет.
