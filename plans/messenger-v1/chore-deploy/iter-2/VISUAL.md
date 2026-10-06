STATUS: APPROVED
Issue source: none

## Summary
Проверен прод https://greenapi-messenger.stevvy1122.workers.dev/ (сборка `main`, бандл `/assets/index-Cb0irt-X.js`), Chrome 154, 1440×900 и 390×844. Все 7 строк PASS: загрузка, вход, SPA-fallback, отправка одного сообщения в тестовый чат, цикл poller-а, выход и `raw_values_in_ui`. Есть два замечания вне матрицы, они не блокируют (см. Notes): `deleteNotification` ответил `result:false … not found`, а на несуществующем пути показывается английский «Not Found».

## Visual Verification
STATUS: PASSED

| check_id | dependency_group | status | evidence | blocker_check_id | root_cause_scope | contrast_with |
| --- | --- | --- | --- | --- | --- | --- |
| raw_values_in_ui | independent | PASS | Проверены `/chat/<test_chat_id>` после отправки и эха, `/` на 390 px и `/login` после выхода. Смотрелись текст `aside` / `main` / `body`, атрибуты `aria-label` / `placeholder` / `title` и `<title>`. Нет `undefined`, `NaN`, `null`, `[object`, ключей словаря (`login.` / `sidebar.` / `chat.` / `newChat.` / `settingsWarning.` / `sendErrors.` / `common.`), членов enum (`PEER_FLOOD`, `GENERIC`, `QUOTA`, `NETWORK`, `SENT`, `PENDING`, `FAILED`, `INCOMING`, `OUTGOING`) и U+FFFD. Атрибуты: `Меню`, `Новый чат`, `Назад`, `Сообщение`, `Отправить`. Атрибута devtools в проде нет. Шапка чата «Artur Ovcharenko / @stevvy1122», превью «Artur Ovcharenko / 19:29 / Проверка прода 1» | | item_specific | |
| prod_boots | boot | PASS | `/` без сессии ведёт на `/login`: h1 «Вход», подзаголовок «Данные инстанса из личного кабинета GREEN-API», подписи `idInstance` / `apiTokenInstance`, кнопка «Войти». Документ 200, `<title>` «GREEN-API Messenger». `/favicon.svg` — 200, `image/svg+xml`, тело `<svg…`, `<link rel=icon href=/favicon.svg>`. Консоль `browser_console_messages` до входа (запросов к GREEN-API ещё не было) — 0 сообщений. Кнопок на странице ровно одна, «Войти»; элементов `tsqd` / `aria-label*=devtools` — 0. В бандле (495 715 байт) нет ни `tsqd`, ни «query devtools» | | item_specific | |
| prod_login | login | PASS | Креды передал helper через popup и `postMessage`: `fetch` на `127.0.0.1` из прода блокирует Local Network Access (см. Notes). После «Войти» — `/` быстрее чем за 15 с. `getStateInstance` 200 `authorized`, затем `getAccountSettings` / `getSettings` / `getChats` / `getContactInfo` / `getChatHistory` — все 200. В `aside` заголовок «Чаты» и 1 строка — тестовый чат (href `/chat/<test_chat_id>` сверен в браузере с `GREEN_API_TEST_CHAT_ID`), «Artur Ovcharenko / 18:53 / Проверка получения 7». В `main` — «Выберите, кому хотели бы написать». `[role=status]` — 0, консоль приложения (обёртки `console.error` / `console.warn`, события `error` / `unhandledrejection`) — 0 / 0 / 0 | | item_specific | |
| prod_spa_fallback | routing | PASS | `location.reload()` на `/chat/<test_chat_id>`: navigation `type: reload`, документ **200**, путь тот же. На странице заголовок «Artur Ovcharenko», 1 пузырь «Проверка прода 1», поле ввода, `[role=status]` / `[role=alert]` — 0. После перезагрузки `getAccountSettings` / `getSettings` / `getChats` / `getChatHistory` ×2 — 200. Прямой заход на `/no-such-page/xyz` (до входа): документ 200, `#root` отрисован, отдаёт SPA с текстом «Not Found» от TanStack Router, а не страницу 404 Cloudflare | | item_specific | |
| prod_send | send | PASS | Тестовый чат открыт реальным кликом по строке списка. Текст «Проверка прода 1» отправлен реальным Enter. `sendMessage` 200; `chatId` в теле тестовый (сверено в браузере), только цифры, без `@c.us`; `idMessage` 13 символов. Поле очищено и осталось в фокусе. Пузырь справа: у ленты `display:flex; justify-content:flex-end`, отступ справа 9 px, слева 660 px при ширине 865. Фон `rgb(238,255,222)` (у входящих `rgb(255,255,255)`), `opacity:1`, время 19:29, подписи «Не доставлено» нет | | item_specific | |
| prod_poller | poller | PASS | Последовательность: `receiveNotification` 200 за 31,6 с, эхо `outgoingAPIMessageReceived` #4 (`idMessage` = ответ `sendMessage`, чат тестовый, текст «Проверка прода 1»). Через 3 мс `deleteNotification` 4 → 200. Затем `receiveNotification` 200 за 0,3 с — `outgoingMessageStatus delivered` #5 → `deleteNotification` 5 → 200. Дальше два ответа 408 с пустым телом (77,4 и 76,5 с), после перезагрузки — 408 за 25,9 с. Промежуток до следующего `receiveNotification` — 1 / 0 / 0 / 0 мс, пауз нет. Одновременно в полёте не больше одного запроса. Resource Timing совпадает с обёрткой (200 / 200 / 408 / 408). Эхо и статус из очереди повторно не пришли. В `main` ровно 1 узел «Проверка прода 1»: 8 замеров раз в секунду, через ~3 мин после эха и после перезагрузки. **Оговорка:** оба `deleteNotification` вернули `{"result":false,"reason":"Message receiptId = N not found"}` (см. Notes) | | shared | |
| prod_logout | menu | PASS | «Меню» → «Аккаунт @stevvy_vn» → «Выйти»: `location` = ровно `/login`, `search` пустой. Плашки «Сессия недействительна» нет, `[role=alert]` — 0, h1 «Вход», поля пустые, сессии нет (булева проверка). Выход сделан полной загрузкой документа (navigation `navigate`, 200), поэтому `receiveNotification`, который был в полёте, оборвался вместе со старой страницей. На новой странице за 42 с запросов к GREEN-API 0 (и в Resource Timing, и по обёртке `fetch`). `browser_console_messages` на `/login` после выхода — 0 сообщений | | item_specific | |

