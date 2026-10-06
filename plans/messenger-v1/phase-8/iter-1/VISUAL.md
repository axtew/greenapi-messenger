STATUS: NEEDS_CHANGES
Issue source: code

## Summary
Phase 8 проверена на живом инстансе: 1440×900, 1440×450 и 390×844. Отправлено 3 реальных сообщения, все в тестовый чат. Все пять строк матрицы фазы и `raw_values_in_ui` — PASS: отправка, Shift+Enter, `disabled`, «Не доставлено: нет связи с GREEN-API» и превью списка работают. Одна находка `[code]` (root cause confirmed): при каждом открытии чата и каждой перерисовке `ChatPage` React пишет `console.error` «Encountered two children with the same key». Причина — у соседей `<MessageList key={chatId}>` и `<Composer key={chatId}>` одинаковый ключ.

## Visual Verification
STATUS: FAILED

| check_id | dependency_group | status | evidence | blocker_check_id | root_cause_scope | contrast_with |
| --- | --- | --- | --- | --- | --- | --- |
| raw_values_in_ui | independent | PASS | `/chat/<test_chat_id>` после отправок. В тексте `aside` + `main`, в aria-label и placeholder нет `undefined`, `NaN`, `null`, `[object`, ключей словаря (`chat.`, `sidebar.`, `common.`, `sendErrors.`) и U+FFFD. aria-label / placeholder: `Меню`, `Новый чат`, `Назад`, `Сообщение`, `Отправить` и `Open Tanstack query devtools` (последний — от dev-инструментов). «Не доставлено: нет связи с GREEN-API» — `chat.failedLabel` + `sendErrors.network` из `ru.json`. `<title>` — `GREEN-API Messenger` | | item_specific | |
| send_appears | send | PASS | 1440×450, «Проверка отправки 1» + реальный Enter. Пузырь появляется сразу, в состоянии SENDING: время `14:10` с `opacity: 0.5`. Он справа (`justify-content: flex-end`), фон `rgb(238,255,222)` (`bubbleOutgoing`), последний в ленте (строка 13 из 14). Поле `""`, в фокусе, кнопка `disabled`. Сеть: `sendMessage` POST **200** за 579 мс, тело — только `idMessage` (13 символов). Через ~557 мс после появления время `opacity: 1`, цвет `rgb(79,174,78)` (`metaOutgoing`), позиция та же (13/14). Лента у низа (зазор 1 px) | | shared | |
| shift_enter_newline | composer | PASS | Реальные Shift+Enter: значение с переводами строк (7 строк, 6 переносов), `sendMessage` — 0. Высота `textarea`: 44 → 66 → 110 (4 строки) → 132 (5 строк) → 132 (7 строк, `scrollHeight` 176, прокрутка внутри поля, `overflow-y: auto`). Кнопка прижата к низу плашки на всех шагах (низ кнопки 426, низ формы 432). Лента 294 → 272 → 228 → 206 px, на каждом шаге у низа (зазор 0) | | item_specific | |
| empty_disabled | composer | PASS | Пустое поле: `disabled`, `opacity: 0.6`. 5 пробелов реальным вводом: `disabled`. Enter на пробелах: значение не изменилось, `sendMessage` — 0. Непустой текст «строка 1»: активна, `opacity: 1`. После каждой отправки снова `disabled` | | item_specific | |
| send_failed_offline | send | PASS | Офлайн эмулирован без отправки. В живую страницу добавлен meta-тег CSP `connect-src 'self' ws://localhost:5173`. Контрольный `fetch` на чужой origin дал `TypeError` и нарушение CSP. «Проверка офлайн» + реальный Enter: `fetch` `sendMessage` → `TypeError`, нарушение `connect-src` с хостом `api.green-api.com` (1). Число resource-записей к `api.green-api.com` не изменилось (11 → 11): запрос из браузера не ушёл. Пузырь справа, `bubbleOutgoing`. Подпись **`Не доставлено: нет связи с GREEN-API`**, `rgb(229,57,53)` (`danger` `#e53935`), `opacity: 1`. Поле очищено и в фокусе. SENDING здесь не заметен: блокировка CSP синхронная, отказ приходит за < 10 мс | | item_specific | |
| list_preview_updated | send | PASS | Сразу после отправки строка тестового чата — `Artur Ovcharenko / 14:10 / Проверка отправки 1`; она выбрана, текст `onPrimary`. В `greenapi-messenger:chats:*` `lastMessage = {text: "Проверка отправки 1", timestamp: 1791270644, direction: "outgoing", isDeleted: false}`, `unreadCount: 0`. При быстрых отправках превью обновляется уже в SENDING: «…2», через ~24 мс «…3» | | item_specific | |
| console_clean | independent | FAIL | `console.error` React: «Encountered two children with the same key…», значение ключа — chatId тестового чата. Ошибка появляется при каждом открытии чата (2 из 2) и при каждой перерисовке `ChatPage` после обновления кэша списка (каждая отправка). За прогон — 6 одинаковых ошибок. **Root cause confirmed:** в `src/pages/ChatPage/_ChatPage.tsx:30-31` соседи внутри одного фрагмента — `<MessageList key={chatId} …/>` и `<Composer key={chatId} …/>`; других соседей с ключом chatId в `src` нет (Grep по `key={`). В chore-deleted iter-1 ошибок консоли было 0 | | item_specific | |

