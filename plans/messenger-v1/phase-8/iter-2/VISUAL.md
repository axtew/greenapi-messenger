STATUS: APPROVED
Issue source: none

## Summary
Повторно проверены `send_appears`, `send_failed_offline`, `console_clean` и `raw_values_in_ui` на 1440×900 и 390×844. Плюс дополнительные проверки iter-2: общий `IconButton` `primary` у FAB и кнопки отправки, блокировка отправки до загрузки истории, `SENDING → FAILED` у низа ленты на 390. Все строки PASS. Ошибки «two children with the same key» больше нет: за прогон в консоли 0 ошибок и 0 предупреждений. Реальных отправок 1 («Проверка отправки 4», тестовый чат, 200).

## Visual Verification
STATUS: PASSED

| check_id | dependency_group | status | evidence | blocker_check_id | root_cause_scope | contrast_with |
| --- | --- | --- | --- | --- | --- | --- |
| raw_values_in_ui | independent | PASS | `/chat/<test_chat_id>` на 390×844 после отправки и двух недоставленных. В тексте `aside` + `main`, в aria-label / placeholder / title и в `<title>` нет `undefined`, `NaN`, `null`, `[object`, ключей словаря (`chat.`, `sidebar.`, `common.`, `sendErrors.`) и U+FFFD. Атрибуты: `Меню`, `Новый чат`, `Назад`, `Сообщение`, `Отправить`, `Open Tanstack query devtools` (dev-инструменты). Подпись «Не доставлено: нет связи с GREEN-API» ×2. 14 меток времени `HH:MM` | | item_specific | |
| send_appears | send | PASS | 1440×900, «Проверка отправки 4» + реальный Enter. Пузырь в ленте через **40 мс** после `keydown` (MutationObserver). В этот момент поле уже `""`, фокус в поле. `sendMessage` POST **200** за 589 мс, `chatId` = тестовый (сверка в браузере), тело — только `idMessage` (13 символов). Пузырь в одном экземпляре, фон `rgb(238,255,222)` (`bubbleOutgoing`), справа: 9 px до правого края ленты, 650 px слева. Последний в ленте (12/12), лента у низа (зазор 0), время `14:33` с `opacity: 1` (SENT) | | shared | |
| shift_enter_newline | composer | PASS | перенесено из iter-1 (`phase-8/iter-1/VISUAL.md`): Shift+Enter → перенос, `sendMessage` 0, авторазмер 44→132 | | item_specific | |
| empty_disabled | composer | PASS | перенесено из iter-1: пусто и пробелы → `disabled`, `opacity: 0.6`, Enter не отправляет | | item_specific | |
| send_failed_offline | send | PASS | 390×844. Офлайн эмулирован обёрткой `fetch` в странице: `sendMessage` через 1,5 с бросает `TypeError: Failed to fetch`, запрос из браузера не уходит. Так отказ виден приложению как при обрыве сети, а URL с токеном не попадает в лог CSP. «Проверка офлайн 2» + реальный Enter, кадры `requestAnimationFrame`: SENDING (высота пузыря 35, зазор до низа −1 ≈ 0) → **FAILED** (высота 80, зазор −1 ≈ 0) **в том же кадре**. Примечание **`Не доставлено: нет связи с GREEN-API`** `rgb(229,57,53)` (`danger`) полностью в видимой области ленты: 717–753 при ленте 64–772, пузырь в 16 px от низа. Первый прогон («Проверка офлайн») — то же: зазор 0, примечание видно. Поле очищено, фокус в поле. Горизонтального переполнения нет | | item_specific | |
| list_preview_updated | send | PASS | перенесено из iter-1. В iter-2 заодно: строка списка сразу после отправки — «14:33 / Проверка отправки 4» | | item_specific | |
| console_clean | independent | PASS | `console.error` / `console.warn`, `window.onerror` и `unhandledrejection` перехватывались в странице до входа и во всех переходах (SPA, без перезагрузок): **0 записей**. Переходы: открытие чата с ошибкой истории → «Повторить» → загрузка → отправка → 2 недоставленных → Esc → `/` → чат → FAB «Новый чат» → Esc → (390) «Назад» → `/` → чат → Esc → `/`. В лог консоли Playwright за всю сессию — 1 строка, совпадений `same key` 0, `error` 0, `warn` 0 (считал `grep -c`, содержимое не читал). **В DOM ровно одна лента** (один прокручиваемый контейнер в `main`) и одно поле ввода на каждом шаге в чате: 1/1 сразу после клика и через 2,5 с; 1/1 при открытой панели «Новый чат»; на `/` — 0/0. Второго чата в списке нет, A→B проверен как чат → `/` → чат и чат → «Новый чат» → чат, без создания чатов | | item_specific | |

```yaml
verdict:
  matrix:
    - check_id: raw_values_in_ui
      dependency_group: independent
      status: PASS
      evidence: "aside/main/aria-label/placeholder/title на /chat/<test_chat_id> (390): только значения ru.json и HH:MM; undefined/NaN/null/[object/ключей/U+FFFD нет"
      root_cause_scope: item_specific
    - check_id: send_appears
      dependency_group: send
      status: PASS
      evidence: "Enter → пузырь через 40 мс, поле пустое и в фокусе; sendMessage POST 200 {idMessage}; flex-end, bubbleOutgoing, последний 12/12, лента у низа"
      root_cause_scope: shared
    - check_id: shift_enter_newline
      dependency_group: composer
      status: PASS
      evidence: "iter-1 (carry forward)"
      root_cause_scope: item_specific
    - check_id: empty_disabled
      dependency_group: composer
      status: PASS
      evidence: "iter-1 (carry forward)"
      root_cause_scope: item_specific
    - check_id: send_failed_offline
      dependency_group: send
      status: PASS
      evidence: "390×844, fetch-обёртка → TypeError: SENDING h35 → FAILED h80, зазор до низа ≈0 в том же кадре; «Не доставлено: нет связи с GREEN-API» rgb(229,57,53) полностью видно (717–753 в ленте 64–772)"
      root_cause_scope: item_specific
    - check_id: list_preview_updated
      dependency_group: send
      status: PASS
      evidence: "iter-1 (carry forward); iter-2: «14:33 / Проверка отправки 4» сразу"
      root_cause_scope: item_specific
    - check_id: console_clean
      dependency_group: independent
      status: PASS
      evidence: "перехват console.error/warn/onerror/unhandledrejection: 0 за все переходы; лог Playwright: same key 0, error 0; в DOM одна лента и одно поле на каждом шаге"
      root_cause_scope: item_specific
      contrast_with: console_clean@iter-1
  blockers: []
  overgeneralization_risk: false
  ready_to_escalate: true
```

