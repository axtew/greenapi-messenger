Status: COMPLETED

## Phase goal

Phase 6 — «Новый чат и экран переписки»: карандаш открывает панель «Новый чат» → номер → `checkAccount` → чат в списке → переход на `/chat/<id>` с шапкой; чат из адреса, которого нет в списке, — редирект на главную. Плюс поправки (2), enum-поправка, (4), (7), (8), (9), (10), (12).

## What was implemented

- **Мутация** `useCreateChatMutation` (`src/api/mutations/chats.mutations.ts`): логика вынесена в `createChat(queryClient, idInstance, phone)`. `exists: false` → `ChatNotFoundError` (по образцу `InstanceNotAuthorizedError`, `message` = `GREEN-API checkAccount: notFound`). Чат уже в списке → возвращается его chatId без `getContact`. Новый чат: `getContact` → `upsertContact(…, { isProfileLoaded: true })`; если `getContact` упал → контакт из `checkAccount`, `name` = `@username` → `+phone` → chatId, `{ isProfileLoaded: false }`. Словарь мутация не читает. Без сессии — `GreenApiError` HTTP 401, как у клиента.
- **NewChatPanel** (`…/Sidebar/_internal/NewChatPanel/`): шапка — `IconButton` «назад» + `H3` `newChat.title`; поле — общий `Input` (`type="tel"`, `inputMode="tel"`, `autoFocus`); форма на `useForm`. Ошибка валидации — только в `error` у `Input`; ошибка мутации — отдельный `B2 role="alert"` **под** кнопкой `newChat.submitButton`. В `_helpers.ts`: `normalizePhone` (только цифры), `validatePhone` (10–15 цифр → `newChat.phoneError`), `getSubmitErrorText` (`ChatNotFoundError` → `notFoundError`; `RATE_LIMITED` → `rateLimitError`; HTTP 469 → `searchRestrictedError`; остальное → `genericError`). При успехе — `navigate({ to: routerPaths.chat, params: { chatId } })`, затем панель возвращается к списку.
- **Sidebar**: вид панели задаётся строковым `enum ESidebarView { LIST, NEW_CHAT }` (локальный, внутри `_Sidebar.tsx`). `useChatsQuery` вызывается при любом виде (поправка (12)/Phase 9: запрос существует с первого рендера). FAB-карандаш 56px, `primary`, в правом нижнем углу, `aria-label={l.newChatButton}`, виден только в списке; у `SBody` нижний отступ, чтобы FAB не закрывал последний чат.
- **ChatListItem** — `createLink(styled.a)`: ссылка роутера с типизированными `to: routerPaths.chat` + `params`. Выбранный чат (`useParams({ strict: false }).chatId`) — фон `primary`, весь текст `onPrimary` (имя через `color` корня, превью и время через проп `color`); hover — `surfaceMuted`; `focus-visible` — рамка.
- **Роут** `/chat/$chatId` добавлен в обобщённую фабрику `createProtectedRoutes`, `path: routerPaths.chat`. Обёртка `ChatRoute` читает `useParams({ from: "/protected-layout/chat/$chatId" })` и передаёт `chatId` в `ChatPage` пропсом. Проверено: неверный id даёт TS2820, а `chatId` из `strict: false` имеет тип `string | undefined`, не `any`.
- **ChatPage**: колонка по центру, `max-width: 880px`, сверху `ChatHeader`. `_useChatPage`: чат ищется в `useChatsQuery` по `chatId`. Если чата нет **и синхронизация не идёт** → `navigate({ to: routerPaths.home, replace: true })`. Пока идёт синхронизация, переход откладывается: открытый по ссылке чат при пустом localStorage появится после неё. Когда `unreadCount > 0` (при открытии, при смене `chatId`) → `updateChats(resetUnread)`. Пока чата нет, экран ничего не рендерит.
- **ChatHeader**: белая пилюля, `Avatar` 42, имя `H3` с многоточием; подзаголовок `B2 textMuted` — `formatContactHandle` (`@username`, иначе `+phone`; если оба `null`, подзаголовка нет). Кнопка «назад» (`IconButton` + `BackIcon`) видна только при ширине ≤ `mobileMax` и ведёт на `routerPaths.home`.
- **MessengerLayout**: `data-chat-open={chatId !== undefined}` (`useParams({ strict: false })`). На узком экране при открытом чате `SContent` показывается, а `Sidebar` (`[data-chat-open="true"] > &`) прячется — только CSS.
- **Иконки**: `PencilIcon` (`edit_fill1_24px`) и `BackIcon` (`arrow_back_24px`) — `d` скачан `curl`'ом по ссылкам из Phase 4 §6. Внутренняя неэкспортируемая база `SvgIcon({ d, size })`, все четыре иконки переведены на неё.
- **Общая кнопка-иконка** `src/components/IconButton/` (44×44, круглая, `textMuted`, hover/`aria-expanded` — `surfaceMuted`, обязательный `aria-label`, ref пробрасывается). Её используют гамбургер `AccountMenu`, «назад» в `NewChatPanel` и в `ChatHeader`. `SMenuButton` удалён из `AccountMenu/_styles.ts`.
- **Общая основная кнопка** `src/components/Button/` — у основной кнопки формы появился второй потребитель в другой фиче (`LoginPage` + `NewChatPanel`), поэтому она поднята по лестнице `structure.md`.
- **Общий хелпер** `src/utils/helpers/contactFormat.ts` → `formatContactHandle({ username, phone })`. Потребители: `AccountMenu` (заменил локальный `formatAccountLine`), `ChatHeader`, запасной контакт в `createChat`, `getContact` в `chats.service.ts` (та же цепочка; поведение не изменилось, тесты сервиса зелёные).

