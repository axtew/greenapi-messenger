STATUS: APPROVED
Issue source: none

## Summary
Прогнал в браузере все пять пунктов Visual Verification фазы 4 и постоянную строку `raw_values_in_ui`: вход через настоящую форму, каркас на 1440px и 390px, меню аккаунта (Escape, клик вне меню, возврат фокуса), выход. Все строки — PASS, консоль чистая. Раскладку сверил с `01-wide-empty.png` / `04-mobile-list.png` по числам: совпадает.

## Visual Verification
STATUS: PASSED

| check_id | dependency_group | status | evidence | blocker_check_id | root_cause_scope | contrast_with |
| --- | --- | --- | --- | --- | --- | --- |
| raw_values_in_ui | independent | PASS | Тексты интерфейса на `/` (закрытое и открытое меню) и на `/login` после выхода: `Меню` (aria-label), `Чаты`, `Выберите, кому хотели бы написать`, `Аккаунт`, `@stevvy_vn`, `Выйти`, `Вход`. Все берутся из словаря или отформатированы; ключей словаря, членов enum, `undefined` / `null` / `[object Object]` и двойного `@` нет | | item_specific | |
| messenger_boots | boot | PASS | Форма входа (креды из `.env.local`, клик `Войти`) → URL `http://localhost:5173/`. В DOM: `aside` > `header` с кнопкой «Меню» и h2 `Чаты`; в `main` — p `Выберите, кому хотели бы написать`. Сеть: `GET …/waInstance<id>/getStateInstance/<token>` → 200, затем `GET …/waInstance<id>/getAccountSettings/<token>` → 200 (запрос уходит при монтировании layout). Консоль: 0 errors / 0 warnings, только vite debug и React DevTools info | | shared | |
| desktop_two_columns | layout | PASS | 1440×900. Каркас: flex, 1440×900, `background-image: linear-gradient(135deg, rgb(178,201,158) 0%, rgb(169,197,159) 50%, rgb(152,189,144) 100%)`. `aside`: x=18 y=18 w=420 h=864 (отступ 18px сверху, слева и снизу), `border-radius: 24px`, фон `rgb(255,255,255)`. `main`: x=438 w=1002 h=900, `display: flex`, свой фон прозрачный — виден градиент. Обе колонки видны одновременно. Пилюля в центре `main`: смещение dx≈-0.006, dy≈0 | | item_specific | |
| mobile_single_column | layout | PASS | 390×844. `aside`: x=0 y=0 w=390.4 h=844, `border-radius: 0px`, `margin: 0px`, фон белый. У `main` `display: none`, пилюля не видна (`checkVisibility()` → false). `elementFromPoint(195,600)` попадает в `ASIDE`; горизонтального скролла нет (scrollWidth 390) | | item_specific | desktop_two_columns |
| account_menu | menu | PASS | Клик «Меню» → `aria-expanded="true"`, меню 240×131 появляется на 4px ниже кнопки (radius 12px, рамка, фон белый, z-index 2). Содержимое: p `Аккаунт` (12px/400, rgb(112,117,121)), p `@stevvy_vn` (16px/400), кнопка `Выйти`. В сыром ответе `getAccountSettings` `username: "@stevvy_vn"` — строка в UI с ним совпадает. При открытии меню новых запросов нет (всего 2). Tab переводит фокус на `Выйти`, затем `Escape` → меню закрыто, `aria-expanded="false"`, `aria-controls` снят, фокус на гамбургере (`:focus-visible`, outline `rgb(51,144,236)`). Повторное открытие и реальный клик вне меню (точка 720×450 в правой колонке, туда приходится подложка) → меню закрыто, URL остаётся `/` | | item_specific | |
| logout | menu | PASS | Меню → клик `Выйти` → `http://localhost:5173/login` (`signOut` перезагружает страницу полностью), h1 `Вход`, поля пустые, в `localStorage` ключей нет. Повторный `goto http://localhost:5173/` → снова `/login`, форма входа, кнопка `Войти` неактивна. Консоль 0/0 | | item_specific | |

