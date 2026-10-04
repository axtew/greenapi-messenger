# Plan: GREEN-API Messenger — базовый сценарий ТЗ

slug: `messenger-v1`
Artifacts: standard layout — `plans/messenger-v1/{plan.md, brainstorm.md, EXECUTION.md}`, `plans/messenger-v1/baseline/{build.log, lint.log, README.md}`,
`plans/messenger-v1/<phase>/iter-<N>/{DEV-REPORT.md, REVIEW.md, VISUAL.md}` per executed iteration. Baseline is captured by the developer before the first phase.

## Approach

См. [`brainstorm.md`](brainstorm.md) → `## Approach` (направление, отклонённое, риски) и «Принятые решения» — там же проверенные на реальном инстансе
формы ответов и уведомлений GREEN-API. План на них опирается и не повторяет их.

## Task summary

Пустой каркас (Vite + React 19 + TS, зависимости установлены) превращается в веб-мессенджер для Telegram через GREEN-API: вход по `idInstance` +
`apiTokenInstance`, список чатов (localStorage + синхронизация с сервером при входе), новый чат по номеру, история переписки, отправка текста,
получение через HTTP API (long-polling с одной вкладкой-потребителем), непрочитанные, предупреждение о настройках инстанса, выход;
две раскладки — десктоп и мобильная — по референсам веб-версии Telegram; unit-тесты на чистую логику и e2e со стабом GREEN-API.

## Requirement coverage

- Вход по `idInstance` / `apiTokenInstance`, проверка `getStateInstance` → Phase 2 (`account.service`), Phase 3 (`LoginPage`, `useLoginMutation`).
- 401 посреди сессии → выход на экран входа с сообщением → Phase 2 (`signOut`), Phase 3 (`_queryClient` entry), Phase 9 (poller).
- Выход из аккаунта → Phase 4 (`AccountMenu`).
- Список чатов: localStorage, синхронизация `getChats` → `getContactInfo` (только новые) → `getChatHistory` `count: 1`, первые 10 личных → Phase 5.
- Сортировка по последнему сообщению, бейдж непрочитанных, аватар с инициалами → Phase 5.
- Новый чат по номеру через `checkAccount` (только числовой chatId), понятные ошибки `exist:false` / 469 → Phase 6.
- Чат из адреса, которого нет в списке → редирект на `/` → Phase 6 (`_useChatPage`).
- История: последние 100, удалённые скрыты, правки заменяют оригинал, дедуп, разделители дат, ссылки, плашка нетекстовых → Phase 7.
- Отправка `sendMessage`, сообщение видно сразу, «не доставлено» с причиной → Phase 8 (+ отображение в Phase 7).
- Получение `receiveNotification` / `deleteNotification`, один потребитель (Web Locks), непрочитанные, чаты от новых собеседников, статус `failed` → Phase 9.
- Предупреждение о `webhookUrl` / `incomingWebhook` → Phase 9 (`SettingsWarning`).
- Десктоп (две колонки) и мобильная (один экран) раскладки → Phase 4 (каркас), далее каждая UI-фаза.
- Тексты только через словарь `ru.json` → Phase 1 (словарь целиком).
- Шрифт Roboto из `@fontsource/roboto` → Phase 1.
- e2e, воспроизводимые без кредов → Phase 10.

## Assumptions to confirm

- **`getChats` отдаёт чаты в порядке активности** (как список диалогов Telegram), поэтому «первые 10» — самые свежие. Проверено только на одном чате;
  проверить, когда в аккаунте будет несколько чатов.
- **Цвета** сняты пикселями со скриншотов `docs/design/` и с палитры Telegram Web A (таблица в Phase 1); бейдж непрочитанных `#4fae4e` — по палитре,
  не по пикселю (сверить с `06-unread-badge.png`).
- **Подтверждённые на живом инстансе, но редкие ветки** (ответ 466, `quotaExceeded`, уведомление `extendedTextMessage`) реализуются по документации
  и проверяются только e2e-стабом.

## Visual references

- Список чатов, пустое состояние справа (десктоп) — Reference: `docs/design/01-wide-empty.png`
- Открытый чат (десктоп, широкий и узкий) — Reference: `docs/design/02-wide-chat.png`, `docs/design/03-desktop-narrow-chat.png`
- Мобильный список и мобильный чат — Reference: `docs/design/04-mobile-list.png`, `docs/design/05-mobile-chat.png`
- Элемент списка с непрочитанными — Reference: `docs/design/06-unread-badge.png`
- Панель «Новый чат» — Reference: `docs/design/07-new-chat-panel.png` (вместо поиска контактов — поле номера)
- Экран входа, меню аккаунта, предупреждение о настройках — Free choice в стилистике референсов (у Telegram аналогов нет)

Key observations from the references:

- Боковая панель на десктопе — белая «карточка» со скруглением ~24px и отступом ~18px от краёв окна поверх фона; на мобильной — во весь экран без скруглений.
- Правая часть — фон-градиент; шапка чата и поле ввода — белые «пилюли» по ширине колонки переписки (~880px максимум, по центру).
- Выбранный чат — синяя подложка, весь текст белый. Время в элементе списка — справа сверху, бейдж — справа снизу.
- Пузыри: входящий белый, исходящий `#eeffde`; хвостик у последнего пузыря подряд от одного отправителя; время внутри пузыря справа снизу, мельче.
- Разделитель даты — полупрозрачная зелёная «пилюля» по центру с белым жирным текстом.
- В референсах есть поиск, скрепка, эмодзи, микрофон, звонок, меню собеседника — **не делаем** (см. brainstorm → «Интерфейс»).

## Reference implementations

Проект пустой — образцы из recipe-book (тот же стек). Пути абсолютные; конвенции этого репозитория важнее образца.

| What | File | Why it's relevant |
|------|------|-------------------|
| Хук форм | `C:/Users/stevv/Desktop/recipe-book/src/hooks/useForm/` (`_useForm.hook.ts`, `_helpers.ts`, `_types.ts`, `index.ts`) | Переносится как есть (решение brainstorm 15) |
| `useLatest` | `C:/Users/stevv/Desktop/recipe-book/src/hooks/useLatest.hook.ts` | Переносится как есть |
| i18n-контекст | `C:/Users/stevv/Desktop/recipe-book/src/context/I18nContext/` | Структура провайдера и `useI18nSelector`; без `_dictionary.ts` и без Mantine |
| Типографика | `C:/Users/stevv/Desktop/recipe-book/src/components/Typography/` | `SBaseText` + `$color` / `$textAlign`; здесь сведена в один модуль |
| Тема | `C:/Users/stevv/Desktop/recipe-book/src/theme/` | Палитра/типографика/брейкпоинты + `DefaultTheme`; здесь в одном `_theme.ts` |
| Роуты code-based, guard в `beforeLoad` | `C:/Users/stevv/Desktop/recipe-book/src/routes/` (`_paths.ts`, `_routes.tsx`, `AppRouter.tsx`) | Фабрики роутов с корнем параметром (без цикла импортов), pathless layout-роут |
| Экран входа | `C:/Users/stevv/Desktop/recipe-book/src/pages/LoginPage/` | Форма на `useForm`, хук страницы; Mantine не переносить |
| Сервис → query → mutation | `C:/Users/stevv/Desktop/recipe-book/src/api/{services,queries,mutations}/products.*` | Plain-функции, ключи в модуле query, инвалидация в mutation |

## Files to create

