STATUS: APPROVED
Issue source: none

## Summary
Перепроверены `list_from_storage`, `avatar_rendered` и постоянная строка `raw_values_in_ui`; `list_synced` и `mobile_list` перенесены из iter-2 (PASS). Обе дополнительные пробы итерации прошли. (a) Многоточие стоит на самом текстовом `span` и рисуется его цветом и начертанием. (b) При пустом списке и ошибке синхронизации видна только подпись `sidebar.syncError`. `getContactInfo` за весь прогон не вызывался ни разу.

## Visual Verification
STATUS: PASSED

| check_id | dependency_group | status | evidence | blocker_check_id | root_cause_scope | contrast_with |
| --- | --- | --- | --- | --- | --- | --- |
| raw_values_in_ui | independent | PASS | Тексты `aside` на `/` (1440×900): `Чаты`, `AO`, `Artur Ovcharenko`, `вс`, `Приветствую!`; единственный aria-label — `Меню`. Превью и время пришли из живого `getChatHistory`: сохранённая запись после синхронизации — `lastMessage {text "Приветствую!", timestamp 1791100144, direction outgoing}`. `вс` — `formatChatListTime` для вс 04.10.2026 при «сейчас» 05.10.2026. Ключей словаря, `undefined` / `NaN` / `[object` в текстах нет. `<title>` `GREEN-API Messenger`. Проба (b): текст тела панели — ровно `Не удалось обновить список чатов` (значение `sidebar.syncError` из `ru.json`), а не ключ | | item_specific | |
| list_synced | sync | PASS | iter-2 (`phase-5/iter-2/VISUAL.md`), не перепроверялось: свежая синхронизация расходует `getContactInfo`. В этой итерации вход формой с засеянным хранилищем дал `getStateInstance` 200 → `getChats` 200 → `getChatHistory` 200, `getContactInfo` нет; в списке 1 строка `Artur Ovcharenko · вс · Приветствую!` | | shared | |
| list_from_storage | sync | PASS | (1) `goto /` в той же сессии: сразу после загрузки в списке `AO · Artur Ovcharenko · вс · Приветствую!`. Resource timing: `getAccountSettings` 200 204–493, `getChats` 200 204–491 → `getChatHistory` 200 492–787. **`getContactInfo` нет**, `getStateInstance` нет. FCP 180 мс. (2) Второе окно той же сессии (`window.open("/")`, DOM опрашивался из окна-открывателя раз в ~1 мс): `aside ul > li` появился на **232 мс**, первый ответ GREEN-API (`getChats`) — на 515 мс. Пустое состояние до списка не появлялось. Запросы те же: `getChats` → `getChatHistory`, `getContactInfo` нет. Синхронизация идёт через `client` из `QueryFunctionContext` (изменение iter-3): результат записался в кэш и в localStorage (`lastMessage` обновлён) | | item_specific | |
| avatar_rendered | item | PASS | Живая строка (засеяна без `avatarUrl`): аватар `DIV aria-hidden="true"` 54×54, `border-radius 9999px`, `overflow hidden`, фон `rgb(250,167,116)`, текст `AO` `rgb(255,255,255)` 20px / 500; центр текста (Range) совпадает с центром круга (dx 0, dy 0). Проба через хранилище, кириллица: `name "Иван Петров"` и недоступный `avatarUrl` → `onError` → `img` нет, текст **`ИП`**, 54×54, тот же цвет от chatId, белый 20px / 500, по центру. Проба через хранилище, картинка: `avatarUrl = <origin>/favicon.svg` → `img` 54×54, `complete`, natural 150×150, `object-fit: cover`, `alt=""`, круг 9999px. В пробных окнах `getContactInfo` 0. Исходная запись восстановлена побайтно (`restored: true`). Проба (a) — длинное имя и превью — тоже здесь, см. «Design verification» | | item_specific | |
| mobile_list | layout | PASS | iter-2 (`phase-5/iter-2/VISUAL.md`), не перепроверялось: раскладка в iter-3 не менялась. 390×844: `aside` во всю ширину, radius 0, `main` скрыт, без горизонтального скролла | | item_specific | |

```yaml
verdict:
  matrix:
    - check_id: raw_values_in_ui
      dependency_group: independent
      status: PASS
      evidence: "тексты панели: Чаты / AO / Artur Ovcharenko / вс / Приветствую!; превью и время из живого getChatHistory; в пробе (b) текст syncError из словаря; ключей, undefined и NaN нет"
      root_cause_scope: item_specific
    - check_id: list_synced
      dependency_group: sync
      status: PASS
      evidence: "iter-2 (phase-5/iter-2/VISUAL.md), перенесено без перепроверки (квота getContactInfo)"
      root_cause_scope: shared
    - check_id: list_from_storage
      dependency_group: sync
      status: PASS
      evidence: "перезагрузка: список в DOM на 232 мс, первый ответ API на 515 мс; getChats + getChatHistory (+ getAccountSettings), getContactInfo нет; пустого состояния до списка нет; FCP 180 мс"
      root_cause_scope: item_specific
    - check_id: avatar_rendered
      dependency_group: item
      status: PASS
      evidence: "инициалы AO 54x54 по центру, белый 20/500; проба «Иван Петров» с битым URL → ИП; проба с /favicon.svg → img 54x54 cover, alt пустой; данные восстановлены побайтно"
      root_cause_scope: item_specific
    - check_id: mobile_list
      dependency_group: layout
      status: PASS
      evidence: "iter-2 (phase-5/iter-2/VISUAL.md), перенесено: 390x844, список во всю ширину"
      root_cause_scope: item_specific
  blockers: []
  overgeneralization_risk: false
  ready_to_escalate: true
```

