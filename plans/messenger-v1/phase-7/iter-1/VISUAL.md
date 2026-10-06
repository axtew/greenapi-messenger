STATUS: APPROVED
Issue source: none

## Summary
Проверена лента переписки тестового чата на 1440×900, 1440×450 и 390×844. Все шесть строк матрицы и постоянная `raw_values_in_ui` — PASS. В живой истории не хватало трёх случаев: «Сегодня» / «Вчера», нетекстовое сообщение и `FAILED`. Их проверил временными пробами без отправки сообщений: подменой «сейчас» и дописыванием записей в ответ `getChatHistory`. Квота: `getContactInfo` — 1 (свежая синхронизация при входе), `checkAccount` — 0, `sendMessage` — 0.

## Visual Verification
STATUS: PASSED

| check_id | dependency_group | status | evidence | blocker_check_id | root_cause_scope | contrast_with |
| --- | --- | --- | --- | --- | --- | --- |
| raw_values_in_ui | independent | PASS | `main` на `/chat/<test_chat_id>`: шапка `Artur Ovcharenko / @<username>`, пилюли `3 октября` / `4 октября`, 8 пузырей, время `HH:MM`. `aside` — `Чаты / Artur Ovcharenko / вс / Приветствую!`. aria-label: `Меню`, `Новый чат`, `Назад` (плюс `Open Tanstack query devtools` от dev-инструментов). В `main` и `aside` нет `undefined`, `NaN`, `null`, `[object`, ключей словаря (`chat.`, `sidebar.`) и U+FFFD. В пробах: `Сообщение этого типа не поддерживается`, `Не доставлено`, `Сегодня`, `Вчера` — значения `ru.json`. `<title>` — `GREEN-API Messenger` | | item_specific | |
| history_loaded | history | PASS | Реальный клик по чату в списке → ровно один `POST getChatHistory` с телом `{"chatId":"<test_chat_id>","count":100}`, **200**, 375 мс. Пока идёт запрос — 3 анимированных скелетона, затем лента. Сырой ответ — 9 записей, все `textMessage`. В DOM **8 пузырей**: удалённая запись скрыта. Тексты всех пузырей совпадают с не удалёнными записями ответа. Входящие: `justify-content: flex-start`, пузырь в 9 px от левого края ленты, фон `rgb(255,255,255)` (`surface`). Исходящие: `flex-end`, в 9 px от правого края, фон `rgb(238,255,222)` (`bubbleOutgoing`). Время есть в каждом пузыре. Порядок на 4 октября: IN 13:31, IN 13:31, IN 13:31, OUT 13:54, OUT 14:49. **Повторное открытие:** «назад» в истории → `/`, снова реальный клик по чату → новый `getChatHistory` `count:100`, 200. Лента из кэша показана сразу, без скелетонов | | shared | |
| date_separators | history | PASS | **Живые данные** (сейчас 06.10.2026): две пилюли `3 октября` и `4 октября`, каждая перед первым сообщением дня. «Сегодня» и «Вчера» в живой истории не встречаются: последнее сообщение — 04.10. **Проба 1:** глобальный `Date` подменён так, что `new Date()` без аргументов = 04.10.2026 15:00. `Date.now` не трогал. Повторное открытие чата реальным кликом → `Вчера` перед 22:44 / 22:44 / 23:05, `Сегодня` перед 13:31 … 14:49. После этого `Date` восстановлен. **Проба 2:** стаб-записи с сегодняшней датой → третья пилюля `Сегодня` после блока 4 октября. Стиль пилюли: фон `rgb(114,166,100)` (`datePill`), radius `9999px`, padding `4px 12px`. Текст `<p>` (H3): `rgb(255,255,255)`, 16px, weight 500. Отступ центра пилюли от центра ленты — 0 px (1440 и 390). Высота 30 px, margin 8px сверху и снизу | | item_specific | |
| deleted_hidden | history | PASS | Сырой ответ: одна запись `isDeleted: true` с непустым `deletedMessageId`, исходного сообщения в ответе нет. Её `textMessage` из 76 символов начинается с восьми U+FFFD («кракозябры»). Этого текста и его первых 10 символов в `main.innerText` нет, U+FFFD в DOM нет. Пузырей 8 при 9 записях | | item_specific | |
| links_clickable | history | PASS | Ссылки есть в двух живых пузырях: входящий 23:05 и исходящий правленый 13:54. В обоих `<a href="https://green-api.com" target="_blank" rel="noopener noreferrer">`, текст ссылки = `href`, цвет `rgb(51,144,236)` (`primary`). **Проба 2:** ссылка с точкой в конце (`https://green-api.com/aaa….`) → `href` длиной 142 символа заканчивается на `aaa`, точка осталась текстом. Те же `target` и `rel` | | item_specific | |
| scrolled_to_bottom | history | PASS | **1440×900, первое открытие:** лента помещается целиком (`scrollHeight` 808 = `clientHeight` 808, `scrollTop` 0) — прокрутка не нужна. **1440×450, повторное открытие** (лента из кэша): `scrollTop` 100.8, `clientHeight` 358, `scrollHeight` 459, разница 0.2 px. Последний пузырь виден: низ 416 при низе ленты 432. **1440×450, перезагрузка `/chat/<test_chat_id>`** (кэша нет, данные из сети): те же 100.8 / 358 / 459, разница 0.2. **390×844, проба 2** (рост 8 → 11 сообщений, пока лента внизу): `scrollTop` 327, `clientHeight` 772, `scrollHeight` 1099, разница 0 | | item_specific | |
| mobile_history | layout | PASS | 390×844: `aside` `display: none`, `main` 0…390. Шапка 374×56 по (8,8), лента 374 в ширину с x = 8. У `documentElement` `scrollWidth` 390 = `clientWidth` 390. У ленты `scrollWidth` = `clientWidth` (374; с вертикальным скроллбаром в пробе 2 — 359 = 359). Элементов `main` правее вьюпорта — 0. Входящие с x = 17, исходящие до x = 373. Пузыри в две строки и больше упираются в `max-width` 70%: 249 px = 0.7 × 356. **Проба 2:** текст из 220 `x` без пробелов и длинная ссылка переносятся (`word-break: break-word`). Пузырь 239×349, горизонтального скролла нет. Сверено с `05-mobile-chat.png`: та же раскладка (пилюли по центру, входящие слева, исходящие справа, шапка-пилюля сверху). Узора фона нет, «Unread Messages», «edited» и галочек нет — так задумано | | item_specific | |

