MODE: review
STATUS: APPROVED
Issue source: none

## Summary

Phase 8, iter-4: правка владельца после одобрения iter-3. Из `useComposer` убран особый случай IME через `keyCode` 229, остаётся стандартная проверка `isComposing`, как в тексте фазы плана (`plan.md:729`). Код, JSDoc и перезапуск Verification совпадают с отчётом. Регрессий сверх того, что владелец принял сознательно, нет. Фаза готова к коммиту владельца.

## Notes

- **Verification перезапущена**: `pnpm lint` — без ошибок, `pnpm build` — успешно, `pnpm test` — 15 файлов, 175/175, `pnpm exec prettier --check src/pages/ChatPage/_internal/Composer` — чисто. Совпадает с отчётом, команды не подменены.
- **Чек-лист iter-4 — проверено** (`src/pages/ChatPage/_internal/Composer/_useComposer.ts`):
  - Константы `IME_PROCESS_KEY_CODE` нет. Особой обработки Escape во время композиции (`preventDefault`) тоже нет. Поиск `keyCode|229` по `src/` даёт 0 совпадений. Совпадения по `Safari` остались только в чужих, не связанных с IME местах (`Input/_styles.ts`, `Composer/_styles.ts` — зум iOS; `AccountMenu`, `localStorage.ts`).
  - `onKeyDown` (`:66-74`): при `event.nativeEvent.isComposing` сразу выходит. Дальше идут Enter без Shift → `preventDefault` + `send()`. Shift+Enter не перехватывается, значит работает как перенос строки по умолчанию. Логика Enter / Shift+Enter не изменилась.
  - JSDoc хука (`:27`): «Во время IME-ввода (`isComposing`) клавиша принадлежит вводу: Enter не отправляет.» Это правда, упоминаний Safari / 229 / CJK нет. Остальной JSDoc и комментарий у авторазмера не менялись и по-прежнему соответствуют коду.
  - Импорты без лишнего: `KeyboardEvent` и `EKeyboardKey` по-прежнему используются.
- **Поведение Escape.** Composer больше не трогает Escape, событие всплывает к `document`-слушателю в `src/pages/ChatPage/_useChatPage.ts:47-58`. Тот сам пропускает `isComposing`, `defaultPrevented` и `repeat`, и его JSDoc («Во время IME-ввода клавиша принадлежит вводу и тоже пропускается») остаётся правдой.
  - Chrome / Firefox: keydown Escape во время композиции приходит с `isComposing: true`. Composer выходит, слушатель чата тоже пропускает событие, чат не закрывается. Регрессии нет.
  - Safari (macOS/iOS) с IME: keydown клавиши, которая завершает композицию, приходит уже после `compositionend` с `isComposing: false` (это и закрывал случай 229). Escape, отменяющий композицию, теперь закроет чат, а Enter, подтверждающий слово, отправит сообщение. Для русской раскладки IME не задействован, так что основной сценарий MVP это не затрагивает. Владелец принял это сознательно, мобильные клавиатуры записаны в `BACKLOG.md:40`. Не блокирует.
- **Хвост п. 4 из iter-3** (Android / Gboard и `keyCode 229`) закрыт пунктом в `BACKLOG.md:40`.
- Новых экспортов, `console.*`, `any` / `as` в дельте нет.
