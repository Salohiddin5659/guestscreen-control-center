# Dashboard JQL & Gadget Contracts: Проект «Ургент линия»

**Feature**: [spec.md](file:///d:/Anti/specs/003-urgent-line-jira/spec.md) | **Date**: 2026-09-08

---

## 1. Спецификация 9 виджетов операционного Dashboard «Ургент линия»

| № | Виджет / Блок | Тип гаджета Jira | JQL Запрос / Фильтр | Параметры отображения |
| :-: | :--- | :--- | :--- | :--- |
| **1** | **Активные P1** | `Filter Results` | `project = URG AND priority = "P1 — Критический" AND statusCategory != Done ORDER BY created ASC` | Поля: Key, Summary, Status, Assignee, Created. Цветовая подсветка: Красный. |
| **2** | **Активные P2** | `Filter Results` | `project = URG AND priority = "P2 — Высокий" AND statusCategory != Done ORDER BY created ASC` | Поля: Key, Summary, Status, Assignee, Created. Цветовая подсветка: Оранжевый. |
| **3** | **Все открытые ургентные тикеты** | `Filter Results` | `project = URG AND statusCategory != Done ORDER BY priority ASC, created ASC` | Поля: Key, Summary, Priority, Status, Assignee, Retail Point, City. |
| **4** | **Просроченные тикеты (SLA Breached)** | `Filter Results` | `project = URG AND statusCategory != Done AND (labels = "sla-breached" OR "Time to resolution" = breached() OR "Time to first response" = breached()) ORDER BY created ASC` | Предупреждающий баннер, отображение времени просрочки. |
| **5** | **Количество инцидентов (Счетчики)** | `Two-Dimensional Filter Statistics` | `project = URG AND created >= startOfMonth()` | Ось X: Priority; Ось Y: Status. |
| **6** | **Инциденты по типам** | `Pie Chart` | `project = URG AND created >= startOfMonth()` | Статистика по полю: `customfield_incident_type` (11 типов). |
| **7** | **Инциденты по торговым точкам** | `Issue Statistics` / `Bar Chart` | `project = URG AND created >= startOfMonth()` | Статистика по полю: `customfield_branch`. Сортировка по убыванию количества. |
| **8** | **Время реакции** | `Resolution Time / SLA Gadget` | `project = URG AND created >= startOfMonth()` | Среднее время от создания до первого перехода/ответа. Разделение по P1/P2. |
| **9** | **Время решения** | `Created vs Resolved Issues` | `project = URG AND created >= startOfMonth()` | График темпа поступления vs закрытия инцидентов со средним MTTR. |

---

## 2. JQL-фильтры для оповещений и сторожевого таймера (Watchdog)

### Фильтр аварийной эскалации P1 при отсутствии реакции (5 минут)
```jql
project = URG AND priority = "P1 — Критический" AND status in ("Новый", "Эскалирован") AND updated <= -5m
```
*Действие по фильтру*: Отправка экстренного уведомления руководителю группы Urgent Team о нарушении регламента первичного отклика.

### Фильтр превентивного предупреждения SLA 75%
```jql
project = URG AND statusCategory != Done AND "Time to resolution" = remaining("25%")
```
*Действие по фильтру*: Маркировка тегом `#sla-warning-75` и направление нотификации исполнителю.
