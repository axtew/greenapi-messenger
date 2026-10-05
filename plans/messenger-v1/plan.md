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

### Phase 1 — added 2026-10-04
**Trigger:** ревьюер (phase-1, iter-1): `H2`, `H3`, `B1`, `B2`, `Caption` экспортируются без импортёров — противоречит дисциплине экспорта `structure.md`.
**Fix:** одобренное владельцем исключение из дисциплины экспорта — шкала Typography является контрактом фазы и экспортируется целиком (`H1`, `H3`, `B1`, `B2`, `Caption`, пропсы `color` / `textAlign` / `as`, полный набор `TTextColor`), хотя в Phase 1 их пользователь — только заглушка `H1`. `H2` удаляется из `src/components/Typography/` и из плана: его не использует ни одна фаза.

### Phase 2 — added 2026-10-05
**Trigger:** разработчик и ревьюер (phase-2, iter-1): по документации CheckAccount лимит поиска по номеру приходит ответом **HTTP 200** `{"status": false, "data": {"reason": "rate_limit_exceeded", …}}`, а HTTP 469 — другой лимит без срока (`brainstorm.md` → «Проверенные факты», исправлено владельцем). Схема `checkAccount` такой ответ не принимает → `invalidResponse` → Phase 6 показала бы `newChat.genericError`.
**Fix:**
- `checkAccount` распознаёт тело `{status: false, …}`: `data.reason === "rate_limit_exceeded"` → `GreenApiError` с новым `kind: "rateLimited"`; любой другой `status: false` (в т. ч. `instance is starting or not authorized`) → `GreenApiError` `kind: "invalidResponse"`. HTTP 469 по-прежнему даёт `kind: "http"`, `status: 469` — клиент не меняется.
- Новый ключ словаря `newChat.searchRestrictedError` = «Telegram временно ограничил поиск по номеру — попробуйте позже» — в `public/dictionaries/ru.json` и интерфейс `I18n` (словарь остаётся общим для всех фаз).
- Таблица ошибок Phase 6 (п. 1, `useCreateChatMutation`) заменяется: `exists: false` → `newChat.notFoundError`; `kind: "rateLimited"` → `newChat.rateLimitError`; HTTP 469 → `newChat.searchRestrictedError`; прочее → `newChat.genericError`.

### Phase 5 — added 2026-10-05
**Trigger:** ревьюер (phase-2, iter-1): `IChat` и `IChatLastMessage` из «Types and interfaces» не объявлены в Phase 2 — у них нет импортёра до Phase 5 (дисциплина экспорта `structure.md`).
**Fix:** `IChat` и `IChatLastMessage` объявляются в Phase 5 в `src/types/chats.types.ts` по форме из «Types and interfaces», вместе с первым потребителем (`chats.cache.ts`).

### Phases 2, 3, 6, 7, 9 — added 2026-10-05
**Trigger:** владелец (после phase-2, iter-2): везде, где может быть `enum`, должен быть строковый `enum`; литеральные union — только для пропсов компонентов (потребителю не нужно импортировать `enum` ради пропа). План в нескольких местах задаёт литеральные union.
**Fix:** правило действует для всех фаз и перекрывает формулировки фаз. Исключение — пропсы компонентов (`Typography` `color` / `textAlign` и т. п.). Где объявлять `enum` — по лестнице `structure.md`. Конкретно:
- **Phase 2:** `GreenApiError.kind` → `enum` (`HTTP`, `NETWORK`, `INVALID_RESPONSE`, `RATE_LIMITED`); `httpMethod` клиента → `enum` (`GET`, `POST`; `DELETE` добавит Phase 9); `signOut(reason?)` → `enum` причины выхода (`EXPIRED = "expired"`, значение уходит в `?reason=`). Значения полей GREEN-API, с которыми код сравнивает (`stateInstance`, `incomingWebhook`, `reason` отказа `checkAccount`, `type` записи истории, `statusMessage`, `typeMessage`), — строковые `enum` из используемых значений; zod-схемы при этом не сужаются там, где API может прислать значение вне `enum` (неизвестный `typeMessage` / `statusMessage` не должен ронять разбор).
- **Phase 3:** `validateSearch` роута логина → `{ reason?: <enum причины выхода> }`; таблица ошибок входа сравнивает `kind` с членами `enum`.
- **Phase 6:** вид левой панели `"list" | "newChat"` → `enum`.
- **Phase 7:** дискриминант элементов `buildListItems` (`date` / `message`) и частей `splitTextWithLinks` (`text` / `link`) → `enum`.
- **Phase 9:** результат разбора уведомления (`message` / `status` / `ignored`), значения `typeWebhook` и `status` у `outgoingMessageStatus` → `enum`; неизвестный `typeWebhook` по-прежнему разбирается в `ignored`.

