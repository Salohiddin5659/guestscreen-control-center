#!/usr/bin/env python3
# -*- coding: utf-8 -*-
r"""
================================================================================
 СИСТЕМА МОНИТОРИНГА КАССОВЫХ СЛУЖБ: FiscalService & FiscalDriveAPI
================================================================================
 Скрипт быстрого многопоточного аудита и онлайн-мониторинга касс R-Keeper / UCS.
 Проверяет наличие и статус служб FiscalService и FiscalDriveAPI, PID, тип запуска,
 пути к исполняемым файлам, сетевую доступность и сохраняет отчеты.

 Использование:
   python fiscal_monitor.py                     # Полный опрос диапазона 114..222 (хосты 201..205)
   python fiscal_monitor.py --subnets 114-253   # Расширенный диапазон подсетей
   python fiscal_monitor.py --only-running      # Показать только кассы с работающим FiscalService
   python fiscal_monitor.py --only-stopped      # Показать кассы со остановленным FiscalService
   python fiscal_monitor.py --all-fiscal        # Подробно по всем фискальным службам
   python fiscal_monitor.py --watch 30          # Режим живого мониторинга каждые 30 сек
   python fiscal_monitor.py --html report.html  # Генерация интерактивного HTML отчета
   python fiscal_monitor.py --web 8088          # Запуск веб-дашборда на http://localhost:8088
   python fiscal_monitor.py --start 192.168.152.202   # Запустить службу на кассе
   python fiscal_monitor.py --restart 192.168.152.202 # Перезапустить службу на кассе
================================================================================
"""

import os
import re
import sys
import time
import json
import csv
import socket
import argparse
import datetime
import subprocess
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
from concurrent.futures import ThreadPoolExecutor, as_completed

# Включение поддержки ANSI цветов и UTF-8 в Windows консоли
if os.name == "nt":
    os.system("")
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# ============================ НАСТРОЙКИ ПО УМОЛЧАНИЮ ============================
DEFAULT_USERNAME = "Administrator"
DEFAULT_PASSWORD = "123"

# Диапазон по умолчанию: 114–222 (или до 253), хосты 201–205
DEFAULT_START_SUBNET = 114
DEFAULT_END_SUBNET = 222
DEFAULT_START_HOST = 201
DEFAULT_END_HOST = 205

# Таймауты и потоки
PING_TIMEOUT = 0.45       # Быстрый TCP таймаут для отсева офлайна (сек)
CMD_TIMEOUT = 4.0         # Таймаут выполнения sc.exe / net use (сек)
MAX_PING_WORKERS = 70     # Потоков для TCP проверки
MAX_QUERY_WORKERS = 35    # Потоков для опроса служб

REPORTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "reports")
LOGS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")

# ============================ ЦВЕТА И СТИЛИ КОНСОЛИ ============================
class Color:
    RESET   = "\033[0m"
    BOLD    = "\033[1m"
    DIM     = "\033[2m"
    RED     = "\033[91m"
    GREEN   = "\033[92m"
    YELLOW  = "\033[93m"
    BLUE    = "\033[94m"
    MAGENTA = "\033[95m"
    CYAN    = "\033[96m"
    WHITE   = "\033[97m"
    GRAY    = "\033[90m"
    BG_GREEN = "\033[42m\033[30m"
    BG_RED   = "\033[41m\033[97m"
    BG_BLUE  = "\033[44m\033[97m"

def c(text, color_code):
    return f"{color_code}{text}{Color.RESET}"

# ============================ ГЕНЕРАТОР IP АДРЕСОВ ============================
def generate_ips(start_subnet=DEFAULT_START_SUBNET, end_subnet=DEFAULT_END_SUBNET,
                 start_host=DEFAULT_START_HOST, end_host=DEFAULT_END_HOST):
    """
    Генератор IP адресов касс по диапазону подсетей и номеров хостов.
    """
    ips = []
    for subnet in range(start_subnet, end_subnet + 1):
        for host in range(start_host, end_host + 1):
            ips.append(f"192.168.{subnet}.{host}")
    return ips

def parse_ip_targets(args):
    """Определение списка целевых IP из аргументов командной строки."""
    if args.ips:
        return [ip.strip() for ip in args.ips.split(",") if ip.strip()]
    if args.file and os.path.exists(args.file):
        with open(args.file, "r", encoding="utf-8") as f:
            return [line.strip() for line in f if line.strip() and not line.strip().startswith("#")]
    
    start_sub = args.start_subnet
    end_sub = args.end_subnet
    if args.subnets:
        if "-" in args.subnets:
            p = args.subnets.split("-")
            start_sub, end_sub = int(p[0]), int(p[1])
        else:
            start_sub = end_sub = int(args.subnets)

    start_h = args.start_host
    end_h = args.end_host
    if args.hosts:
        if "-" in args.hosts:
            p = args.hosts.split("-")
            start_h, end_h = int(p[0]), int(p[1])
        elif "," in args.hosts:
            host_list = [int(x.strip()) for x in args.hosts.split(",") if x.strip()]
            ips = []
            for subnet in range(start_sub, end_sub + 1):
                for host in host_list:
                    ips.append(f"192.168.{subnet}.{host}")
            return ips
        else:
            start_h = end_h = int(args.hosts)

    return generate_ips(start_sub, end_sub, start_h, end_h)

# ============================ СЕТЕВЫЕ ПРОВЕРКИ ============================
def is_port_open(ip: str, port: int = 445, timeout: float = PING_TIMEOUT) -> bool:
    """Быстрая проверка доступности порта (SMB 445 или RPC 135)."""
    try:
        with socket.create_connection((ip, port), timeout=timeout):
            return True
    except (socket.timeout, OSError):
        return False