```yaml
verdict:
  matrix:
    - check_id: raw_values_in_ui
      dependency_group: independent
      status: PASS
      evidence: "main/aside на /chat/<test_chat_id> и в пробах — только значения ru.json, время HH:MM, даты Intl; undefined/NaN/null/[object/ключей/U+FFFD нет"
      root_cause_scope: item_specific
    - check_id: history_loaded
      dependency_group: history
      status: PASS
      evidence: "реальный клик → getChatHistory {chatId:<test_chat_id>,count:100} 200; 3 скелетона → 8 пузырей из 9 записей; IN flex-start surface, OUT flex-end bubbleOutgoing, время в каждом; при повторном открытии свежий getChatHistory count:100 200"
      root_cause_scope: shared
    - check_id: date_separators
      dependency_group: history
      status: PASS
      evidence: "живые: «3 октября» / «4 октября»; проба с подменой «сейчас» = 04.10: «Вчера» / «Сегодня»; datePill rgb(114,166,100), H3 белый 16px/500, по центру (отклонение 0)"
      root_cause_scope: item_specific
    - check_id: deleted_hidden
      dependency_group: history
      status: PASS
      evidence: "запись isDeleted:true с текстом из U+FFFD в сыром ответе есть, в DOM нет; 9 записей → 8 пузырей"
      root_cause_scope: item_specific
    - check_id: links_clickable
      dependency_group: history
      status: PASS
      evidence: "2 живые ссылки https://green-api.com: <a target=_blank rel=noopener noreferrer>, цвет primary; в пробе завершающая точка не вошла в href"
      root_cause_scope: item_specific
    - check_id: scrolled_to_bottom
      dependency_group: history
      status: PASS
      evidence: "1440x450 из кэша и из сети: scrollHeight - scrollTop - clientHeight = 0.2; 390 после роста 8→11 — 0; на 1440x900 лента помещается без прокрутки"
      root_cause_scope: item_specific
    - check_id: mobile_history
      dependency_group: layout
      status: PASS
      evidence: "390x844: scrollWidth 390 = clientWidth; у ленты scrollWidth = clientWidth; 0 элементов за правым краем; max-width 70% (249 = 0.7·356); длинное слово без пробелов и длинная ссылка переносятся"
      root_cause_scope: item_specific
  blockers: []
  overgeneralization_risk: false
  ready_to_escalate: true
```

## Design verification
STATUS: NOT_REQUESTED

`design.source: none`, Figma нет. Поверхность «Открытый чат» — Reference: `docs/design/02-wide-chat.png`, `03-desktop-narrow-chat.png`, `05-mobile-chat.png`. Сверял структуру и снимал числа, пиксели не сравнивал.

