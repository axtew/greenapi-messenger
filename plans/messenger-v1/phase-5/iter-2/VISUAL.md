STATUS: APPROVED
Issue source: none

## Summary
В браузере прогнаны четыре строки Visual Verification фазы 5 и постоянная строка `raw_values_in_ui`. Использована одна свежая синхронизация: чистый localStorage, затем вход через форму, ушёл один `getContactInfo`. Все строки PASS, консоль чистая. Запросы синхронизации идут строго по очереди. После перезагрузки список появляется в DOM раньше первого ответа GREEN-API, `getContactInfo` при этом не вызывается.

## Visual Verification
STATUS: PASSED

| check_id | dependency_group | status | evidence | blocker_check_id | root_cause_scope | contrast_with |
| --- | --- | --- | --- | --- | --- | --- |
| raw_values_in_ui | independent | PASS | Тексты панели на `/` (1440 и 390): `Чаты`, `Artur Ovcharenko`, `вс`, `Приветствую!`; aria-label `Меню`; у `img` аватара `alt=""`. Имя совпадает с `name` в сыром ответе `getContactInfo` (`contactName` там `""`), превью — с `textMessage` в сыром ответе `getChatHistory`. `вс` — это `formatChatListTime` для `timestamp 1791100144`: вс 04.10.2026 14:49 при «сейчас» пн 05.10.2026 22:13 (UTC+7), попадает в правило «последние 7 дней → день недели». Ключей словаря, `undefined` / `null` / `NaN` / `[object` нет. Во время скелетонов тело панели без текста. `<title>` `GREEN-API Messenger` | | item_specific | |
| list_synced | sync | PASS | localStorage до входа пуст (`[]`, sessionStorage тоже). Форма входа заполнена helper-ом, затем реальный клик `Войти` → `/`. Через ~3 с в `aside ul` одна строка: имя `Artur Ovcharenko`, время `вс`, превью `Приветствую!`. Чат — `<test_chat_id>`: тело запросов `getContactInfo` / `getChatHistory` равно `GREEN_API_TEST_CHAT_ID`. Сеть (мс от старта `getStateInstance`): `getStateInstance` GET 200 0–1165 → `getChats` GET 200 1178–1481 → `getContactInfo` POST `{chatId:<test_chat_id>}` 200 1482–2417 → `getChatHistory` POST `{chatId:<test_chat_id>,count:1}` 200 2418–3009. Запросы синхронизации не перекрываются. `getAccountSettings` (1177–2795) идёт параллельно, это отдельный запрос меню аккаунта из фазы 4. Сырой `getChats`: 1 запись, `chatId > 0`, это тестовый чат. Состояния панели: с 1182 мс 3 строки-скелетона (9 анимированных элементов = 3 × (круг + 2 полосы), текста нет), с 3017 мс одна строка списка. Пустое состояние между ними не появлялось. Консоль 0 errors / 0 warnings | | shared | |
| list_from_storage | sync | PASS | (1) `goto /` в той же сессии: сразу после загрузки в списке `Artur Ovcharenko · вс · Приветствую!`. Resource timing: `getChats` 200 233–531 → `getChatHistory` 200 532–874, плюс `getAccountSettings` 200 232–818. **`getContactInfo` нет**, `getStateInstance` тоже нет. За следующие 6 с новых запросов не было. FCP 224 мс. (2) Время первого кадра со списком замерено во втором окне той же сессии (`window.open("/")`, DOM опрашивался из окна-открывателя раз в ~1 мс): `aside ul > li` появился на **218 мс**, первый ответ GREEN-API пришёл на 519 мс (`getChats`). `aside` без списка (скелетоны / пустое состояние) не встречался ни разу. Запросы те же: `getChats` → `getChatHistory`, без `getContactInfo`. Синхронизация на каждой загрузке ожидаема (`initialDataUpdatedAt: 0`, поправка (11)) | | item_specific | |
| avatar_rendered | item | PASS | Живые данные: аватар 54×54 в (35,91), `border-radius 9999px`, `overflow hidden`, `aria-hidden="true"`. Внутри `img` с `api.green-api.com`, `complete`, natural 640×640, `object-fit: cover`, `alt=""`. Сырой `avatar` из `getContactInfo` — URL длиной 115 символов. Имя латиницей, поэтому кириллицу проверил отдельной пробой: в сохранённом списке временно заменил `name` на `Иван Петров`, `avatarUrl` — на недоступный URL, открыл второе окно. `onError` → `img` нет, текст `ИП`, 54×54, фон `rgb(250,167,116)` (тот же, что под фото: цвет считается от chatId), текст `rgb(255,255,255)` 20px / 500, центр текста совпадает с центром круга (dx 0, dy 0). Исходная запись восстановлена побайтно (`restored: true`), `getContactInfo` проба не вызывала | | item_specific | |
| mobile_list | layout | PASS | 390×844 (visualViewport 390.4, DPR-артефакт хоста, как в фазе 4). `aside` 390.4×844 в (0,0), radius 0, у `main` `display: none`, `scrollWidth` 390, горизонтального скролла нет. Шапка 390.4×64. Тело 390.4×780, `padding: 0 8px 8px`. `ul` / строка 374.4×72 в (8,64), аватар 54 в (17,73). Время `вс` прижато справа: правый край 373.5 = 382.4 − 9 (padding). Как в `04-mobile-list.png`: строка во всю ширину, аватар слева, имя / превью, время справа сверху | | item_specific | |