| Path | Purpose | Phase |
|------|---------|-------|
| `src/theme/_theme.ts`, `_GlobalStyle.ts`, `index.ts` | Токены темы + `DefaultTheme`, глобальные стили | 1 |
| `src/components/Typography/_styles.ts`, `_Typography.tsx`, `index.ts` | `H1`–`H3`, `B1`–`B2`, `Caption` | 1 |
| `src/context/I18nContext/_I18nContext.tsx`, `_context.ts`, `_useI18nSelector.ts`, `index.ts` | Загрузка `ru.json`, `useI18nSelector` | 1 |
| `src/types/i18n.types.ts`, `public/dictionaries/ru.json` | Интерфейс и словарь — **целиком, для всех фаз** | 1 |
| `src/app/App.tsx`, `src/app/_queryClient.ts` | Провайдеры | 1 |
| `src/api/greenApi/_client.ts`, `index.ts` | Клиент GREEN-API, `GreenApiError` | 2 |
| `src/api/session.ts` | Креды сессии в localStorage | 2 |
| `src/api/schemas/account.schema.ts`, `chats.schema.ts`, `messages.schema.ts` | zod-схемы ответов | 2 |
| `src/api/services/account.service.ts`, `chats.service.ts`, `messages.service.ts` | Сервисы — граница типов | 2 |
| `src/types/account.types.ts`, `chats.types.ts`, `messages.types.ts` | Сущности проекта | 2 |
| `src/api/__tests__/api.test.ts` | Клиент, сессия и маппинг сервисов на стабе `fetch` | 2 |
| `src/routes/_paths.ts`, `_routes.tsx`, `AppRouter.tsx` | Дерево роутов | 3 |
| `src/hooks/useForm/{_useForm.hook.ts,_helpers.ts,_types.ts,index.ts}`, `src/hooks/useLatest.hook.ts` | Перенос из recipe-book | 3 |
| `src/pages/LoginPage/{index.ts,_LoginPage.tsx,_styles.ts,_useLoginForm.ts}` | Экран входа | 3 |
| `src/api/mutations/session.mutations.ts` | `useLoginMutation` | 3 |
| `src/routes/layouts/MessengerLayout/{index.ts,_MessengerLayout.tsx,_styles.ts,_NoChatSelected.tsx}` | Каркас двух колонок, пустое состояние справа | 4 |
| `src/components/Sidebar/{index.ts,_Sidebar.tsx,_styles.ts}` | Левая панель | 4 |
| `src/components/Sidebar/_internal/AccountMenu/{index.ts,_AccountMenu.tsx,_styles.ts}` | Меню-гамбургер: аккаунт + «Выйти» | 4 |
| `src/components/icons/{index.ts,_icons.tsx}` | SVG-иконки | 4 |
| `src/api/queries/account.queries.ts` | `useAccountQuery` | 4 |
| `src/api/cache/chats.cache.ts`, `chats.cache.test.ts` | Список чатов: localStorage + кэш, чистые операции | 5 |
| `src/api/queries/chats.queries.ts` | `useChatsQuery` с синхронизацией | 5 |
| `src/components/Sidebar/_internal/ChatListItem/{index.ts,_ChatListItem.tsx,_styles.ts}` | Элемент списка | 5 |
| `src/components/Avatar/{index.ts,_Avatar.tsx,_styles.ts,_helpers.ts,_helpers.test.ts}` | Аватар с инициалами | 5 |
| `src/utils/helpers/dateFormat.ts`, `dateFormat.test.ts` | Время/даты для списка и переписки | 5 |
| `src/api/mutations/chats.mutations.ts` | `useCreateChatMutation` | 6 |
| `src/components/Sidebar/_internal/NewChatPanel/{index.ts,_NewChatPanel.tsx,_styles.ts,_useNewChatForm.ts}` | Панель «Новый чат» | 6 |
| `src/pages/ChatPage/{index.ts,_ChatPage.tsx,_styles.ts,_useChatPage.ts}` | Экран переписки | 6 |
| `src/pages/ChatPage/_ChatHeader.tsx` | Шапка чата (подкомпонент рядом со страницей, стили — в `_styles.ts` страницы) | 6 |
| `src/api/queries/messages.queries.ts` | `useChatMessagesQuery` | 7 |
| `src/api/cache/messages.cache.ts`, `messages.cache.test.ts` | Слияние сообщений, дедуп | 7 |
| `src/pages/ChatPage/_internal/MessageList/{index.ts,_MessageList.tsx,_styles.ts,_helpers.ts,_helpers.test.ts,_useAutoScroll.ts}` | Лента | 7 |
| `src/pages/ChatPage/_internal/MessageList/_internal/MessageBubble/{index.ts,_MessageBubble.tsx,_styles.ts,_helpers.ts,_helpers.test.ts}` | Пузырь, ссылки | 7 |
| `src/api/mutations/messages.mutations.ts` | `useSendMessageMutation` | 8 |
| `src/pages/ChatPage/_internal/Composer/{index.ts,_Composer.tsx,_styles.ts,_useComposer.ts}` | Поле ввода | 8 |
| `src/api/schemas/notifications.schema.ts`, `src/api/services/notifications.service.ts` | Очередь уведомлений | 9 |
| `src/api/poller/{index.ts,_poller.ts,_applyNotification.ts,_applyNotification.test.ts}` | Цикл получения | 9 |
| `src/routes/layouts/MessengerLayout/_useMessengerLayout.ts` | Запуск poller'а из каркаса | 9 |
| `src/components/Sidebar/_internal/SettingsWarning/{index.ts,_SettingsWarning.tsx,_styles.ts}` | Предупреждение о настройках | 9 |
| `playwright.config.ts`, `e2e/greenApiStub.ts`, `e2e/messenger.spec.ts` | e2e со стабом | 10 |

## Files to modify

| Path | What changes | Phase |
|------|-------------|-------|
| `src/main.tsx` | Шрифт, `App`, проверка `#root` | 1 |
| `src/app/App.tsx` — router mount | `RouterProvider` вместо заглушки | 3 |
| `src/app/_queryClient.ts` — 401 | `QueryCache` / `MutationCache` `onError` → `signOut` | 3 |
| `src/routes/_routes.tsx`, `AppRouter.tsx` — messenger layout | `MessengerLayout` + индексный роут | 4 |
| `src/components/Sidebar/_Sidebar.tsx` — chat list | Список, пустое/загрузочное состояние | 5 |
| `src/components/Sidebar/_Sidebar.tsx`, `_styles.ts` — new chat | Кнопка-карандаш, переключение видов | 6 |
| `src/components/icons/_icons.tsx` — chat icons | `PencilIcon`, `BackIcon` | 6 |
| `src/routes/_routes.tsx` — chat route | Роут `/chat/$chatId` | 6 |
| `src/components/Sidebar/_internal/ChatListItem/_ChatListItem.tsx`, `_styles.ts` — navigation | Ссылка на чат, подсветка выбранного | 6 |
| `src/pages/ChatPage/_ChatPage.tsx` — message list | Лента | 7 |
| `src/pages/ChatPage/_ChatPage.tsx` — composer | Поле ввода | 8 |
| `src/components/icons/_icons.tsx` — send icon | `SendIcon` | 8 |
| `src/routes/layouts/MessengerLayout/_MessengerLayout.tsx` — poller | Вызов `useMessengerLayout` | 9 |
| `src/api/queries/account.queries.ts` — settings | `useInstanceSettingsQuery` | 9 |
| `src/components/Sidebar/_Sidebar.tsx` — warning | `SettingsWarning` над списком | 9 |
| `package.json` | `@playwright/test`, скрипт `e2e` | 10 |
| `README.md` | Раздел про тесты и известные ограничения | 10 |

## Types and interfaces

Сущности проекта — контракт для сервисов, кэша и UI (Phase 2). Ограниченные наборы значений — строковые `enum`.

```typescript
// src/types/account.types.ts
interface ISession { idInstance: string; apiTokenInstance: string }
interface IAccount { phone: string; username: string | null; avatarUrl: string | null }
interface IInstanceSettings { webhookUrl: string; isIncomingEnabled: boolean } // incomingWebhook === "yes"

// src/types/messages.types.ts
enum EMessageDirection { INCOMING = "incoming", OUTGOING = "outgoing" }
enum EMessageStatus { SENDING = "sending", SENT = "sent", FAILED = "failed" }
interface IMessage {
  id: string;               // idMessage; у неотправленного — `local-<uuid>`
  chatId: string;
  direction: EMessageDirection;
  text: string | null;      // null — неподдерживаемый тип (стикер, фото…)
  timestamp: number;        // секунды, как в API
  status: EMessageStatus;
  failReason: string | null;
  replacesId: string | null; // editedMessageId || deletedMessageId ("" → null)
  isDeleted: boolean;
}

// src/types/chats.types.ts
interface IChatLastMessage { text: string | null; timestamp: number; direction: EMessageDirection }
interface IContact { chatId: string; name: string; phone: string | null; username: string | null; avatarUrl: string | null }
interface IChat extends IContact { lastMessage: IChatLastMessage | null; unreadCount: number }
type TCheckAccountResult = { exists: false } | { exists: true; chatId: string; phone: string | null; username: string | null };
```

`IContact.name` собирается в сервисе: `name || contactName || username || "+" + phone || chatId` (пустые строки API — как отсутствие).
`phone` в API — число, `0` = скрыт → `null`; в проекте — строка цифр без `+`.

