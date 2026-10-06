STATUS: APPROVED
Issue source: none

## Summary
Проверен заход `chore-ui` на живом инстансе: `Escape` на экране чата (сам по себе, после меню аккаунта, после панели «Новый чат»), ширина сайдбара на 768 / 1024 / 1280 / 1600 / 390 и `:hover` у `Button`. Все пять строк матрицы и постоянная `raw_values_in_ui` — PASS. Квота: `getStateInstance` — 1, `getContactInfo` — 1, `checkAccount` — 0, `sendMessage` — 0.

## Visual Verification
STATUS: PASSED

| check_id | dependency_group | status | evidence | blocker_check_id | root_cause_scope | contrast_with |
| --- | --- | --- | --- | --- | --- | --- |
| raw_values_in_ui | independent | PASS | 1440×900, `/chat/<test_chat_id>`: в `aside` — `Чаты / <имя чата>`, в `main` — шапка и 8 пузырей. aria-label: `Меню`, `Новый чат`, `Назад` (и `Open Tanstack query devtools` от dev-инструментов). В тексте `aside` + `main` + aria-label нет `undefined`, `NaN`, `null`, `[object`, ключей словаря (`sidebar.`, `chat.`, `common.`) и U+FFFD. `/login`: `Вход`, `Данные инстанса из личного кабинета GREEN-API`, `idInstance`, `apiTokenInstance`, `Войти`. `<title>` — `GREEN-API Messenger`. Консоль за прогон: 0 ошибок, 0 предупреждений | | item_specific | |
| esc_closes_chat | keyboard | PASS | 1440×900. **Прогон 1:** реальный клик по чату → `/chat/<test_chat_id>`, `history.length` 4, фокус на ссылке чата в списке. `Escape` → `/`, в `main` «Выберите, кому хотели бы написать», `history.length` по-прежнему 4. `history.back()` → `/`, `history.forward()` → `/`: в чат не вернулись ни туда, ни обратно. **Прогон 2:** фокус на `body` (клик по колонке чата), `history.length` 5 → `Escape` → `/`, `history.length` 5; `back()` → `/`. **390×844:** `Escape` на `/chat/<test_chat_id>` → `/`, виден список. `Escape` на `/` ничего не делает: URL прежний, ошибок нет | | item_specific | |
| esc_menu_first | keyboard | PASS | `/chat/<test_chat_id>`, клик «Меню» → `aria-expanded="true"`, фокус в выпадающем блоке (в нём «Аккаунт / @<username> / Выйти»). **`Escape` №1** → URL прежний, `aria-expanded="false"`, «Выйти» в `aside` нет, фокус на кнопке «Меню», чат открыт, `history.length` 5 → 5. **`Escape` №2** → `/`, `history.length` 5 | | item_specific | |
| esc_new_chat_first | keyboard | PASS | `/chat/<test_chat_id>`, клик «Новый чат» → в `aside` «Новый чат / Номер телефона / Начать чат», фокус в `input[type=tel]` «Номер телефона» внутри `aside`, `history.length` 6. **`Escape` №1** → URL прежний, в `aside` снова «Чаты / <имя чата>», фокус на кнопке «Новый чат» (карандаш), чат открыт, `history.length` 6. **`Escape` №2** → `/`, `history.length` 6 | | item_specific | |
| sidebar_width | layout | PASS | Открыт чат, вид `aside` → computed `width` / ожидание `clamp(280, 28vw, 380)`. **768:** 280 / 280. `aside` 18…298, `main` 298…768 (470), колонка чата 316…750 (434). `documentElement` `scrollWidth` 768 = `clientWidth`, у `main` 470 = 470. Элементов `main` за его границами — 0, элементов с горизонтальной прокруткой — 0, правый край пузырей не дальше 741. **1024:** `286.712px` / 286.72, `main` 719 = 719, документ 1024 = 1024. **1280:** `358.4px` / 358.4, `main` 904 = 904, документ 1280 = 1280. **1600:** `380px` / 380, `main` 1202 = 1202, документ 1600 = 1600. **390×844:** на `/chat/<test_chat_id>` `aside` `display: none`, у документа 390 = 390. На `/` `aside` `display: flex`, x = 0, ширина 390.4 = ширине `html`, `main` `display: none`, у документа 390 = 390 | | item_specific | |
| button_hover | ui | PASS | `/login` 1440×900, курсор подведён к кнопке. Неактивная «Войти» (`disabled`, `:hover` true): `filter: none`, `opacity` 0.6, `cursor: default`. Активная (поля заполнены, `:hover` true): `filter: brightness(0.92)`, `opacity` 1, `cursor: pointer`. Активная без курсора: `filter: none` | | item_specific | |