```yaml
verdict:
  matrix:
    - check_id: raw_values_in_ui
      dependency_group: independent
      status: PASS
      evidence: "тексты панели: Чаты / Artur Ovcharenko / вс / Приветствую!; имя и превью совпадают с сырыми getContactInfo.name и getChatHistory.textMessage; «вс» верно для timestamp вчерашнего дня; сырых ключей, null/undefined/NaN нет"
      root_cause_scope: item_specific
    - check_id: list_synced
      dependency_group: sync
      status: PASS
      evidence: "чистый localStorage → вход формой → 1 чат <test_chat_id> с именем, превью, временем; getChats 200 → getContactInfo 200 → getChatHistory(count 1) 200 строго последовательно; 3 скелетона ~1.8 с до списка; консоль 0/0"
      root_cause_scope: shared
    - check_id: list_from_storage
      dependency_group: sync
      status: PASS
      evidence: "перезагрузка: список в DOM на 218 мс, первый ответ API на 519 мс; запросы getChats + getChatHistory (+ getAccountSettings), getContactInfo нет; скелетонов и пустого состояния нет"
      root_cause_scope: item_specific
    - check_id: avatar_rendered
      dependency_group: item
      status: PASS
      evidence: "живой аватар — img 54x54 круг, загружен (640x640); проба через хранилище: битый URL + «Иван Петров» → инициалы «ИП» по центру, белый 20px/500 на цвете от chatId; данные восстановлены"
      root_cause_scope: item_specific
    - check_id: mobile_list
      dependency_group: layout
      status: PASS
      evidence: "390x844: aside во всю ширину, radius 0, main скрыт, без горизонтального скролла; строка 374.4x72 с отступом 8px, время справа"
      root_cause_scope: item_specific
  blockers: []
  overgeneralization_risk: false
  ready_to_escalate: true
```

**Хранимый список** — ключ `greenapi-messenger:chats:<id>`; рядом лежит только `greenapi-messenger:session`. Форма записи (id и телефон скрыты):

```json
[
  {
    "chatId": "<test_chat_id>",
    "name": "Artur Ovcharenko",
    "phone": "<digits 11>",
    "username": "stevvy1122",
    "avatarUrl": "<url https://4100.api.green-api.com…>",
    "lastMessage": { "text": "Приветствую!", "timestamp": 1791100144, "direction": "outgoing" },
    "unreadCount": 0,
    "isProfileLoaded": true
  }
]
```

## Design verification
STATUS: PASSED

