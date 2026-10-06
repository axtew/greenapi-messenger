STATUS: APPROVED
Issue source: none

## Summary
Перепроверены 4 строки `new_chat_opens`, `chat_header`, `unknown_chat_redirect`, `mobile_chat_back` и постоянная `raw_values_in_ui`, все PASS. Прогон шёл на живом инстансе: `pnpm dev`, вход реальной формой, Playwright MCP. Строки `new_chat_invalid`, `list_item_opens_chat`, `new_chat_existing`, `account_menu_tab_out` перенесены из iter-1 (PASS) без повторного запуска. Квота: `checkAccount` — 0, `getContactInfo` — 1 (единственная свежая синхронизация при входе с пустым localStorage).

## Visual Verification
STATUS: PASSED

| check_id | dependency_group | status | evidence | blocker_check_id | root_cause_scope | contrast_with |
| --- | --- | --- | --- | --- | --- | --- |
| raw_values_in_ui | independent | PASS | `/` (1440): `Чаты / Artur Ovcharenko / вс / Приветствую! / Выберите, кому хотели бы написать`. Панель: `Новый чат / Номер телефона / Начать чат`, плейсхолдер `+7 999 123-45-67`. Шапка чата: `Artur Ovcharenko / @<username>`. Заглушка шапки текста не содержит, у неё только aria-label `Назад`. aria-label: `Меню`, `Новый чат`, `Назад`. Ключей словаря, `undefined`, `NaN`, `null`, `[object` нет. `<title>` — `GREEN-API Messenger` | | item_specific | |
| new_chat_opens | new-chat | PASS | Реальный клик по FAB открывает панель: `h2 «Новый чат»` 16px / 500, «Назад» 44×44 по (34,28). Фокус на `input type=tel inputmode=tel` («Номер телефона»), «Начать чат» disabled, FAB и ссылки списка скрыты. Реальный клик «Назад» возвращает список (`Чаты`, 1 ссылка). **`document.activeElement === FAB`** («Новый чат», 56×56 по (362,806)). После клика мышью `:focus-visible` false — штатно. Клавиатурой (Enter на FAB → Shift+Tab на «Назад» → Enter) фокус тоже на FAB, `:focus-visible` true, outline `primary` solid 2px (1.6px при масштабе 125%), offset 2px. **Hover:** без наведения `filter: none`, под курсором (`:hover` true) **`filter: brightness(0.92)`**. Фон `rgb(51,144,236)` не меняется, `cursor: pointer` | | shared | |
| new_chat_invalid | new-chat | PASS | Перенесено из iter-1 без перезапуска: `123` → `phoneError` под полем (`aria-describedby`, `aria-invalid`, `danger`); Enter → 0 запросов | | item_specific | |
| list_item_opens_chat | chat | PASS | Перенесено из iter-1: клик → `/chat/<id>`, `aria-current=page`, фон `primary`, тексты `onPrimary` | | item_specific | |
| new_chat_existing | new-chat | PASS | Перенесено из iter-1 (`checkAccount` повторно не вызывался): `/chat/<GREEN_API_TEST_CHAT_ID>`, 1 запись без дубля | | item_specific | |
| chat_header | chat | PASS | 1440×900, реальный клик по чату. `main header` 880×56 по (499,18): белый, radius 9999px, padding `6px 16px 6px 8px`, gap 12px. Аватар `DIV aria-hidden` 42×42, radius 9999px, `img` (complete, natural 640, `cover`, `alt=""`). Имя `H2` 16px / 500 / 21.6px, nowrap + ellipsis. `P` `@<username>` 14px / 400, `rgb(112,117,121)`. «Назад» `display: none`. **Инициалы:** `avatarUrl` в localStorage временно заменён недостижимым URL, после перезагрузки `img` нет. Шапка — `AO` **15.5556px** / 500, белый на `rgb(250,167,116)`. Список, аватар 54 — `AO` **20px** / 500 (20 × 42 / 54 = 15.5556). Синхронизация после правки — без `getContactInfo` | | item_specific | |
| unknown_chat_redirect | chat | PASS | `/chat/1` в iframe того же origin, опрос DOM раз в ~1 мс. **1440×900:** 10 мс — путь `/chat/1`. **152 мс** — заглушка в `main`: шапка 880×56, в ней скелетоны **42×42** и **160×14**, radius 9999px, фон `rgb(244,244,245)`, `animation 1.5s ease-in-out infinite`. «Назад» `display: none`, список виден. Сеть: `getAccountSettings` 147–441, `getChats` 147–460, `getChatHistory` 461–775, `getContactInfo` нет. **787 мс** — URL `/`, в `main` `Выберите, кому хотели бы написать`. `history.length` 4 → 4 (replace). **390×844:** 147 мс — `main` 390×844, `aside` скрыт, шапка 374×56 по (8,8), скелетоны 42×42 по (72,15) и 160×14 по (126,29). **«Назад» `flex` 44×44 по (16,14)**, `textMuted`. 740 мс — `/`, `aside` 390×844, `main` скрыт, горизонтального скролла нет. **Кнопка в ожидании (390, верхний уровень):** `goto /chat/1`, сразу реальный клик по `main header button[aria-label="Назад"]` → `/`, список во всю ширину, `main` скрыт. Клик попал в заглушку до редиректа: на `/` при 390 шапки чата в DOM нет, локатор бы не нашёлся; меню аккаунта, которое стоит на том же месте, не открылось (`aria-expanded=false`) | | item_specific | |
| mobile_chat_back | layout | PASS | 390×844, реальный клик по чату в списке → `/chat/<id>`, `history.length` 6. `aside` `display: none`, `main` 390×844, горизонтального скролла нет. Шапка 374×56 по (8,8), «Назад» 44×44 по (16,14), аватар 42×42 по (72,15), FAB не виден. Реальный клик «Назад» → `/`, **`history.length` остаётся 6** (в iter-1 было 4 → 5), `aside` 390×844, radius 0. `main` скрыт, 1 ссылка, невыбранная, FAB 56×56 по (314,768). **`history.back()`** → путь `/`, шапки чата нет, `main` скрыт: чат **не** открылся снова | | item_specific | |
| account_menu_tab_out | menu | PASS | Перенесено из iter-1: Tab из «Выйти» → первая ссылка списка (`:focus-visible`), меню закрыто | | item_specific | |