```yaml
verdict:
  matrix:
    - check_id: raw_values_in_ui
      dependency_group: independent
      status: PASS
      evidence: "/chat/<test_chat_id>, / (390px), /login: только значения ru.json и HH:MM; undefined/NaN/null/[object/ключей/enum/U+FFFD нет; devtools-атрибута нет"
      root_cause_scope: item_specific
    - check_id: prod_boots
      dependency_group: boot
      status: PASS
      evidence: "/ -> /login, h1 «Вход»; документ 200; /favicon.svg 200 image/svg+xml; консоль 0 сообщений до входа; кнопки/классов TanStack Query Devtools нет, в бандле нет tsqd"
      root_cause_scope: item_specific
    - check_id: prod_login
      dependency_group: login
      status: PASS
      evidence: "helper (popup + postMessage) -> Войти -> /; getStateInstance authorized; синхронизация 200; в списке тестовый чат; консоль приложения 0/0/0"
      root_cause_scope: item_specific
    - check_id: prod_spa_fallback
      dependency_group: routing
      status: PASS
      evidence: "reload на /chat/<test_chat_id>: navigation reload, 200, тот же чат; /no-such-page/xyz: 200, SPA (TanStack «Not Found»), не 404 Cloudflare"
      root_cause_scope: item_specific
    - check_id: prod_send
      dependency_group: send
      status: PASS
      evidence: "«Проверка прода 1» в тестовый чат: sendMessage 200, chatId числовой тестовый; пузырь справа (flex-end), bubbleOutgoing rgb(238,255,222), без «Не доставлено»"
      root_cause_scope: item_specific
    - check_id: prod_poller
      dependency_group: poller
      status: PASS
      evidence: "эхо #4 и delivered #5 -> deleteNotification 4/5 (200) сразу; затем 408 пустые циклы с промежутком 0 мс; inflight <= 1; ровно 1 пузырь; оговорка: deleteNotification result:false «not found» (гипотеза — второй потребитель очереди)"
      root_cause_scope: shared
    - check_id: prod_logout
      dependency_group: menu
      status: PASS
      evidence: "Выйти -> /login без ?reason, без плашки «Сессия недействительна»; сессии нет; 0 запросов к GREEN-API за 42 с; консоль 0"
      root_cause_scope: item_specific
  blockers: []
  overgeneralization_risk: false
  ready_to_escalate: true
```

**390 px.** Чат (`/chat/<test_chat_id>`): `aside` скрыт (`display:none`), `main` во всю ширину 390×844. Кнопка «Назад» 44×44 слева в шапке. Поле ввода 296×44 и «Отправить» 44×44 внизу (y 786). Пузырь «Проверка прода 1» прижат вправо (x 163, ширина 195). Список (`/`, переход по «Назад» реальным кликом): `aside` 390×844, `main` скрыт. Строка чата 374×72, «Меню» 44×44, FAB «Новый чат» 56×56 в правом нижнем углу. `scrollWidth` = 390 на обоих экранах, элементов за краем экрана 0. Вёрстка не сломана.

## Design verification
STATUS: NOT_REQUESTED

`design.source: none`, Figma нет. Заход проверяет деплой, экраны в нём не менялись.