def check_host_online(ip: str) -> tuple[str, bool]:
    """Проверка доступности хоста по SMB (445) и резервно по RPC (135)."""
    if is_port_open(ip, 445, PING_TIMEOUT):
        return ip, True
    if is_port_open(ip, 135, PING_TIMEOUT):
        return ip, True
    return ip, False

def connect_remote_smb(ip: str, username: str, password: str) -> bool:
    """Аутентификация через SMB/IPC$ для удаленного доступа к SC Manager."""
    share = rf"\\{ip}\c$"
    cmd = ["net", "use", share, password, f"/user:{username}"]
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, encoding="cp866", errors="replace", timeout=CMD_TIMEOUT)
        return res.returncode == 0 or "уже" in res.stderr.lower() or "already" in res.stderr.lower() or os.path.exists(share)
    except Exception:
        return False

# ============================ ОПРОС СЛУЖБ ЧЕРЕЗ SC.EXE ============================
def parse_service_details(ip: str, service_name: str) -> dict:
    """
    Получение детальной информации о службе на удаленной кассе через sc.exe.
    Возвращает статус (RUNNING/STOPPED/NOT_INSTALLED), PID, StartType, BinPath.
    """
    res = {
        "name": service_name,
        "status": "NOT_INSTALLED",
        "pid": 0,
        "start_type": "UNKNOWN",
        "bin_path": "",
        "display_name": service_name,
        "error": None
    }

    try:
        # 1. Запрос статуса и PID (queryex)
        q = subprocess.run(
            ["sc.exe", rf"\\{ip}", "queryex", service_name],
            capture_output=True, text=True, encoding="cp866", errors="replace",
            timeout=CMD_TIMEOUT
        )

        if q.returncode != 0:
            if "1060" in q.stdout or "1060" in q.stderr:
                res["status"] = "NOT_INSTALLED"
            elif "5" in q.stdout or "Access is denied" in q.stdout or "Отказано в доступе" in q.stdout:
                res["status"] = "ACCESS_DENIED"
                res["error"] = "Access Denied"
            else:
                res["status"] = "NOT_INSTALLED"
            return res

        # Определяем статус
        out = q.stdout.upper()
        if "RUNNING" in out:
            res["status"] = "RUNNING"
        elif "STOPPED" in out:
            res["status"] = "STOPPED"
        elif "PAUSED" in out:
            res["status"] = "PAUSED"
        elif "START_PENDING" in out:
            res["status"] = "STARTING"
        elif "STOP_PENDING" in out:
            res["status"] = "STOPPING"
        else:
            res["status"] = "UNKNOWN"

        # Извлечение PID
        m_pid = re.search(r'(?:PID|ID_[^\s:]+)\s*:\s*(\d+)', q.stdout, re.IGNORECASE)
        if m_pid:
            res["pid"] = int(m_pid.group(1))

        # 2. Запрос конфигурации службы (qc)
        qc = subprocess.run(
            ["sc.exe", rf"\\{ip}", "qc", service_name],
            capture_output=True, text=True, encoding="cp866", errors="replace",
            timeout=CMD_TIMEOUT
        )
        if qc.returncode == 0:
            qc_out = qc.stdout
            if "AUTO_START" in qc_out:
                res["start_type"] = "AUTO"
            elif "DEMAND_START" in qc_out:
                res["start_type"] = "MANUAL"
            elif "DISABLED" in qc_out:
                res["start_type"] = "DISABLED"

            # Бинарный путь
            for line in qc_out.splitlines():
                ls = line.strip()
                if any(k in ls for k in ["BINARY_PATH_NAME", "ПУТЬ_К_ДВОИЧНОМУ_ФАЙЛУ", "ИМЯ_ДВОИЧНОГО_ФАЙЛА"]):
                    if ":" in ls:
                        res["bin_path"] = ls.split(":", 1)[1].strip()
                elif any(k in ls for k in ["DISPLAY_NAME", "ОТОБРАЖАЕМОЕ_ИМЯ"]):
                    if ":" in ls:
                        res["display_name"] = ls.split(":", 1)[1].strip()

            if not res["bin_path"]:
                m_path = re.search(r':\s*([a-zA-Z]:\\[^\r\n]+)', qc_out)
                if m_path:
                    res["bin_path"] = m_path.group(1).strip()

    except subprocess.TimeoutExpired:
        res["status"] = "TIMEOUT"
        res["error"] = "SC Query Timeout"
    except Exception as e:
        res["status"] = "ERROR"
        res["error"] = str(e)

    return res

def inspect_cash_desk(ip: str, username: str, password: str, target_service: str = "FiscalService") -> dict:
    """Полная инспекция одной кассы: статус сети, FiscalService и FiscalDriveAPI."""
    result = {
        "ip": ip,
        "online": False,
        "auth_ok": False,
        "fiscal_service": None,
        "fiscal_drive_api": None,
        "all_services": [],
        "scan_time": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "error": None
    }

    # 1. Проверка доступности порта
    _, is_up = check_host_online(ip)
    if not is_up:
        return result

    result["online"] = True

    # 2. Подключение SMB
    auth = connect_remote_smb(ip, username, password)
    result["auth_ok"] = auth

    # 3. Опрос целевой службы FiscalService
    fs_info = parse_service_details(ip, target_service)
    result["fiscal_service"] = fs_info

    # 4. Опрос службы FiscalDriveAPI (для полной картины)
    fd_info = parse_service_details(ip, "FiscalDriveAPI")
    result["fiscal_drive_api"] = fd_info

    return result

