STATUS: APPROVED
Issue source: none

## Summary
Все 8 строк фазы и постоянная `raw_values_in_ui` прошли на живом инстансе: `pnpm dev`, вход реальной формой, Playwright MCP. Квота за прогон: `checkAccount` — 1 вызов (ровно `new_chat_existing`), `getContactInfo` — 1 вызов (единственная свежая синхронизация при входе с пустым localStorage). Других номеров не вводилось.

## Visual Verification
STATUS: PASSED

| check_id | dependency_group | status | evidence | blocker_check_id | root_cause_scope | contrast_with |
| --- | --- | --- | --- | --- | --- | --- |
| raw_values_in_ui | independent | PASS | Все видимые тексты — значения `ru.json`. Боковая панель: `Чаты`, `Новый чат`, `Номер телефона`, плейсхолдер `+7 999 123-45-67`, `Начать чат`, `Введите номер в международном формате: от 10 до 15 цифр`. Главная: `Выберите, кому хотели бы написать`. aria-label: `Меню`, `Новый чат`, `Назад` (плюс devtools TanStack Query). Данные: `Artur Ovcharenko`, `вс`, `Приветствую!`, `@<username>` (без двойного `@`: в хранилище username без ведущего `@`). Ключей словаря, `undefined`, `NaN`, `null`, `[object` в `body.innerText` нет. `<title>` — `GREEN-API Messenger` | | item_specific | |
| new_chat_opens | new-chat | PASS | Реальный клик по FAB → вместо шапки и списка: `button "Назад"` + `h2 "Новый чат"` (16px / 500 / 21.6px, = `H3`); `textbox "Номер телефона"` в фокусе (`autoFocus`), `type=tel`, `inputmode=tel`, `autocomplete=tel`, 16px; `button "Начать чат"` disabled, opacity 0.6. FAB и список скрыты. «Назад» 44×44 по (34,28), radius 9999px, `textMuted`, иконка 24×24 по центру. Обратный клик «Назад» → снова `Чаты`, 1 ссылка, FAB на месте | | shared | |
| new_chat_invalid | new-chat | PASS | Набор `123` посимвольно → под полем `Введите номер в международном формате: от 10 до 15 цифр` (12px, `rgb(229,57,53)` `danger`). Ошибка вне `<label>`, связана через `aria-describedby`; `aria-invalid="true"`, рамка `danger`. Кнопка disabled, `role="alert"` нет. Enter в поле → за 1,5 с **0** новых resource-записей (и к GREEN-API, и вообще); URL `/`, панель на месте | | item_specific | |
| list_item_opens_chat | chat | PASS | Реальный клик по ссылке → URL `/chat/<chatId>` = `GREEN_API_TEST_CHAT_ID`. Ссылка `A` 404×72, radius 12px, `aria-current="page"`. Фон `rgb(51,144,236)` (`primary`); имя, время и превью — `rgb(255,255,255)` (`onPrimary`). Так и под курсором, и после ухода курсора. Ни одного запроса GREEN-API. Контраст: на `/` фон невыбранного `transparent`, под курсором `rgb(244,244,245)` (`surfaceMuted`), тексты чёрный / `textMuted`. Совпадает с `02-wide-chat.png`: синяя заливка, весь текст белый | | item_specific | |
| new_chat_existing | new-chat | PASS | С `/` открыта панель, номер `<test_phone>` подставлен из helper (11 цифр, `aria-invalid=false`, кнопка активна), «Начать чат» — реальный клик. Сеть: ровно **один** `checkAccount` 200, `getContactInfo` нет. URL → `/chat/<GREEN_API_TEST_CHAT_ID>` (совпадение проверено строго). Панель вернулась к списку (`Чаты`, FAB). В DOM 1 ссылка на этот чат, она выбрана. В localStorage 1 запись: профиль загружен, аватар и `lastMessage` прежние. Дубля нет, `role="alert"` нет | | item_specific | |
| chat_header | chat | PASS | 1440×900, `main header`: 880×56 по (499,18), белый, radius 9999px, padding `6px 16px 6px 8px`, gap 12. Аватар `DIV aria-hidden` 42×42, radius 9999px, внутри `img` (фото, `complete`, natural 640, `object-fit: cover`, пустой `alt`). Имя — `H2` «Artur Ovcharenko»: 16px / 500 / 21.6px, чёрный, nowrap + ellipsis. Подзаголовок — `P` `@<username>`: 14px / 400 / 19.6px, `rgb(112,117,121)` (`textMuted`). «Назад» на десктопе `display: none`. chatId в шапке не выводится. Совпадает с `02-wide-chat.png`: пилюля по центру, аватар слева, имя над подзаголовком; кнопки справа — «не делаем» | | item_specific | |
| unknown_chat_redirect | chat | PASS | Новое окно `window.open` на `/chat/1`, опрос DOM окна раз в ~1 мс (t от открытия). 39 мс — путь `/chat/1`. 266 мс — список (1 ссылка, не выбрана), `main` пуст (0 детей, шапки нет). Сеть окна: `getAccountSettings` 259–557, `getChats` 260–551, `getChatHistory` 553–843, `getContactInfo` нет. **853 мс** — URL `/`, в `main` `Выберите, кому хотели бы написать`. Редирект — через ~10 мс после конца синхронизации, как задумано. `history.length` окна 1 — переход с `replace` | | item_specific | |
| mobile_chat_back | layout | PASS | 390×844 на `/chat/<chatId>`: `aside` `display: none` (0×0), `main` flex 390×844, горизонтального скролла нет. Шапка 374×56 по (8,8), padding колонки 8px. «Назад» видна: 44×44 по (16,14), radius 9999px, `textMuted`. Аватар 42×42 по (72,15). FAB не виден. Клик «Назад» → URL `/`, `aside` flex 390×844, radius 0, `main` `display: none`. 1 ссылка, невыбранная. FAB 56×56, отступ 20/20 от правого нижнего угла. Обратный путь (тап по чату в мобильном списке) → только колонка чата | | item_specific | |
| account_menu_tab_out | menu | PASS | На `/` реальный клик «Меню» → `aria-expanded=true`, фокус на выпадающем блоке. Tab → фокус на `BUTTON` «Выйти». Tab → фокус на первой ссылке списка (`A` «Artur Ovcharenko вс Приветствую!», `:focus-visible`, рамка `primary`). Меню закрыто: `aria-expanded=false`, «Выйти» и «Аккаунт» из DOM ушли. URL `/` — выхода не было | | item_specific | |

