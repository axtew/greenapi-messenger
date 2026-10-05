STATUS: APPROVED
Issue source: none

## Summary
Заново прогнал в браузере все пять строк Visual Verification фазы 4 и постоянную строку `raw_values_in_ui` после переноса файлов в `src/layouts/` / `src/pages/HomePage/` и правки фокуса в меню аккаунта. Все строки PASS, консоль чистая. Раскладка по числам совпадает с iter-1. Из пяти дополнительных проверок меню (a), (b), (d), (e) прошли. (c) в буквальном виде в фазе 4 выполнить нельзя: после «Выйти» на странице нет фокусируемого элемента. Эквивалентный переход фокуса за пределы меню (Shift+Tab) меню закрывает.

## Visual Verification
STATUS: PASSED

| check_id | dependency_group | status | evidence | blocker_check_id | root_cause_scope | contrast_with |
| --- | --- | --- | --- | --- | --- | --- |
| raw_values_in_ui | independent | PASS | Тексты интерфейса на `/` при закрытом и открытом меню и на `/login` после выхода: `Меню` (aria-label), `Чаты`, `Выберите, кому хотели бы написать`, `Аккаунт`, `@stevvy_vn`, `Выйти`, `Вход`, `Данные инстанса из личного кабинета GREEN-API`, `idInstance`, `apiTokenInstance`, `Войти`. Все взяты из словаря или отформатированы. Ключей словаря, членов enum, `undefined` / `null` / `[object Object]` и двойного `@` нет. После удаления ключа `app` в `ru.json` остались `login, sidebar, settingsWarning, newChat, chat, sendErrors`; в `src/` обращений к `l.app` нет; `<title>` берётся из `index.html` | | item_specific | |
| messenger_boots | boot | PASS | Форма входа заполнена кредами из `.env.local`, затем реальный клик `Войти` → `http://localhost:5173/`. В DOM: `aside` (innerText `Чаты`, h2 `Чаты`, кнопка `Меню`), `main` (innerText `Выберите, кому хотели бы написать`). Сеть: `GET …/waInstance<id>/getStateInstance/<token>` → 200 `{stateInstance:"authorized"}`, затем `GET …/waInstance<id>/getAccountSettings/<token>` → 200. Других запросов нет. В `localStorage` один ключ `greenapi-messenger:session`. Консоль: 0 errors / 0 warnings (только vite debug и React DevTools info) | | shared | |
| desktop_two_columns | layout | PASS | 1440×900. Каркас: flex, 1440×900, `background-image: linear-gradient(135deg, rgb(178,201,158) 0%, rgb(169,197,159) 50%, rgb(152,189,144) 100%)`. `aside`: x=18 y=18 w=420 h=864, `margin: 18px 0 18px 18px`, `border-radius: 24px`, фон `rgb(255,255,255)`. `main`: x=438 w=1002 h=900, `display: flex`, фон прозрачный, `checkVisibility()` → true. Пилюля (div 298.1×29.6) по центру `main`: dx=-0.05, dy=0. Гамбургер 44×44 в (34,28). Горизонтального скролла нет. Все числа совпадают с iter-1 | | item_specific | |
| mobile_single_column | layout | PASS | 390×844 (visualViewport 390.4, тот же DPR-артефакт, что в iter-1). `aside`: x=0 y=0 w=390.4 h=844, `border-radius: 0px`, `margin: 0px`, фон белый. У `main` `display: none`, пилюля не видна. `elementFromPoint(195,600)` → `ASIDE`, scrollWidth 390. Гамбургер в (16,10) | | item_specific | desktop_two_columns |
| account_menu | menu | PASS | Реальный клик «Меню» → `aria-expanded="true"`, есть `aria-controls`. Выпадающий блок 240×131 в (34,76): radius 12px, z-index 2, `tabIndex=-1`, `outline: none`. Содержимое: p `Аккаунт` (12px/400, rgb(112,117,121)), p `@stevvy_vn` (16px/400), кнопка `Выйти`. В сыром ответе `getAccountSettings` `username: "@stevvy_vn"`, строка в UI совпадает. При открытии меню новых запросов нет (всего 2). (a)–(e) — ниже. Escape закрывает меню | | item_specific | |
| logout | menu | PASS | Меню → реальный клик `Выйти` → `http://localhost:5173/login`. Маркер `window.__marker` пропал, значит страница перезагрузилась полностью (`signOut`). h1 `Вход`, оба поля пустые, `Войти` неактивна, `localStorage` пуст. Повторный `goto http://localhost:5173/` → снова `/login`. Консоль 0/0 | | item_specific | |

**Дополнительная проверка `account_menu` (сравнение с iter-1):**