## Design verification
STATUS: PASSED

- Строка списка (десктоп) — Reference: `docs/design/02-wide-chat.png`, `docs/design/06-unread-badge.png` → PASSED. Проба (a) при 1440×900: в сохранённом списке временно подставлены длинное имя (кириллица) и длинное превью; `timestamp + 1`, чтобы синхронизация не заменила превью. Обрезку `text-overflow: ellipsis` в строке несут ровно два элемента, оба — сами текстовые `SPAN` без дочерних элементов:
  - **имя**: `SPAN`, `color rgb(0,0,0)`, 16px / **500** / 21.6px (= `H3`: `md` / `medium` / 1.35), `overflow hidden`, `nowrap`, `flex-grow 1`, `min-width 0`; `scrollWidth` 606 > `clientWidth` 299, высота 21.6 (одна строка);
  - **превью**: `SPAN`, `color rgb(112,117,121)` (`textMuted`, тот же серый, что у времени), 16px / **400** / 22.4px (= `B1`: `md` / `regular` / 1.4), `overflow hidden`, `nowrap`; `scrollWidth` 1069 > `clientWidth` 320, высота 22.4.

  Цвет и начертание многоточия совпадают с цветом и начертанием текста: обрезка задана на том же элементе. У родителя (`SRow`) `color rgb(0,0,0)` / 400 — в iter-2 многоточие превью рисовалось именно им, теперь этого нет. Время — `SPAN` `Caption` 12px / 400 `rgb(112,117,121)`. Остальная раскладка в iter-3 не менялась (числа строки — iter-2).
- Мобильный список — Reference: `docs/design/04-mobile-list.png` → PASSED (перенесено из iter-2, `mobile_list`).
- Скелетоны / пустое состояние / ошибка синхронизации — Free choice. Правило поправки (12) проверено пробой (b). Условие: пустой список и сбой синхронизации.
  - Окно `/`: 3 строки-скелетона (9 анимированных элементов, текста нет) с 232 мс, пока шли попытки (`retry`: 3 попытки на сетевой сбой). С 3256 мс тело панели содержит ровно один элемент — `DIV[role=alert]` с текстом `Не удалось обновить список чатов`, `Caption` 12px `rgb(229,57,53)` (`danger`).
  - «Чатов пока нет» и подсказка с карандашом не появлялись ни на одном кадре таймлайна (опрос раз в 20 мс в течение 9 с).
  - Как вызван сбой: `getChats` блокировался **до выхода из браузера**, без расхода квоты. Route interception Playwright в этом наборе MCP-инструментов нет, поэтому использован одноразовый локальный прокси `127.0.0.1:5198` → `localhost:5173`. Он отдавал тот же бандл Vite и добавлял заголовок `Content-Security-Policy: connect-src 'self' ws://127.0.0.1:5198`.
  - Сессия на этом origin фиктивная (`idInstance 1100000001`, токен-заглушка), хранимого списка нет. Что запросы действительно блокировались: в окне 0 resource-записей к `api.green-api.com`. Контрольный `fetch` на этом origin дал `TypeError: Failed to fetch` и событие `securitypolicyviolation`: `connect-src`, хост `api.green-api.com`.
  - 401 не возникал, поэтому `signOut` не сработал: окно осталось на `/`.

## Notes
- **Квота.** `getContactInfo` за прогон — **0**. Чистый профиль браузера засеян до входа: в localStorage одна запись тестового чата `{name "Artur Ovcharenko", avatarUrl null, lastMessage null, isProfileLoaded true}`, `chatId` подставлен helper-ом. Перед этим состав `getChats` проверен из Node, выведены только счётчики: 1 чат, это тестовый. Поэтому синхронизация при входе не запрашивала профиль. Живой аватар — инициалы, а не фото: в засеянной записи нет `avatarUrl`. Ветка с картинкой проверена пробой с `/favicon.svg`, живое фото — в iter-2. `checkAccount` не вызывался.
- **Пробы через хранилище** — не шаги плана, а проверки веток, которых не дают живые данные: длинные строки, кириллица, битый и рабочий URL. Каждый раз запись бралась как есть, подменялась, открывалось второе окно, после замера исходная строка возвращалась (`restored: true`). Исходный код не менялся.
- **Креды.** Одноразовый helper на `127.0.0.1:5199` читал `.env.local`. Эндпоинт формы отдавал креды один раз, дальше 410. Поля заполнены через native value setter, `Войти` нажата реальным кликом. Токен и idInstance не попали ни в аргументы инструментов, ни в отчёт; chatId скрыт.
- **Консоль.** На `localhost:5173` за прогон 0 errors / 0 warnings. Две ошибки CSP на `127.0.0.1:5198` — от контрольного `fetch` самой пробы.
- **Рабочее дерево.** В `git status` есть изменённый `docs/agents/conventions/structure.md`, которого не было в снимке на старте сессии. Эта проверка файлов не меняла. Источник — вне этого прогона, сообщаю как наблюдение.
- **Teardown.** localStorage / sessionStorage очищены на обоих origin, браузер закрыт. Dev-сервер `:5173` и helper / прокси `:5198` / `:5199` остановлены, порты свободны. `.playwright-mcp/` и скрипты helper-а удалены.