```yaml
verdict:
  matrix:
    - check_id: raw_values_in_ui
      dependency_group: independent
      status: PASS
      evidence: "aside/main/aria-label/placeholder на /chat/<test_chat_id>: только значения ru.json и HH:MM; undefined/NaN/null/[object/ключей/U+FFFD нет"
      root_cause_scope: item_specific
    - check_id: send_appears
      dependency_group: send
      status: PASS
      evidence: "Enter → пузырь сразу, flex-end, bubbleOutgoing, время opacity 0.5 → 1 через ~557 мс на той же позиции; поле пустое и в фокусе; sendMessage POST 200 {idMessage}"
      root_cause_scope: shared
    - check_id: shift_enter_newline
      dependency_group: composer
      status: PASS
      evidence: "Shift+Enter → перевод строки в значении, sendMessage 0; высота 44→66→110→132 (5 строк), дальше прокрутка в поле (scrollHeight 176); лента у низа на каждом шаге"
      root_cause_scope: item_specific
    - check_id: empty_disabled
      dependency_group: composer
      status: PASS
      evidence: "пусто и 5 пробелов → disabled, opacity 0.6; Enter на пробелах не отправляет; текст → активна"
      root_cause_scope: item_specific
    - check_id: send_failed_offline
      dependency_group: send
      status: PASS
      evidence: "meta CSP connect-src self → fetch sendMessage TypeError, 0 новых resource-записей к GREEN-API; пузырь «Не доставлено: нет связи с GREEN-API» rgb(229,57,53)"
      root_cause_scope: item_specific
    - check_id: list_preview_updated
      dependency_group: send
      status: PASS
      evidence: "строка списка «14:10 / Проверка отправки 1» сразу; localStorage lastMessage {text, ts 1791270644, outgoing, isDeleted:false}, unread 0"
      root_cause_scope: item_specific
    - check_id: console_clean
      dependency_group: independent
      status: FAIL
      evidence: "6× console.error duplicate key = chatId; соседи MessageList и Composer с key={chatId} в _ChatPage.tsx:30-31 (root cause confirmed)"
      root_cause_scope: item_specific
  blockers: []
  overgeneralization_risk: false
  ready_to_escalate: true
```

### Дополнительно проверено (по просьбе оркестратора)