```yaml
verdict:
  matrix:
    - check_id: raw_values_in_ui
      dependency_group: independent
      status: PASS
      evidence: "все тексты и aria-label — значения ru.json; заглушка шапки без текста; ключей, undefined, NaN, null нет (iter-2)"
      root_cause_scope: item_specific
    - check_id: new_chat_opens
      dependency_group: new-chat
      status: PASS
      evidence: "FAB → панель, поле tel в фокусе; «Назад» → activeElement = FAB (с клавиатуры :focus-visible + outline primary); hover FAB filter none → brightness(0.92) (iter-2)"
      root_cause_scope: shared
    - check_id: new_chat_invalid
      dependency_group: new-chat
      status: PASS
      evidence: "перенесено из iter-1 (phase-6/iter-1/VISUAL.md)"
      root_cause_scope: item_specific
    - check_id: list_item_opens_chat
      dependency_group: chat
      status: PASS
      evidence: "перенесено из iter-1 (phase-6/iter-1/VISUAL.md)"
      root_cause_scope: item_specific
    - check_id: new_chat_existing
      dependency_group: new-chat
      status: PASS
      evidence: "перенесено из iter-1 (phase-6/iter-1/VISUAL.md), checkAccount повторно не вызывался"
      root_cause_scope: item_specific
    - check_id: chat_header
      dependency_group: chat
      status: PASS
      evidence: "пилюля 880x56; аватар 42 фото cover; H2 16/500; P 14/400 textMuted; инициалы AO 15.5556px в шапке (42) и 20px в списке (54) (iter-2)"
      root_cause_scope: item_specific
    - check_id: unknown_chat_redirect
      dependency_group: chat
      status: PASS
      evidence: "/chat/1: заглушка (скелетоны 42x42 + 160x14, 1.5s infinite) 152–787 мс, редирект на / после getChatHistory, history.length без изменений; 390px — «Назад» видна и реальный клик в ожидании ведёт к списку (iter-2)"
      root_cause_scope: item_specific
    - check_id: mobile_chat_back
      dependency_group: layout
      status: PASS
      evidence: "390x844: только колонка чата; «Назад» → /, history.length 6 → 6; history.back() не открывает чат (iter-2)"
      root_cause_scope: item_specific
    - check_id: account_menu_tab_out
      dependency_group: menu
      status: PASS
      evidence: "перенесено из iter-1 (phase-6/iter-1/VISUAL.md)"
      root_cause_scope: item_specific
  blockers: []
  overgeneralization_risk: false
  ready_to_escalate: true
```