```yaml
verdict:
  matrix:
    - check_id: raw_values_in_ui
      dependency_group: independent
      status: PASS
      evidence: все тексты UI из словаря или отформатированы; сырых ключей, enum, null/undefined и двойного "@" нет
      root_cause_scope: item_specific
    - check_id: messenger_boots
      dependency_group: boot
      status: PASS
      evidence: "после входа: aside с h2 «Чаты» и кнопкой «Меню», в main пилюля «Выберите, кому хотели бы написать»; getStateInstance 200, getAccountSettings 200; консоль 0/0"
      root_cause_scope: shared
    - check_id: desktop_two_columns
      dependency_group: layout
      status: PASS
      evidence: "1440x900: aside 420x864 at (18,18), radius 24px, white; main 1002x900 visible; градиент на каркасе; пилюля по центру"
      root_cause_scope: item_specific
    - check_id: mobile_single_column
      dependency_group: layout
      status: PASS
      evidence: "390x844: aside 390.4x844 at (0,0), radius 0, margin 0; main display:none; горизонтального скролла нет"
      root_cause_scope: item_specific
      contrast_with: desktop_two_columns
    - check_id: account_menu
      dependency_group: menu
      status: PASS
      evidence: "меню: «Аккаунт» + «@stevvy_vn» (совпадает с сырым username) + «Выйти»; Escape закрывает, фокус на гамбургере; клик вне меню закрывает; повторного запроса нет"
      root_cause_scope: item_specific
    - check_id: logout
      dependency_group: menu
      status: PASS
      evidence: "«Выйти» → /login, localStorage пуст; повторный переход на / → /login"
      root_cause_scope: item_specific
  blockers: []
  overgeneralization_risk: false
  ready_to_escalate: true
```

## Design verification
STATUS: PASSED

- Список чатов, пустое состояние справа (десктоп) — Reference: `docs/design/01-wide-empty.png` → PASSED. Сверка на уровне раскладки: белая карточка-панель с отступом 18px от краёв окна (сверху, слева, снизу) и `border-radius` 24px поверх фона; справа фон-градиент. Гамбургер в шапке панели слева, x=34 (16px от края карточки), кнопка 44×44. Поиска в фазе нет, тело панели пустое — так задумано (поиск не делаем, список появится в Phase 5).
- Мобильный список — Reference: `docs/design/04-mobile-list.png` → PASSED. Панель занимает весь экран без скругления, гамбургер слева сверху (x=16, y=10). Правой колонки нет.
- Пилюля «Выберите, кому хотели бы написать»: стоит по центру `main`, padding 4px 12px, radius 9999px, фон `rgb(114,166,100)` = токен `palette.datePill` (`#72a664`). Текст белый, Roboto 16px / 500 / 21.6px, по центру. Токен непрозрачный, хотя «Key observations» плана называют пилюлю «полупрозрачной». Цвет сверен с таблицей палитры Phase 1 (`#72a664`, снят пикселем со скриншота), поэтому это не расхождение: см. Notes.
- Меню аккаунта — Free choice → не проверяется.

## Notes
- **Граница брейкпоинта (вне матрицы, окружение).** У Chromium в Playwright на этом хосте DPR = 1.0000000149, поэтому визуальный viewport получается чуть больше заданного: 766 → 766.4, 767 → 767.2. На viewport 766 раскладка уже мобильная (main `display: none`). На 767 остаётся десктопная, потому что `(max-width: 767px)` не срабатывает при ширине 767.2. Это артефакт дробного масштаба в окружении проверки, не баг кода: медиазапрос `max-width: 767px` совпадает с `breakpoints.mobileMax`. Если ровно 767px важны, владелец может проверить на стенде с DPR 1.
- **Пилюля «полупрозрачная» vs `#72a664`.** В Phase 1 токен `datePill` зафиксирован непрозрачным цветом, снятым пикселем с референса, то есть уже смешанным с фоном. На градиенте он выглядит как в референсе. Насколько это похоже визуально, владелец решит на стенде.
- **Скелетон строки аккаунта** в этом прогоне не виден: `getAccountSettings` отвечает при монтировании layout, и к первому открытию меню данные уже были. В матрице его нет, поэтому это не дефект.
- **Запросы к GREEN-API:** ровно `getStateInstance` (1) и `getAccountSettings` (1), оба 200. `checkAccount` / `getContactInfo` не вызывались. В отчёте URL замаскированы (`<id>`, `<token>`).
- Креды в браузер передавал одноразовый helper на `127.0.0.1:5199`, который читал `.env.local`. Поля заполнялись через native value setter с событием `input`, кнопка `Войти` нажималась реальным кликом по CSS-селектору. Snapshot заполненной формы не снимался, в аргументы инструментов и в отчёт креды не попали.
- Teardown: `localStorage` / `sessionStorage` очищены, браузер закрыт. Dev-сервер (`:5173`) и helper (`:5199`) остановлены, порты свободны. `.playwright-mcp/` и скрипт helper-а удалены.
