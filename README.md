# kontora-site

## Что сделано
- Добавлены премиальные анимации входа, появления блоков при скролле и более «живые» hover/transition эффекты на главной.
- Основная страница использует динамический каталог из `catalog.json` + локальный override.
- Добавлена отдельная страница `admin/` для редактирования каталога.
- Admin-панель подготовлена под дальнейший переход на защищенный вход (сейчас временный пароль).
- Добавлена заготовка синхронизации каталога через Firebase Firestore.
- Стили разделены на:
  - `styles/base.css`
  - `styles/desktop.css`
  - `styles/mobile.css`

## Firebase (опционально)
Чтобы включить облачную синхронизацию каталога, задайте глобальные переменные до загрузки скриптов:

- `window.KONTORA_FIREBASE_API_KEY`
- `window.KONTORA_FIREBASE_AUTH_DOMAIN`
- `window.KONTORA_FIREBASE_PROJECT_ID`

И подключите Firebase SDK (compat) на странице.

## Временный доступ в admin
- URL: `/admin/`
- Пароль по умолчанию: `kontora`
- Меняется в `admin/admin.js`.