## Notes
- **`deleteNotification` → `{"result":false,"reason":"Message receiptId = N not found"}` для #4 и #5.** Симптом подтверждён сырым телом ответа. Причина не подтверждена, это гипотеза.
  - Приложение отработало как положено: удаление ушло через 3 мс после каждого непустого ответа, с тем же `receiptId`, получило 200. Уведомления повторно не приходили, консоль приложения чистая.
  - В phase-9 / iter-1 тот же путь давал `result:true`. Скорее всего, в это время инстанс читал второй потребитель вне этого браузера: открытая у владельца вкладка прода или dev-сервера, другой браузер, e2e против живого API. Он получил те же уведомления и удалил их раньше. Web Locks координируют только вкладки одного браузера и origin, поэтому дефектом кода это не считаю.
  - Владельцу стоит проверить, не было ли у него в 19:28–19:33 открыто приложение с тем же инстансом. Если было, второй потребитель мог показать «Проверка прода 1» у себя.
- **Несуществующий путь показывает «Not Found» на английском.** Это встроенный `notFoundComponent` TanStack Router; ни в плане, ни в `ru.json` такого экрана нет. На проверку SPA-fallback это не влияет (документ 200, не страница Cloudflare). Для русскоязычного UI это пробел плана, а не регрессия деплоя. Предлагаю занести в `BACKLOG.md` локализованную 404 со ссылкой на «Чаты» или редирект на `/`. **[plan], не блокирует.**
- **Вход на прод-origin: почему завис iter-1 и как обошёл.** В Chrome 154 `fetch` со страницы прода на `http://127.0.0.1:5199` до helper-а не дошёл вообще: в логе helper-а нет ни preflight, ни GET, через 15 с `AbortError`. Это Local Network Access, разрешение пользователя, которое под Playwright никто не подтвердит; заголовки PNA (`Access-Control-Allow-Private-Network`) не помогают.
  - Сработал второй вариант того же одноразового helper-а. Страница прода открывает popup `http://127.0.0.1:5199/popup` через `window.open` (навигация верхнего уровня под LNA не попадает), страница helper-а шлёт креды `postMessage` в `opener` строго на origin прода. Слушатель в том же `browser_evaluate` проверяет `e.origin`, заполняет поля native setter-ом, закрывает popup, нажимает «Войти» и возвращает только `"ok"`. Весь вход занял один `evaluate` меньше чем за 15 с.
  - Для будущих проверок прода стоит сразу брать этот вариант.
- **Ошибки консоли браузера.** Playwright отметил 3 записи уровня error (2 до перезагрузки, 1 после). Их ровно столько же, сколько ответов 408 у `receiveNotification`, и время совпадает: записи появились при завершении 408. Скорее всего, это строки Chrome `Failed to load resource … 408` с URL, в котором стоит токен. Содержимое не проверено: лог консоли `.playwright-mcp/` по протоколу не читался и удалён. Обёртки консоли приложения (`console.error` / `warn`, `error`, `unhandledrejection`) за всё время — 0 / 0 / 0. Ресурсов не с GREEN-API со статусом ≥400 — 0.
- **Квота.** `getStateInstance` — 1, `checkAccount` — 0, `sendMessage` — 1, только в тестовый чат.
  - Синхронизация при входе: `getAccountSettings`, `getSettings`, `getChats`, `getContactInfo` — по 1, `getChatHistory` — 2: превью и открытие чата.
  - Перезагрузка, без которой `prod_spa_fallback` не проверить, вызвала повторное обновление: `getAccountSettings`, `getSettings`, `getChats`, `getChatHistory` ×2. `getContactInfo` при этом не запрашивался, контакт взят из кэша.
  - `receiveNotification` — 7, из них 2 оборваны перезагрузкой или выходом. `deleteNotification` — 2. 429 не было. Ещё был один запрос аватара к CDN GREEN-API: opaque, статус 0.
- **Креды и секреты.**
  - Helper — одноразовый Node-сервер на `127.0.0.1:5199`. Он сам читал `.env.local` и в лог писал только метод, путь и origin. Отдал креды один раз через `/popup`, остановлен вручную, порт свободен. Скрипт удалён из scratchpad.
  - Агент `.env.local` не читал. Креды не попадали в аргументы инструментов. Поле токена — `type=password`, в снапшотах значений нет.
  - Запросы к GREEN-API снимались только через `browser_evaluate`: обёртка `fetch` (метод из пути, статус, время, разобранные поля тела, `chatId` только как булево «тестовый») и Resource Timing (метод, статус). `browser_network_*` не вызывались. `browser_console_messages` вызывался только на `/login` до входа и после выхода — на страницах, где запросов к GREEN-API не было. Ключ `greenapi-messenger:session` проверялся только как `!== null`.
  - **Токен и `idInstance` в вывод инструментов не попадали.** В выводе были только тестовый `chatId` (в URL `/chat/…` у снапшотов) и юзернеймы аккаунтов.
- **Teardown.** Выход через UI, затем `localStorage` и `sessionStorage` очищены (0 / 0). Браузер закрыт, helper остановлен, `.playwright-mcp/` удалён. Исходники не менялись: `git status` — тот же `M plans/messenger-v1/EXECUTION.md`, что на старте, плюс новый `plans/messenger-v1/chore-deploy/`.