# ============================ ДЕЙСТВИЯ СО СЛУЖБАМИ ============================
def control_remote_service(ip: str, service_name: str, action: str, username: str, password: str) -> tuple[bool, str]:
    """
    Управление службой на кассе: start, stop, restart, config.
    """
    connect_remote_smb(ip, username, password)
    action = action.lower()

    if action == "start":
        cmd = ["sc.exe", rf"\\{ip}", "start", service_name]
        res = subprocess.run(cmd, capture_output=True, text=True, encoding="cp866", errors="replace", timeout=8)
        if res.returncode == 0 or "1056" in res.stdout: # 1056: already running
            return True, f"Служба {service_name} запущена."
        return False, f"Ошибка запуска: {res.stdout.strip() or res.stderr.strip()}"

    elif action == "stop":
        cmd = ["sc.exe", rf"\\{ip}", "stop", service_name]
        res = subprocess.run(cmd, capture_output=True, text=True, encoding="cp866", errors="replace", timeout=8)
        if res.returncode == 0 or "1062" in res.stdout: # 1062: not started
            return True, f"Служба {service_name} остановлена."
        return False, f"Ошибка остановки: {res.stdout.strip() or res.stderr.strip()}"

    elif action == "restart":
        # Stop first
        subprocess.run(["sc.exe", rf"\\{ip}", "stop", service_name], capture_output=True, timeout=5)
        time.sleep(1.5)
        # Start
        cmd = ["sc.exe", rf"\\{ip}", "start", service_name]
        res = subprocess.run(cmd, capture_output=True, text=True, encoding="cp866", errors="replace", timeout=8)
        if res.returncode == 0:
            return True, f"Служба {service_name} успешно перезапущена."
        return False, f"Ошибка перезапуска: {res.stdout.strip() or res.stderr.strip()}"

    elif action == "auto":
        cmd = ["sc.exe", rf"\\{ip}", "config", service_name, "start=", "auto"]
        res = subprocess.run(cmd, capture_output=True, text=True, encoding="cp866", errors="replace", timeout=5)
        if res.returncode == 0:
            return True, f"Автозапуск службы {service_name} установлен в AUTO."
        return False, f"Ошибка установки автозапуска: {res.stdout.strip()}"

    return False, f"Неизвестное действие: {action}"

# ============================ СКАНИРОВАНИЕ ВСЕЙ СЕТИ ============================
def scan_network(ips: list[str], username: str = DEFAULT_USERNAME, password: str = DEFAULT_PASSWORD,
                 target_service: str = "FiscalService", show_progress: bool = True) -> list[dict]:
    """
    Двухэтапное высокоскоростное сканирование сети:
    Этап 1: Параллельный TCP пинг всех IP (отсев офлайн хостов за пару секунд)
    Этап 2: Параллельный опрос служб на активных хостах
    """
    total_ips = len(ips)
    if show_progress:
        print(c(f"\n[*] Этап 1/2: Быстрое сканирование доступности {total_ips} IP адресов...", Color.CYAN))

    online_ips = []
    checked_count = 0
    t_start = time.time()

    # Этап 1: TCP Ping
    with ThreadPoolExecutor(max_workers=MAX_PING_WORKERS) as executor:
        futures = {executor.submit(check_host_online, ip): ip for ip in ips}
        for future in as_completed(futures):
            checked_count += 1
            ip, is_up = future.result()
            if is_up:
                online_ips.append(ip)
            if show_progress and (checked_count % 25 == 0 or checked_count == total_ips):
                pct = int((checked_count / total_ips) * 100)
                sys.stdout.write(f"\r    Проверено хостов: {checked_count}/{total_ips} ({pct}%) | Доступно в сети: {len(online_ips)}")
                sys.stdout.flush()

    if show_progress:
        print(f"\n    {c('✔', Color.GREEN)} Доступно в сети: {c(len(online_ips), Color.BOLD)} из {total_ips} хостов (за {time.time() - t_start:.2f} сек)")
        print(c(f"[*] Этап 2/2: Опрос службы '{target_service}' и 'FiscalDriveAPI' на активных кассах...", Color.CYAN))

    # Сортируем активные IP по числовым октетам
    def ip_sort_key(ip_str):
        return [int(x) for x in ip_str.split(".")]
    
    sorted_online = sorted(online_ips, key=ip_sort_key)
    results_map = {}

    # Заполняем офлайн результаты
    for ip in ips:
        if ip not in online_ips:
            results_map[ip] = {
                "ip": ip,
                "online": False,
                "auth_ok": False,
                "fiscal_service": None,
                "fiscal_drive_api": None,
                "all_services": [],
                "scan_time": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "error": "Host unreachable"
            }

    # Этап 2: Опрос служб на активных
    t2_start = time.time()
    queried_count = 0
    total_online = len(sorted_online)

    with ThreadPoolExecutor(max_workers=MAX_QUERY_WORKERS) as executor:
        futures = {
            executor.submit(inspect_cash_desk, ip, username, password, target_service): ip 
            for ip in sorted_online
        }
        for future in as_completed(futures):
            queried_count += 1
            res = future.result()
            results_map[res["ip"]] = res
            if show_progress and (queried_count % 5 == 0 or queried_count == total_online):
                pct = int((queried_count / max(1, total_online)) * 100)
                sys.stdout.write(f"\r    Опрошено касс: {queried_count}/{total_online} ({pct}%)")
                sys.stdout.flush()

    if show_progress and total_online > 0:
        print(f"\n    {c('✔', Color.GREEN)} Опрос завершен за {time.time() - t2_start:.2f} сек")

    # Итоговый список отсортирован по IP
    final_list = [results_map[ip] for ip in sorted(ips, key=ip_sort_key)]
    return final_list