Формы ответов GREEN-API (для zod-схем) — `brainstorm.md` → «Проверенные факты» и «Проверено на реальном инстансе».

## Architectural fit

Путь данных — `компонент → хук TanStack Query → сервис → клиент` (`docs/agents/architecture.md`). Два места, где состояние меняется вне хуков, — оба в слое `src/api/`:

| Что | Где | Почему так |
|-----|-----|-----------|
| Список чатов (localStorage + кэш запроса) | `src/api/cache/chats.cache.ts` | Список — данные GREEN-API, дополненные локальными (непрочитанные); пишут его и хуки, и poller. Отдельный store противоречил бы `stack.md` (второе хранилище) — поэтому данные живут в кэше TanStack Query, а модуль только синхронизирует его с localStorage |
| Poller | `src/api/poller/` | Цикл вне жизненного цикла компонентов (`architecture.md` → «Получение сообщений») |

**Выход — полная перезагрузка страницы.** `signOut(reason?)` в `src/api/session.ts` чистит сессию и делает `window.location.assign("/login…")`, а не
`router.navigate` + `queryClient.clear()`: перезагрузка гарантированно обнуляет кэш запросов, poller и Web Lock, а модулю не нужно импортировать
`router` — иначе цикл `router → роуты → AccountMenu → signOut → router`. Вызывают его `_queryClient` (401), `AccountMenu` и poller (401).

## Implementation phases

### Phase 1 — Основа: тема, шрифт, типографика, словарь

**Goal**

Приложение рендерится с темой, Roboto и словарём; дальше UI-фазы только пользуются этим фундаментом.

**Budget**

- Operation budget: 15
- Concern budget: ui, i18n
- Stop condition: `pnpm lint` и `pnpm build` зелёные; `pnpm dev` показывает заглушку-заголовок шрифтом Roboto.

**Files to modify**

- `src/main.tsx` — импорт `@fontsource/roboto/{latin,cyrillic}-{400,500}.css`; проверка `#root` с понятной ошибкой (как в recipe-book); рендер `<App />`.

**Implementation details**

1. `src/theme/_theme.ts` — объект темы (палитра, типографика, радиусы, брейкпоинт) + аугментация `DefaultTheme` (`declare module "styled-components"`) в этом же файле.
   Токены:

   | Токен | Значение | Источник |
   |---|---|---|
   | `palette.primary` | `#3390ec` | выбранный чат, кнопки, ссылки, FAB |
   | `palette.surface` | `#ffffff` | панели, входящий пузырь, шапка, поле ввода |
   | `palette.surfaceMuted` | `#f4f4f5` | ховер элемента списка, поле ввода номера |
   | `palette.text` / `textMuted` | `#000000` / `#707579` | основной / время, превью, подзаголовок |
   | `palette.border` | `#dadce0` | разделители |
   | `palette.bubbleOutgoing` | `#eeffde` | исходящий пузырь |
   | `palette.metaOutgoing` | `#4fae4e` | время в исходящем |
   | `palette.unreadBadge` | `#4fae4e` | бейдж непрочитанных (сверить с `06-unread-badge.png`) |
   | `palette.datePill` | `#72a664` | разделитель даты |
   | `palette.danger` | `#e53935` | ошибки, «не доставлено» |
   | `palette.onPrimary` | `#ffffff` | текст на синем |
   | `palette.chatBackground` | `linear-gradient(135deg, #b2c99e 0%, #a9c59f 50%, #98bd90 100%)` | фон переписки (без узора) |
   | `palette.avatarColors` | 7 цветов в духе аватаров Telegram (красный, оранжевый, фиолетовый, зелёный, бирюзовый, синий, розовый) | фон инициалов |
   | `typography.fontFamily` | `Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` | |
   | `typography.fontSizes` | `xs 12px`, `sm 14px`, `md 16px`, `lg 20px`, `xl 24px` | |
   | `typography.fontWeights` | `regular 400`, `medium 500` | |
   | `radii` | `pill 9999px`, `panel 24px`, `item 12px`, `bubble 15px` | |
   | `breakpoints.mobileMax` | `767px` | одна колонка до этой ширины включительно |

2. `_GlobalStyle.ts` — по образцу recipe-book: box-sizing, `html, body, #root` — `height: 100dvh`, `margin: 0`, фон `surface`, шрифт темы.
3. `src/components/Typography/` — один модуль: `_styles.ts` (`SBaseText` + стили размеров), `_Typography.tsx` (`H1` xl/500, `H2` lg/500, `H3` md/500,
   `B1` md/400, `B2` sm/400, `Caption` xs/400), `index.ts`. Пропсы как в recipe-book `Body`: `color` (ключ палитры из ограниченного набора), `textAlign`, `as`.
   Экраны не задают `font-size` сами, кроме поля ввода (`styling.md`).
4. `src/context/I18nContext/` — по образцу recipe-book без `_dictionary.ts`; на время загрузки словаря — пустой экран фона (не Mantine `Loader`);
   ошибка загрузки — `console.error` и тот же пустой экран (словарь — статический файл того же origin).
5. `public/dictionaries/ru.json` и `src/types/i18n.types.ts` — **полный словарь всех фаз** (ниже). Интерфейс повторяет структуру JSON.
6. `src/app/_queryClient.ts` — `QueryClient` с `defaultOptions.queries`: `refetchOnWindowFocus: false`, `retry: 1`
   (условие по `GreenApiError` и обработчик 401 добавляет Phase 3).
7. `src/app/App.tsx` — `QueryClientProvider` → `ThemeProvider` → `GlobalStyle` → `I18nProvider` → заглушка `<H1>{l.app.title}</H1>`;
   `ReactQueryDevtools` (исключается из прод-сборки самим пакетом).

Словарь (`ru.json`, все ключи — для всех фаз; значения на русском):

```json
{
  "app": { "title": "GREEN-API Messenger" },
  "login": {
    "title": "Вход",
    "subtitle": "Данные инстанса из личного кабинета GREEN-API",
    "idInstanceLabel": "idInstance",
    "apiTokenLabel": "apiTokenInstance",
    "submitButton": "Войти",
    "requiredError": "Обязательное поле",
    "idInstanceError": "Только цифры",
    "unauthorizedError": "Неверный idInstance или apiTokenInstance",
    "notAuthorizedError": "Инстанс не авторизован — подключите Telegram-аккаунт в личном кабинете GREEN-API",
    "networkError": "Не удалось связаться с GREEN-API. Проверьте подключение",
    "sessionExpired": "Сессия недействительна — войдите заново"
  },
  "sidebar": {
    "title": "Чаты",
    "menuButton": "Меню",
    "accountLabel": "Аккаунт",
    "logoutButton": "Выйти",
    "newChatButton": "Новый чат",
    "emptyTitle": "Чатов пока нет",
    "emptyHint": "Нажмите на карандаш, чтобы начать новый чат",
    "syncError": "Не удалось обновить список чатов"
  },
  "settingsWarning": {
    "webhookUrl": "У инстанса указан webhookUrl — новые сообщения уходят на него и сюда не придут",
    "incomingDisabled": "У инстанса выключены входящие уведомления (incomingWebhook) — новые сообщения не придут",
    "hint": "Исправьте настройки инстанса в личном кабинете GREEN-API"
  },
  "newChat": {
    "title": "Новый чат",
    "backButton": "Назад",
    "phoneLabel": "Номер телефона",
    "phonePlaceholder": "+7 999 123-45-67",
    "submitButton": "Начать чат",
    "phoneError": "Введите номер в международном формате: от 10 до 15 цифр",
    "notFoundError": "Аккаунт Telegram не найден или номер скрыт настройками приватности",
    "rateLimitError": "Слишком много проверок номера — попробуйте через пару часов",
    "genericError": "Не удалось создать чат"
  },
  "chat": {
    "selectChat": "Выберите, кому хотели бы написать",
    "backButton": "Назад",
    "historyError": "Не удалось загрузить историю",
    "retryButton": "Повторить",
    "emptyHistory": "Сообщений пока нет",
    "today": "Сегодня",
    "yesterday": "Вчера",
    "unsupportedMessage": "Сообщение этого типа не поддерживается",
    "failedLabel": "Не доставлено",
    "composerPlaceholder": "Сообщение",
    "sendButton": "Отправить"
  },
  "sendErrors": {
    "quota": "превышен лимит тарифа",
    "network": "нет связи с GREEN-API",
    "generic": "ошибка отправки"
  }
}
```