```yaml
verdict:
  matrix:
    - check_id: raw_values_in_ui
      dependency_group: independent
      status: PASS
      evidence: "все тексты и aria-label — значения ru.json; данные Artur Ovcharenko / вс / Приветствую! / @<username>; ключей, undefined, NaN, null нет"
      root_cause_scope: item_specific
    - check_id: new_chat_opens
      dependency_group: new-chat
      status: PASS
      evidence: "клик по FAB → «Назад» 44x44 + h2 «Новый чат», поле tel в фокусе, «Начать чат» disabled; FAB и список скрыты; «Назад» возвращает список"
      root_cause_scope: shared
    - check_id: new_chat_invalid
      dependency_group: new-chat
      status: PASS
      evidence: "123 → phoneError под полем (aria-describedby, aria-invalid, danger), кнопка disabled; Enter → 0 сетевых запросов"
      root_cause_scope: item_specific
    - check_id: list_item_opens_chat
      dependency_group: chat
      status: PASS
      evidence: "клик → /chat/<GREEN_API_TEST_CHAT_ID>; ссылка aria-current=page, bg rgb(51,144,236), все тексты rgb(255,255,255); hover невыбранного rgb(244,244,245)"
      root_cause_scope: item_specific
    - check_id: new_chat_existing
      dependency_group: new-chat
      status: PASS
      evidence: "<test_phone> → ровно 1 checkAccount 200, getContactInfo 0; URL /chat/<GREEN_API_TEST_CHAT_ID>; 1 ссылка в DOM, 1 запись в localStorage"
      root_cause_scope: item_specific
    - check_id: chat_header
      dependency_group: chat
      status: PASS
      evidence: "пилюля 880x56 белая; аватар 42 (фото, cover); H2 16/500 имя; P 14/400 textMuted @<username>; «Назад» скрыта на десктопе"
      root_cause_scope: item_specific
    - check_id: unknown_chat_redirect
      dependency_group: chat
      status: PASS
      evidence: "/chat/1: main пуст, getChats 260–551 → getChatHistory 553–843 → URL / на 853 мс; history.length 1 (replace)"
      root_cause_scope: item_specific
    - check_id: mobile_chat_back
      dependency_group: layout
      status: PASS
      evidence: "390x844: aside display none, main 390x844, «Назад» 44x44; клик → /, список во всю ширину, main скрыт"
      root_cause_scope: item_specific
    - check_id: account_menu_tab_out
      dependency_group: menu
      status: PASS
      evidence: "меню → Tab «Выйти» → Tab первая ссылка списка (:focus-visible); aria-expanded false, пункты меню ушли из DOM"
      root_cause_scope: item_specific
  blockers: []
  overgeneralization_risk: false
  ready_to_escalate: true
```

