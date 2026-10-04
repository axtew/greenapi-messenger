# 0006. Хостинг — Cloudflare Workers Static Assets

- Статус: принято
- Дата: 2026-10-03

## Контекст и проблема

ТЗ желает ссылку на работающий сервис. Нужен бесплатный хостинг статики с SPA-fallback.

## Рассмотренные варианты

1. Cloudflare Workers Static Assets.
2. Cloudflare Pages.
3. GitHub Pages.

## Решение

**Workers Static Assets.** Cloudflare ведёт новые проекты туда, а не в Pages; SPA-fallback — одна настройка
(`not_found_handling: single-page-application`); схема уже отработана автором в другом проекте.
GitHub Pages требует обходного `404.html` для клиентского роутинга.

## Последствия

- Деплой — `pnpm deploy` (`wrangler deploy`), конфиг — `wrangler.jsonc`.