```yaml
verdict:
  matrix:
    - check_id: raw_values_in_ui
      dependency_group: independent
      status: PASS
      evidence: "aside/main/aria-label на /chat/<test_chat_id> и /login — только значения ru.json и данные чата; undefined/NaN/null/[object/ключей словаря/U+FFFD нет; консоль 0 ошибок 0 предупреждений"
      root_cause_scope: item_specific
    - check_id: esc_closes_chat
      dependency_group: keyboard
      status: PASS
      evidence: "1440: Escape на /chat/<test_chat_id> при фокусе на ссылке и на body → /, history.length не растёт (4→4, 5→5), back и forward → /; 390 → /; Escape на / ничего не делает"
      root_cause_scope: item_specific
    - check_id: esc_menu_first
      dependency_group: keyboard
      status: PASS
      evidence: "меню открыто → Escape №1: aria-expanded false, фокус на «Меню», URL прежний, history.length 5; Escape №2 → /"
      root_cause_scope: item_specific
    - check_id: esc_new_chat_first
      dependency_group: keyboard
      status: PASS
      evidence: "панель «Новый чат», фокус в поле номера → Escape №1: список чатов, фокус на «Новый чат», URL прежний, history.length 6; Escape №2 → /"
      root_cause_scope: item_specific
    - check_id: sidebar_width
      dependency_group: layout
      status: PASS
      evidence: "aside 280 / 286.712 / 358.4 / 380 на 768 / 1024 / 1280 / 1600 = clamp(280,28vw,380); на 768 у документа и main scrollWidth = clientWidth, переполнения 0; 390: aside во всю ширину на /, скрыт на чате"
      root_cause_scope: item_specific
    - check_id: button_hover
      dependency_group: ui
      status: PASS
      evidence: "/login: активная «Войти» под курсором — filter brightness(0.92); неактивная под курсором — none; активная без курсора — none"
      root_cause_scope: item_specific
  blockers: []
  overgeneralization_risk: false
  ready_to_escalate: true
```

## Design verification
STATUS: NOT_REQUESTED

`design.source: none`, Figma нет, у захода `chore-ui` нет `## Visual references`. Значения сверял с поправкой (15): `clamp(280px, 28vw, 380px)` и `brightness(0.92)`, как у FAB-карандаша.

## Notes
- **Наблюдение вне матрицы, к этому заходу не относится.** В строке чата в списке после свежей синхронизации нет ни времени, ни превью: `lastMessage: null` в кэше. Ответ `getChatHistory` с `count:1` был 200.
  - **Symptom confirmed, root cause — гипотеза.** Сырое тело ответа не снимал. Вероятная причина: самая новая запись истории — удалённая (`isDeleted`), а `fetchLastMessage` для неё по замыслу возвращает `null`. Удалённую запись видел visual-ревьюер Phase 7.
  - Diff захода синхронизацию и список не трогает. В прогоне Phase 7 превью было, но взялось из кэша прошлых прогонов. Если владельцу нужно превью последнего не удалённого сообщения — это пункт в `BACKLOG.md`, не дефект `chore-ui`.
- **Порядок обработчиков подтверждён вживую.** Разработчик обосновал его делегированием React, но не проверял. React-обработчики меню и панели срабатывают раньше слушателя на `document`, `preventDefault` до него доходит: первый `Escape` чат не закрыл ни в одном из двух сценариев.
- **Чего не проверял.** `isComposing` (IME) и повтор при 429 — второй покрыт unit-тестом, провоцировать 429 запрещено. Сценарий «фокус вне открытой панели „Новый чат“ → `Escape` закрывает чат, панель остаётся» описан разработчиком как следствие решения и в матрицу не входит.
- **Квота.** Вход — `getStateInstance` (1). Свежая синхронизация — `getAccountSettings`, `getChats`, `getContactInfo` (1), `getChatHistory` `count:1`. Ещё 6 открытий чата реальным кликом — 6 × `getChatHistory` `count:100`, все 200, 429 не было. `checkAccount` и `sendMessage` — 0.
- **Креды.** Одноразовый helper на `127.0.0.1:5199` прочитал `.env.local` и отдал креды один раз. Поля заполнялись native setter, наружу возвращались только длины. «Войти» нажата реальным кликом. Сеть снималась обёрткой `fetch`, которая записывала только имя метода и статус. В отчёт токен, idInstance, chatId и username не попали. Но в выводе инструментов они появлялись: URL страницы, текст меню аккаунта и **частично замаскированная** запись сессии из localStorage — моя маска цифр не закрыла токен целиком. Это только вывод инструментов, на диск ничего не записано.
- **Teardown.** localStorage и sessionStorage очищены, браузер закрыт. Dev-сервер `:5173` и helper `:5199` остановлены, порты свободны. `.playwright-mcp/` и скрипт helper удалены. Исходники не менялись: `git status` совпадает со снимком на старте.