# ============================ ФОРМАТИРОВАНИЕ И ВЫВОД ============================
def render_terminal_dashboard(results: list[dict], target_service: str = "FiscalService", filter_mode: str = "all"):
    """
    Отрисовка красивого цветного терминального дашборда со сводкой и таблицами.
    """
    total = len(results)
    online_count = sum(1 for r in results if r["online"])
    offline_count = total - online_count

    fs_running = []
    fs_stopped = []
    fs_not_installed = []
    fs_error = []

    fd_running = 0
    fd_stopped = 0

    for r in results:
        if not r["online"]:
            continue
        fs = r.get("fiscal_service") or {}
        fd = r.get("fiscal_drive_api") or {}

        if fd.get("status") == "RUNNING":
            fd_running += 1
        elif fd.get("status") == "STOPPED":
            fd_stopped += 1

        st = fs.get("status", "UNKNOWN")
        if st == "RUNNING":
            fs_running.append(r)
        elif st == "STOPPED":
            fs_stopped.append(r)
        elif st == "NOT_INSTALLED":
            fs_not_installed.append(r)
        else:
            fs_error.append(r)

    # Заголовок
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print("\n" + "=" * 90)
    print(c(f" МОНИТОРИНГ ФИСКАЛЬНЫХ СЛУЖБ КАСС ({target_service}) — {now_str}", Color.BOLD + Color.WHITE))
    print("=" * 90)

    # Сводная плашка (Summary Box)
    print(f" Всего касс в пуле:   {c(total, Color.BOLD)}  (В сети: {c(online_count, Color.GREEN)}, Недоступно: {c(offline_count, Color.GRAY)})")
    print(f" Служба {c(target_service, Color.CYAN)}:")
    print(f"   🟢 {c('РАБОТАЕТ (RUNNING):', Color.GREEN)}      {c(len(fs_running), Color.BOLD + Color.GREEN):4} касс")
    print(f"   🔴 {c('ОСТАНОВЛЕНА (STOPPED):', Color.RED)}   {c(len(fs_stopped), Color.BOLD + Color.RED):4} касс")
    print(f"   ⚪ {c('НЕ УСТАНОВЛЕНА:', Color.GRAY)}        {c(len(fs_not_installed), Color.BOLD):4} касс")
    if fs_error:
        print(f"   ⚠️ {c('ОШИБКИ / ДОСТУП:', Color.YELLOW)}       {c(len(fs_error), Color.BOLD + Color.YELLOW):4} касс")
    print(f" Альтернативная служба {c('FiscalDriveAPI', Color.MAGENTA)}: 🟢 Работает: {fd_running} | 🔴 Остановлена: {fd_stopped}")
    print("-" * 90)

    def print_table_header():
        print(f"{'IP АДРЕС':17} | {'СТАТУС ' + target_service.upper():20} | {'PID':6} | {'АВТОЗАПУСК':10} | {'ДРУГАЯ СЛУЖБА':16} | {'ПУТЬ / ОПИСАНИЕ'}")
        print("-" * 90)

    # 1. Секция РАБОТАЕТ (RUNNING)
    if fs_running and filter_mode in ["all", "running", "installed"]:
        print(c(f"\n[🟢] КАССЫ С РАБОТАЮЩЕЙ СЛУЖБОЙ {target_service} ({len(fs_running)} шт.):", Color.BOLD + Color.GREEN))
        print_table_header()
        for r in fs_running:
            ip = r["ip"]
            fs = r["fiscal_service"]
            fd = r["fiscal_drive_api"]
            pid = str(fs.get("pid", "-"))
            stype = fs.get("start_type", "-")
            fd_st = f"DriveAPI:{fd.get('status')}" if fd and fd.get('status') != 'NOT_INSTALLED' else "-"
            path = fs.get("bin_path", "")
            if len(path) > 35:
                path = "..." + path[-32:]
            print(f"{c(ip, Color.BOLD):26} | {c('● RUNNING', Color.GREEN):29} | {pid:6} | {stype:10} | {fd_st:16} | {path}")

    # 2. Секция ОСТАНОВЛЕНА (STOPPED)
    if fs_stopped and filter_mode in ["all", "stopped", "installed"]:
        print(c(f"\n[🔴] КАССЫ С ОСТАНОВЛЕННОЙ СЛУЖБОЙ {target_service} ({len(fs_stopped)} шт.):", Color.BOLD + Color.RED))
        print_table_header()
        for r in fs_stopped:
            ip = r["ip"]
            fs = r["fiscal_service"]
            fd = r["fiscal_drive_api"]
            pid = str(fs.get("pid", "-"))
            stype = fs.get("start_type", "-")
            fd_st = f"DriveAPI:{fd.get('status')}" if fd and fd.get('status') != 'NOT_INSTALLED' else "-"
            path = fs.get("bin_path", "")
            if len(path) > 35:
                path = "..." + path[-32:]
            print(f"{c(ip, Color.BOLD):26} | {c('■ STOPPED', Color.RED):29} | {pid:6} | {stype:10} | {fd_st:16} | {path}")

    # 3. Секция НЕ УСТАНОВЛЕНА (но касса онлайн, например работает FiscalDriveAPI)
    if fs_not_installed and filter_mode in ["all", "not_installed"]:
        print(c(f"\n[⚪] ОНЛАЙН КАССЫ БЕЗ СЛУЖБЫ {target_service} ({len(fs_not_installed)} шт.):", Color.BOLD + Color.WHITE))
        print(f"{'IP АДРЕС':17} | {'СТАТУС':15} | {'FiscalDriveAPI СТАТУС':25} | {'PID':6} | {'ПУТЬ FiscalDriveAPI'}")
        print("-" * 90)
        for r in fs_not_installed:
            ip = r["ip"]
            fd = r["fiscal_drive_api"] or {}
            fd_st = fd.get("status", "NOT_INSTALLED")
            fd_pid = str(fd.get("pid", "-"))
            fd_path = fd.get("bin_path", "")
            if len(fd_path) > 35:
                fd_path = "..." + fd_path[-32:]
            
            fd_col = Color.GREEN if fd_st == "RUNNING" else (Color.RED if fd_st == "STOPPED" else Color.GRAY)
            print(f"{ip:17} | {c('НЕ УСТАНОВЛЕНА', Color.GRAY):24} | {c(fd_st, fd_col):34} | {fd_pid:6} | {fd_path}")

    # 4. Секция ОШИБКИ
    if fs_error and filter_mode in ["all", "errors"]:
        print(c(f"\n[⚠️] КАССЫ С ОШИБКАМИ ОПРОСА ({len(fs_error)} шт.):", Color.BOLD + Color.YELLOW))
        for r in fs_error:
            fs = r.get("fiscal_service") or {}
            print(f"  {r['ip']:16} -> Статус: {fs.get('status')} | Ошибка: {fs.get('error')}")

    print("\n" + "=" * 90 + "\n")