### Phase 3 — added 2026-10-05
**Trigger:** владелец (после phase-2): (1) у приложения нет фавиконки — браузер запрашивает `/favicon.ico`, получает 404, и проверка `app_boots` (консоль без ошибок) падает; (2) имена методов GREEN-API — закрытый набор, а сейчас это `string`; (3) ревьюер phase-2 iter-3: текст `GreenApiError.message` выбирается вложенным тернарником по `kind`, где `INVALID_RESPONSE` — неявная ветка «иначе», и новый член `enum` молча получил бы чужой текст.
**Fix:**
- `public/favicon.svg` — белая иконка `send` (Material Symbols Rounded, тот же источник и файл, что у `SendIcon` в Phase 4 п. 6: `send/materialsymbolsrounded/send_fill1_24px.svg`, путь скачивается `curl`'ом, по памяти не рисуется) на круге цвета `palette.primary` (`#3390ec`; файл статический, токен темы в нём недоступен — значение повторяет токен). `index.html` — `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`. Проверка `app_boots` дополнительно ожидает: запроса `/favicon.ico` с 404 нет.
- Имена методов GREEN-API → строковый `enum` (`EGreenApiMethod`, члены — по используемым методам; Phase 9 добавит `receiveNotification` / `deleteNotification`); `method` запроса и `GreenApiError.method` типизируются им; повтор строки имени метода в сервисах уходит. Место — по лестнице `structure.md`.
- Текст причины в `GreenApiError.message` выбирается исчерпывающе по `EGreenApiErrorKind` (`switch` с проверкой исчерпанности или справочник `Record<EGreenApiErrorKind, …>` из `typing.md`), чтобы пропущенный член был ошибкой компиляции; тексты сообщений не меняются, токен в них по-прежнему не попадает.

### Phase 3 — added 2026-10-05 (2)
**Trigger:** ревьюер (phase-3, iter-1): (1) перенос `useForm` «как есть» оставил комментарии, верные только для recipe-book (`resetOn` с примерами `isOpened` / `recipeId`; `catch` в `onSubmit` ссылается на общий `MutationCache`, который здесь ошибок не показывает) — это противоречит `code-style.md`; (2) `EGreenApiMethod` лежит в слое клиента (им типизирован запрос), а `architecture.md` называл сервисы единственным местом, знающим URL и имена методов.
**Fix:**
- В перенесённом `useForm` комментарии, ссылающиеся на образец, переписываются нейтрально; логика и FIXME не меняются. `resetOn` — «значение, при смене которого форма возвращается к начальным `inputs` (например, id редактируемой сущности)»; `catch` — «обработчик кидает при неудаче (так делает `mutateAsync`); показать ошибку — забота вызывающего (общий `MutationCache` или `onError` мутации), здесь достаточно не запирать форму для повтора».
- `EGreenApiMethod` остаётся в `src/api/greenApi/_types.ts`. `docs/agents/architecture.md` (раздел «Путь данных») уточнён владельцем: только сервисы решают, какой метод GREEN-API вызвать и с каким телом; клиент знает хост, форму URL и набор имён методов (`enum`, которым типизирован запрос), но сам методы не выбирает.

### Phases 3, 5 — added 2026-10-05 (3)
**Trigger:** владелец: в `structure.md` добавлены раздел «Общий слой — сначала он, потом встроенный API» (обёртки над встроенными API и общие алиасы типов живут в `src/utils/` / `src/types/common.types.ts` с первого использования) и исключение «Заготовка под будущую фазу» (раздел фазы `**Provisioned for later phases**`). План написан до этих правил.
**Fix:**
- **Phase 3:**
  - `getEntries` переезжает из `src/hooks/useForm/_helpers.ts` в `src/utils/helpers/objectGetters.ts`, `TSetState` — из `src/hooks/useForm/_types.ts` в `src/types/common.types.ts`; `useForm` импортирует их оттуда. JSDoc обёртки — что заменяет и почему.
  - `src/utils/helpers/localStorage.ts` — `getLSItem(key, schema)` → `T | null` (`try/catch` + `JSON.parse` + zod `safeParse`; недоступное хранилище, битый JSON или чужая форма → `null`), `setLSItem(key, value)`, `removeLSItem(key)` (оба в `try/catch`: приватный режим Safari, запрет хранилища). Без `any` и непроверенных приведений. `src/api/session.ts` переходит на него; поведение сессии и её тесты не меняются.
  - **Provisioned for later phases:**

    | Символ | Фаза-потребитель | Как используется |
    |---|---|---|
    | `routerPaths.chat` | Phase 6 | роут `/chat/$chatId`, ссылки `ChatListItem` |
- **Phase 5:** `chats.cache.ts` работает с хранилищем через `getLSItem` / `setLSItem` (схема списка чатов — zod), не через `localStorage` напрямую.
  - **Provisioned for later phases:**

    | Символ | Фаза-потребитель | Как используется |
    |---|---|---|
    | `resetUnread` (`chats.cache.ts`) | Phase 6 | `_useChatPage` — сброс непрочитанных при открытии чата |
    | `applyLastMessage` (`chats.cache.ts`) | Phase 8, Phase 9 | снимок последнего сообщения при отправке и при входящем |
    | `formatMessageTime`, `getDayKey`, `formatDayLabel` (`dateFormat.ts`) | Phase 7 | время в пузыре, группировка и подписи разделителей дат |

### Phases 3, 6 — added 2026-10-05 (4)
**Trigger:** ревьюер (phase-3, iter-1, необязательные замечания) и владелец: текст ошибки поля лежит внутри `<label>` и подмешивается в доступное имя поля; поле с подписью и ошибкой нужно двум фичам (вход — Phase 3, «Новый чат» — Phase 6); ошибка входа стоит между полями и кнопкой; `"/login"` в `session.ts` захардкожен.
**Fix:**
- **Phase 3:**
  - `src/components/Input/` (`index.ts`, `_Input.tsx`, `_styles.ts`) — общее поле: проп `label` (видимая подпись, связанная с полем через `<label>`), проп `error: string | null`, остальные атрибуты `input` пробрасываются. Внутри — `id` от `useId()`; текст ошибки — **вне** `<label>`, отдельный элемент со своим `id`; у поля `aria-invalid` при ошибке и `aria-describedby` на элемент ошибки (только когда ошибка есть). Стиль ошибки и рамки — по `aria-invalid`. `font-size: 16px` (зум iOS). `LoginPage` переходит на него; поведение и тексты формы не меняются.
  - Ошибка входа (`submitError`) — **под** кнопкой «Войти», `role="alert"` сохраняется.
  - `signOut` берёт путь логина из `routerPaths.login` вместо литерала `"/login"` (цикла импортов нет: `_paths.ts` ничего не импортирует).
- **Phase 6:** поле номера в `NewChatPanel` — общий `Input` из `src/components/Input/`.

### Phase 3 — added 2026-10-05 (5)
**Trigger:** владелец (после phase-3, iter-2): `GreenApiError.message` пользователю не показывается нигде (тексты интерфейса выбираются по `kind` / `status` из словаря) — это отладочная строка; справочник человекочитаемых причин по `kind` избыточен.
**Fix:** заменяет пункт «текст причины выбирается исчерпывающе по `EGreenApiErrorKind`» из «Phase 3 — added 2026-10-05». `message` собирается из кодов: `GREEN-API <method>: <kind>` и ` <status>`, если статус есть (`GREEN-API getStateInstance: http 401`, `GREEN-API getChats: network`). Справочник причин удаляется. Токен в `message` по-прежнему не попадает.

### Phases 1, 3 — added 2026-10-05 (6)
**Trigger:** владелец: `declare module` смешан с логикой (`_theme.ts`, `_queryClient.ts`, `AppRouter.tsx`); объявления для компилятора — в `.d.ts` (правило добавлено в `typing.md`). Phase 1 п. 1 прямо требовал аугментацию «в этом же файле».
**Fix:** заменяет «аугментация `DefaultTheme` … в этом же файле» из Phase 1 п. 1. Каждая аугментация переезжает в свой `.d.ts` рядом с тем, что описывает: тема styled-components — рядом с `src/theme/_theme.ts`; `Register` TanStack Query (тип `meta` мутаций) — рядом с `src/app/_queryClient.ts`; `Register` TanStack Router — рядом с `src/routes/AppRouter.tsx`. Значения (`theme`-части, `router`) — через `import type`. Поведение и типы не меняются; делается в phase-3 (фаза не закоммичена).

### Phases 3, 4, 6 — added 2026-10-05 (7)
**Trigger:** ревьюер (phase-3, iter-5): (1) фабрики роутов в `_routes.tsx` принимают родителя как `AnyRoute` (перенято из образца recipe-book) — пути и id детей собираются из `any`, `reason` из `useSearch` логина — `any`, `navigate` / `redirect` с несуществующим путём или чужим `search` компилируются; (2) при `skipLibCheck: true` компилятор не проверяет и собственные `.d.ts`: сломанный импорт в `styled.d.ts` / `router.d.ts` молча превращает тему и роутер в `any`.
**Fix:**
- **Phase 3:** `createCommonRoutes` / `createProtectedRoutes` обобщены по родителю (`<TRoot extends AnyRoute>(rootRoute: TRoot)` и т. п.; тела и вызовы не меняются). Правило записано в `routing.md`. Проверка: `reason` — `ESignOutReason | undefined`; несуществующий путь в `navigate` и неверный `search` — ошибка компиляции.
- **Phase 3:** `skipLibCheck: false` в `tsconfig.app.json` (и в других tsconfig проекта, если они проверяют `src`); владелец разрешил devDependency `@types/stylis` для ошибок в типах `styled-components`. Если после этого остаются ошибки в чужих типах, которые `@types/stylis` не закрывает, — остановиться и сообщить, не обходить.
- **Уточнение 2026-10-05 (владелец, после phase-3 iter-6):** `skipLibCheck: false` **отменён** — с `@types/stylis` в типах `styled-components` остаётся TS2694 (`NodeJS.ReadWriteStream`), закрыть её можно только типами `node` в браузерном конфиге или заглушкой. `skipLibCheck: true` остаётся, `@types/stylis` не добавляется; объявления остаются в `.d.ts`, а в `typing.md` записана проверка: после правки `.d.ts` — `tsc --noEmit --skipLibCheck false` без ошибок в `src/`.
- **Phases 4, 6:** новые роуты (`MessengerLayout` + индексный роут, `/chat/$chatId`) добавляются в обобщённые фабрики; у `/chat/$chatId` типизированы путь и `params`. Внутри обобщённой фабрики `chatRoute.useParams()` не выводится (тип роута зависит от параметра-родителя — проверено на recipe-book: TS2339); компонент-обёртка роута читает параметры через `useParams({ from: <id роута> })` зарегистрированного роутера — тогда неверный id даёт ошибку компиляции.

### Phases 4–10 — added 2026-10-05 (8): сверка с фазами 1–3
**Trigger:** владелец попросил проверить, что будущие фазы учитывают правки фаз 1–3; аудит текста фаз 4–10 и общих таблиц против поправок, конвенций (`structure.md`, `typing.md`, `routing.md`, `architecture.md`) и кода фаз 1–3. Ниже — только то, что ещё не покрыто предыдущими поправками.
**Fix:**
- **Types and interfaces:** `IAccount.phone` — `string | null`; `username` в `IAccount` / `IContact` / `TCheckAccountResult` хранится без ведущего `@` (API присылает с `@`, сервис срезает), `@` добавляет UI; `IContact.name` — `name || contactName || "@" + username || "+" + phone || chatId`.
- **Conventions to follow:** + строковые `enum` вместо литеральных union (кроме пропсов) — `typing.md`; сначала общий слой (`src/utils/`, `src/types/common.types.ts`), потом встроенный API — `structure.md`; пути — только `routerPaths`; `declare` — в `.d.ts` с проверкой `tsc --skipLibCheck false` — `typing.md`; фабрики роутов обобщены — `routing.md`.
- **Phase 4:** `data-chat-open` и чтение `chatId` из параметров переносятся в Phase 6 (в её «Files to modify» добавляется `src/routes/layouts/MessengerLayout/_MessengerLayout.tsx`): пока роут `/chat/$chatId` не зарегистрирован, `useParams({ strict: false }).chatId` не компилируется (TS2339). В Phase 4 на мобильной видна только панель. Строка аккаунта в `AccountMenu` — `"@" + username`, иначе `"+" + phone`; оба `null` — строки нет (как при ошибке запроса).
- **Phase 5:** имя-фолбэк при сбое `getContact` — `chatId` (`getChatIds()` отдаёт только id, телефона нет).
- **Phase 6:**
  - роут — `path: routerPaths.chat` (заготовка Phase 3); `Link` в `ChatListItem` и `navigate` после создания чата — `to: routerPaths.chat, params: { chatId }`; редирект неизвестного чата и «назад» в `ChatHeader` — `routerPaths.home`, не литерал `"/"`.
  - `exists: false` → собственный класс ошибки по образцу `InstanceNotAuthorizedError` (`message` — код `GREEN-API checkAccount: notFound`); текст выбирает `_useNewChatForm` по классу / `kind` / `status` (как форма входа); мутация словарь не читает.
  - фолбэк-контакт из `checkAccount` получает `name` по той же цепочке, что `getContact`: `"@" + username` → `"+" + phone` → `chatId`; подзаголовок `ChatHeader` — `"@" + username`, иначе `"+" + phone`, оба `null` — без подзаголовка.
- **Phase 7:** `buildListItems` группирует по `getDayKey` из `dateFormat.ts` (заготовка Phase 5).
  - **Provisioned for later phases:**

    | Символ | Фаза-потребитель | Как используется |
    |---|---|---|
    | `updateMessages` (`messages.cache.ts`) | Phase 8, Phase 9 | локальная запись / замена / `FAILED` в `useSendMessageMutation`; `applyNotification` |
- **Phase 9:**
  - `typeMessage` уведомления сравнивается с существующим `ETypeMessage`, `status` у `outgoingMessageStatus` — с `EStatusMessage` (`messages.schema.ts`, члены добавляются при необходимости); новые `enum` — только `typeWebhook` и вид результата разбора. В `src/api/greenApi/_types.ts` добавляются `EGreenApiMethod.RECEIVE_NOTIFICATION` / `DELETE_NOTIFICATION` и `EHttpMethod.DELETE`.
  - `wait(ms, signal)` — обёртка над `setTimeout`, прерываемая сигналом, — в `src/utils/helpers/` (общий слой, JSDoc: что заменяет и почему), не внутри `_poller.ts`.
  - если понадобится проверка принадлежности значения к строковому `enum` — это второй потребитель после `isSignOutReason` (`_routes.tsx`): обобщённый guard в `src/utils/helpers/`, оба места переходят на него.
- **Phase 10:**
  - стаб различает HTTP-метод и путь (`deleteNotification` — `DELETE …/<receiptId>`, `receiveNotification` — `GET ?receiveTimeout=`), отдаёт `username` с ведущим `@` (`checkAccount`, `getContactInfo`), `getChats` — без `type`; `checkAccount` умеет `exist: false`, 200 `{status: false, data: {reason: "rate_limit_exceeded"}}` и HTTP 469. Имена методов в стабе сравниваются с `EGreenApiMethod`, а не с голыми строками (как импортировать без алиаса `@/` — решить при реализации).
  - + сценарии: ошибки нового чата (`newChat.notFoundError` / `rateLimitError` / `searchRestrictedError`); 466 при отправке (`sendErrors.quota`) и входящее `extendedTextMessage` — их обещают «Assumptions to confirm».
  - `e2e/*.ts` и `playwright.config.ts` проверяются `tsc` (свой tsconfig или включение в существующий), иначе `pnpm build` их типы не видит.
- **Решения владельца (2026-10-05):**
  - **Phases 4, 8 — клавиши.** Сравнения `event.key` — с членами строкового `enum` клавиш в общем слое (например, `EKeyboardKey` в `src/types/common.types.ts` или рядом с хелперами клавиатуры — по лестнице `structure.md`), не с голыми `"Escape"` / `"Enter"`. Заводит его Phase 4 (`ESCAPE`) — первый потребитель; Phase 8 добавляет `ENTER`.
  - **Phase 6 — ошибка мутации «Новый чат».** Как на входе (поправка (4)): в `error` у `Input` — только ошибка валидации поля; ошибка запроса (`notFound` / лимиты / прочее) — отдельный элемент с `role="alert"` **под** кнопкой `newChat.submitButton`. Заменяет «ошибка мутации — под полем» из Phase 6 п. 2.

### Phases 4–9 — added 2026-10-05 (9): папка `src/layouts/`
**Trigger:** ревьюер (phase-4, iter-1): `Sidebar` (один потребитель — каркас) лежал в `src/components/`, `NoChatSelected` (экран индексного роута) — в `src/routes/layouts/`; это противоречило лестнице `structure.md` и `routing.md`. Владелец: каркасы layout-роутов — в отдельной папке `src/layouts/`, устроенной как страницы; `_internal/` — не глубже двух уровней (правила записаны в `structure.md` и `routing.md`). Плюс находка `[code]` iter-1 и необязательные замечания.
**Fix:** пути ниже заменяют пути из таблиц «Files to create / Files to modify» и текста фаз.
- **Phase 4:**
  - `src/routes/layouts/MessengerLayout/` → `src/layouts/MessengerLayout/` (`index.ts`, `_MessengerLayout.tsx`, `_styles.ts`); `src/routes/layouts/` удаляется.
  - `src/components/Sidebar/` → `src/layouts/MessengerLayout/_internal/Sidebar/`; `AccountMenu` → `src/layouts/MessengerLayout/_internal/Sidebar/_internal/AccountMenu/`.
  - `_NoChatSelected.tsx` → страница `src/pages/HomePage/` (`index.ts`, `_HomePage.tsx`, `_styles.ts`); индексный роут `/` рендерит `HomePage`.
  - `AccountMenu`: при открытии фокус переходит внутрь меню (выпадающий блок с `tabIndex={-1}` фокусируется ref-callback'ом при монтировании, без `useEffect`), чтобы `Escape` закрывал меню и в Safari / Firefox на macOS, и после клика по тексту меню; меню закрывается и когда фокус уходит за его пределы (`onBlur` корня, `relatedTarget` вне меню).
  - Ключ `app` (`app.title`) удаляется из `public/dictionaries/ru.json` и интерфейса `I18n` — после ухода заглушки Phase 3 он не используется.
- **Phase 5:** `ChatListItem` → `src/layouts/MessengerLayout/_internal/Sidebar/_internal/ChatListItem/`; правка тела панели — в `src/layouts/MessengerLayout/_internal/Sidebar/_Sidebar.tsx`.
- **Phase 6:** `NewChatPanel` → `src/layouts/MessengerLayout/_internal/Sidebar/_internal/NewChatPanel/`; правки `Sidebar` и `ChatListItem` — по новым путям; `data-chat-open` (поправка (8)) — в `src/layouts/MessengerLayout/_MessengerLayout.tsx`.
  - Иконки: с `PencilIcon` / `BackIcon` обёртка `<svg …>` повторяется четыре раза — внутренняя (неэкспортируемая) база в `src/components/icons/`, принимающая `d`.
  - Круглая кнопка-иконка 44×44 (сейчас `SMenuButton` в `AccountMenu/_styles.ts`) нужна карандашу, «назад» в `NewChatPanel` и `ChatHeader` — второй потребитель в другой фиче: поднять в общий компонент `src/components/`, а не копировать.
- **Phase 7:** пилюля (сейчас в `src/pages/HomePage/_styles.ts`) становится и разделителем дат в `MessageList` — второй потребитель в другой фиче: поднять в общий компонент `src/components/`.
- **Phase 9:** `_useMessengerLayout.ts` → `src/layouts/MessengerLayout/_useMessengerLayout.ts`, правка — `src/layouts/MessengerLayout/_MessengerLayout.tsx`; `SettingsWarning` → `src/layouts/MessengerLayout/_internal/Sidebar/_internal/SettingsWarning/`; правка `Sidebar` — по новому пути.

## Known issues