## UIKit wrappers

- `SSubmit = styled(Button)` (`LoginPage/_styles.ts`): `margin-top: 8px` — отступ раскладки формы входа (так было раньше), пропсом не выражается.
- `SBackButton = styled(IconButton)` (`ChatPage/_styles.ts`): `display: none` вне узкого экрана — видимость по брейкпоинту, пропсом не выражается.
- `SHeaderTitle = styled(H3)` (`ChatPage/_styles.ts`): обрезка в одну строку с многоточием (тот же приём, что `SName` в `ChatListItem`).

## Files created

- `src/api/mutations/chats.mutations.ts` — `ChatNotFoundError`, `createChat`, `useCreateChatMutation`.
- `src/api/mutations/chats.mutations.test.ts` — не найден / уже в списке / новый с профилем / сбой `getContact` (три варианта имени) / проброс ошибки.
- `src/components/IconButton/{index.ts,_IconButton.tsx,_styles.ts}` — общая круглая кнопка-иконка 44×44.
- `src/components/Button/{index.ts,_Button.tsx,_styles.ts}` — общая основная кнопка формы.
- `src/utils/helpers/contactFormat.ts`, `contactFormat.test.ts` — `formatContactHandle`.
- `src/layouts/MessengerLayout/_internal/Sidebar/_internal/NewChatPanel/{index.ts,_NewChatPanel.tsx,_styles.ts,_useNewChatForm.ts,_helpers.ts,_helpers.test.ts}` — панель «Новый чат».
- `src/pages/ChatPage/{index.ts,_ChatPage.tsx,_styles.ts,_useChatPage.ts,_ChatHeader.tsx}` — экран переписки с шапкой.

## Files modified

- `src/components/icons/_icons.tsx` — внутренняя база `SvgIcon`, + `PencilIcon`, `BackIcon`.
- `src/routes/_routes.tsx` — роут `/chat/$chatId` (`routerPaths.chat`) с обёрткой `ChatRoute`.
- `src/layouts/MessengerLayout/_MessengerLayout.tsx`, `_styles.ts` — `data-chat-open`, на узком экране при открытом чате видна только колонка чата.
- `src/layouts/MessengerLayout/_internal/Sidebar/_Sidebar.tsx`, `_styles.ts` — `ESidebarView`, `NewChatPanel`, FAB, `position: relative`, нижний отступ списка, панель прячется по `data-chat-open`.
- `src/layouts/MessengerLayout/_internal/Sidebar/_internal/ChatListItem/_ChatListItem.tsx`, `_styles.ts` — элемент стал ссылкой (`createLink`), подсветка выбранного и hover.
- `src/layouts/MessengerLayout/_internal/Sidebar/_internal/AccountMenu/_AccountMenu.tsx`, `_styles.ts` — `IconButton` вместо `SMenuButton`, `formatContactHandle` вместо локального `formatAccountLine`.
- `src/pages/LoginPage/_LoginPage.tsx`, `_styles.ts` — кнопка «Войти» на общем `Button`. Добавились `padding: 0 16px` и `focus-visible` из общего стиля, в остальном внешний вид не изменился.
- `src/api/services/chats.service.ts` — `getContact` собирает имя через `formatContactHandle`.

## Figma extraction