# ============================ ЭКСПОРТ ОТЧЕТОВ ============================
def export_json(results: list[dict], filepath: str):
    """Экспорт результатов в структурированный JSON."""
    os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"  [+] Отчет JSON сохранен: {filepath}")

def export_csv(results: list[dict], filepath: str):
    """Экспорт результатов в CSV файл."""
    os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)
    with open(filepath, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f, delimiter=";")
        writer.writerow([
            "IP", "Online", "FiscalService_Status", "FiscalService_PID",
            "FiscalService_StartType", "FiscalService_Path",
            "FiscalDriveAPI_Status", "FiscalDriveAPI_PID", "FiscalDriveAPI_Path",
            "ScanTime"
        ])
        for r in results:
            fs = r.get("fiscal_service") or {}
            fd = r.get("fiscal_drive_api") or {}
            writer.writerow([
                r["ip"],
                "1" if r["online"] else "0",
                fs.get("status", "OFFLINE" if not r["online"] else "NOT_INSTALLED"),
                fs.get("pid", ""),
                fs.get("start_type", ""),
                fs.get("bin_path", ""),
                fd.get("status", "OFFLINE" if not r["online"] else "NOT_INSTALLED"),
                fd.get("pid", ""),
                fd.get("bin_path", ""),
                r.get("scan_time", "")
            ])
    print(f"  [+] Отчет CSV сохранен: {filepath}")