### Дополнительно проверено (по просьбе оркестратора)

- **Отправка до загрузки истории (Amendment 18).** История тестового чата при первом открытии проверена в двух состояниях.
  - **Ошибка.** Обёртка `fetch` отклоняла `getChatHistory`: 3 попытки, наружу не ушла ни одна. Экран «Не удалось загрузить историю / Повторить», в поле «Проверка до загрузки». Кнопка `disabled`, `opacity: 0.6`, `cursor: default`. Реальный Enter: значение не изменилось, фокус в поле, `sendMessage` — 0, ошибка с «Повторить» на месте (локальная запись её не скрыла).
  - **Загрузка.** Реальный клик «Повторить», ответ `getChatHistory` придерживался в обёртке ~10 с. Ленты ещё нет, кнопка `disabled` (0.6). Реальный Enter: значение то же, `sendMessage` — 0. После ответа (200) история появилась, кнопка активна, `opacity: 1`, текст в поле сохранился.
- **FAB «Новый чат» (IconButton primary lg).** 1440: 56×56, 20/20 от правого нижнего угла `aside` (`offsetParent` — `aside`, обёртка-`div` `absolute` right/bottom 20px). 390: 56×56, тоже 20/20. Фон `rgb(51,144,236)` (`primary`), иконка 24 px белая (`onPrimary`), `border-radius: 9999px`, `type="button"`. Реальное наведение → `filter: brightness(0.92)`. Фокус с клавиатуры (Shift+Tab) → `:focus-visible`. После «Новый чат» → Esc фокус возвращается на FAB.
- **Кнопка «Отправить» (IconButton primary md).** 44×44, `type="submit"`, фон `primary`, иконка 24 px белая, в плашке 880×56 с отступом 6/6 справа и снизу. Активна: наведение → `brightness(0.92)`, `cursor: pointer`. Неактивна: `opacity: 0.6`, `cursor: default`. Tab из поля → кнопка, `:focus-visible`.
- **Обводка фокуса у обеих кнопок.** Сработали правила `outline: 2px solid rgb(51,144,236)` и `outline-offset: 2px`, проверено по совпавшим правилам CSSOM. Computed даёт 1.6px / 1.6px. Похоже на округление Chrome в этом окружении: у `body` medium выходит 2.4 вместо 3, коэффициент тот же 0.8. Решающее здесь — обводка снаружи кнопки. Как она выглядит, владелец смотрит на стенде.

## Design verification
STATUS: NOT_REQUESTED

`design.source: none`, Figma нет. Composer и FAB сверяются со скриншотами Reference (`docs/design/02-wide-chat.png`, `05-mobile-chat.png`) только по структуре — она та же, что в iter-1. Размеры, места и цвета обеих кнопок после перехода на `IconButton` совпадают с iter-1.

## Notes
- **На решение владельца (как в iter-1).** Недоставленное сообщение становится превью списка («14:34 / Проверка офлайн 2») без пометки о недоставке. По плану не оговорено.
- **Квота.** Одна свежая синхронизация после входа: `getStateInstance`, `getAccountSettings`, `getChats`, `getContactInfo` (1), `getChatHistory` `count:1`. Затем `getChatHistory` `count:100`: 3 отклонены в браузере, 1 придержан (200), ещё 2 при повторных открытиях (200). **`sendMessage` — 1 реальный** («Проверка отправки 4», тестовый чат: перед отправкой `location.pathname` и `chatId` в теле сверены в браузере с `GREEN_API_TEST_CHAT_ID` → true), плюс 2 отклонены в браузере (офлайн). `checkAccount` — 0, 429 не было. Доставку на телефон подтверждает владелец.
- **Креды и секреты.** Креды отдал один раз одноразовый helper на `127.0.0.1:5199`: он читал `.env.local`, ответил на один запрос и завершился. Поля заполнены native setter, наружу ушли только длины. «Войти» нажата реальным кликом. Сеть и консоль снимались обёртками в странице: имя метода из пути, `count`, начало текста, статус, время. URL GREEN-API в перехваченных сообщениях заменялись заглушкой ещё в браузере. Ключ сессии не читался, только булева проверка до входа. `browser_network_requests` и `browser_console_messages` не вызывались. Лог консоли Playwright не читался, по нему только `grep -c`. Блокировки CSP в этот раз не было, URL с токеном в лог не писался. **Токен и `idInstance` в вывод инструментов не попадали.** chatId тестового чата виден в выводе инструментов как часть URL страницы, в отчёт не перенесён.
- **Teardown.** localStorage и sessionStorage очищены, браузер закрыт. Dev-сервер `:5173` остановлен, helper `:5199` завершился сам, порты свободны. `.playwright-mcp/` и скрипт helper удалены. Исходники не менялись: `git status` совпадает со снимком на старте.