## Design verification
STATUS: NOT_REQUESTED

`design.source: none`, Figma нет.

- Заглушка шапки — Free choice: не сверяется, числа — в строке `unknown_chat_redirect`. По раскладке совпадает с настоящей шапкой: та же пилюля, кружок на месте аватара, полоса на месте имени. Подзаголовка нет, как и задумано.
- Мобильная шапка — Reference: `docs/design/05-mobile-chat.png`. Геометрия та же, что в iter-1: пилюля с отступом 8px, «Назад», затем аватар 42.

## Notes
- **Квота.** Вызовы GREEN-API:
  - вход — `getStateInstance`;
  - первая синхронизация (localStorage пуст) — `getAccountSettings`, `getChats`, `getContactInfo` (1), `getChatHistory`;
  - каждая перезагрузка или iframe — `getAccountSettings`, `getChats`, `getChatHistory`, без `getContactInfo`, профиль уже загружен.

  `checkAccount` не вызывался. `download` — загрузка фото аватара.
- **Подмена `avatarUrl`.** Исходная строка записи списка чатов (349 байт) сохранялась в sessionStorage. Восстановление дало строгое равенство с исходником сразу после записи, затем страница перезагружена.
  - После этой перезагрузки и синхронизации строгое сравнение с исходником вернуло `false`. Длина та же (349), ключи те же, битого URL нет, `avatarUrl` — хост GREEN-API, `isProfileLoaded: true`, фото грузится (natural 640).
  - Копию-эталон я удалил до сравнения по полям, поэтому что именно отличалось, не установлено. Следующая перезагрузка с синхронизацией дала побайтовое совпадение: запись стабильна.
  - В конце прогона localStorage очищен целиком, так что на стенд владельца это не влияет.
- **Как проверялся `/chat/1`.** Таймлайн снимался в iframe того же origin: та же сессия из localStorage, а media queries работают по ширине iframe. Реальный клик «Назад» в ожидании сделан на верхнем уровне при 390×844.
- **Консоль.** Одна ошибка за прогон: `net::ERR_UNSAFE_PORT` для подставленного `http://127.0.0.1:9/unreachable.png`, вызвана намеренно. Больше errors и warnings нет.
- **Креды.** Одноразовый helper на `127.0.0.1:5199` читал `.env.local` и отдал креды один раз, дальше отвечал 410. Поля заполнялись native setter, наружу возвращались только длины. «Войти» нажата реальным кликом. Токен, idInstance и номер в отчёт не попали, chatId скрыт как `<id>`.
- **Teardown.** localStorage и sessionStorage очищены, браузер закрыт. Dev-сервер `:5173` и helper `:5199` остановлены, порты свободны. `.playwright-mcp/` и скрипт helper удалены. Исходники не менялись: `git status` такой же, как в снимке на старте.