- **(a) Фокус при открытии — PASS.** После клика по гамбургеру `document.activeElement` — сам выпадающий блок (`DIV`, `tabIndex -1`), `:focus-visible` не срабатывает, рамки нет. В iter-1 фокус после клика оставался на гамбургере, а в меню попадал только по Tab.
- **(b) Клик по подписи «Аккаунт», затем Escape — PASS.** После клика меню открыто, фокус по-прежнему внутри выпадающего блока. `Escape` → `aria-expanded="false"`, `aria-controls` снят, выпадающего блока и подложки в DOM нет. Фокус на гамбургере (`:focus-visible`, outline `rgb(51,144,236)`). Сценарий, который в iter-1 зависел от браузера (фокус на `body` после клика), закрыт.
- **(c) Tab из «Выйти» наружу — буквально невыполнимо в фазе 4; эквивалент PASS.** Порядок Tab на странице: `Open Tanstack query devtools` (только в dev, стоит в DOM перед layout) → `Меню` → (меню открыто) `Выйти`. После «Выйти» фокусируемых элементов нет. Tab из «Выйти» уводит фокус из документа: `focusout` с `relatedTarget: null`, активным становится `BODY`. Меню остаётся открытым, как задумал разработчик, чтобы клик в Safari не терялся. Переход фокуса за пределы меню проверил так: меню открыто → Shift+Tab (фокус на гамбургер, меню открыто) → Shift+Tab → `focusout` с `relatedTarget = BUTTON[Open Tanstack query devtools]` → меню закрыто, блока в DOM нет. Механизм `onBlur` работает.
- **(d) Клик по подложке — PASS.** Подложка `position: fixed`, 1440×900, z-index 1, `tabIndex -1`. `elementFromPoint(720,450)` и `(1000,800)` попадают в неё. Реальный клик по центру окна → меню закрыто, URL остаётся `/`. Подложка закрыла меню и из состояния, описанного в Notes, когда фокус уже был снаружи.
- **(e) Клик по «Выйти» не теряется — PASS.** Меню открыто, фокус на выпадающем блоке → реальный клик `Выйти` → выход сработал (строка `logout`).

```yaml
verdict:
  matrix:
    - check_id: raw_values_in_ui
      dependency_group: independent
      status: PASS
      evidence: "все тексты UI из словаря или отформатированы; сырых ключей, enum, null/undefined и двойного @ нет; ключ app удалён из ru.json и нигде не используется"
      root_cause_scope: item_specific
    - check_id: messenger_boots
      dependency_group: boot
      status: PASS
      evidence: "после входа через форму: aside с h2 «Чаты» и кнопкой «Меню», в main пилюля «Выберите, кому хотели бы написать»; getStateInstance 200, getAccountSettings 200, других запросов нет; консоль 0/0"
      root_cause_scope: shared
    - check_id: desktop_two_columns
      dependency_group: layout
      status: PASS
      evidence: "1440x900: aside 420x864 at (18,18), radius 24px, white; main 1002x900 visible; градиент на каркасе; пилюля по центру (dx -0.05, dy 0); совпадает с iter-1"
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
      evidence: "меню: «Аккаунт» + «@stevvy_vn» (совпадает с сырым username) + «Выйти»; при открытии фокус в выпадающем блоке; клик по подписи + Escape закрывает, фокус возвращается на гамбургер; уход фокуса на внешний элемент (Shift+Tab) закрывает; подложка закрывает; повторного запроса нет"
      root_cause_scope: item_specific
    - check_id: logout
      dependency_group: menu
      status: PASS
      evidence: "клик «Выйти» срабатывает при фокусе в меню → полная перезагрузка, /login, localStorage пуст; повторный переход на / → /login"
      root_cause_scope: item_specific
  blockers: []
  overgeneralization_risk: false
  ready_to_escalate: true
```

## Design verification
STATUS: PASSED

- Список чатов, пустое состояние справа (десктоп) — Reference: `docs/design/01-wide-empty.png` → PASSED. Раскладка совпадает с iter-1 до пикселя: белая карточка-панель с отступом 18px сверху, слева и снизу, `border-radius` 24px, справа фон-градиент, гамбургер 44×44 слева в шапке. PNG заново не открывал: геометрия не изменилась, сверка с референсом из iter-1 остаётся в силе.
- Мобильный список — Reference: `docs/design/04-mobile-list.png` → PASSED. Панель во весь экран без скругления, гамбургер в (16,10), правой колонки нет. Совпадает с iter-1.
- Пилюля «Выберите, кому хотели бы написать» (теперь `src/pages/HomePage/`): padding 4px 12px, radius 9999px, фон `rgb(114,166,100)` = `palette.datePill`, текст белый 16px / 500 / 21.6px, по центру `main`. Совпадает с iter-1.
- Меню аккаунта — Free choice → не проверяется.

## Notes
- **(c), граничный случай только в dev.** Tab из «Выйти» уводит фокус из документа (`relatedTarget: null`), и меню остаётся открытым. Следующий Tab вернул фокус в страницу на кнопку `Open Tanstack query devtools`: она вне меню, но первая в порядке Tab. Меню при этом осталось открытым, и `Escape` его уже не закрывает: keydown не доходит до корня меню. Закрыла его подложка. Это происходит только в dev: в production devtools не рендерятся, и после возврата в страницу фокус попадает на гамбургер внутри корня меню, где `Escape` работает. В матрицу не выношу. Перепроверить в Phase 5, когда после шапки панели появятся элементы списка чатов: тогда Tab из «Выйти» даст ненулевой `relatedTarget`, и меню должно закрыться.
- **Брейкпоинт и DPR.** Как и в iter-1, у Chromium в Playwright на этом хосте DPR = 1.0000000149, поэтому visualViewport равен 390.4 при заданных 390. На результаты матрицы это не влияет.
- **Скелетон строки аккаунта** снова не виден: `getAccountSettings` отвечает при монтировании layout, раньше первого открытия меню. В матрице его нет.
- **Запросы к GREEN-API:** `getStateInstance` (1) и `getAccountSettings` (1), оба 200. `checkAccount` / `getContactInfo` не вызывались. В отчёте URL замаскированы (`<id>`, `<token>`).
- Креды передавал в браузер одноразовый helper на `127.0.0.1:5199` (читал `.env.local`, отдавал не больше двух ответов). Поля заполнялись через native value setter с событием `input`, `Войти` нажималась реальным кликом. Snapshot заполненной формы не снимался, креды не попали ни в аргументы инструментов, ни в отчёт.
- Teardown: `localStorage` / `sessionStorage` очищены, браузер закрыт. Dev-сервер (`:5173`) и helper (`:5199`) остановлены, порты свободны. `.playwright-mcp/` и скрипт helper-а удалены.
