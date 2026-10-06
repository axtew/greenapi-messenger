STATUS: APPROVED
Issue source: none

## Summary
Перепроверены `unknown_chat_redirect` и постоянная `raw_values_in_ui`, обе PASS. Скелетоны после переноса на общий `Skeleton` выглядят как в iter-2: размеры, радиус, фон и анимация совпадают. Заодно сняты скелетоны списка чатов и меню аккаунта во время единственной свежей синхронизации при входе. Остальные строки перенесены из iter-2 / iter-1 (PASS) без повторного запуска. Квота: `checkAccount` — 0, `getContactInfo` — 1.

## Visual Verification
STATUS: PASSED

| check_id | dependency_group | status | evidence | blocker_check_id | root_cause_scope | contrast_with |
| --- | --- | --- | --- | --- | --- | --- |
| raw_values_in_ui | independent | PASS | После редиректа на `/` (1440): `main` — `Выберите, кому хотели бы написать`; `aside` — `Чаты / Artur Ovcharenko / вс / Приветствую!`. Меню аккаунта (реальный клик): `Аккаунт / @<username> / Выйти`. aria-label: `Меню`, `Новый чат` (плюс `Open Tanstack query devtools` от dev-инструментов). Заглушка шапки текста не содержит (`textContent` пустой), все скелетоны — пустые `div` без текста. `undefined`, `NaN`, `null`, `[object`, ключей словаря нет. `<title>` — `GREEN-API Messenger` | | item_specific | |
| new_chat_opens | new-chat | PASS | Перенесено из iter-2 (`phase-6/iter-2/VISUAL.md`) без перезапуска | | shared | |
| new_chat_invalid | new-chat | PASS | Перенесено из iter-1 (`phase-6/iter-1/VISUAL.md`) | | item_specific | |
| list_item_opens_chat | chat | PASS | Перенесено из iter-1 | | item_specific | |
| new_chat_existing | new-chat | PASS | Перенесено из iter-1 (`checkAccount` повторно не вызывался) | | item_specific | |
| chat_header | chat | PASS | Перенесено из iter-2 | | item_specific | |
| unknown_chat_redirect | chat | PASS | `/chat/1` в iframe того же origin, опрос DOM раз в ~1 мс. **1440×900:** 14 мс — путь `/chat/1`. **197 мс** — заглушка: `main header` 880×56 по (499,18), текста нет. В ней два `Skeleton`: **42×42** по (507,25) и **160×14** по (561,39). У обоих radius `9999px`, фон `rgb(244, 244, 245)`, `animation 1.5s ease-in-out infinite`, `flex-shrink: 0`. «Назад» `display: none`, `aside` `flex`. Сеть: `getAccountSettings` 188–528, `getChats` 189–520, `getChatHistory` 521–827, `getContactInfo` нет. Последний кадр с заглушкой — 827 мс. **839 мс** — путь `/`, в `main` `Выберите, кому хотели бы написать`, шапки чата нет, горизонтального скролла нет. **390×844:** 145 мс — шапка 374.4×56 по (8,8), скелетоны 42×42 по (72,15) и 160×14 по (126,29), те же radius / фон / анимация. «Назад» `flex` 44×44 по (16,14), `aside` `none`. 750 мс — `/`, `aside` 390.4 в ширину, `main` `none`. **Ветка `min(160px, 50%)`, 300×700:** у шапки 284 ширина и padding `6px 16px 6px 8px`, контент 260. Полоса имени — **130×14** (= 50 % от 260), аватар 42×42. 753 мс — `/`. Все три запроса 200. **Replace, верхний уровень:** на `/` `history.length` 3. `goto /chat/1` добавляет одну запись, после редиректа на `/` длина **4**, а не 5: запись `/chat/1` заменена. В iframe `history.length` 3 → 3 | | item_specific | |
| mobile_chat_back | layout | PASS | Перенесено из iter-2 | | item_specific | |
| account_menu_tab_out | menu | PASS | Перенесено из iter-1 | | item_specific | |

