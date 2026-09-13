# Feature Specification: Централизованное управление рекламным контентом UCS GuestScreen

**Feature Identifier**: `004-gs-ad-content-management`  
**Created**: 2026-09-10  
**Last Clarified**: 2026-09-10  
**Status**: Clarified (Ready for Plan)  
**Target POS System**: UCS GuestScreen v3.1.1.0 (Windows POS Monoblocks, CefSharp Chromium, local `C:\UCS\GuestScreen\gs.db`)  
**Central Server Stack**: Python 3.13 | FastAPI | SQLAlchemy 2.x / asyncpg | AsyncSSH  
**Central Database**: PostgreSQL 16 (Authoritative Persistent Storage)  
**Central Media Storage**: Local Filesystem of Central Server (Decoupled storage abstraction)  
**Cashbox Media Path**: `C:\UCS\GuestScreen\Front\media\uploads\`  
**Cashbox Staging Path**: `C:\UCS\GuestScreen\Front\media\uploads\.staging\<deployment_id>\`  
**Transport & File Protocol**: SSH Management Transport + SFTP over SSH for file transfers  
**Local SQLite Execution**: `C:\UCS\GuestScreen\sqlite3.exe` (Strict predefined templates only, no arbitrary SQL)  
**Fleet Scope**: 200+ кассовых моноблоков (рестораны, филиалы, фудкорты)  
**Secondary Display**: `\\.\DISPLAY2` (Физическое разрешение: 1024×768, 4:3)

---

## Clarifications

### Session 2026-09-10

- **Q: Какой технологический стек выбран для центрального сервера?** → **A: Python 3.13, FastAPI, SQLAlchemy 2.x / asyncpg, AsyncSSH.** Система сфокусирована на асинхронной оркестрации (PostgreSQL + SSH/SFTP + файловые операции). Node.js и Go исключены из рассмотрения как альтернативы.
- **Q: Какова транспортная модель взаимодействия с кассами?** → **A: SSH как транспорт управления, SFTP поверх SSH для передачи файлов.** Никакого прямого SCP как отдельного протокола; все операции (проверка связи, инвентаризация, загрузка, проверка SHA-256, атомарный перенос, выполнение строгих команд) идут через единый SSH/SFTP-канал. Произвольный remote shell категорически запрещен; все команды валидируются через строгий allowlist.
- **Q: Как выполняются операции с SQLite на кассе?** → **A: Штатная утилита `C:\UCS\GuestScreen\sqlite3.exe`.** Центральный сервер и UI не принимают и не передают произвольный SQL. Сервер формирует только жестко зафиксированные параметризованные шаблоны (read scene, backup scene, update FULL scene, update 50/50 scene, restore scene, verify). Шаблоны являются неотъемлемой частью backend-логики.
- **Q: Каковы абсолютные ограничения по работе с `gs.db`?** → **A: Категорический запрет полной замены, копирования, удаления или пересоздания `gs.db`.** Таблицы `licenses`, `screens`, `scenarios`, `settings` неприкосновенны. Разрешено только точечное обновление сцен рекламы по алгоритму: 1. считать Raw; 2. проверить ожидаемый Scene GUID; 3. сохранить previous_state_snapshot; 4. выполнить транзакцию с retry-политикой; 5. выполнить верификацию; 6. только затем обновить `sync_version.txt`.
- **Q: Где хранятся физические медиафайлы центрального сервера?** → **A: Локальная файловая система центрального сервера.** PostgreSQL хранит только метаданные (`media_id`, `filename`, `storage_path`, `size`, `mime_type`, `sha256`, даты). MinIO не включается в MVP, но архитектура слоя хранения полностью отделена от бизнес-логики, что позволит подключить Object Storage в будущем без изменения моделей.
- **Q: Где хранятся медиафайлы на кассе?** → **A: Строго в штатном каталоге `C:\UCS\GuestScreen\Front\media\uploads\`.** Временные файлы загружаются в `.staging\<deployment_id>\` и после верификации SHA-256 атомарно переносятся в `uploads\`. Постоянные альтернативные каталоги на кассе не создаются.
- **Q: Какова политика в отношении старых медиафайлов на кассах?** → **A: Safe Policy (без автоудаления в MVP).** Обычный деплой добавляет новые файлы и заменяет существующие только при изменении SHA-256. Старые файлы не удаляются. Garbage Collection исключен из скоупа MVP.
- **Q: Каковы требования к сетевой пропускной способности и параллелизму?** → **A: Конфигурируемый пул параллелизма со значением по умолчанию 4 кассы одновременно.** Искусственное ограничение скорости (throttling) в MVP не вводится, но архитектура проектируется с возможностью добавления per-cashbox rate limit. Значение пула хранится в конфигурации БД/приложения, а не в UI.
- **Q: Как формируется инвентарь кассы и классифицируется дифференциал?** → **A: Инвентарь — единственный источник Actual State.** Для каждого файла фиксируются: `filename`, `size`, `sha256`, `modified_time`. Результаты сверки Desired vs Actual: `OK`, `MISSING`, `OUTDATED`, `UNEXPECTED`. Файлы со статусом `UNEXPECTED` автоматически НЕ удаляются.
- **Q: Как устроена модель конфигураций?** → **A: Раздельное хранение конфигураций FULL SCREEN и 50/50.** Каждая конфигурация определяет режим (`STATIC` / `DYNAMIC`), плейлист, порядок, интервалы, версию и статус. Плейлисты являются переиспользуемыми (reusable) сущностями и не привязаны к конкретной кассе.
- **Q: Каков строгий пайплайн деплоймента?** → **A: 17 последовательных шагов.** Если любой критический шаг завершается ошибкой — выполнение немедленно останавливается (STOP). Применение конфигурации сцены строго запрещено до тех пор, пока 100% файлов не присутствуют и не валидированы по SHA-256.
- **Q: Как обрабатывается повторный деплой идентичной версии?** → **A: Полный No-Op (Идемпотентность).** Если `desired_version == actual_version` и все SHA-256 файлов совпадают, сервер не выполняет upload, sqlite update и hot reload. Выполняется только быстрая верификация.
- **Q: Какие требования предъявляются к безопасности учетных данных SSH?** → **A: Шифрование в покое по промышленным стандартам.** Требование спецификации: *"SSH credentials must be encrypted at rest using an industry-standard authenticated encryption mechanism and must never be exposed through API responses, logs or UI."* Поддерживаются пароли, приватные ключи и passphrases. Конкретный механизм утверждается на этапе PLAN.
- **Q: Каковы границы отката (Rollback)?** → **A: Откат восстанавливает исключительно рекламную сцену.** Запрещено откатывать `gs.db` целиком. Для отката используются `previous_raw` и `previous_version`. После отката обязательно выполняется обновление `sync_version.txt` и верификация CefSharp.
- **Q: Каков регламент Hot Reload?** → **A: Таймаут 15 секунд.** Механизм `sync_version.txt` считается успешным только после подтверждения верификацией. Если перезагрузка не подтверждена за 15 секунд — деплой получает статус `FAILED` и запускается откат.
- **Q: Как обеспечивается параллелизм в SQLite?** → **A: WAL + busy_timeout=10000 + ограниченный Retry Policy.** Параметры SQLite не дают абсолютной гарантии, поэтому обязательны транзакции, таймауты и ограниченное число повторов (без бесконечных циклов).

---

## 1. Problem Statement (Проблематика)

В ресторанных сетях (Milly, O!Kafe, Oqtepa Lavash и др.), работающих под управлением POS-систем UCS / r_keeper v7, гостевые экраны покупателей (GuestScreen) являются ключевым цифровым каналом маркетинговых коммуникаций, информирования об акциях и кросс-продаж. На кассовых моноблоках под управлением Windows установлен штатный программный комплекс UCS GuestScreen v3.1.1.0, функционирующий на базе встроенного браузера CefSharp (Chromium) и локальной базы данных SQLite (`C:\UCS\GuestScreen\gs.db`).

### Текущие проблемы и риски:
1. **Отсутствие централизованного контроля**: Обновление рекламных баннеров и промо-материалов требует ручного копирования файлов администраторами на каждой кассе, что при парке 200+ касс приводит к колоссальным трудозатратам, рассинхронизации акций и показу устаревших спецпредложений.
2. **Критический риск повреждения кассового контура**: Локальная база данных `gs.db` содержит системные таблицы: лицензии (`licenses`), аппаратную геометрию дисплеев (`screens`), системные сценарии кассы (`scenarios`) и настройки (`settings`). Попытки копирования центральной базы `gs.db` целиком приводят к слету лицензий UCS, сбросу привязки второго монитора (`\\.\DISPLAY2`) и блокировке работы кассы.
3. **Рассинхронизация контента и черные экраны**: Если конфигурация рекламы активируется до того, как медиафайлы физически скопированы на кассу, гостевой экран отображает черные блоки или битые картинки прямо перед глазами покупателя.
4. **Недопустимость прерывания кассовых операций (Downtime)**: Перезапуск процесса `GuestScreen.exe` во время рабочего дня недопустим, так как приводит к миганию экранов, разрыву связи с кассовым клиентом r_keeper и задержкам в обслуживании гостей.
5. **Отсутствие сквозной верификации и аудита**: Центральный офис не имеет объективных данных о том, какие файлы физически находятся на каждой кассе, совпадает ли их SHA-256 с утвержденными креативами и действительно ли отображается актуальная промо-кампания.

---

## 2. Goals & Scope Lock (Цели и границы MVP)

### 2.1. Goals (Цели)
- **Централизованное управление ТОЛЬКО рекламными медиа**:
  1. **FULL SCREEN** рекламой (Экран ожидания / Idle screen — 1024×768).
  2. **50/50** рекламой во время активного заказа (Правая рекламная область экрана заказа — 512×768).
- **Поддержка гибких форматов показа**:
  - Для обоих режимов поддержка статического показа (`STATIC`, 1 медиафайл).
  - Для обоих режимов поддержка динамического показа (`DYNAMIC`, плейлист из нескольких медиафайлов).
  - Последовательное циклическое воспроизведение плейлиста.
  - Настраиваемый интервал между медиафайлами (5, 7, 10 секунд и любые произвольные значения).
- **Использование штатного рендеринга GuestScreen**: Полный отказ от разработки собственного плеера или альтернативной веб-оболочки. GuestScreen самостоятельно воспроизводит Full Screen и 50/50, используя подготовленные конфигурационные данные.
- **PostgreSQL 16 как единственный persistent storage центрального сервера**: Хранение реестра касс, групп, сетевых настроек, безопасных ссылок на учетные данные SSH, версий конфигураций, плейлистов, интервалов, фактического инвентаря касс, SHA-256 хешей, истории развертываний и журнала аудита. Полный отказ от хранения конфигурации в текстовых JSON/YAML файлах или во вспомогательных SQLite БД на сервере.
- **Раздельное хранение бинарных медиа**: Физические медиафайлы хранятся в локальной файловой системе сервера отдельно от базы данных, а PostgreSQL хранит строгие метаданные (`media_id`, `filename`, `storage_path`, `size`, `mime_type`, `sha256`, даты). Архитектура абстрагирована от типа хранилища для прозрачной миграции на S3/Object Storage в будущем.
- **Локальное размещение медиа в штатном каталоге кассы**: Размещение рекламных файлов на кассах строго в `C:\UCS\GuestScreen\Front\media\uploads\` без создания альтернативных постоянных директорий.
- **Инвентаризация и вычисление дифференциала (Desired vs Actual)**: Сравнение хешей SHA-256 центрального сервера и кассы для классификации файлов (`OK`, `MISSING`, `OUTDATED`, `UNEXPECTED`). Файлы `UNEXPECTED` не удаляются автоматически.
- **Атомарная доставка через Staging**: Загрузка по SFTP поверх SSH во временный каталог `uploads\.staging\<deployment_id>\`, валидация SHA-256 каждого файла и атомарный перенос в рабочий каталог `uploads\`.
- **Хирургическая модификация `gs.db`**: Точечное обновление исключительно записей в таблице `scenes` с использованием штатной утилиты `C:\UCS\GuestScreen\sqlite3.exe` по строго определенным параметризованным backend-шаблонам (`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=10000;`).
- **Бесшовный Hot Reload через триггер с таймаутом**: Применение новой рекламы через обновление `C:\UCS\GuestScreen\Front\sync_version.txt` без перезапуска `GuestScreen.exe` с ожиданием подтверждения не более 15 секунд.
- **Автоматическая верификация и откат (Rollback)**: Контроль неизменности PID и StartTime процесса GuestScreen, сверка примененных данных и возврат исключительно рекламной сцены из снимка при обнаружении любых аномалий.
- **Корпоративная безопасность**: Шифрование учетных данных SSH в покое с использованием промышленных стандартов аутентифицированного шифрования, запрет произвольных shell-команд через UI, строгий allowlist исполняемых команд, защита от Path Traversal, ролевая модель (RBAC) и неизменяемый аудит.

### 2.2. Strict Scope Lock / Non-Goals (Строго исключено из скоупа проекта)
Категорически запрещено добавлять в проект функционал, выходящий за рамки MVP:
- **Управление заказом и составом чека**: Система НЕ управляет заказами, списком блюд, ценами, налогами, модификаторами и суммами чеков.
- **Управление r_keeper**: Система НЕ взаимодействует с серверами r_keeper, кассовыми станциями, протоколами обмена кассы и логикой POS.
- **Управление левой половиной экрана 50/50**: Левая половина экрана (0..512×768) полностью и безоговорочно управляется штатным комплексом GuestScreen/r_keeper. Наша система ни при каких обстоятельствах не модифицирует сцену чека.
- **Управление системными таблицами GuestScreen**: Категорически запрещено изменять таблицы `licenses`, `screens`, `scenarios`, `settings` в `gs.db`.
- **Замена `gs.db` целиком**: Категорически запрещено копировать центральный файл `gs.db` на кассы, удалять или пересоздавать базу.
- **Собственный Web-рендерер**: Система НЕ подменяет фронтенд GuestScreen и не запускает сторонние браузерные движки.
- **Произвольный удаленный терминал (Remote Shell)**: UI системы НЕ предоставляет функционал интерактивной командной строки для выполнения произвольных команд на кассовых моноблоках.
- **Удаленное администрирование Windows**: Управление службами Windows, обновлениями ОС, реестром и сторонними программами исключено.
- **Управление товарами, ценообразованием и блюдами**: Исключено.
- **Редактор сценариев и экранов GuestScreen**: Исключено.
- **Аналитика, AI, рекламная статистика и биллинг**: Исключено.
- **Пользовательские уведомления вне рамок статуса деплоя**: Исключено.
- **Автоматическая очистка старых файлов (Garbage Collection)**: Исключено из MVP (Safe Policy).

---

## 3. Core Architectural Principles (Фундаментальные принципы системы)

| Принцип | Содержание | Обоснование |
| :--- | :--- | :--- |
| **I. Штатный рендерер (Native Renderer Only)** | GuestScreen уже умеет отображать Full Screen, 50/50, статику, слайд-шоу и интервалы. Мы управляем ТОЛЬКО рекламными медиа и конфигурационными данными сцен. | Исключает конфликты библиотек, гарантирует 100% совместимость с версией 3.1.1.0 и нулевую нагрузку на процессор кассы. |
| **II. Приоритет кассового обслуживания (POS Non-Interference)** | Любые рекламные операции вторичны по отношению к пробитию чеков. Запрещены перезапуски `GuestScreen.exe` и эксклюзивные блокировки SQLite. | Защита от простоя ресторанов и срыва фискальных операций кассиров. |
| **III. Хирургическая точность (Surgical Scene Update)** | Допускается точечная модификация только необходимых записей в таблице `scenes` через `sqlite3.exe`. Таблицы `licenses`, `screens`, `scenarios`, `settings` строго неизменяемы. | Предотвращает слет лицензий UCS и сброс аппаратных координат второго монитора (`\\.\DISPLAY2`). |
| **IV. Обязательный транзакционный гейт (Pre-Flight Media Gate)** | Сцена в `gs.db` НЕ обновляется до тех пор, пока 100% медиафайлов не проверены на кассе по имени, размеру и SHA-256. | Категорический запрет показа черных экранов и битых изображений гостям ресторана. |
| **V. Бесшовный Hot Reload с верификацией** | Обновление визуала выполняется через триггер `Front\sync_version.txt` с таймаутом 15 сек. Процесс `GuestScreen.exe` продолжает работать непрерывно. | Сохранение непрерывного аптайма гостевого экрана без морганий. |
| **VI. Модель сходимости состояний (Desired vs Actual Convergence)** | Центральный сервер хранит желаемое состояние и приводит кассы к нему через вычисление дифференциала. Повторный деплой идентичной версии безопасен (No-Op). | Сетевая экономия, полная идемпотентность, масштабируемость на 200+ касс. |
| **VII. Безопасность и жесткий Allowlist** | SSH-управление кассами, SFTP для передачи файлов, шифрование секретов в покое, строгий allowlist команд, защита от Path Traversal. | Защита кассовой сети от компрометации и атак на исполнение произвольного кода. |

---

## 4. Actors & Roles (Пользователи и роли)

1. **Content Manager (Контент-менеджер / Маркетолог)**:
   - Загрузка, просмотр и организация рекламных изображений в медиатеке.
   - Создание плейлистов, настройка порядка слайдов и хронометража (интервалов: 5, 7, 10 сек).
   - Формирование рекламных конфигураций FULL SCREEN и 50/50 (`STATIC` / `DYNAMIC`).
   - Назначение конфигураций на отдельные кассы или группы касс.
   - Инициирование публикаций и визуальный мониторинг статусов применения.
2. **System Administrator (Системный администратор)**:
   - Регистрация кассовых моноблоков (IP, hostname, порт SSH, ссылка на учетные данные).
   - Управление иерархией групп касс (города, бренды, филиалы).
   - Управление учетными данными SSH и ротация ключей доступа.
   - Настройка пула параллелизма развертывания (по умолчанию 4 кассы одновременно).
   - Мониторинг сетевых сбоев, анализ технических логов и управление ручным откатом.
3. **Security Auditor (Аудитор информационной безопасности)**:
   - Аудит действий пользователей через неизменяемый журнал `audit_logs`.
   - Контроль соблюдения ролевой модели (RBAC).
   - Проверка неизменности хэшей медиафайлов и фактов обращений к кассам.
4. **Cashbox Monoblock (Кассовый моноблок как пассивный узел)**:
   - Принимает входящие SSH-соединения от доверенного центрального сервера.
   - Выполняет строго ограниченный набор системных команд из белого списка.
   - Предоставляет инвентарь файлов, принимает файлы в staging, выполняет предопределенные скрипты `sqlite3.exe` и перезагружает фронтенд по триггеру `sync_version.txt`.

---

## 5. Physical Screen Modes & Display Geometry

В соответствии с подтвержденной архитектурой UCS GuestScreen v3.1.1.0 на кассовых моноблоках, дисплей покупателя подключен как вторичный монитор (`\\.\DISPLAY2`, физическое разрешение **1024×768**, соотношение сторон 4:3). Система оперирует строго двумя режимами:

```
================================================================================
РЕЖИМ 1: FULL SCREEN (Экран ожидания / Idle Screen)
Разрешение: 1024 x 768 px | Соотношение: 4:3
Штатная сцена GuestScreen: Guid = '2509359c-2d71-4344-9be4-7d90dd453083'
Сценарий SQLite scenarios: mode1
+------------------------------------------------------------------------------+
|                                                                              |
|                      ПОЛНОЭКРАННАЯ РЕКЛАМА (1024 x 768)                      |
|                                                                              |
|        - Static: 1 медиафайл (1024x768)                                      |
|        - Dynamic: Плейлист слайд-шоу (интервалы: 5с, 7с, 10с и др.)          |
|                                                                              |
+------------------------------------------------------------------------------+

