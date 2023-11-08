# Binance WebSocket API

## Описание проекта

Данный проект представляет собой микросервис, разработанный для получения актуальных курсов криптовалют с Binance WebSocket API. Микросервис записывает эти данные в хранилище Redis для быстрого доступа и в базу данных PostgreSQL для долгосрочного хранения. Система поддерживает добавление и удаление монет для отслеживания курсов. Реализована возможность запуска нескольких инстансов микросервиса с использованием механизма распределённой блокировки (red-lock) для обеспечения согласованности данных при одновременном доступе.

### Особенности

- **NestJS** - для создания структурированного и легко поддерживаемого кода.
- **Redis** - для кеширования данных, обеспечения их быстрой доставки и синхронизации между инстансами.
- **Prisma** - ORM для взаимодействия с PostgreSQL, обеспечивающая легкую миграцию и удобный доступ к данным.
- **Node-Redlock** - алгоритм распределенной блокировки для решения проблемы согласованности при конкурентном доступе.
- **Nx** - для управления монорепозиторием и оптимизации процесса разработки.
- **Docker и Docker Compose** - для контейнеризации приложения и его зависимостей.
- **Swagger** - для документации REST API.
- **Microservices** - архитектура для масштабирования и надежной работы системы.
- **REST API** - для взаимодействия с микросервисом.

## Развертывание проекта

### Предварительные требования

Для запуска проекта у вас должны быть установлены:

- Docker и Docker Compose
- Node.js (желательно последняя стабильная версия)
- Git

### Шаги запуска

1. Клонируйте репозиторий проекта:

```bash
git clone [ссылка на ваш репозиторий]
```

2. Перейдите в директорию проекта:

```bash
cd [имя вашего проекта]
```

3. Скопируйте пример файла конфигурации `.env.example` в `.env` и заполните его актуальными значениями:

```bash
cp .env.example .env
```

4. Запустите сервисы при помощи Docker Compose:

```bash
docker-compose up --build
```

После выполнения данных команд, микросервисы будут запущены и доступны.

### API Документация

Для просмотра Swagger документации API, перейдите по ссылке [http://localhost:3000/api](http://localhost:3000/api) после запуска сервисов.

## Работа с микросервисом

Микросервис предоставляет REST API для управления перечнем отслеживаемых криптовалют и просмотра текущих курсов.

### Добавление монеты для отслеживания

```http
POST /api/currency
```

Тело запроса:
```json
{
  "symbol": "BTCUSDT"
}
```

### Удаление монеты из отслеживания

```http
DELETE /api/currency/{symbol}
```

Замените `{symbol}` на актуальный тикер криптовалюты, например `BTCUSDT`.

### Получение списка отслеживаемых монет

```http
GET /api/currencies
```

### Получение текущего курса монеты

```http
GET /api/currency/{symbol}
```

Замените {symbol} на актуальный тикер криптовалюты.

## Масштабирование системы

Для масштабирования системы и добавления дополнительных инстансов микросервиса используйте Docker Compose, указав количество инстансов в параметре `scale`:

```bash
docker-compose up --scale [имя_сервиса]=[N]
```

Здесь `[имя_сервиса]` - имя сервиса в `docker-compose.yml`, `[N]` - количество инстансов.

## Проблемы concurrency

Для решения проблем concurrency используется Node-Redlock. Это гарантирует, что операции записи в Redis и PostgreSQL будут проходить атомарно и последовательно даже в условиях множественных инстансов.

---

Обратите внимание, что данный `README.md` служит шаблоном и должен быть дополнен ссылками на ваш репозиторий, а также конкретными инструкциями по настройке переменных окружения в файле `.env`, именами сервисов в `docker-compose.yml` и другой специфичной информацией для вашего проекта.