- **SENDING → SENT** на той же позиции: время полупрозрачное (0.5), затем обычное (1), строка 13/14 не меняется. Узел пузыря при подтверждении пересоздаётся: ключ `local-*` → `idMessage`, ремоунт. На глаз это не видно, позиция та же.
- **Две быстрые отправки** (#2 — Enter, #3 — кнопка, разница ~24 мс). Оба пузыря сразу в SENDING, порядок #2 → #3 (строки 14/16, 15/16). Запросы строго по очереди (`scope`): #2 идёт 171196–171496 мс, #3 стартует в 171497 и заканчивается в 171812. Оба 200, оба SENT, порядок сохранён, у каждого текста ровно один пузырь.
- **Фокус** после каждой отправки (Enter и кнопка) остаётся на поле.
- **Esc в поле** (поле с 7 строками текста) → URL `/`, поля ввода нет, `sendMessage` — 0.
- **Кнопка:** `aria-label` «Отправить», 44×44, `rgb(51,144,236)` (`primary`), белая svg-иконка, `border-radius: 9999px`. Пустое поле — `disabled`, `opacity: 0.6`.
- **Плашка (1440):** 880×56, `surface` белый, `border-radius: 24px` (`panel`), отступы 6/6/6/20, `margin-top: 8px`, `gap: 8px`, `align-items: flex-end`. Внутри 1 `textarea` и 1 кнопка, скрепки, эмодзи и микрофона нет. `textarea`: 16px / 22px, `rows=1`, `maxLength=4096`, `max-height: 132px`, placeholder «Сообщение», `enterkeyhint="send"`.
- **Мобильная 390×844:** `aside` скрыт, `main` во всю ширину. Плашка 374×56 с отступом 8 px по краям, `textarea` 296×44 16px, кнопка 44×44. Горизонтального переполнения нет. Лента у низа.
- **Лента при ресайзе окна** 900 → 450 осталась у низа (зазор 0): `ResizeObserver` срабатывает.

## Design verification
STATUS: NOT_REQUESTED

`design.source: none`, Figma нет. Поверхность Composer — `Reference: docs/design/02-wide-chat.png`, `05-mobile-chat.png`, сверка только по структуре. Белая скруглённая плашка по ширине колонки, круглая кнопка `primary` справа на месте микрофона, скрепки и эмодзи нет — совпадает с референсом и п. 2 фазы.

## Issues
- **[code] `console_clean` — root cause confirmed.** `src/pages/ChatPage/_ChatPage.tsx:30-31`: оба соседа во фрагменте получают `key={chatId}`, и React на каждом рендере `ChatPage` пишет `console.error` о дублирующемся ключе. Ключ нужен для сброса обоих при смене чата, но у соседей он должен быть уникальным. Вариант правки: один `<Fragment key={chatId}>` вокруг `MessageList` и `Composer` вместо ключей на каждом. Сброс при смене чата сохранится. Ещё вариант — разные ключи (`messages-${chatId}` / `composer-${chatId}`). Регрессия этой фазы: до добавления `Composer` ключ был только у `MessageList`.

## Notes
- **Наблюдение, не FAIL.** Поле на 7 строк: `scrollTop` 31 при максимуме 44. Последняя строка (y 143–165) примерно на 2 px выходит за видимую область поля (31–163), нижний внутренний отступ при наборе не виден. Похоже на поведение Chrome: при прокрутке к каретке он не учитывает padding. Есть ли видимое обрезание нижних выносных элементов — решит владелец на стенде.
- **На решение владельца.** У недоставленного сообщения превью списка показывает его текст («Проверка офлайн») как обычное последнее сообщение, без пометки о недоставке. По плану это не оговорено (`onError` правит только ленту).
- **Квота.** `getStateInstance` — 1. Свежая синхронизация: `getAccountSettings`, `getChats`, `getContactInfo` (**1**), `getChatHistory` `count:1`. Ещё 2 открытия чата реальным кликом — 2 × `getChatHistory` `count:100`. **`sendMessage` — 3 реальных** («Проверка отправки 1/2/3», только тестовый чат: перед отправками `location.pathname` сверялся с `GREEN_API_TEST_CHAT_ID` из helper, `true`) плюс 1 заблокированный в браузере. Все реальные ответы 200, 429 не было. `checkAccount` — 0. Доставку трёх сообщений на телефон подтверждает владелец.
- **Креды и секреты.** Креды отдал один раз одноразовый helper на `127.0.0.1:5199`, который читал `.env.local`. Поля заполнялись native setter, наружу возвращались только длины. «Войти» нажата реальным кликом. Сеть снималась обёрткой `fetch`, которая записывала имя метода из пути, `count`, длину и начало отправляемого текста, статус и время. Тело `sendMessage` разбиралось в браузере, наружу ушли только ключи и длина `idMessage`. Ключ сессии не читался: была только булева проверка до входа. `browser_network_requests` и `browser_console_messages` не вызывались. Из лога консоли Playwright прочитаны только строки с предупреждением React о ключах, после фильтра URL GREEN-API (совпадений 0). **Токен и idInstance в вывод инструментов не попадали.** Нарушение CSP по заблокированному `sendMessage` Chrome записал в лог консоли `.playwright-mcp/` вместе с URL запроса, в котором есть токен. Этот лог не читался и удалён при teardown. chatId тестового чата виден в выводе инструментов как часть URL страницы, в отчёт не перенесён.
- **Teardown.** localStorage и sessionStorage очищены, браузер закрыт. Dev-сервер `:5173` и helper `:5199` остановлены, порты свободны. `.playwright-mcp/` и скрипт helper удалены. Исходники не менялись: `git status` совпадает со снимком на старте.