- **Пузыри.** Входящий: `surface` `rgb(255,255,255)`, слева. Исходящий: `bubbleOutgoing` `rgb(238,255,222)`, справа. `max-width: 70%`: на 1440 предел 603 px при ряде 862, на 390 — 249. padding `6px 8px 6px 10px`, `white-space: pre-wrap`, `word-break: break-word`. radius `15px` (`radii.bubble`), у пузыря с хвостиком угол со стороны хвостика 0.
- **Хвостик** только у последнего в группе. Группа 4 октября: IN 13:31 ×3 — хвостик только у третьего; у первых двух `::before` нет и `margin-bottom` 2px, у последнего 8px. OUT 13:54 без хвостика, OUT 14:49 с хвостиком. Хвостик — `::before` 9×16, `left: -8px` у входящих и `right: -8px` у исходящих, фон наследуется от пузыря, `clip-path: path(…)`. Строки с хвостиком и без начинаются с одного x (9 px от края ленты): выравнивание не прыгает.
- **Время** внутри пузыря справа снизу: от правого края пузыря 8 px (= padding), от нижнего 0 px. Caption 12px. У входящих `rgb(112,117,121)` (`textMuted`), у исходящих `rgb(79,174,78)` (`metaOutgoing`), `opacity` 1. В многострочном исходящем пузыре время встаёт в последнюю строку.
- **Пилюля даты:** `datePill` `rgb(114,166,100)`, белый H3 16px / 500, по центру ленты, radius `9999px`, padding `4px 12px`.
- **Пробы.** Нетекстовое (`stickerMessage`) → курсивом `Сообщение этого типа не поддерживается` (`font-style: italic`), время на месте. Исходящее `statusMessage: "failed"` → вместо времени `Не доставлено` цветом `rgb(229,57,53)` (`danger`). У записей истории `failReason` всегда `null`, поэтому суффикса `: <причина>` нет.
- **Отличия от референса, не дефекты:**
  - узора фона, «Unread Messages», «edited», галочек нет — в плане они «не делаем»;
  - правленое исходящее «Ответьте, пожалуйста…» стоит на 4 октября в 13:54 (время записи правки в сыром ответе), а не среди сообщений 3 октября, как в Telegram. Так задумано: `brainstorm.md`, «Правки и удаления» — исходное время недоступно.

## Notes
- **Чего нет в живой истории тестового чата и как это закрыто.**
  - «Сегодня» / «Вчера»: последнее сообщение от 04.10 → проба 1 с подменой «сейчас».
  - Нетекстовое сообщение и `FAILED`: все 9 записей — `textMessage`, у исходящих статус `read` → проба 2.
  - Ссылка с хвостовой пунктуацией и длинное слово без пробелов → проба 2.
  - Как устроены пробы. Проба 1 подменяла глобальный `Date` (только `new Date()` без аргументов). Проба 2 обёрткой `fetch` дописывала три синтетические записи в **ответ** `getChatHistory`, сам запрос уходил без изменений. Ни одна проба ничего не отправляла и не писала в localStorage: после проб `probe` в хранилище нет. Чат открывался реальными кликами по списку и по кнопке «Назад».
  - Ветка «дата прошлого года» (`4 октября 2025 г.`) живьём не наблюдалась.
- **Наблюдение вне матрицы, не блокер: `429` на `getChatHistory` при перезагрузке `/chat/<test_chat_id>`.** Это единственная ошибка консоли за прогон.
  - Тайминги `PerformanceResourceTiming`: история чата (`count:100`) стартует сразу, на 226 мс, потому что чат есть в localStorage и лента монтируется до синхронизации. Синхронизация идёт последовательно: `getChats` 225–525, затем `getChatHistory` на 527 мс → **429**.
  - **Symptom confirmed, root cause — гипотеза.** Тело запроса, получившего 429, не снято: после перезагрузки обёртки `fetch` не было. По времени старта это `count:1` синхронизации: он стартует через 2 мс после конца `getChats`, пока `count:100` ещё летит (226–851).
  - Видимых последствий в этом прогоне нет. Лента загрузилась (200), превью в списке осталось прежним (`вс / Приветствую!`), `role="alert"` нет. `fetchLastMessage` глотает ошибку, и известный чат сохраняет то, что у него было.
  - Структурно Phase 7 добавила параллельный `getChatHistory` к синхронизации, которая намеренно идёт последовательно из-за лимитов частоты. При прямом заходе или перезагрузке на экране чата столкновение возможно при каждом старте. Решать владельцу: принять, разнести запросы или записать в `BACKLOG.md`.
- **Квота.** Вход: `getStateInstance`. Свежая синхронизация: `getAccountSettings`, `getChats`, `getContactInfo` (**1**), `getChatHistory` `count:1`. `getChatHistory` `count:100` — 5 раз: первое открытие, повторное открытие, перезагрузка, пробы 1 и 2. Перезагрузка добавила `getAccountSettings`, `getChats`, `getChatHistory` `count:1` (429), без `getContactInfo`. `checkAccount` и `sendMessage` — 0.
- **Креды.** Одноразовый helper на `127.0.0.1:5199` читал `.env.local` и отдал креды один раз, дальше отвечал 410. Поля заполнялись native setter, наружу возвращались только длины. «Войти» нажата реальным кликом. Сеть снималась обёрткой `fetch`, которая сразу маскирует chatId в телах. Токен, idInstance, chatId и username в отчёт не попали. Они мелькали в выводе инструментов (URL страницы, текст ошибки 429 в консоли), но только там.
- **Teardown.** localStorage и sessionStorage очищены, браузер закрыт. Dev-сервер `:5173` и helper `:5199` остановлены, порты свободны. `.playwright-mcp/` (в нём был лог консоли с URL 429) и скрипт helper удалены. Исходники не менялись: `git status` такой же, как в снимке на старте.