**Verification**

- `pnpm lint`, `pnpm build` зелёные.
- В `ru.json` нет ключей с кириллицей / пробелами (`i18n.md`).

**Visual Verification**

N/A — видимого сценария ещё нет (заглушка).

### Phase 2 — Слой GREEN-API: клиент, сессия, сервисы

**Goal**

Все запросы к GREEN-API, используемые до Phase 9, доступны как типизированные функции сервисов с проверкой ответа zod; покрыты unit-тестами на стабе `fetch`.

**Budget**

- Operation budget: 13
- Concern budget: services, types
- Stop condition: `pnpm test` зелёный; `pnpm lint`, `pnpm build` зелёные.

**Implementation details**

1. `src/api/greenApi/_client.ts`:
   - `GREEN_API_HOST = "https://api.green-api.com"` (проверено на реальном инстансе — brainstorm).
   - `greenApiRequest<T>({ method, httpMethod, schema, body?, query?, pathSuffix?, signal?, credentials? })` →
     `${GREEN_API_HOST}/waInstance${idInstance}/${method}/${apiTokenInstance}${pathSuffix}${query}`; `credentials` по умолчанию — `getSession()`,
     при отсутствии сессии — `GreenApiError` со `status: 401` (обрабатывается как истёкшая сессия).
   - POST — `Content-Type: application/json`, `JSON.stringify(body)`.
   - Ответ 200: текст → `JSON.parse` (тело `null` допустимо) → `schema.parse`. Не 200 → `GreenApiError` со статусом. Сбой `fetch` (не `AbortError`) →
     `GreenApiError` со `status: null`. Ошибка zod → `GreenApiError` с `kind: "invalidResponse"`.
   - `GreenApiError extends Error`: поля `kind: "http" | "network" | "invalidResponse"`, `status: number | null`, `method: string`.
     **Токен не попадает в `message`.**
2. `src/api/session.ts` — `getSession(): ISession | null`, `saveSession`, `clearSession`; ключ `greenapi-messenger:session`; битый JSON → `null`.
   Чтение/запись localStorage — в `try/catch` (приватный режим Safari). `signOut(reason?: "expired")` — `clearSession()` +
   `window.location.assign("/login" + (reason ? "?reason=expired" : ""))` (почему перезагрузка — «Architectural fit»).
3. Схемы (zod) и сервисы — по одному модулю на домен:

   | Сервис | Функция | Метод GREEN-API | Возвращает |
   |---|---|---|---|
   | `account.service.ts` | `checkInstanceAuthorized(credentials)` | `GET getStateInstance` | `boolean` (`stateInstance === "authorized"`) |
   | | `getInstanceSettings()` | `GET getSettings` | `IInstanceSettings` |
   | | `getAccount()` | `GET getAccountSettings` | `IAccount` (`""` → `null`) |
   | `chats.service.ts` | `checkAccount(phone)` | `POST checkAccount {phoneNumber: number}` | `TCheckAccountResult` |
   | | `getContact(chatId)` | `POST getContactInfo {chatId}` | `IContact` |
   | | `getChatIds()` | `GET getChats` | `string[]` — только личные (`Number(chatId) > 0`), в порядке ответа |
   | `messages.service.ts` | `getChatHistory(chatId, count)` | `POST getChatHistory {chatId, count}` | `IMessage[]` по возрастанию времени |
   | | `sendMessage(chatId, text)` | `POST sendMessage {chatId, message}` | `string` (`idMessage`) |

   Маппинг истории в `IMessage`: `text` — `textMessage` для `typeMessage` `textMessage` / `extendedTextMessage` (у последнего ещё
   `extendedTextMessage.text`), иначе `null`; `status` — `FAILED`, если `statusMessage === "failed"`, иначе `SENT`; `replacesId` и `isDeleted` — из полей
   истории. Схемы допускают отсутствие необязательных полей (у входящих нет `statusMessage`; `getChats` вернул записи без `type`).
4. `src/api/__tests__/api.test.ts` (`vi.stubGlobal("fetch", …)`, `window.location` — стаб): сессия (битый JSON → `null`, `signOut` чистит сессию и уходит на `/login?reason=expired`); URL и тело запроса; 401 → `GreenApiError` `http`/401; сетевой сбой → `network`;
   невалидный ответ → `invalidResponse`; токен не встречается в `error.message`; маппинг истории (текст / `extendedTextMessage` / нетекстовый → `null`,
   `failed`, `replacesId`, порядок); `getChatIds` отбрасывает отрицательные id; `getContact` собирает `name` по цепочке и `phone: 0 → null`.

**Verification**

- `pnpm test` — все тесты Phase 2 проходят; `pnpm lint`, `pnpm build` зелёные.
- Экспорты сервисов имеют импортёра — тест (`structure.md` → дисциплина экспорта).

**Visual Verification**

N/A — слой без UI.

### Phase 3 — Вход и маршруты

**Goal**

Пользователь входит по `idInstance` + `apiTokenInstance`; защищённые роуты недоступны без сессии; 401 в любом запросе выводит на вход с сообщением.

**Budget**

- Operation budget: 15
- Concern budget: routing, ui
- Stop condition: вход с реальными кредами ведёт на `/`, с неверными — показывает ошибку; `/` без сессии → `/login`.

**Files to modify**

- `src/app/App.tsx` — router mount: `RouterProvider` вместо заглушки.
- `src/app/_queryClient.ts` — 401: `QueryCache` и `MutationCache` с `onError`: `GreenApiError` со `status === 401` → `signOut("expired")`
  (кроме `useLoginMutation` — там 401 означает неверные креды и показывается под формой: проверять `mutation.options.meta`, мутация входа помечается
  `meta: { skipUnauthorizedRedirect: true }`); `retry` — `count < 2` и без повторов для `GreenApiError` со статусом < 500.

**Implementation details**

1. `src/routes/_paths.ts` — `routerPaths = { login: "/login", home: "/", chat: "/chat/$chatId" }` (все пути сразу — объект один).
2. `src/routes/_routes.tsx` + `AppRouter.tsx` — по образцу recipe-book: роут логина с `validateSearch` → `{ reason?: "expired" }` и `beforeLoad`
   (сессия есть → `redirect` на `/`); pathless защищённый layout-роут с `beforeLoad` (нет `getSession()` → `redirect` на логин). В этой фазе компонент
   layout-роута — `<Outlet />` прямо в `AppRouter.tsx` (Phase 4 заменит его на `MessengerLayout`).
3. `src/hooks/useForm/` и `useLatest.hook.ts` — перенос из recipe-book **как есть**, с двумя правками: `getEntries` и `TSetState` переезжают внутрь
   `useForm` (`_helpers.ts` / `_types.ts`) — других потребителей нет (`structure.md` → лестница); в JSDoc `useForm` один абзац:
   «Общий хук форм автора, переиспользуется между проектами; известные ограничения отмечены FIXME» (решение brainstorm 15).
4. `src/api/mutations/session.mutations.ts` — `useLoginMutation` (`meta: { skipUnauthorizedRedirect: true }`): `checkInstanceAuthorized(credentials)` →
   `false` → ошибка «не авторизован»; `true` → `saveSession(credentials)`. Ошибки различаются по `GreenApiError.status` / `kind`.
5. `src/pages/LoginPage/` — по образцу recipe-book; поля `idInstance` (`inputMode="numeric"`, валидатор «только цифры»), `apiTokenInstance`
   (`type="password"`, `autoComplete="off"`), оба `required`, значения обрезаются formatter'ом `trim`. Сообщение об ошибке входа — под формой;
   при `search.reason === "expired"` — сверху `login.sessionExpired`. Успех → `navigate` на `/`. Карточка по центру, кнопка `primary`, поля `font-size: 16px`.
| Ошибка | Текст |
|---|---|
| `GreenApiError` 401 / 403 | `login.unauthorizedError` |
| `checkInstanceAuthorized` → `false` | `login.notAuthorizedError` |
| `kind: "network"` | `login.networkError` |
| прочее | `login.networkError` |

**Verification**

- `pnpm lint`, `pnpm build` зелёные.

**Visual Verification**

