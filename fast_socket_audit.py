# -*- coding: utf-8 -*-
"""
High-Speed Pure Socket & HTTP Auditor for GuestScreen across all 103 branches.
"""

import os
import sys
import time
import socket
import datetime
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

FILIALS_FILE = r"C:\Users\Administrator\Desktop\all_filials.txt"
LOGS_DIR = r"D:\Anti\logs"
os.makedirs(LOGS_DIR, exist_ok=True)
timestamp_str = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
REPORT_FILE = os.path.join(LOGS_DIR, f"guestscreen_audit_report_{timestamp_str}.md")
LATEST_REPORT = os.path.join(LOGS_DIR, "guestscreen_audit_latest.md")

def parse_filials():
    filials = []
    with open(FILIALS_FILE, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("=") or "ПРЕФИКС" in line or "ИТОГО" in line:
                continue
            parts = [p.strip() for p in line.split("|")]
            if len(parts) >= 3:
                filials.append({
                    "prefix": parts[0],
                    "name": parts[1],
                    "subnet": parts[2]
                })
    return filials

def check_tcp_port(ip, port, timeout=0.35):
    try:
        with socket.create_connection((ip, port), timeout=timeout):
            return True
    except:
        return False

def audit_target(target):
    ip = target["ip"]
    
    # 1. Check if host is online (SMB 445 / RPC 135 / HTTP 80)
    is_online = False
    for p in [445, 135]:
        if check_tcp_port(ip, p, timeout=0.35):
            is_online = True
            break

    target["online"] = is_online
    target["gs_running"] = False
    target["gs_port"] = None
    target["details"] = "Офлайн"

    if not is_online:
        return target

    # 2. Check GuestScreen ports (2121, 2122)
    has_2121 = check_tcp_port(ip, 2121, timeout=0.35)
    has_2122 = check_tcp_port(ip, 2122, timeout=0.35)

    if has_2122 or has_2121:
        target["gs_running"] = True
        target["gs_port"] = 2122 if has_2122 else 2121
        target["details"] = f"🟢 Запущен (Порт {target['gs_port']})"
    else:
        target["details"] = "🟡 Онлайн, но GuestScreen НЕ запущен"

    return target

def main():
    print("=================================================================")
    print("   Запуск аудита GuestScreen по всем 103 филиалам сети")
    print(f"   Файл филиалов: {FILIALS_FILE}")
    print("=================================================================")

    filials = parse_filials()
    print(f"Загружено филиалов: {len(filials)}")

    targets = []
    for f in filials:
        for h in [201, 202, 203, 204, 205, 228]:
            targets.append({
                "ip": f"{f['subnet']}.{h}",
                "prefix": f["prefix"],
                "name": f["name"],
                "subnet": f["subnet"]
            })

    print(f"Всего кассовых IP-адресов на аудит: {len(targets)}")
    print("Сканирование сети в 100 параллельных потоков...")

    start_time = time.time()
    results = []

    with ThreadPoolExecutor(max_workers=100) as executor:
        futures = {executor.submit(audit_target, t): t for t in targets}
        done = 0
        total = len(futures)
        for fut in as_completed(futures):
            done += 1
            if done % 100 == 0 or done == total:
                print(f"Проверено: {done}/{total} ({(done/total*100):.1f}%)...")
            results.append(fut.result())

    elapsed = time.time() - start_time
    print(f"Аудит завершен за {elapsed:.2f} сек.")

    def ip_sort_key(r):
        parts = [int(p) if p.isdigit() else 0 for p in r["ip"].split(".")]
        while len(parts) < 4: parts.append(0)
        return parts

    results.sort(key=ip_sort_key)

    online_kassas = [r for r in results if r["online"]]
    gs_running = [r for r in results if r["gs_running"]]
    gs_stopped = [r for r in results if r["online"] and not r["gs_running"]]
    offline_kassas = [r for r in results if not r["online"]]

    print("\n" + "="*65)
    print(f" ИТОГОВЫЕ РЕЗУЛЬТАТЫ АУДИТА ({datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}):")
    print(f" Всего кассовых IP проверено: {len(results)}")
    print(f" [ONLINE] Всего включенных касс в сети: {len(online_kassas)}")
    print(f" 🟢 [RUNNING] Касс с ЗАПУЩЕННЫМ GuestScreen: {len(gs_running)}")
    print(f" 🟡 [STOPPED] Касс онлайн, но GuestScreen НЕ запущен: {len(gs_stopped)}")
    print(f" ⚪ [OFFLINE] Касс выключено / офлайн: {len(offline_kassas)}")
    print("="*65 + "\n")

    # Generate Markdown Report
    for out_path in [REPORT_FILE, LATEST_REPORT]:
        with open(out_path, "w", encoding="utf-8") as f:
            f.write("# 📋 Полный аудит GuestScreen по всем филиалам сети\n\n")
            f.write(f"**Дата и время аудита:** {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  \n")
            f.write(f"**Всего проверено кассовых IP:** {len(results)} (103 филиала)  \n")
            f.write(f"**Включено касс в сети (Онлайн):** {len(online_kassas)}  \n")
            f.write(f"**🟢 Запущен и работает в штатном режиме:** {len(gs_running)}  \n")
            f.write(f"**🟡 Касса онлайн, но GuestScreen НЕ запущен:** {len(gs_stopped)}  \n")
            f.write(f"**⚪ Касса выключена / Офлайн:** {len(offline_kassas)}  \n\n")
            f.write("---\n\n")

            f.write(f"## 🟢 1. Список касс, где GuestScreen ЗАПУЩЕН и работает ({len(gs_running)} касс)\n\n")
            if gs_running:
                f.write("| № | IP-адрес | Филиал | Префикс | Порт | Статус |\n")
                f.write("| :- | :--- | :--- | :--- | :--- | :--- |\n")
                for idx, k in enumerate(gs_running, 1):
                    f.write(f"| {idx} | `{k['ip']}` | **{k['name']}** | {k['prefix']} | `{k['gs_port']}` | 🟢 Запущен (Штатный режим) |\n")
            else:
                f.write("*Нет обнаруженных касс с запущенным процессом*\n")

            f.write("\n---\n\n")
            f.write(f"## 🟡 2. Список касс ОНЛАЙН, где GuestScreen НЕ запущен ({len(gs_stopped)} касс)\n\n")
            if gs_stopped:
                f.write("| № | IP-адрес | Филиал | Префикс | Состояние |\n")
                f.write("| :- | :--- | :--- | :--- | :--- |\n")
                for idx, k in enumerate(gs_stopped, 1):
                    f.write(f"| {idx} | `{k['ip']}` | **{k['name']}** | {k['prefix']} | 🟡 Онлайн, GuestScreen не запущен |\n")

            f.write("\n---\n\n")
            f.write("## 🏢 3. Сводная таблица по всем филиалам сети (103 филиала)\n\n")
            
            filial_groups = {}
            for r in results:
                fname = r["name"]
                if fname not in filial_groups:
                    filial_groups[fname] = {
                        "prefix": r["prefix"],
                        "subnet": r["subnet"],
                        "kassas": []
                    }
                filial_groups[fname]["kassas"].append(r)

            f.write("| Филиал | Подсеть | Онлайн | 🟢 Запущен | 🟡 Не запущен | ⚪ Офлайн | IP-адреса с запущенным GuestScreen |\n")
            f.write("| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n")
            for fname, g in sorted(filial_groups.items()):
                klist = g["kassas"]
                on_count = sum(1 for k in klist if k["online"])
                run_count = sum(1 for k in klist if k["gs_running"])
                stop_count = sum(1 for k in klist if k["online"] and not k["gs_running"])
                off_count = sum(1 for k in klist if not k["online"])
                running_ips = ", ".join([f"`{k['ip']}`" for k in klist if k["gs_running"]]) or "—"
                if on_count > 0:
                    f.write(f"| **{fname}** | `{g['subnet']}` | {on_count}/{len(klist)} | **{run_count}** | {stop_count} | {off_count} | {running_ips} |\n")

    print(f"Отчет успешно сохранен в файл: {LATEST_REPORT}")

if __name__ == "__main__":
    main()
