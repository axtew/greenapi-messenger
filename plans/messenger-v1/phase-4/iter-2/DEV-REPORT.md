Status: COMPLETED

## Phase goal

Phase 4 — каркас мессенджера и меню аккаунта. Итерация 2 — FIX после ревью iter-1 и поправка плана «Phases 4–9 — added 2026-10-05 (9): папка `src/layouts/`» (в работе только её пункты Phase 4): перенос файлов в `src/layouts/` и `src/pages/HomePage/`, находка `[code]` про `Escape`, закрытие меню при уходе фокуса и удаление ключа `app` из словаря.

## What was implemented

1. **Перенос файлов** (файлы были untracked, поэтому обычный `mv`, без `git mv`):
   - `src/routes/layouts/MessengerLayout/` → `src/layouts/MessengerLayout/` (`index.ts`, `_MessengerLayout.tsx`, `_styles.ts`); `src/routes/layouts/` удалена.
   - `src/components/Sidebar/` → `src/layouts/MessengerLayout/_internal/Sidebar/`; `AccountMenu` → `.../Sidebar/_internal/AccountMenu/`. `src/components/Sidebar/` удалена.
   - `_NoChatSelected.tsx` → страница `src/pages/HomePage/` (`index.ts`, `_HomePage.tsx`, `_styles.ts`). Стили `SNoChatSelected`→`SWrapper` (как у `LoginPage`) и `SPill` переехали из `_styles.ts` каркаса. Индексный роут `/` рендерит `HomePage`.
   - Импорты: `AppRouter.tsx` → `@/layouts/MessengerLayout`; `_routes.tsx` → `@/pages/HomePage`; `_MessengerLayout.tsx` → `./_internal/Sidebar`. Из barrel каркаса убрана строка `NoChatSelected`. Каждая строка barrel теперь соответствует импортёру снаружи папки.
2. **`Escape` (находка `[code]`)**: выпадающий блок `SDropdown` получил `tabIndex={-1}` и ref-callback `focusOnMount`. Ref-callback при монтировании переводит фокус в блок, без `useEffect`. Функция объявлена на уровне модуля: стабильная ссылка вызывается только при монтировании и размонтировании. Inline-стрелка вызывалась бы на каждом рендере и забирала бы фокус обратно, например у «Выйти», когда приходит ответ `useAccountQuery`. Обработчик `onKeyDown` на корне и возврат фокуса на гамбургер не менялись. У `SDropdown` стоит `&:focus { outline: none; }`: блок фокусируется только программно и в Tab-порядок не входит.
3. **Закрытие при уходе фокуса**: `onBlur` на `SRoot` закрывает меню, если `relatedTarget` — элемент вне корня. При `relatedTarget === null` (фокус ушёл на `body` или из окна) меню **не** закрывается. Если бы закрывалось, то в Safari `mousedown` по кнопке, которая не получает фокус, размонтировал бы меню до `click`, и клик по «Выйти» или по подложке пропал бы. Клик вне меню по-прежнему закрывает подложка. Конфликтов нет:
   - фокус переходит на подложку или гамбургер (внутри корня) → `onBlur` не закрывает, а клик и `Escape` работают как раньше;
   - пока меню открыто, подложка перекрывает и гамбургер (`z-index: 1`).
4. **Ключ `app`** удалён из `public/dictionaries/ru.json` и интерфейса `I18n` (`src/types/i18n.types.ts`). Поиск `app.title` / `l.app` / `"app"` / `app:` по `src`, `public`, `e2e`, `index.html` ничего не нашёл.

Обёрток `styled(<UIKit-примитив>)` не добавлено.

## Files created

Итоговое дерево фазы (накопительно):