- Строка списка (десктоп) — Reference: `docs/design/02-wide-chat.png`, `docs/design/06-unread-badge.png` → PASSED. Числа при 1440×900:
  - строка 404×72 в (26,82), flex, `gap 12px`, `padding 9px`, `min-height 72px`, `border-radius 12px`, тег `DIV` (так и задумано до Phase 6);
  - аватар 54×54 слева;
  - имя `H3` 16px / 500 / 21.6px, чёрное, одна строка (`overflow hidden`, `text-overflow ellipsis`, `nowrap`);
  - превью `B1` 16px / 400 / 22.4px `rgb(112,117,121)`, одна строка с многоточием;
  - время `Caption` 12px / 400 `rgb(112,117,121)` справа сверху: правый край 421.1 = 430 − 9.

  Многоточие и бейдж проверены пробой через хранилище, данные потом восстановлены. Длинное имя: `scrollWidth` 520 > `clientWidth` 282, высота 21.6 (одна строка). Длинное превью: 752 > 274. При `unreadCount 150` бейдж `99+` стоит справа снизу: 37.7×22.4 в (383.3,118.6), правый край 421 совпадает с правым краем времени. `min-width 22px`, `padding 1px 7px`, `radius 9999px`, фон `rgb(79,174,78)`, текст белый 14px / 400. Время сегодняшнего сообщения — `22:13` (HH:mm). У живого тестового чата `unreadCount 0`, бейджа нет. Это совпадает с сырыми данными: синхронизация непрочитанные не считает (`incrementUnread: false`).
- Мобильный список — Reference: `docs/design/04-mobile-list.png` → PASSED (см. `mobile_list`). Строки поиска и FAB-карандаша из референса в фазе 5 нет по плану: карандаш появится в Phase 6, поиск в план не входит.
- Скелетоны / пустое состояние / ошибка синхронизации — Free choice → не проверяются (скелетоны записаны как наблюдение в `list_synced`).

## Notes
- **Квота.** За весь прогон `getContactInfo` вызван **1 раз**: при единственной свежей синхронизации. На перезагрузке и в трёх пробных окнах его не было: профиль загружен, `isProfileLoaded: true`. `checkAccount` не вызывался. Каждая загрузка страницы делает `getChats` + `getChatHistory` по каждому чату (сейчас 1) — так и задумано: данные из хранилища считаются устаревшими.
- **Пробы через хранилище** (кириллица, битый URL, длинные строки, `unreadCount 150`) — не шаг плана. Это дополнительная проверка веток, которых живые данные не покрывают. Каждый раз запись бралась как есть, подменялась в localStorage, открывалось второе окно, после замера исходная строка возвращалась и сравнивалась побайтно (`restored: true`). Исходный код не менялся.
- **Сырой `getChats`** на этом инстансе отдаёт записи с полями `chatId, name, type, phoneNumber, username`. Комментарий в `chats.schema.ts` говорит, что поля `type` нет, — сейчас оно есть. На поведение это не влияет: схема берёт только `chatId`, отбор личных чатов идёт по знаку id. Сообщаю как наблюдение, не как дефект.
- **Перепроверка из phase-4 (Tab из «Выйти»)** в фазе 5 по-прежнему невозможна: элементы списка — `div`, не фокусируемые. Проверка перенесена в Phase 6 поправкой (10) (`account_menu_tab_out`).
- **Креды.** Их передавал одноразовый helper на `127.0.0.1:5199`: читал `.env.local`, использован один раз. Поля заполнялись через native value setter с событием `input`, `Войти` нажималась реальным кликом. Заполненную форму snapshot не снимал. Токен и idInstance не попали ни в аргументы инструментов, ни в отчёт; chatId скрыт как `<test_chat_id>`.
- **Teardown.** `localStorage` / `sessionStorage` очищены, браузер закрыт. Dev-сервер `:5173` и helper `:5199` остановлены, порты свободны. `.playwright-mcp/` и скрипт helper-а удалены.