```yaml
verdict:
  matrix:
    - check_id: raw_values_in_ui
      dependency_group: independent
      status: PASS
      evidence: "/ после редиректа и меню аккаунта — только значения ru.json; заглушка шапки и скелетоны без текста; undefined/NaN/null/ключей нет (iter-3)"
      root_cause_scope: item_specific
    - check_id: new_chat_opens
      dependency_group: new-chat
      status: PASS
      evidence: "перенесено из iter-2 (phase-6/iter-2/VISUAL.md)"
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
      evidence: "перенесено из iter-2 (phase-6/iter-2/VISUAL.md)"
      root_cause_scope: item_specific
    - check_id: unknown_chat_redirect
      dependency_group: chat
      status: PASS
      evidence: "/chat/1: Skeleton 42x42 + 160x14 (130x14 при контенте шапки 260 — ветка 50%), radius 9999px, rgb(244,244,245), 1.5s ease-in-out infinite; 197–827 мс, затем / с replace (history 3 → goto 4 → 4); 390px — «Назад» 44x44 видна (iter-3)"
      root_cause_scope: item_specific
    - check_id: mobile_chat_back
      dependency_group: layout
      status: PASS
      evidence: "перенесено из iter-2 (phase-6/iter-2/VISUAL.md)"
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

`design.source: none`, Figma нет. Скелетоны — Free choice. Их числа сверены с iter-2 и с DEV-REPORT iter-3: расхождений нет.

## Notes
- **Остальные скелетоны** (сверх строк матрицы). Сняты за одну свежую синхронизацию при входе: localStorage был пуст, `getContactInfo` вызван один раз. 1440×900, тот же опрос DOM, время — от заполнения формы.
  - **Список чатов**, 4765–6566 мс, путь `/`, ссылок 0. Три строки `SSkeletonRow`: `flex`, `align-items: center`, gap 12px, padding 9px, `min-height` 72px, размер 404×72. В строке аватар **54×54** по (35,91). Колонка строк шириной 320 с gap 10px, в ней полосы **144×14** (= 45 %) по (101,99) и **240×14** (= 75 %) по (101,123). У всех radius `9999px`, фон `rgb(244, 244, 245)`, `1.5s ease-in-out infinite`, `flex-shrink: 0`. 6578 мс — скелетонов нет, 1 ссылка чата.
  - **Меню аккаунта.** Открыто на 4765 мс **синтетическим** `button.click()` из опроса: реальный клик не успел бы, пока идёт `getAccountSettings` (4759–6382 мс). Скелетон **123.84×22**: контейнер 238.4, padding `8px 16px 12px`, контент 206.4, 60 % = 123.84. Radius, фон и анимация те же. Подпись `Аккаунт` над ним. 6386 мс — скелетон сменился строкой аккаунта. Меню закрыто Escape.
  - `flex-shrink: 0` у строк списка и аккаунта (новое в iter-3) размеров не изменил: 14 и 22 по высоте, как задано.
- **Квота.** Вход: `getStateInstance`. Свежая синхронизация: `getAccountSettings`, `getChats`, `getContactInfo` (1), `getChatHistory`, `download` (фото аватара). Каждый из трёх iframe и переход на `/chat/1` на верхнем уровне: `getAccountSettings`, `getChats`, `getChatHistory`, без `getContactInfo`. `checkAccount` — 0.
- **Консоль.** Одна ошибка за прогон: `429 Too Many Requests` на `getChatHistory` (URL `…/waInstance<id>/getChatHistory/<token>`). Ответ пришёл в одном из двух iframe, которые шли подряд (1440 и 390); какой именно, не записано — iframe удалён до чтения `responseStatus`. Редирект и тайминги в обоих одинаковы: запрос завершился, `isFetching` погас. Это лимит частоты запросов GREEN-API на быстрых подряд прогонах, а не дефект фазы. Следующий iframe (300) запущен после паузы 5 с: все ответы 200. На верхнем уровне тоже всё 200, ошибок и предупреждений после последней навигации 0.
- **Креды.** Одноразовый helper на `127.0.0.1:5199` читал `.env.local` и отдал креды один раз, дальше отвечал 410. Поля заполнялись native setter, наружу возвращались только длины. «Войти» нажата реальным кликом. Токен, idInstance и номер в отчёт не попали.
- **Teardown.** localStorage и sessionStorage очищены, браузер закрыт. Dev-сервер `:5173` и helper `:5199` остановлены, порты свободны. `.playwright-mcp/` и скрипт helper удалены. Исходники не менялись: `git status` такой же, как в снимке на старте.
