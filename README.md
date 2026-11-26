# Доска кайдзен-предложений (frontend)

Без сборки и зависимостей. ES-модули требуют HTTP-сервер:

    python3 -m http.server 8080      # или: npx serve .
    # открыть http://localhost:8080

## Структура
- `index.html`, `styles.css` — разметка и стили (по макету)
- `config.js` — `mode: 'mock' | 'http'`, `baseUrl` бэкенда
- `src/api.js` — слой данных (MockApi на localStorage, HttpApi для Fastify)
- `src/seed.js` — демо-данные
- `src/app.js` — состояние, рендер, drag&drop, модалки

## Подключение бэкенда
В репозитории бэкенда пока нет API предложений (есть только /ping, /health и модель User).
Ожидаемый контракт описан в шапке `src/api.js`; статусы: new | review | progress | done.