## Design verification
STATUS: NOT_REQUESTED

`design.source: none`, Figma нет. Сверка с референсами ниже — по структуре, справочно. Числа — в строках матрицы.

- Открытый чат, десктоп — Reference: `docs/design/02-wide-chat.png` → совпадает по структуре.
  - Выбранный элемент: синяя заливка, весь текст белый.
  - Шапка — белая пилюля по центру колонки 880px: аватар, имя, подзаголовок.
  - Поиска, звонка и меню собеседника нет — так задумано.
- Открытый чат, узкий десктоп — Reference: `docs/design/03-desktop-narrow-chat.png` → совпадает по структуре. При 1100×800 шапка 626×56, отступ от панели 18px, от правого края 18px.
- Мобильный чат — Reference: `docs/design/05-mobile-chat.png` → совпадает по структуре. Пилюля во всю ширину с отступом 8px, «Назад» слева, затем аватар 42 и имя с подзаголовком. Меню «⋮» не делаем.
- Панель «Новый чат» — Reference: `docs/design/07-new-chat-panel.png` → совпадает по структуре. «Назад» слева в шапке. Вместо поиска контактов — заголовок и форма номера, как в плане. FAB «добавить контакт» из референса не переносился — его нет в плане.
- Кнопки и FAB — Free choice. Гамбургер и обе «Назад» (панель «Новый чат», шапка чата) — общий `IconButton`, все три 44×44, radius 9999px, `textMuted`, иконка 24×24. FAB 56×56:
  - `primary` `rgb(51,144,236)`, иконка белая 24×24, `position: absolute`;
  - отступ 20px справа и снизу от карточки панели: (362,806) при 1440×900, (314,768) при 390×844;
  - виден только в виде списка;
  - у тела списка `padding-bottom: 88px`.

## Notes
- **Квота.** Вызовы GREEN-API в основной вкладке:
  - вход: `getStateInstance`;
  - синхронизация: `getAccountSettings`, `getChats`, `getContactInfo` (1, профиль тестового чата при пустом localStorage), `getChatHistory`;
  - `new_chat_existing`: `checkAccount` (1).

  В окне `unknown_chat_redirect`: `getAccountSettings`, `getChats`, `getChatHistory`, без `getContactInfo` (профиль уже загружен). `getChats` вернул 1 чат — тестовый. Свежая синхронизация была одна, дальше работала сессия с заполненным localStorage.
- **Аватар без фото в шапке.** Живой профиль с фото, поэтому инициалы в шапке не показывались. По `Avatar/_styles.ts` размер шрифта инициалов фиксирован: `lg` 20px / 500 при любом диаметре. В шапке 42px это 20px — доля 0,48 диаметра против 0,37 у аватара 54px в списке. Наблюдение, не провал: план размер инициалов для 42px не задаёт. Если нужна пропорция, это вопрос владельцу.
- **Мелочи, не проверки фазы:**
  - после «Назад» из «Новый чат» фокус уходит на `body` (разработчик это отметил);
  - «Назад» в шапке мобильного чата добавляет запись в историю (`history.length` 4 → 5), а не возвращается по ней. После неё системная «назад» снова открывает чат;
  - `0.8px` / `1.6px` в computed-значениях — масштаб экрана 125 процентов (1px / 2px CSS).
- **Креды.** Одноразовый helper на `127.0.0.1:5199` читал `.env.local`: креды и номер отдавал по одному разу, дальше 410. Поля заполнялись native value setter внутри `browser_evaluate`, который возвращал только длины и флаги. Кнопки нажимались реальным кликом. Токен, idInstance и номер в отчёт не попали; chatId скрыт.
- **Консоль.** 0 errors / 0 warnings за прогон, только info от React DevTools.
- **Teardown.** localStorage и sessionStorage очищены, браузер закрыт. Dev-сервер `:5173` и helper `:5199` остановлены, порты свободны. `.playwright-mcp/` и скрипт helper удалены. Исходники не менялись: `git status` такой же, как в снимке на старте сессии.