Figma нет (`design.source: none`). Оценка по референсам:
- Панель «Новый чат» (`07-new-chat-panel.png`): вместо поиска контактов — шапка «назад» + заголовок и форма номера (поле, кнопка, ошибка запроса под кнопкой). Шапка переиспользует `SHeader` панели. FAB «добавить контакт» из референса не переносился — его нет в плане.
- Шапка чата (`02`, `05`): белая пилюля `radii.pill`, мин. высота 56, `padding 6px 16px 6px 8px`, аватар 42, имя `H3`, подзаголовок `B2 textMuted`; звонок, поиск и меню собеседника не делались (так в плане).
- Отступ колонки чата от краёв на десктопе — 18px, как у карточки панели; на мобильной — 8px + safe-area.
- Выбранный чат (`02`): заливка `primary`, текст `onPrimary`; бейдж оставлен прежним (`unreadBadge` + `onPrimary`).

## Verification

- `pnpm format` (prettier по `src`) — выполнено.
- `pnpm lint` — passed, 0 ошибок и предупреждений (в baseline тоже 0).
- `pnpm build` (`tsc -b && vite build`) — passed.
- `pnpm test` — passed: 8 файлов, 105 тестов. Новые: `chats.mutations.test.ts`, `NewChatPanel/_helpers.test.ts`, `contactFormat.test.ts`.
- Дополнительная проба типов: временная правка `from` в `ChatRoute` на неверный id → TS2820; `useParams({ strict: false }).chatId` → `string | undefined`. Правка отменена, пробный файл удалён.
- `.d.ts` не менялись — проверка `tsc --skipLibCheck false` не требуется.
- Экспорты: у каждого нового экспорта есть импортёр вне модуля. `PencilIcon`/`BackIcon`/`IconButton`/`Button`/`formatContactHandle`/`useCreateChatMutation`/`ChatNotFoundError`/`ChatPage`/`NewChatPanel`/`SLink`/`SNewChatButton` — потребители в коде. `createChat` импортирует только тест — по прецеденту `getChatsQueryOptions` (Phase 5). Заготовки `routerPaths.chat` и `resetUnread` теперь потреблены. Новых заготовок нет.
- Stop condition: по коду выполнено. Создание чата ведёт `navigate` на `/chat/<id>`, где `ChatPage` рендерит шапку. Неверный номер даёт `newChat.phoneError`, кнопка отключена, запроса нет. `exists:false` и лимиты показывают тексты из словаря под кнопкой.
- Runtime/browser: разработчик **не проверял**. Живой `checkAccount` не вызывался, квота не тратилась. Visual Verification (`new_chat_opens`, `new_chat_invalid`, `list_item_opens_chat`, `new_chat_existing`, `chat_header`, `unknown_chat_redirect`, `mobile_chat_back`, `account_menu_tab_out`) проводит визуальный ревьюер.
- Временных файлов не осталось, `.playwright-mcp` нет.

## Known issues

- **Отклонения от плана (проверить ревьюеру):**
  - `Button` (`src/components/Button/`) и `formatContactHandle` (`src/utils/helpers/contactFormat.ts`) подняты в общий слой, хотя плана на это нет. Причина — лестница `structure.md`: у кнопки формы появился второй потребитель в другой фиче, у формата `@username`/`+телефон` — четыре потребителя. Из-за этого затронуты файлы вне таблицы фазы: `LoginPage/_LoginPage.tsx`, `LoginPage/_styles.ts`, `chats.service.ts`.
  - Поправка (9) называет карандаш потребителем общей кнопки 44×44, но текст фазы задаёт FAB 56px с заливкой `primary`. Размер, цвет и позиция другие, поэтому FAB сделан локальным `SNewChatButton` в `Sidebar/_styles.ts`, а `IconButton` используют только кнопки 44px (гамбургер, «назад» ×2).
  - `ChatRoute` — маленький компонент-обёртка внутри `src/routes/_routes.tsx`. `routing.md` говорит «компонентов в `src/routes/` нет», но поправка (7) и прецедент recipe-book (`ProductCardRoute`) прямо предписывают такую обёртку. Сделано по поправке; правилу в `routing.md` может понадобиться уточнение.
  - `_useChatPage` откладывает редирект, пока идёт синхронизация списка. План говорит просто «нет в списке → редирект». Без отсрочки прямая ссылка на существующий чат в новом браузере (пустой localStorage) сразу уводила бы на главную. `unknown_chat_redirect` всё равно сработает — после синхронизации.
- После «назад» из панели «Новый чат» фокус не возвращается на карандаш, а уходит на `body`. Это a11y-мелочь, в плане не требуется.
- Ошибка мутации остаётся видимой, пока номер правят до следующей отправки — так же, как ошибка на форме входа.
- Если `getContact` в `createChat` упадёт с 401, это проглатывается в запасной контакт. На практике сначала 401 вернёт `checkAccount`.
- i18n: новых ключей нет, все тексты есть в `ru.json`.