================================================================================
РЕЖИМ 2: 50 / 50 (Экран заказа / Order & Receipt Screen)
Разрешение: 1024 x 768 px | Соотношение: 4:3
Сценарий SQLite scenarios: mode2
+--------------------------------------+---------------------------------------+
| ЛЕВАЯ ПОЛОВИНА: 512 x 768 px         | ПРАВАЯ ПОЛОВИНА: 512 x 768 px         |
| ЗОНА СОСТАВА ЗАКАЗА                  | ЗОНА РЕКЛАМНОГО БАННЕРА 50/50         |
| Scene GUID: 255dc54c-70ea-465d...    | Scene GUID: 68906ed2-49a3-4dc3...     |
|                                      |                                       |
| УПРАВЛЯЕТСЯ ТОЛЬКО r_keeper!         | УПРАВЛЯЕТСЯ ЦЕНТРАЛЬНОЙ СИСТЕМОЙ!     |
| - Позиции заказа, блюда              |                                       |
| - Количество, модификаторы           | - Static: 1 промо-файл (512x768)      |
| - Цены, скидки                       | - Dynamic: Плейлист промо-акций       |
| - Итоговая сумма к оплате            |   (интервалы: 5с, 7с, 10с и др.)      |
|                                      |                                       |
| НАША СИСТЕМА СТРОГО НЕ ИЗМЕНЯЕТ ЭТО! | НАША СИСТЕМА УПРАВЛЯЕТ ЭТОЙ СЦЕНОЙ!   |
+--------------------------------------+---------------------------------------+
```

### 5.1. Структура записей в SQLite `gs.db` (`scenes.Raw`)
1. **FULL SCREEN (Guid: `2509359c-2d71-4344-9be4-7d90dd453083`)**:
   - *Static Mode*:
     ```json
     {
       "type": "image",
       "width": 1024,
       "height": 768,
       "src": "media/uploads/banner_full_01.jpg"
     }
     ```
   - *Dynamic Mode*:
     ```json
     {
       "type": "gallery",
       "width": 1024,
       "height": 768,
       "interval": 5000,
       "slides": [
         "media/uploads/banner_full_01.jpg",
         "media/uploads/banner_full_02.jpg",
         "media/uploads/banner_full_03.jpg"
       ]
     }
     ```
2. **50/50 Promo Block (Guid: `68906ed2-49a3-4dc3-bb8a-6fa7943f39c3`)**:
   - *Static Mode*:
     ```json
     {
       "type": "image",
       "width": 512,
       "height": 768,
       "src": "media/uploads/promo_combo_01.jpg"
     }
     ```
   - *Dynamic Mode*:
     ```json
     {
       "type": "gallery",
       "width": 512,
       "height": 768,
       "interval": 7000,
       "slides": [
         "media/uploads/promo_combo_01.jpg",
         "media/uploads/promo_dessert_02.jpg"
       ]
     }
     ```
3. **Строгий запрет модификации системных областей**:
   - Сцена чека `255dc54c-70ea-465d-8b2c-d9d8b0ad63a4` и текстовые блоки заголовков (`60c04a0a...`, `bff6bafa...`, `4784a6cd...`, `743e6538...`) **СТРОГО НЕ МОДИФИЦИРУЮТСЯ**.
   - Таблица `screens` (геометрия `DISPLAY2`) **СТРОГО НЕ МОДИФИЦИРУЕТСЯ**.
   - Таблица `licenses` (привязка кассовой лицензии) **СТРОГО НЕ МОДИФИЦИРУЕТСЯ**.
   - Таблица `scenarios` (привязка `mode1` и `mode2`) **СТРОГО НЕ МОДИФИЦИРУЕТСЯ**.
   - Таблица `settings` **СТРОГО НЕ МОДИФИЦИРУЕТСЯ**.

---

## 6. Central Database Architecture (PostgreSQL 16)

PostgreSQL 16 является единственным постоянным хранилищем центрального приложения. Хранение конфигураций в файлах JSON/YAML или вспомогательных базах SQLite на сервере запрещено. JSON разрешен исключительно как payload в REST API и для сериализации снапшотов.

### 6.1. Реляционная схема и сущности

```sql
-- 1. Реестр учетных данных SSH (Зашифрованные секреты)
CREATE TABLE ssh_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    auth_type VARCHAR(20) NOT NULL CHECK (auth_type IN ('PASSWORD', 'SSH_KEY')),
    username VARCHAR(100) NOT NULL,
    encrypted_secret BYTEA NOT NULL,
    secret_iv BYTEA,
    passphrase_encrypted BYTEA,
    key_fingerprint VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Системная конфигурация приложения (Параметры параллелизма и таймаутов)