def export_html(results: list[dict], filepath: str, target_service: str = "FiscalService"):
    """
    Генерация современного интерактивного HTML отчета с фильтрацией,
    поиском по IP, подсветкой статусов и метриками.
    """
    os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    total = len(results)
    online_count = sum(1 for r in results if r["online"])
    offline_count = total - online_count

    fs_run = sum(1 for r in results if (r.get("fiscal_service") or {}).get("status") == "RUNNING")
    fs_stop = sum(1 for r in results if (r.get("fiscal_service") or {}).get("status") == "STOPPED")
    fs_none = sum(1 for r in results if r["online"] and (r.get("fiscal_service") or {}).get("status") == "NOT_INSTALLED")

    fd_run = sum(1 for r in results if (r.get("fiscal_drive_api") or {}).get("status") == "RUNNING")
    fd_stop = sum(1 for r in results if (r.get("fiscal_drive_api") or {}).get("status") == "STOPPED")

    rows_html = []
    for r in results:
        ip = r["ip"]
        is_up = r["online"]
        fs = r.get("fiscal_service") or {}
        fd = r.get("fiscal_drive_api") or {}

        fs_st = fs.get("status", "OFFLINE" if not is_up else "NOT_INSTALLED")
        fs_pid = fs.get("pid", "-") if fs_st == "RUNNING" else "-"
        fs_start = fs.get("start_type", "-")
        fs_path = fs.get("bin_path", "-")

        fd_st = fd.get("status", "OFFLINE" if not is_up else "NOT_INSTALLED")
        fd_pid = fd.get("pid", "-") if fd_st == "RUNNING" else "-"

        # Классы бейджей
        if not is_up:
            badge_class = "badge-offline"
            row_filter = "offline"
        elif fs_st == "RUNNING":
            badge_class = "badge-running"
            row_filter = "fs-running"
        elif fs_st == "STOPPED":
            badge_class = "badge-stopped"
            row_filter = "fs-stopped"
        else:
            badge_class = "badge-none"
            row_filter = "fs-none"

        fd_badge_class = "badge-running" if fd_st == "RUNNING" else ("badge-stopped" if fd_st == "STOPPED" else "badge-none")

        rows_html.append(f"""
        <tr data-status="{row_filter}" data-ip="{ip}">
            <td><strong><code>{ip}</code></strong></td>
            <td><span class="badge {'badge-online' if is_up else 'badge-offline'}">{'ONLINE' if is_up else 'OFFLINE'}</span></td>
            <td><span class="badge {badge_class}">{fs_st}</span></td>
            <td><code>{fs_pid}</code></td>
            <td>{fs_start}</td>
            <td><span class="badge {fd_badge_class}">{fd_st}</span> (PID: {fd_pid})</td>
            <td class="small-path" title="{fs_path}">{fs_path}</td>
        </tr>
        """)

    html_content = f"""<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Мониторинг касс: {target_service}</title>
    <style>
        :root {{
            --bg-color: #0f172a;
            --card-bg: #1e293b;
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --border-color: #334155;
            --green: #10b981;
            --red: #ef4444;
            --yellow: #f59e0b;
            --blue: #3b82f6;
            --purple: #8b5cf6;
        }}
        * {{ box-sizing: border-box; margin: 0; padding: 0; }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-main);
            padding: 24px;
            line-height: 1.5;
        }}
        .container {{ max-width: 1300px; margin: 0 auto; }}
        header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 1px solid var(--border-color);
        }}
        h1 {{ font-size: 24px; font-weight: 700; display: flex; align-items: center; gap: 10px; }}
        .pulse-dot {{
            width: 12px; height: 12px; border-radius: 50%; background: var(--green);
            box-shadow: 0 0 10px var(--green);
        }}
        .stats-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }}
        .stat-card {{
            background: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 16px;
            text-align: center;
        }}
        .stat-val {{ font-size: 28px; font-weight: 800; margin-top: 4px; }}
        .stat-label {{ font-size: 13px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }}
        
        .controls {{
            display: flex;
            gap: 12px;
            margin-bottom: 20px;
            flex-wrap: wrap;
            align-items: center;
            background: var(--card-bg);
            padding: 14px;
            border-radius: 10px;
            border: 1px solid var(--border-color);
        }}
        .search-box {{
            flex: 1;
            min-width: 250px;
            background: #0f172a;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 8px 14px;
            color: #fff;
            font-size: 14px;
        }}
        .btn-filter {{
            background: #0f172a;
            border: 1px solid var(--border-color);
            color: var(--text-main);
            padding: 8px 14px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 13px;
            transition: all 0.2s;
        }}
        .btn-filter.active, .btn-filter:hover {{
            background: var(--blue);
            border-color: var(--blue);
            color: #fff;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            background: var(--card-bg);
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid var(--border-color);
        }}
        th, td {{ padding: 12px 16px; text-align: left; font-size: 14px; border-bottom: 1px solid var(--border-color); }}
        th {{ background: #162032; font-weight: 600; color: var(--text-muted); font-size: 12px; text-transform: uppercase; }}
        tr:hover {{ background: rgba(255, 255, 255, 0.03); }}
        
        .badge {{
            display: inline-block;
            padding: 3px 8px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
        }}
        .badge-running {{ background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); }}
        .badge-stopped {{ background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); }}
        .badge-online  {{ background: rgba(59, 130, 246, 0.2); color: #60a5fa; }}
        .badge-offline {{ background: rgba(148, 163, 184, 0.1); color: #64748b; }}
        .badge-none    {{ background: rgba(148, 163, 184, 0.2); color: #cbd5e1; }}
        .small-path    {{ font-family: monospace; font-size: 12px; color: var(--text-muted); max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1><span class="pulse-dot"></span> Мониторинг фискальных служб касс ({target_service})</h1>
            <div style="font-size: 13px; color: var(--text-muted);">Обновлено: <strong>{now_str}</strong></div>
        </header>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">Всего касс</div>
                <div class="stat-val">{total}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">В сети (Online)</div>
                <div class="stat-val" style="color: var(--blue);">{online_count}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">{target_service} RUNNING</div>
                <div class="stat-val" style="color: var(--green);">{fs_run}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">{target_service} STOPPED</div>
                <div class="stat-val" style="color: var(--red);">{fs_stop}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">FiscalDriveAPI RUNNING</div>
                <div class="stat-val" style="color: var(--purple);">{fd_run}</div>
            </div>
        </div>

        <div class="controls">
            <input type="text" id="searchInput" class="search-box" placeholder="🔍 Поиск по IP (например 192.168.142...)..." onkeyup="filterTable()">
            <button class="btn-filter active" onclick="setFilter('all', this)">Все ({total})</button>
            <button class="btn-filter" onclick="setFilter('fs-running', this)">🟢 {target_service} Работает ({fs_run})</button>
            <button class="btn-filter" onclick="setFilter('fs-stopped', this)">🔴 {target_service} Остановлена ({fs_stop})</button>
            <button class="btn-filter" onclick="setFilter('fs-none', this)">⚪ Без {target_service} ({fs_none})</button>
            <button class="btn-filter" onclick="setFilter('offline', this)">⚫ Офлайн ({offline_count})</button>
        </div>

        <table>
            <thead>
                <tr>
                    <th>IP адрес</th>
                    <th>Сеть</th>
                    <th>{target_service}</th>
                    <th>PID</th>
                    <th>Автозапуск</th>
                    <th>FiscalDriveAPI</th>
                    <th>Путь к файлу</th>
                </tr>
            </thead>
            <tbody id="tableBody">
                {"".join(rows_html)}
            </tbody>
        </table>
    </div>

    <script>
        let currentFilter = 'all';
        function setFilter(filter, btn) {{
            currentFilter = filter;
            document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterTable();
        }}
        function filterTable() {{
            const search = document.getElementById('searchInput').value.toLowerCase();
            const rows = document.querySelectorAll('#tableBody tr');
            rows.forEach(row => {{
                const ip = row.getAttribute('data-ip').toLowerCase();
                const st = row.getAttribute('data-status');
                const matchesSearch = ip.includes(search);
                const matchesFilter = (currentFilter === 'all') || (st === currentFilter);
                row.style.display = (matchesSearch && matchesFilter) ? '' : 'none';
            }});
        }}
    </script>
</body>
</html>
"""
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"  [+] Интерактивный HTML отчет сохранен: {filepath}")