| check_id | dependency_group | expected_evidence |
| --- | --- | --- |
| app_boots | boot | `/login` рендерит заголовок `Вход` и два поля; консоль без ошибок |
| guard_redirect | routing | открыть `/` без сессии → URL `/login` |
| login_invalid | login | неверный токен → под формой `Неверный idInstance или apiTokenInstance`; URL остаётся `/login` |
| login_success | login | креды из `.env.local` → URL `/`; запрос `getStateInstance` 200 в network |
| login_redirect_when_authed | routing | после входа открыть `/login` → URL `/` |
| mobile_layout | layout | ширина 390px: форма во всю ширину без горизонтального скролла |

**Shared blockers**

- `app_boots`

**Independent checks**

- `guard_redirect`, `login_invalid`, `login_success`, `login_redirect_when_authed`, `mobile_layout`

### Phase 4 — Каркас мессенджера и меню аккаунта

**Goal**

После входа — каркас из двух колонок (на мобильной — одна), левая панель с меню аккаунта и выходом, справа — плашка «Выберите, кому хотели бы написать».

**Budget**

- Operation budget: 15
- Concern budget: ui, routing
- Stop condition: меню показывает аккаунт, «Выйти» возвращает на `/login`; раскладка переключается на 767px.

**Files to modify**

- `src/routes/_routes.tsx`, `src/routes/AppRouter.tsx` — messenger layout: компонент защищённого layout-роута — `MessengerLayout`;
  индексный роут `/` → `NoChatSelected`.

**Implementation details**

1. `MessengerLayout` — flex-строка во весь `100dvh` на фоне `chatBackground`: слева `<Sidebar />` (десктоп: ширина 420px, «карточка» с `radii.panel`,
   отступ 18px; мобильная: во весь экран, без скругления), справа `<Outlet />`. Мобильная логика — **только CSS**: атрибут `data-chat-open`
   (`useParams({ strict: false }).chatId !== undefined`) прячет панель при открытом чате и `Outlet` — без него (до `breakpoints.mobileMax`).
   Каркас колонки со скроллом: `min-height: 0` у растягиваемых flex-детей (иначе скролл внутри flex ломается).
2. `_NoChatSelected.tsx` — пилюля `chat.selectChat` по центру (стиль разделителя дат); стили — в `_styles.ts` каркаса.
3. `Sidebar` — шапка: кнопка-гамбургер (`MenuIcon`, `aria-label={l.menuButton}`) + `H3` `sidebar.title`; тело — пока пустое (Phase 5).
4. `AccountMenu` — выпадающее меню у гамбургера: строка «Аккаунт» + `@username` или `+телефон` из `useAccountQuery` (во время загрузки — серая плашка-скелетон
   строки; при ошибке запроса строки нет), пункт «Выйти» → `signOut()` из `src/api/session.ts`. Закрытие — по клику вне (прозрачная подложка-кнопка под меню, без `useEffect`-слушателей) и по `Escape`.
5. `src/api/queries/account.queries.ts` — `useAccountQuery()` (`getAccount`, `staleTime: Infinity`).
6. `src/components/icons/` — `MenuIcon`, `LogoutIcon`. Источник всех иконок проекта — **Material Symbols Rounded** (Google, Apache 2.0): SVG скачивается
   `curl`'ом по ссылке из таблицы, в компонент переносится только `d` пути. Компонент — `<svg viewBox="0 -960 960 960" width/height={size}
   fill="currentColor" aria-hidden>`; проп `size` (по умолчанию 24). Пути по памяти не рисовать.
   База ссылок: `https://raw.githubusercontent.com/google/material-design-icons/master/symbols/web/`

   | Компонент | Фаза | Файл (относительно базы) |
   |---|---|---|
   | `MenuIcon` | 4 | `menu/materialsymbolsrounded/menu_24px.svg` |
   | `LogoutIcon` | 4 | `logout/materialsymbolsrounded/logout_24px.svg` |
   | `PencilIcon` | 6 | `edit/materialsymbolsrounded/edit_fill1_24px.svg` |
   | `BackIcon` | 6 | `arrow_back/materialsymbolsrounded/arrow_back_24px.svg` |
   | `SendIcon` | 8 | `send/materialsymbolsrounded/send_fill1_24px.svg` |
   `index.ts` — `export * from "./_icons"`: следующие фазы добавляют иконки только в `_icons.tsx`; каждая иконка добавляется в фазе своего потребителя.

**Verification**

- `pnpm lint`, `pnpm build` зелёные.

**Visual Verification**

| check_id | dependency_group | expected_evidence |
| --- | --- | --- |
| messenger_boots | boot | после входа: левая панель с `Чаты`, справа пилюля `Выберите, кому хотели бы написать`; консоль чистая |
| desktop_two_columns | layout | 1440px: панель и правая часть видны одновременно; панель — скруглённая карточка (сверить с `01-wide-empty.png`) |
| mobile_single_column | layout | 390px: видна только панель, во всю ширину |
| account_menu | menu | клик по гамбургеру → меню с `Аккаунт` и username/телефоном тестового аккаунта; `Escape` закрывает |
| logout | menu | `Выйти` → URL `/login`; повторное открытие `/` → снова `/login` |

**Shared blockers**

- `messenger_boots`

**Independent checks**

- `desktop_two_columns`, `mobile_single_column`, `account_menu`, `logout`

### Phase 5 — Список чатов и синхронизация с сервером

**Goal**

Левая панель показывает чаты из localStorage мгновенно и обновляет их с сервера при входе: имя, аватар, последнее сообщение, время, бейдж непрочитанных.

**Budget**

- Operation budget: 14
- Concern budget: state, ui
- Stop condition: после входа в новом браузере тестовый чат появляется с именем, аватаром и последним сообщением; после перезагрузки — сразу, без `getContactInfo`.

**Files to modify**

- `src/components/Sidebar/_Sidebar.tsx` — chat list: тело панели — список `ChatListItem` / скелетоны / пустое состояние.

**Implementation details**

1. `src/api/cache/chats.cache.ts`:
   - ключ запроса `["chats", idInstance]`; localStorage `greenapi-messenger:chats:<idInstance>`; `readStoredChats(idInstance)` (битые данные → `[]`).
   - `updateChats(queryClient, idInstance, updater)` — единственная точка записи: `setQueryData` + запись в localStorage.
   - чистые операции (экспорт — для тестов и потребителей фаз 6/9): `upsertContact(chats, contact)` (имя/аватар обновляются, `lastMessage` и
     `unreadCount` сохраняются), `applyLastMessage(chats, chatId, lastMessage, { incrementUnread })` (снимок меняется, только если сообщение не старее),
     `resetUnread(chats, chatId)`, `sortChats(chats)` (по `lastMessage.timestamp` убыв., чаты без сообщений — в конце).
   - `chats.cache.test.ts` — каждая операция, включая «не старее» и сохранение `unreadCount` при `upsertContact`.
2. `src/api/queries/chats.queries.ts` — `useChatsQuery()`:
   - `initialData: () => readStoredChats(id)`, `initialDataUpdatedAt: 0` — список виден сразу, синхронизация стартует при монтировании;
     `staleTime: Infinity` — повторной синхронизации в сессии нет.
   - `queryFn` (синхронизация, запросы **последовательно** — лимиты частоты):
     1. `getChatIds()` → первые `CHATS_SYNC_LIMIT = 10`.
     2. Для id, которых нет в текущем кэше, — `getContact` (лимит `getContactInfo` — 100 в месяц на «Разработчике»; известные чаты не запрашиваются).
     3. Для всех 10 — `getChatHistory(id, 1)` → снимок `lastMessage` (запись `isDeleted` не берётся).
     4. Результат сливается с **текущим** кэшем на момент окончания (`queryClient.getQueryData`), а не со снимком на старте — poller (Phase 9) мог
        изменить список, пока шла синхронизация. Локальные чаты, которых нет в ответе, сохраняются. Запись — через `updateChats`.
     5. Ошибка одного `getContact` / `getChatHistory` не роняет синхронизацию: чат остаётся с тем, что есть (имя-фолбэк — `+телефон` / `chatId`).
3. `ChatListItem` — по `06-unread-badge.png` / `02-wide-chat.png`: `Avatar` 54px, имя (`H3`, одна строка с многоточием), превью (`B1` `textMuted`,
   одна строка, `text-overflow`; нетекстовое — `chat.unsupportedMessage`), время справа сверху (`formatChatListTime`), бейдж справа снизу (`unreadCount > 0`;
   больше 99 → `99+`; `min-width` + `padding`, не фиксированная ширина). Элемент в этой фазе — только отображение (`div`): типизированный `Link` TanStack Router требует зарегистрированного роута,
   а роут чата появляется в Phase 6 — там элемент станет ссылкой.