CREATE TABLE system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- Дефолтное значение пула: {"default_concurrency_pool": 4, "reload_timeout_sec": 15}

-- 3. Иерархические группы касс (Города, Бренды, Филиалы)
CREATE TABLE cashbox_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    parent_id UUID REFERENCES cashbox_groups(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Реестр кассовых моноблоков
CREATE TABLE cashboxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    group_id UUID NOT NULL REFERENCES cashbox_groups(id) ON DELETE RESTRICT,
    ip_address VARCHAR(45) NOT NULL UNIQUE,
    hostname VARCHAR(100),
    ssh_port INTEGER NOT NULL DEFAULT 22,
    ssh_credential_id UUID NOT NULL REFERENCES ssh_credentials(id) ON DELETE RESTRICT,
    guest_screen_version VARCHAR(50) DEFAULT '3.1.1.0',
    os_info VARCHAR(150),
    status VARCHAR(20) NOT NULL DEFAULT 'OFFLINE' CHECK (status IN ('ONLINE', 'OFFLINE', 'UNREACHABLE')),
    sync_status VARCHAR(30) NOT NULL DEFAULT 'PENDING_UPDATE' CHECK (sync_status IN ('SYNCHRONIZED', 'PENDING_UPDATE', 'IN_PROGRESS', 'ERROR')),
    current_full_version INTEGER DEFAULT 0,
    current_split_version INTEGER DEFAULT 0,
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Каталог медиафайлов (Метаданные центрального хранилища)
CREATE TABLE media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_filename VARCHAR(255) NOT NULL,
    storage_filename VARCHAR(255) NOT NULL UNIQUE,
    storage_path VARCHAR(512) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
    sha256_hash CHAR(64) NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_media_assets_sha256 ON media_assets(sha256_hash);

-- 6. Плейлисты для слайд-шоу (Reusable Entity)
CREATE TABLE playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    display_type VARCHAR(20) NOT NULL CHECK (display_type IN ('FULL_SCREEN', 'SPLIT_50_50')),
    default_interval_sec INTEGER NOT NULL DEFAULT 5 CHECK (default_interval_sec >= 1),
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Элементы плейлиста с порядком и индивидуальным интервалом
CREATE TABLE playlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    media_asset_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE RESTRICT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    duration_sec INTEGER CHECK (duration_sec IS NULL OR duration_sec >= 1),
    UNIQUE (playlist_id, sort_order)
);