# ============================ ВЕБ-СЕРВЕР ДАШБОРДА ============================
class MonitoringWebServer(BaseHTTPRequestHandler):
    """Легковесный встроенный веб-сервер дашборда."""
    scan_cache = None
    target_service = "FiscalService"
    ips_target = []
    username = DEFAULT_USERNAME
    password = DEFAULT_PASSWORD
    is_scanning = False

    def do_GET(self):
        if self.path == "/api/scan":
            self.trigger_rescan()
            self.send_response(200)
            self.send_header("Content-type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(MonitoringWebServer.scan_cache, ensure_ascii=False).encode("utf-8"))
            return

        if self.path == "/api/data":
            self.send_response(200)
            self.send_header("Content-type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(MonitoringWebServer.scan_cache or [], ensure_ascii=False).encode("utf-8"))
            return

        # HTML дашборд
        temp_html_path = os.path.join(REPORTS_DIR, "web_dashboard_temp.html")
        if MonitoringWebServer.scan_cache:
            export_html(MonitoringWebServer.scan_cache, temp_html_path, MonitoringWebServer.target_service)
            if os.path.exists(temp_html_path):
                with open(temp_html_path, "r", encoding="utf-8") as f:
                    content = f.read()
                self.send_response(200)
                self.send_header("Content-type", "text/html; charset=utf-8")
                self.end_headers()
                self.wfile.write(content.encode("utf-8"))
                return

        self.send_response(200)
        self.send_header("Content-type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write("<h1>Сканирование выполняется, обновите через несколько секунд...</h1>".encode("utf-8"))

    def trigger_rescan(self):
        if not MonitoringWebServer.is_scanning:
            MonitoringWebServer.is_scanning = True
            MonitoringWebServer.scan_cache = scan_network(
                MonitoringWebServer.ips_target,
                MonitoringWebServer.username,
                MonitoringWebServer.password,
                MonitoringWebServer.target_service,
                show_progress=False
            )
            MonitoringWebServer.is_scanning = False

def run_web_dashboard(port: int, ips: list[str], username: str, password: str, target_service: str):
    """Запуск веб-сервера мониторинга."""
    MonitoringWebServer.ips_target = ips
    MonitoringWebServer.username = username
    MonitoringWebServer.password = password
    MonitoringWebServer.target_service = target_service

    print(c(f"\n[*] Выполняем первичное сканирование для веб-дашборда...", Color.CYAN))
    MonitoringWebServer.scan_cache = scan_network(ips, username, password, target_service, show_progress=True)

    server_address = ("", port)
    httpd = HTTPServer(server_address, MonitoringWebServer)
    print(c(f"\n[🚀] Веб-дашборд мониторинга запущен на: http://localhost:{port}/", Color.BOLD + Color.GREEN))
    print(c("     Нажмите Ctrl+C для остановки сервера.\n", Color.GRAY))
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[*] Веб-сервер остановлен.")

# ============================ РЕЖИМ ЖИВОГО МОНИТОРИНГА ============================
def run_watch_mode(ips: list[str], interval: int, username: str, password: str,
                   target_service: str, filter_mode: str):
    """Непрерывный мониторинг с автообновлением каждые N секунд."""
    print(c(f"\n[🔄] Запущен режим онлайн-мониторинга (интервал: {interval} сек).", Color.BOLD + Color.CYAN))
    print(c("     Для выхода нажмите Ctrl+C.\n", Color.GRAY))
    try:
        while True:
            t0 = time.time()
            results = scan_network(ips, username, password, target_service, show_progress=False)
            # Очистка экрана
            os.system("cls" if os.name == "nt" else "clear")
            render_terminal_dashboard(results, target_service, filter_mode)
            elapsed = time.time() - t0
            sleep_time = max(1.0, interval - elapsed)
            print(f"Следующее обновление через {int(sleep_time)} сек... (Опрос занял {elapsed:.2f} сек)")
            time.sleep(sleep_time)
    except KeyboardInterrupt:
        print(c("\n[!] Мониторинг остановлен пользователем.", Color.YELLOW))

# ============================ ТОЧКА ВХОДА (MAIN) ============================
def main():
    parser = argparse.ArgumentParser(
        description="Комплексный мониторинг служб FiscalService и FiscalDriveAPI на кассах R-Keeper",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Примеры:
  python fiscal_monitor.py                          # Сканирование 114..222 (201..205)
  python fiscal_monitor.py --subnets 140-155        # Сканирование выбранных подсетей
  python fiscal_monitor.py --only-running           # Показать только где FiscalService работает
  python fiscal_monitor.py --only-stopped           # Показать где FiscalService остановлена
  python fiscal_monitor.py --watch 30               # Живой мониторинг каждые 30 сек
  python fiscal_monitor.py --html reports/fisc.html # Сохранить HTML дашборд
  python fiscal_monitor.py --web 8088               # Запустить веб-интерфейс на порту 8088
  python fiscal_monitor.py --start 192.168.152.202  # Запустить службу на кассе
  python fiscal_monitor.py --restart 192.168.152.202# Перезапустить службу на кассе
        """
    )

    # Параметры диапазона IP
    parser.add_argument("--subnets", type=str, help="Диапазон подсетей, например: 114-222 или 140-150")
    parser.add_argument("--start-subnet", type=int, default=DEFAULT_START_SUBNET, help=f"Начальная подсеть (default: {DEFAULT_START_SUBNET})")
    parser.add_argument("--end-subnet", type=int, default=DEFAULT_END_SUBNET, help=f"Конечная подсеть (default: {DEFAULT_END_SUBNET})")
    parser.add_argument("--hosts", type=str, help="Диапазон хостов, например: 201-205 или 201,202")
    parser.add_argument("--start-host", type=int, default=DEFAULT_START_HOST, help=f"Начальный хост (default: {DEFAULT_START_HOST})")
    parser.add_argument("--end-host", type=int, default=DEFAULT_END_HOST, help=f"Конечный хост (default: {DEFAULT_END_HOST})")
    parser.add_argument("--ips", type=str, help="Список конкретных IP через запятую (напр. 192.168.142.201,192.168.152.201)")
    parser.add_argument("--file", type=str, default="", help="Файл со списком IP-адресов (например ips.txt)")

    # Учетные данные
    parser.add_argument("-u", "--username", default=DEFAULT_USERNAME, help=f"Логин администратора (default: {DEFAULT_USERNAME})")
    parser.add_argument("-p", "--password", default=DEFAULT_PASSWORD, help="Пароль администратора")

    # Имя службы
    parser.add_argument("--service", default="FiscalService", help="Имя проверяемой службы (default: FiscalService)")

    # Фильтры отображения
    parser.add_argument("--only-running", action="store_true", help="Показать только кассы с работающей службой")
    parser.add_argument("--only-stopped", action="store_true", help="Показать только кассы с остановленной службой")
    parser.add_argument("--only-installed", action="store_true", help="Показать кассы, где служба установлена")
    parser.add_argument("--all-fiscal", action="store_true", help="Показать полный отчет по всем фискальным службам")

    # Режимы работы
    parser.add_argument("--watch", type=int, nargs="?", const=30, help="Режим непрерывного мониторинга (сек, default: 30)")
    parser.add_argument("--web", type=int, nargs="?", const=8088, help="Запустить веб-дашборд на указанном порту (default: 8088)")

    # Экспорт
    parser.add_argument("--json", type=str, help="Путь для сохранения отчета в формате JSON")
    parser.add_argument("--csv", type=str, help="Путь для сохранения отчета в формате CSV")
    parser.add_argument("--html", type=str, help="Путь для сохранения интерактивного HTML отчета")
    parser.add_argument("--no-report", action="store_true", help="Не сохранять автоматический отчет в папку reports/")

    # Действия
    parser.add_argument("--start", type=str, metavar="IP", help="Запустить службу на указанной кассе")
    parser.add_argument("--stop", type=str, metavar="IP", help="Остановить службу на указанной кассе")
    parser.add_argument("--restart", type=str, metavar="IP", help="Перезапустить службу на указанной кассе")
    parser.add_argument("--enable-auto", type=str, metavar="IP", help="Установить автозапуск службы в AUTO на указанной кассе")

    args = parser.parse_args()

    # 1. Проверка одиночных действий управления
    if args.start:
        ok, msg = control_remote_service(args.start, args.service, "start", args.username, args.password)
        print(c(f"[{'✔' if ok else '✖'}] {args.start}: {msg}", Color.GREEN if ok else Color.RED))
        return
    if args.stop:
        ok, msg = control_remote_service(args.stop, args.service, "stop", args.username, args.password)
        print(c(f"[{'✔' if ok else '✖'}] {args.stop}: {msg}", Color.GREEN if ok else Color.RED))
        return
    if args.restart:
        ok, msg = control_remote_service(args.restart, args.service, "restart", args.username, args.password)
        print(c(f"[{'✔' if ok else '✖'}] {args.restart}: {msg}", Color.GREEN if ok else Color.RED))
        return
    if args.enable_auto:
        ok, msg = control_remote_service(args.enable_auto, args.service, "auto", args.username, args.password)
        print(c(f"[{'✔' if ok else '✖'}] {args.enable_auto}: {msg}", Color.GREEN if ok else Color.RED))
        return

    # 2. Получение списка IP адресов
    target_ips = parse_ip_targets(args)
    if not target_ips:
        print(c("[!] Не указано ни одного целевого IP адреса!", Color.RED))
        sys.exit(1)

    filter_mode = "all"
    if args.only_running:
        filter_mode = "running"
    elif args.only_stopped:
        filter_mode = "stopped"
    elif args.only_installed:
        filter_mode = "installed"

    # 3. Режим веб-сервера
    if args.web is not None:
        run_web_dashboard(args.web, target_ips, args.username, args.password, args.service)
        return

    # 4. Режим Watch
    if args.watch is not None:
        run_watch_mode(target_ips, args.watch, args.username, args.password, args.service, filter_mode)
        return

    # 5. Однократное полное сканирование
    t_all_start = time.time()
    results = scan_network(target_ips, args.username, args.password, args.service, show_progress=True)
    t_total = time.time() - t_all_start

    # Вывод в консоль
    render_terminal_dashboard(results, args.service, filter_mode)
    print(c(f"[*] Полное сканирование завершено за {t_total:.2f} сек.", Color.GRAY))

    # Автосохранение отчетов
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    os.makedirs(REPORTS_DIR, exist_ok=True)

    default_html = os.path.join(REPORTS_DIR, f"fiscal_report_{timestamp}.html")
    default_json = os.path.join(REPORTS_DIR, f"fiscal_report_{timestamp}.json")

    export_html(results, args.html if args.html else default_html, args.service)
    export_json(results, args.json if args.json else default_json)

    if args.csv:
        export_csv(results, args.csv)

if __name__ == "__main__":
    main()