4. `src/components/Avatar/` — круг заданного размера; картинка `avatarUrl` (`onError` → инициалы); инициалы — `_helpers.ts`: `getInitials(name)` —
   первые буквы до двух слов, регулярка с флагом `u` **без `\b`** (`\b` не видит кириллицу), верхний регистр; `getAvatarColor(chatId)` — детерминированно
   из `palette.avatarColors`. `_helpers.test.ts`: `"Иван Петров" → "ИП"`, `"John" → "J"`, `"" → ""`, цвет стабилен для одного id.
5. `src/utils/helpers/dateFormat.ts` — все форматтеры приложения (модульные `Intl.DateTimeFormat("ru", …)`, не на каждый вызов):
   `formatChatListTime(ts, now)` — сегодня `HH:mm`, последние 7 дней — день недели (`сб`), иначе `dd.MM.yy`;
   `formatMessageTime(ts)` — `HH:mm`; `getDayKey(ts)` — ключ дня по локальному времени; `formatDayLabel(ts, now, { today, yesterday })` — подписи извне,
   этот год — `4 октября`, иначе `4 октября 2025 г.` `dateFormat.test.ts` — граничные случаи (полночь, вчера, 7 дней назад, прошлый год) с фиксированным `now`.
6. Состояния панели: данные есть → список; список пуст и идёт синхронизация → 3 скелетона строк; пуст и синхронизация закончилась →
   `sidebar.emptyTitle` + `sidebar.emptyHint` по центру; ошибка синхронизации при непустом списке — `Caption` `danger` `sidebar.syncError` над списком.

**Verification**

- `pnpm test` (кэш, аватар, даты), `pnpm lint`, `pnpm build` зелёные.

**Visual Verification**

| check_id | dependency_group | expected_evidence |
| --- | --- | --- |
| list_synced | sync | новый профиль браузера, вход → в списке чат `GREEN_API_TEST_CHAT_ID` с именем, превью и временем; network: `getChats`, `getContactInfo`, `getChatHistory` 200 |
| list_from_storage | sync | перезагрузка → список виден сразу; в network **нет** `getContactInfo` |
| avatar_rendered | item | у чата — картинка аватара или кружок с инициалами (кириллица не пустая) |
| mobile_list | layout | 390px: список во всю ширину (сверить с `04-mobile-list.png`) |

**Shared blockers**

- `list_synced`

**Independent checks**

- `list_from_storage`, `avatar_rendered`, `mobile_list`

### Phase 6 — Новый чат и экран переписки

**Goal**

Карандаш открывает «Новый чат»: номер → `checkAccount` → чат в списке → переход на экран чата с шапкой; чат из адреса без записи в списке → редирект на `/`.

**Budget**

- Operation budget: 15
- Concern budget: ui, state
- Stop condition: создание чата по номеру получателя ведёт на `/chat/<id>` с шапкой; неверный номер показывает ошибку.

**Files to modify**

- `src/components/Sidebar/_Sidebar.tsx`, `_styles.ts` — new chat: `useState` вида `"list" | "newChat"`; кнопка-карандаш (FAB 56px, `primary`,
  правый нижний угол панели, `aria-label={l.newChatButton}`) видна только в виде списка.
- `src/components/icons/_icons.tsx` — chat icons: `PencilIcon`, `BackIcon` (источник и ссылки — Phase 4, п. 6).
- `src/routes/_routes.tsx` — chat route: `/chat/$chatId` → `ChatPage` (параметр — пропсом, как `ProductCardRoute` в recipe-book).
- `src/components/Sidebar/_internal/ChatListItem/_ChatListItem.tsx`, `_styles.ts` — navigation: элемент — `Link` на `/chat/$chatId` (клавиатура и a11y);
  выбранный (`chatId` из параметров) — фон `primary`, весь текст `onPrimary`; ховер — `surfaceMuted`.

**Implementation details**

1. `useCreateChatMutation(phone)`: `checkAccount` → `exists: false` → ошибка «не найден»; чат уже в списке → вернуть его `chatId`;
   иначе `getContact(chatId)` (сбой → контакт из `checkAccount`: `username` / `+phone`) → `updateChats(upsertContact)` → вернуть `chatId`.
   Ошибки: `exists:false` → `newChat.notFoundError`; 469 → `newChat.rateLimitError`; прочее → `newChat.genericError`.
2. `NewChatPanel` (по `07-new-chat-panel.png`): шапка — кнопка «назад» (`BackIcon`) + `H3` `newChat.title`; поле номера на `useForm`
   (`inputMode="tel"`, `font-size: 16px`); нормализация — оставить только цифры; валидатор — 10–15 цифр (`newChat.phoneError`).
   Успех → вид списка + `navigate` на `/chat/$chatId`. Ошибка мутации — под полем.
3. `ChatPage` — колонка во всю высоту по центру, `max-width: 880px`: `ChatHeader` (`_ChatHeader.tsx` рядом, стили в `_styles.ts` страницы)
   сверху, дальше — место ленты (Phase 7) и поля ввода (Phase 8).
   `_useChatPage.ts`: чат из `useChatsQuery` по `chatId`; нет в списке → `navigate({ to: "/", replace: true })`; при открытии и при смене `chatId` —
   `updateChats(resetUnread)`, если `unreadCount > 0`.
4. `ChatHeader` — белая пилюля (`02-wide-chat.png`): `BackIcon`-кнопка (только мобильная, → `/`), `Avatar` 42px, имя (`H3`), подзаголовок —
   `@username`, иначе `+телефон` (`B2` `textMuted`).

**Verification**

- `pnpm lint`, `pnpm build`, `pnpm test` зелёные.

**Visual Verification**

| check_id | dependency_group | expected_evidence |
| --- | --- | --- |
| new_chat_opens | new-chat | клик по карандашу → панель `Новый чат` с полем номера и кнопкой назад |
| new_chat_invalid | new-chat | `123` → `Введите номер в международном формате…`; запроса `checkAccount` нет |
| list_item_opens_chat | chat | клик по тестовому чату в списке → URL `/chat/<id>`, элемент подсвечен синим (сверить с `02-wide-chat.png`) |
| new_chat_existing | new-chat | `GREEN_API_TEST_PHONE` → URL `/chat/<GREEN_API_TEST_CHAT_ID>`, в списке один такой чат (без дубля) |
| chat_header | chat | шапка: аватар, имя, `@username` или телефон (сверить с `02-wide-chat.png`) |
| unknown_chat_redirect | chat | открыть `/chat/1` → URL `/` |
| mobile_chat_back | layout | 390px: на `/chat/<id>` видна только колонка чата; кнопка назад → список |

**Shared blockers**

- `new_chat_opens`

**Independent checks**

- `list_item_opens_chat`, `new_chat_invalid`, `new_chat_existing`, `chat_header`, `unknown_chat_redirect`, `mobile_chat_back`

Номер нового получателя не используется — слот тарифа «Разработчик» (3 чата) не тратится.

### Phase 7 — История переписки

**Goal**

Экран чата показывает последние 100 сообщений: пузыри с временем, разделители дат, кликабельные ссылки, плашку нетекстовых, пометку «не доставлено»; держится внизу.

**Budget**

- Operation budget: 15
- Concern budget: ui, state
- Stop condition: история тестового чата отображается как в `02-wide-chat.png` (без узора фона и без элементов из «не делаем»); удалённое сообщение не видно.

**Files to modify**

- `src/pages/ChatPage/_ChatPage.tsx` — message list: лента между шапкой и местом поля ввода.

**Implementation details**

1. `src/api/cache/messages.cache.ts`:
   - ключ `["messages", chatId]`; `updateMessages(queryClient, chatId, updater)`; `mergeMessages(current, incoming)` — чистая:
     объединение по `id` (запись из `incoming` побеждает); удалить сообщения, чей `id` указан в чьём-то `replacesId`; убрать `isDeleted`;
     сортировка по `timestamp`, при равенстве — по порядку поступления. Локальные `local-*` сохраняются, пока не заменены.
   - `messages.cache.test.ts`: дедуп, правка заменяет оригинал, удаление убирает оригинал и саму запись, порядок, локальные сохраняются.