-- 8. Рекламные конфигурации (Отдельно FULL SCREEN и 50/50)
CREATE TABLE ad_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    mode VARCHAR(20) NOT NULL CHECK (mode IN ('FULL_SCREEN', 'SPLIT_50_50')),
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('STATIC', 'DYNAMIC')),
    media_asset_id UUID REFERENCES media_assets(id) ON DELETE RESTRICT,
    playlist_id UUID REFERENCES playlists(id) ON DELETE RESTRICT,
    version INTEGER NOT NULL DEFAULT 1,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_config_content CHECK (
        (content_type = 'STATIC' AND media_asset_id IS NOT NULL AND playlist_id IS NULL) OR
        (content_type = 'DYNAMIC' AND playlist_id IS NOT NULL AND media_asset_id IS NULL)
    )
);

-- 9. Назначение конфигураций на кассы и группы
CREATE TABLE cashbox_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cashbox_id UUID REFERENCES cashboxes(id) ON DELETE CASCADE,
    group_id UUID REFERENCES cashbox_groups(id) ON DELETE CASCADE,
    full_configuration_id UUID REFERENCES ad_configurations(id) ON DELETE RESTRICT,
    split_configuration_id UUID REFERENCES ad_configurations(id) ON DELETE RESTRICT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_target_exclusive CHECK (
        (cashbox_id IS NOT NULL AND group_id IS NULL) OR
        (group_id IS NOT NULL AND cashbox_id IS NULL)
    )
);

-- 10. Фактический инвентарь медиафайлов на кассе (Actual State)
CREATE TABLE cashbox_media_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cashbox_id UUID NOT NULL REFERENCES cashboxes(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    sha256_hash CHAR(64) NOT NULL,
    modified_at TIMESTAMPTZ NOT NULL,
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (cashbox_id, filename)
);
CREATE INDEX idx_cashbox_inv_lookup ON cashbox_media_inventory(cashbox_id, sha256_hash);

-- 11. Журнал операций деплоймента
CREATE TABLE deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cashbox_id UUID NOT NULL REFERENCES cashboxes(id) ON DELETE RESTRICT,
    target_full_version INTEGER,
    target_split_version INTEGER,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'SUCCESS', 'FAILED', 'ROLLED_BACK', 'NO_OP')),
    error_message TEXT,
    rollback_reason TEXT,
    previous_state_snapshot JSONB NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ
);