```
src/api/queries/account.queries.ts                         — useAccountQuery (getAccount, staleTime: Infinity)
src/components/icons/index.ts                              — barrel иконок
src/components/icons/_icons.tsx                            — MenuIcon, LogoutIcon (Material Symbols Rounded)
src/layouts/MessengerLayout/index.ts                       — barrel: MessengerLayout
src/layouts/MessengerLayout/_MessengerLayout.tsx           — каркас: Sidebar + Outlet
src/layouts/MessengerLayout/_styles.ts                     — SLayout, SContent
src/layouts/MessengerLayout/_internal/Sidebar/index.ts     — barrel: Sidebar
src/layouts/MessengerLayout/_internal/Sidebar/_Sidebar.tsx — левая панель: шапка с меню и заголовком
src/layouts/MessengerLayout/_internal/Sidebar/_styles.ts   — SRoot (карточка / весь экран), SHeader
src/layouts/MessengerLayout/_internal/Sidebar/_internal/AccountMenu/index.ts         — barrel: AccountMenu
src/layouts/MessengerLayout/_internal/Sidebar/_internal/AccountMenu/_AccountMenu.tsx — меню аккаунта (фокус при открытии, Escape, onBlur, выход)
src/layouts/MessengerLayout/_internal/Sidebar/_internal/AccountMenu/_styles.ts       — стили меню, подложки, скелетона
src/pages/HomePage/index.ts                                — barrel: HomePage
src/pages/HomePage/_HomePage.tsx                           — экран индексного роута: пилюля chat.selectChat
src/pages/HomePage/_styles.ts                              — SWrapper, SPill
```

Удалены (iter-1): `src/routes/layouts/` целиком, `src/components/Sidebar/` целиком.

## Files modified

- `src/routes/AppRouter.tsx` — защищённый layout-роут рендерит `MessengerLayout`; импорт из `@/layouts/MessengerLayout`.
- `src/routes/_routes.tsx` — индексный роут `/` рендерит `HomePage` из `@/pages/HomePage`.
- `src/types/common.types.ts` — `EKeyboardKey { ESCAPE }` (iter-1).
- `src/types/i18n.types.ts` — удалён раздел `app`.
- `public/dictionaries/ru.json` — удалён ключ `app`.

## Verification

Команды выполнены как есть, без подмен:

| Команда | Результат |
|---|---|
| `pnpm format` | файлы отформатированы |
| `pnpm lint` | exit 0, ошибок и предупреждений нет (baseline чистый) |
| `pnpm build` | собирается, ошибок нет (baseline чистый) |
| `pnpm test` | 32/32 |

- **Экспорты.** У каждой строки barrel есть импортёр снаружи папки:
  - `MessengerLayout` ← `AppRouter.tsx`;
  - `Sidebar` ← `_MessengerLayout.tsx`;
  - `AccountMenu` ← `_Sidebar.tsx`;
  - `HomePage` ← `_routes.tsx`.

  `focusOnMount` и `formatAccountLine` не экспортируются. Новых экспортов, кроме перенесённых, нет.
- **Условие остановки фазы** выполнено: меню показывает аккаунт, «Выйти» ведёт на `/login`, а CSS-раскладка не менялась (только перенос). Пункты Phase 4 из поправки (9) закрыты. Пункты Phases 5–9 не трогал.
- **Браузер.** Самопроверку разработчика провёл в Chromium на `pnpm dev`; это наблюдение, а не доказательство: визуальная проверка — зона ревьюера. Что видел:
  - каркас и пилюля `/` на месте;
  - после клика по гамбургеру фокус в выпадающем блоке, и он остаётся там после загрузки аккаунта (`@username` показан);
  - клик по подписи «Аккаунт», затем `Escape` → меню закрыто, фокус на гамбургере;
  - фокус на «Выйти» оставляет меню открытым, фокус на элементе вне меню закрывает его;
  - `blur()` на `body` оставляет меню открытым;
  - клик по подложке закрывает меню;
  - «Выйти» → `/login`, сессия удалена;
  - в консоли нет ошибок и предупреждений.

  Сессию положил в `localStorage` через временный модуль, который потом удалил. Токен в вывод не попадал. Dev-сервер остановлен, `.playwright-mcp` удалена.
- **Чего не проверял.** Safari и Firefox на macOS вживую не проверены: под рукой только Chromium. Сценарий «фокус остаётся на `body`» воспроизведён через клик по нефокусируемому тексту.

## Known issues

- **Документация с путём iter-1.** В `plans/messenger-v1/plan.md` тело Phase 4 и строки поправок (7)/(8) по-прежнему называют `src/routes/layouts/...` и `NoChatSelected`. Поправка (9) явно их переопределяет, поэтому план я не трогал.
- **Заготовки на будущие фазы** (из поправки (9)) не делал — они в Phase 6 и Phase 7:
  - подъём `SMenuButton` в общий компонент;
  - внутренняя база иконок;
  - подъём `SPill` в общий компонент.