2. `useChatMessagesQuery(chatId)` — `getChatHistory(chatId, 100)` → `mergeMessages(кэш, ответ)` (кэш мог пополниться poller'ом / отправкой);
   при каждом открытии чата — свежий запрос (`staleTime` по умолчанию).
3. `MessageList` — скролл-контейнер (`overflow-y: auto`, `min-height: 0`), состояния: загрузка — 3 скелетона пузырей; ошибка — `chat.historyError` +
   кнопка `chat.retryButton` (`refetch`); пусто — пилюля `chat.emptyHistory`. `_helpers.ts`: `buildListItems(messages, now, labels)` → массив
   `{ kind: "date", key, label } | { kind: "message", message, isLastInGroup }` (группа — подряд одно направление в пределах дня); `_helpers.test.ts`.
   `_useAutoScroll.ts`: при первом получении данных — вниз; при росте списка — вниз, только если пользователь был у низа (≤ 80px) или последнее
   сообщение — своё (`SENDING`); `useLayoutEffect`.
4. `MessageBubble` — входящий слева (`surface`), исходящий справа (`bubbleOutgoing`), `max-width` ~ 70%, `word-break: break-word`, `white-space: pre-wrap`;
   хвостик — псевдоэлемент только у `isLastInGroup` (у остальных место хвостика сохраняется, выравнивание не прыгает); время (`formatMessageTime`, `Caption`;
   исходящее — `metaOutgoing`) внутри справа снизу. `text === null` → курсивом `chat.unsupportedMessage`. `FAILED` → вместо времени `danger`-текст
   `chat.failedLabel` + `: <failReason>` при наличии. `SENDING` — время полупрозрачное.
   `_helpers.ts`: `splitTextWithLinks(text)` → части `{ kind: "text" | "link", value }` (только `http(s)://…`, хвостовая пунктуация `.,!?)` не входит в ссылку);
   ссылки — `<a href target="_blank" rel="noopener noreferrer">` цвета `primary`. **Без `dangerouslySetInnerHTML`.**
   `MessageBubble/_helpers.test.ts`: ссылка в середине, в конце с точкой, несколько ссылок, текст без ссылок, `javascript:` не становится ссылкой.
5. Разделитель даты — пилюля `datePill`, белый текст `medium`, по центру (`formatDayLabel` с `chat.today` / `chat.yesterday`).

**Verification**

- `pnpm test` (`messages.cache`, `buildListItems`), `pnpm lint`, `pnpm build` зелёные.

**Visual Verification**

| check_id | dependency_group | expected_evidence |
| --- | --- | --- |
| history_loaded | history | открыть тестовый чат → пузыри входящих слева и исходящих справа, время в каждом; network `getChatHistory` 200 |
| date_separators | history | пилюли `Сегодня` / `Вчера` / дата между днями |
| deleted_hidden | history | нет пузыря с «кракозябрами» (удалённое сообщение из истории тестового чата) |
| links_clickable | history | ссылка `https://green-api.com` — `<a>` с `target="_blank"` и `rel` `noopener noreferrer` |
| scrolled_to_bottom | history | после загрузки виден последний пузырь (`scrollTop + clientHeight ≈ scrollHeight`) |
| mobile_history | layout | 390px: лента без горизонтального скролла (сверить с `05-mobile-chat.png`) |

**Shared blockers**

- `history_loaded`

**Independent checks**

- `date_separators`, `deleted_hidden`, `links_clickable`, `scrolled_to_bottom`, `mobile_history`

### Phase 8 — Отправка сообщений

**Goal**

Поле ввода отправляет текст: сообщение появляется сразу, после ответа получает `idMessage`; при ошибке помечается «не доставлено» с причиной.

**Budget**

- Operation budget: 7
- Concern budget: ui, state
- Stop condition: отправленное сообщение видно сразу и приходит получателю; при сетевой ошибке — «Не доставлено: нет связи с GREEN-API».

**Files to modify**

- `src/pages/ChatPage/_ChatPage.tsx` — composer: `Composer` внизу колонки.
- `src/components/icons/_icons.tsx` — send icon: `SendIcon` (источник и ссылки — Phase 4, п. 6).

**Implementation details**

1. `useSendMessageMutation(chatId)`:
   - `onMutate` — `IMessage` с `id: "local-" + crypto.randomUUID()`, `OUTGOING`, `SENDING`, `timestamp` — сейчас; `updateMessages` + `updateChats(applyLastMessage)`.
   - `onSuccess(idMessage)` — локальная запись заменяется на `id: idMessage`, `SENT` (`mergeMessages` уберёт эхо из очереди с тем же id, если оно успело прийти).
   - `onError` — локальная запись → `FAILED`, `failReason`: 466 → `sendErrors.quota`, `network` → `sendErrors.network`, прочее → `sendErrors.generic`.
     Повтора нет (бэклог).
2. `Composer` (белая пилюля по `02-wide-chat.png`, без скрепки и эмодзи) + `_useComposer.ts` (`useState`, не `useForm` — одно поле без валидации):
   `textarea` `rows={1}`, авторазмер в `useLayoutEffect` (`height: auto` → `scrollHeight`), потолок — `max-height` в CSS (~5 строк), `maxLength={4096}`,
   `font-size: 16px`. Enter — отправка, Shift+Enter — перенос; во время IME-ввода (`event.nativeEvent.isComposing`) Enter не отправляет.
   Пустой после `trim` текст не отправляется, кнопка (`SendIcon`, круг `primary`, `aria-label={l.sendButton}`) неактивна. Поле **не** блокируется
   на время отправки и после отправки очищается, фокус остаётся.

**Verification**

- `pnpm lint`, `pnpm build`, `pnpm test` зелёные.

**Visual Verification**

| check_id | dependency_group | expected_evidence |
| --- | --- | --- |
| send_appears | send | ввести текст + Enter → пузырь справа сразу, поле пустое и в фокусе; network `sendMessage` 200 |
| shift_enter_newline | composer | Shift+Enter → перенос строки, запроса нет |
| empty_disabled | composer | пустое поле / только пробелы → кнопка `disabled` |
| send_failed_offline | send | эмуляция офлайна → пузырь с `Не доставлено: нет связи с GREEN-API` |
| list_preview_updated | send | превью и время тестового чата в списке — отправленный текст |

**Shared blockers**

- `send_appears`

**Independent checks**

- `shift_enter_newline`, `empty_disabled`, `send_failed_offline`, `list_preview_updated`

Доставку на телефон получателя подтверждает владелец.

### Phase 9 — Получение: poller, непрочитанные, предупреждение о настройках

**Goal**

Входящие появляются в открытом чате и в списке (бейдж для неоткрытых, новый собеседник — новый чат), статус `failed` помечает сообщение;
очередь читает одна вкладка; при неподходящих настройках инстанса — предупреждение.

**Budget**

- Operation budget: 13
- Concern budget: state, services, ui (третья — `SettingsWarning`; он читает настройки, нужные именно для получения, отдельно его проверять не на чем)
- Stop condition: ответ получателя появляется в открытом чате без перезагрузки; во второй вкладке poller не стартует.

**Files to modify**

- `src/routes/layouts/MessengerLayout/_MessengerLayout.tsx` — poller: вызов `useMessengerLayout()`.
- `src/api/queries/account.queries.ts` — settings: `useInstanceSettingsQuery()` (`staleTime` 5 мин).
- `src/components/Sidebar/_Sidebar.tsx` — warning: `SettingsWarning` между шапкой и списком.

**Implementation details**

1. `notifications.schema.ts` + `notifications.service.ts` — `receiveNotification(receiveTimeout, signal)` →
   `{ receiptId, notification } | null` (тело `null` при таймауте); `deleteNotification(receiptId)`. Разбор тела — по `typeWebhook`:

   | `typeWebhook` | Поля, которые нужны | Остальные типы |
   |---|---|---|
   | `incomingMessageReceived`, `outgoingMessageReceived`, `outgoingAPIMessageReceived` | `idMessage`, `timestamp`, `senderData.{chatId, chatName, senderName}`, `messageData.{typeMessage, textMessageData?.textMessage, extendedTextMessageData?.text}` | |
   | `outgoingMessageStatus` | `chatId`, `idMessage`, `status`, `description?` | |
   | любой другой / не разобралось схемой | — | `{ kind: "ignored" }` — **всё равно удаляется** |

2. `_applyNotification.ts` — `applyNotification(notification, { queryClient, idInstance, activeChatId, enrichChat })`:
   - сообщение → `IMessage` (`INCOMING` для `incomingMessageReceived`, иначе `OUTGOING`; `SENT`); у исходящих `senderData` описывает собеседника.
   - чата нет в списке → `upsertContact` с именем `chatName || senderName || chatId` + `enrichChat(chatId)` (один `getContact`, без ожидания).
   - `applyLastMessage`; `incrementUnread` — только `INCOMING` и `chatId !== activeChatId`.
   - кэш `["messages", chatId]` существует → `updateMessages(mergeMessages)`; не существует → не создаётся (история придёт при открытии).
   - `outgoingMessageStatus` со `status: "failed"` → сообщение с этим `id` → `FAILED`, `failReason = description`; прочие статусы — без изменений.
   - `_applyNotification.test.ts` — каждая ветка, включая «активный чат — без +1» и «эхо с тем же id — без дубля».
3. `_poller.ts` — `startPoller({ idInstance, onNotification, onUnauthorized }): () => void`:

   ```text
   controller = new AbortController()
   navigator.locks.request(`greenapi-messenger:poller:${idInstance}`, { signal }, async () => {
     delay = 0
     while (!signal.aborted):
       try:
         item = receiveNotification(20, signal)        // long-poll
         if item: onNotification(item.notification); deleteNotification(item.receiptId)   // удаление — после обработки
         delay = 0
       catch error:
         if aborted: break
         if GreenApiError 401: onUnauthorized(); break
         delay = min(max(delay * 2, 1000), 30_000); wait(delay, signal)              // сеть, 429, 5xx
   })
   return () => controller.abort()
   ```

   Ошибка внутри `onNotification` логируется и **не** блокирует удаление (иначе очередь встанет на одном уведомлении). Нет `navigator.locks` →
   цикл без блокировки (`console.warn`).
4. `_useMessengerLayout.ts` — `useEffect` по `idInstance`: `startPoller` с `onNotification` → `applyNotification` (активный чат — из
   `useParams({ strict: false }).chatId` через `useLatest`, чтобы смена чата не перезапускала цикл), `enrichChat` → `getContact` + `updateChats(upsertContact)`,
   `onUnauthorized` → `signOut("expired")`; cleanup — `stop()`. Под StrictMode двойной mount даёт abort первого цикла до захвата блокировки — второй цикл один.
5. `SettingsWarning` — `useInstanceSettingsQuery`: `webhookUrl !== ""` → `settingsWarning.webhookUrl`; `!isIncomingEnabled` → `settingsWarning.incomingDisabled`;
   под ними `settingsWarning.hint`. Нет проблем, загрузка или ошибка запроса — ничего не рендерит (предупреждение — подсказка, не блокер).

**Verification**

- `pnpm test` (`applyNotification`), `pnpm lint`, `pnpm build` зелёные.

**Visual Verification**

| check_id | dependency_group | expected_evidence |
| --- | --- | --- |
| poller_running | poller | network: повторяющиеся `receiveNotification` (длинные запросы), после непустого — `deleteNotification` |
| send_no_duplicate | poller | отправить сообщение, дождаться следующего цикла → в ленте один пузырь (эхо не задвоило) |
| single_consumer | poller | открыть вторую вкладку → во второй нет запросов `receiveNotification`; закрыть первую → во второй начинаются |
| no_settings_warning | settings | у тестового инстанса настройки верные → предупреждения нет |
| logout_stops_poller | poller | `Выйти` → запросы `receiveNotification` прекращаются |

**Shared blockers**

- `poller_running`

**Independent checks**

- `send_no_duplicate`, `single_consumer`, `no_settings_warning`, `logout_stops_poller`

Ответ получателя в открытом чате, бейдж непрочитанных в другом чате и автосоздание чата от нового собеседника проверяет владелец руками
(агент не может вызвать входящее). Эти же ветки покрывает e2e (Phase 10).

### Phase 10 — E2E со стабом GREEN-API

**Goal**

Сценарий ТЗ целиком проверяется `pnpm e2e` без кредов и без сети: GREEN-API подменён стабом, входящее сообщение подаётся через очередь стаба.

**Budget**

- Operation budget: 5
- Concern budget: config, tests
- Stop condition: `pnpm e2e` зелёный локально.

**Files to modify**

- `package.json` — devDependency `@playwright/test` (e2e согласованы в brainstorm, решение 16); скрипт `"e2e": "playwright test"`.
- `README.md` — команда `pnpm e2e` (с `pnpm exec playwright install chromium` при первом запуске) и раздел «Известные ограничения»:
  токен в localStorage; список чатов — в браузере + синхронизация первых 10; непрочитанные — локальный счёт (прочитанное в самом Telegram у нас
  остаётся непрочитанным); правленое сообщение встаёт на время правки; очередь читает одна вкладка. В разделе благодарностей — иконки
  Material Symbols (Google, Apache 2.0) и шрифт Roboto (SIL OFL).

**Implementation details**

1. `playwright.config.ts` — `webServer: pnpm dev`, `baseURL`, проект Chromium, артефакты в gitignored `playwright-report/`, `test-results/`.
2. `e2e/greenApiStub.ts` — `page.route("https://api.green-api.com/**")`: in-memory состояние (сессия валидна при заданных тестовых кредах, чаты,
   история, очередь уведомлений) и ответы в формах из `brainstorm.md`; `receiveNotification` с пустой очередью отвечает `null` сразу (без ожидания);
   хелпер `pushIncoming(chatId, text)` кладёт `incomingMessageReceived` в очередь.
3. `e2e/messenger.spec.ts` — сценарии: неверный токен → ошибка; вход → пустой список; новый чат по номеру → экран чата; отправка → пузырь;
   входящее в открытый чат → пузырь слева; входящее от нового собеседника → чат в списке с бейджем `1`; `failed` → «Не доставлено»; выход → `/login`.

**Verification**

- `pnpm e2e` зелёный; `pnpm lint`, `pnpm build` зелёные.

**Visual Verification**

N/A — фаза сама является автоматической браузерной проверкой.

## Conventions to follow

- Путь данных и инварианты очереди — `docs/agents/architecture.md`; формы GREEN-API — только из документации и `brainstorm.md`.
- Все тексты — из `ru.json` (Phase 1 содержит их все); новый текст в фазе — стоп и вопрос, а не хардкод.
- Цвета и размеры — токены темы (Phase 1); литеральный hex вне `_theme.ts` — дефект.
- `apiTokenInstance` не попадает в `message` ошибок, логи, отчёты, снапшоты.
- Комментарии — по `code-style.md`: без ссылок на план, фазы и brainstorm.

## Potential gotchas

- **`\b` в регулярках не работает с кириллицей** — инициалы `"Иван Петров"` дают пустую строку (баг встречался в других проектах автора).
- **Пустая очередь — тело `null` со статусом 200**, а не пустой ответ.
- **`sendMessage` отвечает `idMessage` даже при недоставке** — неудача приходит позже `outgoingMessageStatus: failed` (`peer flood` у новых аккаунтов).
- **Правка/удаление в истории — новые записи** с `editedMessageId` / `deletedMessageId`, у удалённой — старый текст. Без `mergeMessages` будут дубли и
  «воскресшие» сообщения.
- **`getChats` расходится с документацией** — нет `type`, пустые `name` / `username`; личные отличаются только знаком `chatId`.
- **StrictMode** монтирует эффекты дважды — второй poller не должен стартовать (abort + Web Lock).
- **Flex и скролл** — без `min-height: 0` у растягиваемого ребёнка лента не скроллится.
- **Safari iOS** — `font-size` полей < 16px вызывает зум; `100dvh`, не `100vh`.
- Тестовый инстанс — тариф «Разработчик»: 3 чата, `checkAccount` и `getContactInfo` — по 100 в месяц. Проверки не создают новых чатов.

## Deferred follow-ups

См. `BACKLOG.md` — там всё, что осознанно не входит в MVP (галочки, кэш сообщений в IndexedDB, плашка непрочитанных в переписке, синхронизация вкладок,
догрузка истории, повтор отправки, пометка «изменено», черновики, поиск, эмодзи, статус «в сети», файлы, тёмная тема, `@username`, `stateInstanceChanged`, `readChat`).

## Amendments

## Known issues