-- 12. Шаги деплоймента (Детальный трекинг 17 шагов)
CREATE TABLE deployment_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deployment_id UUID NOT NULL REFERENCES deployments(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    step_name VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('SUCCESS', 'FAILED', 'SKIPPED')),
    duration_ms INTEGER NOT NULL DEFAULT 0,
    log_output TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 13. Неизменяемый журнал аудита
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address VARCHAR(45),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp DESC);
```

---

## 7. Media & Cashbox Lifecycles

### 7.1. Жизненный цикл медиафайла (Media Lifecycle)
1. **Загрузка (Upload)**: Пользователь загружает файл через Web UI в локальную файловую систему центрального сервера.
2. **Валидация (Validation)**:
   - Проверка формата (`image/jpeg`, `image/png`, `image/webp`).
   - Проверка максимального размера (до 20 МБ на файл).
   - Проверка геометрии (1024×768 для Full Screen или 512×768 для 50/50).
3. **Хеширование и метаданные (Hashing & Metadata)**:
   - Вычисление SHA-256.
   - Нормализация `storage_filename` по Regex `^[a-zA-Z0-9_\-\.]+$`.
   - Запись метаданных в PostgreSQL `media_assets`.
4. **Переиспользование в плейлистах**:
   - Медиафайл связывается с плейлистами (`playlist_items`). Один и тот же файл может использоваться в нескольких плейлистах одновременно.
5. **Защита от удаления (Safe Dependency Check)**:
   - Удаление файла заблокировано (RESTRICT), если на него ссылаются активные конфигурации или плейлисты.
6. **Safe Old Media Policy на кассе**:
   - При обычном деплое старые файлы в каталоге кассы `uploads\` **НЕ УДАЛЯЮТСЯ**. Файлы заменяются только при изменении SHA-256. Garbage Collection исключен из MVP.

### 7.2. Жизненный цикл плейлиста и конфигурации
1. **Draft**: Создание плейлиста, выбор слайдов из медиатеки, настройка хронометража.
2. **Versioned Configuration**: Конфигурация FULL или 50/50 получает монотонно возрастающий номер версии при публикации.
3. **Target Binding**: Назначение на кассы или группы.
4. **Immutable Snapshot**: Фиксация состояния в снимке деплоя.

### 7.3. Жизненный цикл кассы (Cashbox Lifecycle)
1. **Registered**: Касса занесена в базу с IP, портом и ссылкой на учетную запись.
2. **Discovered & Inventory Collected**: Опрос по SSH, сбор Actual State (`filename`, `size`, `sha256`, `modified_at`).
3. **Synchronized / No-Op**: Если `actual_version == desired_version` и файлы совпадают по SHA-256 — статус `SYNCHRONIZED`.
4. **Update Required**: Различие в версиях или файлах.
5. **Deploying**: Прохождение 17-шагового пайплайна с concurrency limit = 4.
6. **Offline**: Касса изолируется, деплой на остальные кассы продолжается.

---

## 8. Complete 17-Step Deployment Pipeline

Развертывание рекламной конфигурации выполняется в строгой последовательности из 17 шагов. Нарушение порядка запрещено. При падении любого критического шага выполнение **НЕМЕДЛЕННО ОСТАНАВЛИВАЕТСЯ (STOP)**.

```
 [1. Validate Desired Config] -> [2. Validate Central Media] -> [3. SSH Connect]
                                                                        │
 ┌──────────────────────────────────────────────────────────────────────┘
 │
 ▼
 [4. Get Cashbox Inventory] -> [5. Calculate Diff]
                                      │
         ┌────────────────────────────┴────────────────────────────┐
      No Diff & Versions Match                                Diff Detected
         │                                                         │
         ▼                                                         ▼
 [13. Mark NO-OP & Synced]                        [6. Upload Missing/Outdated to Staging]
                                                                   │
                                                                   ▼
                                                  [7. Verify SHA-256 on Cashbox]
                                                                   │ (Fail -> STOP & Cleanup)
                                                                   ▼
                                                  [8. Move Files Atomically to uploads/]
                                                                   │
 ┌─────────────────────────────────────────────────────────────────┘
 │
 ▼
 [9. Backup Current Scene] -> [10. Validate Scene GUID] -> [11. Update Scene via sqlite3.exe]
                                                                   │
                                                                   ▼
                                                           [12. Commit Transaction]
                                                                   │
 ┌─────────────────────────────────────────────────────────────────┘
 │
 ▼
 [13. Update sync_version.txt] -> [14. Wait for Reload (<=15s)]
                                               │
 ┌─────────────────────────────────────────────┘
 │
 ▼
 [15. Verify GuestScreen PID/StartTime] -> [16. Verify Scene/Config] -> [17. Mark SUCCESS]
                                                            │
                                                  (Any Verification Fail)
                                                            │
                                                            ▼
                                                [ Auto Rollback Scene & Trigger ]
