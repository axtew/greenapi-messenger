Status: COMPLETED

## Phase goal
Phase 1 — Основа: тема, шрифт, типографика, словарь. Iteration 2 — re-run после поправки плана (`## Amendments` → «Phase 1 — added 2026-10-04») плюс одна находка статического ревью iter-1.

## What was implemented
- Поправка: `H2` удалён из `src/components/Typography/` — компонент из `_Typography.tsx`, стиль `SH2` из `_styles.ts` (служил только `H2`), реэкспорт из `index.ts`. Остальная шкала (`H1`, `H3`, `B1`, `B2`, `Caption`, пропсы `color` / `textAlign` / `as`, полный `TTextColor`) экспортируется целиком как одобренное исключение из дисциплины экспорта.
- Находка ревью: к приведению `response.json() as Promise<I18n>` в `src/context/I18nContext/_I18nContext.tsx` добавлен комментарий, объясняющий отсутствие рантайм-проверки (собственный статический файл, форма задана интерфейсом `I18n`, внешних данных нет). Без ссылок на план/ревью.
- Решение по «служит только H2»: токен темы `typography.fontSizes.lg` (20px) после удаления `H2` больше никем не используется, но **оставлен** — он входит в контракт темы из таблицы плана (строка ~235), а поправка удаляет только `H2` из Typography. Удалить его или нет — на усмотрение владельца/планировщика.

## Files created (cumulative)
- `src/theme/_theme.ts`, `src/theme/_GlobalStyle.ts`, `src/theme/index.ts` — тема, глобальные стили, barrel.
- `src/components/Typography/_styles.ts`, `_Typography.tsx`, `index.ts` — шкала типографики (без `H2`).
- `src/context/I18nContext/_context.ts`, `_I18nContext.tsx`, `_useI18nSelector.ts`, `index.ts` — загрузка и раздача словаря.
- `src/types/i18n.types.ts` — интерфейс словаря `I18n`.
- `public/dictionaries/ru.json` — словарь.
- `src/app/App.tsx`, `src/app/_queryClient.ts` — корень приложения и QueryClient.
- `plans/messenger-v1/baseline/{build.log,lint.log,README.md}` — baseline (переиспользован, не пересобирался).

## Files modified (cumulative)
- `src/main.tsx` — монтирование `App` (без изменений в этой итерации).

## Verification
- `pnpm format` (`prettier --write src`) — exit 0.
- `pnpm lint` — exit 0, ошибок/предупреждений нет (baseline тоже чистый).
- `pnpm build` (`tsc -b && vite build`) — exit 0.
- Exports: `H3`, `B1`, `B2`, `Caption` без импортёров вне модуля — одобренное исключение по поправке; новых экспортов в этой итерации нет. `grep H2 src/components/Typography` = 0.
- Phase stop condition: выполнено (поправка и находка применены, lint/build зелёные).
- Runtime/browser: не выполнялся разработчиком.

## Known issues
- Тело Phase 1 в плане (строка ~241) всё ещё перечисляет `H2` lg/500; поправка говорит, что `H2` удаляется «и из плана» — правка `plan.md` не входит в зону разработчика, оставлено планировщику/оркестратору.
- `typography.fontSizes.lg` — теперь неиспользуемый токен темы (см. выше).