```

### 8.1. Подробное описание 17 шагов:

1. **Validate Desired Configuration**: Проверка корректности структуры целевой конфигурации, типов сцен и плейлистов в центральной БД.
2. **Validate Central Media Availability**: Проверка физического присутствия всех необходимых файлов на диске центрального сервера. Если файла нет — деплой не начинается.
3. **SSH Connectivity Check**: Установление защищенной SSH-сессии с кассой по порту 22, валидация отклика терминала.
4. **Get Cashbox Inventory**: Сбор Actual State файлов из `C:\UCS\GuestScreen\Front\media\uploads\` (`filename`, `size`, `sha256`, `modified_at`).
5. **Calculate Media Diff**: Сопоставление Desired vs Actual. Классификация: `OK`, `MISSING`, `OUTDATED`, `UNEXPECTED`. Если все файлы `OK` и версии совпадают — переход к No-Op.
6. **Upload Missing/Outdated to Staging**: Передача только `MISSING` и `OUTDATED` файлов по SFTP поверх SSH в каталог:
   `C:\UCS\GuestScreen\Front\media\uploads\.staging\<deployment_id>\`.
7. **Verify SHA-256 on Cashbox (Mandatory Gate)**: Расчет SHA-256 каждого переданного файла прямо на кассе. Если хотя бы один хеш не совпал — **STOP: деплой прерывается, staging удаляется, `gs.db` не трогается**.
8. **Move Verified Files Atomically**: Атомарное перемещение проверенных файлов из staging в рабочий каталог `uploads\`. Удаление директории staging.
9. **Backup Current Advertising Scene**: Считывание текущего значения `Raw` целевой сцены и сохранение в `deployments.previous_state_snapshot`.
10. **Validate Current Scene GUID**: Проверка совпадения GUID (`2509359c...` для Full или `68906ed2...` для 50/50). Если в базе обнаружен посторонний или поврежденный GUID — деплой блокируется.
11. **Update ONLY Required Scene**: Исполнение штатной утилиты `C:\UCS\GuestScreen\sqlite3.exe` с жестким предопределенным backend-шаблоном транзакции (`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=10000;`).
12. **Commit Transaction**: Фиксация транзакции в `gs.db`. При получении `SQLITE_BUSY` срабатывает ограниченный Retry Policy (до 3 попыток с бэкоффом).
13. **Update `sync_version.txt`**: Запись таймстемпа/версии в `C:\UCS\GuestScreen\Front\sync_version.txt`.
14. **Wait for Reload (Таймаут 15 сек)**: Ожидание реакции веб-интерфейса CefSharp Chromium.
15. **Verify GuestScreen PID / StartTime**: Проверка, что процесс `GuestScreen.exe` не упал, не завершился и не был перезапущен Windows (PID и время старта строго равны значениям до деплоя).
16. **Verify Scene / Configuration**: Контрольный `SELECT Raw` из `scenes` через `sqlite3.exe`, подтверждающий корректность целевого JSON.
17. **Mark Deployment SUCCESS**: Фиксация статуса `SUCCESS` в таблице `deployments`, перевод кассы в статус `SYNCHRONIZED`.

---

## 9. Verification & Rollback Architecture

### 9.1. Архитектура верификации
- **PID & StartTime Immutability**: Неизменность системного процесса `GuestScreen.exe` гарантирует отсутствие сбоев у кассира.
- **Scene Verification**: Проверка фактического содержимого `scenes.Raw` на кассе.
- **Reload Confirmation Window**: Окно ожидания перезагрузки фронтенда строго ограничено **15 секундами**.

### 9.2. Архитектура отката (Rollback Engine)
- **Область отката**: Откат восстанавливает **ТОЛЬКО** измененную рекламную сцену.
- **Запрет полного отката БД**: Откат `gs.db` целиком, восстановление из внешних дампов или вмешательство в системные таблицы **КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНЫ**.
- **Данные для отката**: Значение `previous_state_snapshot.raw` и `previous_version`.
- **Процедура**:
  1. Вызов `sqlite3.exe` с шаблоном восстановления предыдущего `Raw`.
  2. Запись триггера в `sync_version.txt`.
  3. Ожидание reload (15 сек) и проверка неизменности PID.
  4. Очистка каталога staging (если сбой произошел до или во время файловых операций).
  5. Запись статуса `ROLLED_BACK` с фиксацией `rollback_reason`.

---

## 10. Security Architecture, Credentials & SSH Transport

### 10.1. Требования к безопасности учетных данных SSH
- **Стандарт шифрования**:
  > *"SSH credentials must be encrypted at rest using an industry-standard authenticated encryption mechanism and must never be exposed through API responses, logs or UI."*
- **Поддерживаемые типы авторизации**:
  - Парольная аутентификация Windows.
  - Аутентификация по SSH Private Key (Ed25519 / RSA).
  - Приватные ключи с кодовой фразой (Key Passphrase).
- **Скрытие секретов**: Пароли и приватные ключи никогда не возвращаются в REST API и не попадают в логи аудита.

### 10.2. Строгий Allowlist команд и запрет произвольного Shell
Управление кассой по SSH осуществляется строго через параметризованные команды из фиксированного списка.

| Идентификатор операции | Системный вызов на кассе | Назначение |
| :--- | :--- | :--- |
| `CMD_PING` | `powershell -NoProfile -Command "Write-Output PONG"` | Проверка доступности SSH |
| `CMD_INVENTORY` | PowerShell script сбора JSON инвентаря `uploads\` | Сбор фактического инвентаря |
| `CMD_HASH_VERIFY` | `powershell -NoProfile -Command "Get-FileHash -Algorithm SHA256 ..."` | Валидация хешей в staging |
| `CMD_STAGING_MOVE` | `powershell -NoProfile -Command "Move-Item -Force ..."` | Атомарное перемещение файлов |
| `CMD_SQLITE_EXEC` | `C:\UCS\GuestScreen\sqlite3.exe "C:\UCS\GuestScreen\gs.db" "<backend_sql_template>"` | Точечные транзакции сцен |
| `CMD_TOUCH_RELOAD` | `powershell -NoProfile -Command "Set-Content ... sync_version.txt ..."` | Триггер hot reload |
| `CMD_PROC_INSPECT` | `powershell -NoProfile -Command "Get-Process GuestScreen \| Select-Object Id, StartTime"` | Верификация PID кассы |

**UI-ограничение**: В пользовательском интерфейсе полностью отсутствует элемент ввода произвольных команд консоли.

---

## 11. Concurrency & Fleet Management

- **Configurable Concurrency Pool**:
  - Параметр `default_concurrency_pool` хранится в таблице `system_settings` в PostgreSQL 16.
  - Значение по умолчанию: **4 кассы одновременно**.
  - При публикации на группу из 50 касс воркеры обрабатывают кассы батчами по 4 параллельных SSH-сессии, предотвращая всплески нагрузки на сеть ресторанов.
- **Fleet Scalability**:
  - Архитектура рассчитана на гарантированное обслуживание **200+ кассовых моноблоков**.
  - Время выполнения No-Op деплоя для синхронизированной кассы — менее **1 секунды**.

---

## 12. Detailed Execution & Failure Scenarios (13 сценариев)

В данном разделе детально специфицированы все ключевые сценарии развертывания, включая обработку нештатных ситуаций и отказов.

### Сценарий 1: Deploy FULL static (Развертывание полноэкранного статичного баннера)
1. Маркетолог назначает FULL SCREEN: Static (`banner_1024x768.jpg`) с версией `v15`.
2. Сервер подключается по SSH, инвентаризация показывает статус `MISSING`.
3. Файл передается по SFTP в `uploads\.staging\dep-001\banner_1024x768.jpg`.
4. Локальный расчет SHA-256 в staging возвращает хеш, совпадающий с эталоном из `media_assets`.
5. Файл перемещается в `uploads\banner_1024x768.jpg`. Staging удаляется.
6. Вызывается `sqlite3.exe` с транзакцией WAL:
   `UPDATE scenes SET Raw = '{"type":"image","width":1024,"height":768,"src":"media/uploads/banner_1024x768.jpg"}' WHERE Guid = '2509359c-2d71-4344-9be4-7d90dd453083'`.
7. Обновляется `Front\sync_version.txt`.
8. CefSharp перезагружает сцену (до 15 сек). Сервер верифицирует неизменность PID и StartTime `GuestScreen.exe`.
9. Статус кассы: `SYNCHRONIZED`, версия FULL: `15`, деплой: `SUCCESS`.

### Сценарий 2: Deploy FULL dynamic (Развертывание полноэкранного слайд-шоу)
1. Назначен плейлист из 3 слайдов (`s1.jpg`, `s2.jpg`, `s3.jpg`) с интервалом 5 сек (версия `v16`).
2. Инвентаризация: `s1.jpg` — `OK`, `s2.jpg` — `MISSING`, `s3.jpg` — `OUTDATED`.
3. Сервер передает по SFTP только `s2.jpg` и `s3.jpg` в staging.
4. Проверка SHA-256 в staging проходит успешно для обоих файлов.
5. Файлы атомарно переносятся в `uploads\`.
6. Сцена `2509359c...` конфигурируется как `gallery` с интервалом `5000` мс и тремя путями к слайдам.
7. Обновление `sync_version.txt`. Процесс `GuestScreen.exe` не прерывается.
8. Слайд-шоу начинает ротацию каждые 5 секунд. Деплой: `SUCCESS`.

### Сценарий 3: Deploy 50/50 static (Развертывание промо-баннера для экрана чека)
1. На кассе открыт активный чек покупателя. Маркетолог назначает статический баннер комбо (`combo.jpg`, 512×768, `v8`).
2. Файл доставляется через staging, проверяется по SHA-256 и переносится в `uploads\combo.jpg`.
3. Сцена состава чека `255dc54c-70ea-465d-8b2c-d9d8b0ad63a4` **НЕ ТРОГАЕТСЯ**.
4. Сцена правого промо-блока `68906ed2-49a3-4dc3-bb8a-6fa7943f39c3` точечно обновляется через `sqlite3.exe`.
5. Обновляется `sync_version.txt`. Правая половина экрана начинает показывать баннер комбо. Чек слева не моргнул, кассир продолжает пробивать блюда без задержек. Деплой: `SUCCESS`.

### Сценарий 4: Deploy 50/50 dynamic (Развертывание динамического слайд-шоу 50/50)
1. Назначена конфигурация 50/50 из 2 слайдов с интервалом 7 секунд (`v9`).
2. Файлы доставляются, валидируются по SHA-256 и перемещаются в `uploads\`.
3. Сцена `68906ed2...` обновляется через `sqlite3.exe`: `"type":"gallery"`, ширина `512`, интервал `7000`.
4. Инкремент `sync_version.txt`. Баннеры сменяются каждые 7 секунд во время обслуживания гостя. Деплой: `SUCCESS`.

### Сценарий 5: Missing media (Отсутствие файла в центральном хранилище)
1. Конфигурация ссылается на файл, физически отсутствующий на диске сервера.
2. Pre-flight валидация сервера на шаге 2 обнаруживает отсутствие файла.
3. Деплой блокируется ДО обращения к кассе по SSH.
4. В UI выводится ошибка: "Медиафайл недоступен в центральном хранилище". Касса не затрагивается.

### Сценарий 6: Wrong SHA-256 (Несовпадение контрольной суммы после передачи)
1. Файл передан в `uploads\.staging\<dep-id>\banner.jpg`, но поврежден при передаче.
2. Проверка SHA-256 на кассе (шаг 7) выявляет несовпадение с эталоном.
3. **Активация шлюза безопасности**:
   - Атомарный перенос в `uploads\` ЗАБЛОКИРОВАН.
   - Модификация `gs.db` ЗАБЛОКИРОВАНА.
   - Каталог staging принудительно удаляется.
4. Деплой получает статус `FAILED`. Касса продолжает непрерывно показывать старую рекламу.

### Сценарий 7: Upload failure (Обрыв сетевого соединения в процессе передачи)
1. При передаче файла по SFTP обрывается сетевой линк.
2. Сервер фиксирует таймаут соединения.
3. Поскольку запись велась в staging, рабочий каталог `uploads\` чист, а `gs.db` не открывалась.
4. Деплой помечается как `FAILED`, касса получает статус `UNREACHABLE` до восстановления связи.

### Сценарий 8: gs.db transaction failure (Блокировка базы данных SQLite)
1. Файлы успешно проверены и перенесены в `uploads\`.
2. При попытке обновления сцены через `sqlite3.exe` база заблокирована сторонним процессом дольше 10 000 мс (`SQLITE_BUSY`).
3. Срабатывает Retry Policy (до 3 попыток с паузой). При исчерпании попыток транзакция прерывается.
4. Файл `sync_version.txt` НЕ затрагивается.
5. Гостевой экран продолжает непрерывно показывать старую рекламу. Деплой получает статус `FAILED`.

### Сценарий 9: Hot reload failure (Отсутствие реакции фронтенда за 15 секунд)
1. Сцена в `gs.db` обновлена, файл `sync_version.txt` перезаписан, но фронтенд не перечитал конфигурацию за 15 сек.
2. Сервер фиксирует таймаут ожидания перезагрузки.
3. Запускается автоматический откат: `sqlite3.exe` восстанавливает исходный Raw из снимка, повторно обновляется `sync_version.txt`.
4. Деплой получает статус `ROLLED_BACK`.

### Сценарий 10: Verification failure (Изменение PID или падение процесса GuestScreen)
1. В ходе или сразу после деплоя процесс `GuestScreen.exe` упал или изменил PID.
2. Шаг 15 верификации фиксирует аномалию: PID не совпадает со значением до деплоя.
3. Формируется критический алерт в журнал аудита. Деплой получает статус `FAILED`.
4. Касса переводится в статус `ERROR`, автоматические публикации на нее блокируются до ручной проверки.

### Сценарий 11: Rollback (Ручной или автоматический возврат к предыдущей конфигурации)
1. Оператор нажимает "Откатить" в Web UI (или срабатывает автооткат при сбое).
2. Сервер берет `previous_state_snapshot.raw` и `previous_version`.
3. Через `sqlite3.exe` восстанавливается предыдущая сцена.
4. Записывается триггер в `sync_version.txt`, проверяется перезагрузка CefSharp и стабильность PID.
5. Статус деплоя: `ROLLED_BACK`. Касса вернулась к предыдущей рекламе без даунтайма.

### Сценарий 12: Cashbox offline (Касса выключена или недоступна по сети)
1. При публикации на группу касс одна из касс выключена (таймаут SSH 5 сек).
2. Офлайн-касса изолируется со статусом `OFFLINE` и помечается `PENDING_UPDATE`.
3. Публикация на остальные кассы группы продолжается в штатном режиме.
4. При выходе кассы в сеть деплой выполняется автоматически.

### Сценарий 13: Re-deployment already synchronized configuration (Идемпотентность / No-Op)
1. Оператор повторно публикует ту же версию конфигурации на синхронизированную кассу.
2. Сервер видит: `target_version == current_version` и хеши всех файлов в инвентаре совпадают.
3. Сетевая передача файлов НЕ производится, команды к `gs.db` НЕ отправляются, `sync_version.txt` НЕ изменяется.
4. Запрос мгновенно возвращает статус `NO_OP / SUCCESS` за время < 1.0 сек.

---

## 13. Complete Functional Requirements (FR)

### 13.1. Media Library & Assets
- **FR-001**: Система ДОЛЖНА поддерживать загрузку файлов JPEG, PNG, WebP в локальную файловую систему центрального сервера.
- **FR-002**: Система ДОЛЖНА сохранять метаданные медиафайлов в PostgreSQL 16 (`media_assets`).
- **FR-003**: Система ДОЛЖНА валидировать имя файла по Regex `^[a-zA-Z0-9_\-\.]+$` для защиты от Path Traversal.
- **FR-004**: Система ДОЛЖНА формировать миниатюры (thumbnails) для предпросмотра в Web UI.
- **FR-005**: Система ДОЛЖНА запрещать удаление медиафайлов, привязанных к активным конфигурациям или плейлистам (HTTP 409 Conflict).

### 13.2. Playlists & Configurations
- **FR-006**: Система ДОЛЖНА поддерживать создание переиспользуемых плейлистов для зон `FULL_SCREEN` и `SPLIT_50_50`.
- **FR-007**: Система ДОЛЖНА поддерживать изменение порядка слайдов в плейлисте (`sort_order`).
- **FR-008**: Система ДОЛЖНА поддерживать настройку интервала показа (общий для плейлиста и индивидуальный для слайда: 5, 7, 10 сек).
- **FR-009**: Система ДОЛЖНА поддерживать создание конфигураций FULL SCREEN (`STATIC` / `DYNAMIC`).
- **FR-010**: Система ДОЛЖНА поддерживать создание конфигураций 50/50 (`STATIC` / `DYNAMIC`).
- **FR-011**: Система ДОЛЖНА инкрементировать версию конфигурации при каждой новой публикации.

### 13.3. Cashbox Fleet & Inventory
- **FR-012**: Система ДОЛЖНА вести реестр кассовых моноблоков и иерархических групп в PostgreSQL 16.
- **FR-013**: Система ДОЛЖНА собирать инвентарь файлов из `C:\UCS\GuestScreen\Front\media\uploads\`.
- **FR-014**: Система ДОЛЖНА классифицировать файлы при сверке: `OK`, `MISSING`, `OUTDATED`, `UNEXPECTED`.
- **FR-015**: Система НЕ ДОЛЖНА автоматически удалять файлы со статусом `UNEXPECTED` в ходе деплоя.

### 13.4. Deployment & Transport
- **FR-016**: Все коммуникации с кассой ДОЛЖНЫ выполняться по протоколам SSH и SFTP.
- **FR-017**: Недостающие и изменившиеся файлы ДОЛЖНЫ передаваться в `uploads\.staging\<deployment_id>\`.
- **FR-018**: Перенос файлов в `uploads\` разрешен ТОЛЬКО после 100% подтверждения SHA-256 в staging.
- **FR-019**: Модификация `gs.db` разрешена ТОЛЬКО после того, как все медиафайлы перенесены в `uploads\`.
- **FR-020**: Модификация `gs.db` ДОЛЖНА выполняться утилитой `C:\UCS\GuestScreen\sqlite3.exe` с параметрами `PRAGMA journal_mode=WAL; PRAGMA busy_timeout=10000;`.
- **FR-021**: Система ДОЛЖНА модифицировать ТОЛЬКО сцену `2509359c-2d71-4344-9be4-7d90dd453083` (FULL) или `68906ed2-49a3-4dc3-bb8a-6fa7943f39c3` (50/50).
- **FR-022**: Система ДОЛЖНА вызывать Hot Reload через модификацию `C:\UCS\GuestScreen\Front\sync_version.txt`.
- **FR-023**: Система ДОЛЖНА контролировать неизменность PID и StartTime процесса `GuestScreen.exe`.
- **FR-024**: При совпадении версий и хешей файлов система ДОЛЖНА выполнять No-Op завершение без повторной передачи данных.

### 13.5. Security & Audit
- **FR-025**: Учетные данные SSH ДОЛЖНЫ храниться в зашифрованном виде (аутентифицированное шифрование в покое).
- **FR-026**: Все удаленные команды ДОЛЖНЫ валидироваться по строгому белому списку (Allowlist).
- **FR-027**: В Web UI ЗАПРЕЩЕНО предоставлять интерфейс выполнения произвольных команд.
- **FR-028**: Все действия пользователей и этапы деплоя ДОЛЖНЫ записываться в `audit_logs` и `deployment_items`.

---

## 14. Non-Functional Requirements (NFR)

- **NFR-001 (Масштабируемость)**: Поддержка одновременного управления парком из **200+ кассовых моноблоков**.
- **NFR-002 (Параллелизм)**: Конфигурируемый пул одновременных деплоев со значением по умолчанию **4 кассы параллельно**.
- **NFR-003 (Время отклика инвентаризации)**: Время сканирования инвентаря кассы по SSH — не более **3 секунд**.
- **NFR-004 (Таймаут Hot Reload)**: Лимит ожидания перезагрузки фронтенда после обновления триггера — строго **15 секунд**.
- **NFR-005 (Идемпотентность No-Op)**: Время завершения No-Op деплоя для синхронизированной кассы — не более **1 секунды**.
- **NFR-006 (100% аптайм кассы)**: Нулевое прерывание кассовых чеков r_keeper и непрерывная работа `GuestScreen.exe`.
- **NFR-007 (Автономность)**: При разрыве связи с сервером касса непрерывно воспроизводит текущую рекламу из `gs.db`.
- **NFR-008 (Безопасность секретов)**: Шифрование учетных записей SSH в покое по промышленным стандартам.

---

## 15. User Scenarios & Prioritized User Stories

### User Story 1 - Развертывание полноэкранного статичного баннера (Priority: P1)
**Given** касса подключена по SSH и свободна от заказа,  
**When** публикуется статический баннер FULL SCREEN (`banner.jpg`),  
**Then** файл доставляется через staging, проверяется SHA-256, обновляется сцена `2509359c...` через `sqlite3.exe`, срабатывает hot reload, и гостевой экран без перезапуска `GuestScreen.exe` отображает баннер.

---

### User Story 2 - Развертывание слайд-шоу FULL SCREEN с интервалом (Priority: P1)
**Given** плейлист из 3 слайдов с интервалом 5 секунд,  
**When** запускается публикация,  
**Then** недостающие файлы доставляются в `uploads\`, сцена `2509359c...` обновляется как галерея с интервалом 5000 мс, и на экране ожидания начинается ротация слайдов.

---

### User Story 3 - Развертывание промо-баннера 50/50 во время заказа (Priority: P1)
**Given** на кассе открыт активный чек в r_keeper,  
**When** публикуется баннер 50/50 Static (`upsell.jpg`),  
**Then** обновляется исключительно сцена `68906ed2...`, левая половина чека не моргает, а правая половина отображает новый промо-баннер.

---

### User Story 4 - Развертывание динамического слайд-шоу 50/50 (Priority: P1)
**Given** открыт чек в r_keeper,  
**When** активируется конфигурация 50/50 Dynamic из 2 слайдов с интервалом 7 секунд,  
**Then** слайды циклически сменяются в правой половине экрана каждые 7 секунд без задержек в обслуживании гостя.

---

### User Story 5 - Инвентаризация и защита целостности по SHA-256 (Priority: P2)
**Given** переданный в staging файл поврежден,  
**When** сервер проверяет контрольную сумму на кассе,  
**Then** деплой блокируется, staging очищается, `gs.db` не затрагивается, касса продолжает показ текущей рекламы.

---

### User Story 6 - Группировка касс и волновой деплой (Priority: P2)
**Given** группа из 20 касс и concurrency limit = 4,  
**When** запускается публикация на группу,  
**Then** сервер обрабатывает кассы батчами по 4 параллельных соединения, исключая сетевые перегрузки.

---

### User Story 7 - Автоматический откат при сбое верификации (Priority: P2)
**Given** после hot reload изменен PID процесса `GuestScreen.exe` или не подтверждена перезагрузка за 15 сек,  
**When** срабатывает монитор верификации,  
**Then** система возвращает предыдущую сцену через `sqlite3.exe`, обновляет `sync_version.txt` и переводит статус в `ROLLED_BACK`.

---

### User Story 8 - Аудит и блокировка неразрешенных команд (Priority: P3)
**Given** попытка выполнения произвольной shell-команды,  
**When** запрос поступает на сервер,  
**Then** команда блокируется allowlist-валидатором, а событие фиксируется в `audit_logs`.

---

## 16. Success Criteria (Критерии приемки)

| ID | Критерий приемки | Метод верификации |
| :--- | :--- | :--- |
| **SC-001** | Штатный рендеринг: GuestScreen без внешних надстроек воспроизводит FULL SCREEN и 50/50 рекламу. | Визуальный контроль на кассовом моноблоке в обоих режимах. |
| **SC-002** | Неприкосновенность системных таблиц: `licenses`, `screens`, `scenarios`, `settings` не изменены ни на один байт. | Сверка дампов и хешей системных таблиц `gs.db` до и после 50 деплоев. |
| **SC-003** | 100% защита от черных экранов: Конфигурация сцены не применяется при повреждении хотя бы одного медиафайла. | Тест с искусственным искажением SHA-256 в staging. |
| **SC-004** | Бесперебойный Hot Reload: PID и время старта `GuestScreen.exe` остаются неизменными при смене баннеров. | Мониторинг WMI-параметров процесса в ходе деплоя. |
| **SC-005** | Идемпотентность: Повторный запуск деплоя той же версии завершается со статусом No-Op за время < 1 сек без передачи данных. | Замер времени и сетевого трафика повторной публикации. |
| **SC-006** | Автоматический откат: Сбой деплоя восстанавливает предыдущую сцену за время ≤ 10 сек. | Имитация сбоев верификации и замер времени возврата баннера. |
| **SC-007** | Изоляция учетных данных: Пароли и SSH-ключи отсутствуют в коде и зашифрованы в БД. | Проверка схемы БД и аудит исходного кода. |
| **SC-008** | Защита от произвольного shell: Попытки отправки команд вне allowlist блокируются ядром сервера. | Автоматизированный тест с вызовом запрещенной команды. |

---

## 17. Assumptions & Dependencies (Допущения и зависимости)

1. **Версия GuestScreen**: Все кассы парка работают под управлением UCS GuestScreen v3.1.1.0 с CefSharp Chromium.
2. **ОС кассовых моноблоков**: Windows 10 IoT Enterprise или Windows 11 Pro с активной службой OpenSSH Server.
3. **Стандартные локальные каталоги**: Программа установлена в `C:\UCS\GuestScreen\`, загрузка медиа в `C:\UCS\GuestScreen\Front\media\uploads\`.
4. **Сетевой маршрут**: Порт SSH (22) касс маршрутизируется и доступен центральному серверу напрямую или через VPN.
5. **Утилита SQLite**: На кассе присутствует штатная утилита `C:\UCS\GuestScreen\sqlite3.exe`.

---

## 18. Remaining Open Questions for Phase PLAN

В ходе сессии Clarify все ключевые архитектурные развилки (стек, транспорт, хранилище, SQLite, политики файлов, параллелизм, пайплайн деплоя) были однозначно зафиксированы.

Для этапа **PLAN** остаются исключительно низкоуровневые вопросы реализации:
1. **Конкретный механизм шифрования учетных данных в PostgreSQL**:
   - Выбор между симметричным шифрованием приложения (например, `Fernet` / AES-256-GCM с мастер-ключом в переменной окружения) или интеграцией с внешним Secret Vault (HashiCorp Vault / KMS).
2. **Архитектура очередей фоновых задач деплоя**:
   - Выбор механизма выполнения асинхронных задач деплоя в FastAPI: встроенный `asyncio.Queue` / фоновые таски FastAPI против распределенной очереди (ARQ / Celery с Redis).
3. **Формат и параметры бэкоффа для SQLite Retry Policy**:
   - Определение точных интервалов между попытками при возникновении `SQLITE_BUSY` (например, 3 попытки: 200мс, 500мс, 1000мс перед признанием ошибки блокировки).
