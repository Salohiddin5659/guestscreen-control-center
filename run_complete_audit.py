# -*- coding: utf-8 -*-
"""
Full Accurate Auditor for GuestScreen across all 103 restaurant branches using check_single_kassa.ps1.
"""

import os
import re
import sys
import json
import time
import socket
import datetime
import subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

FILIALS_FILE = r"C:\Users\Administrator\Desktop\all_filials.txt"
PS_SCRIPT = r"d:\Anti\check_single_kassa.ps1"
LOGS_DIR = r"D:\Anti\logs"
os.makedirs(LOGS_DIR, exist_ok=True)
timestamp_str = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
REPORT_FILE = os.path.join(LOGS_DIR, f"guestscreen_audit_report_{timestamp_str}.md")
LATEST_REPORT = os.path.join(LOGS_DIR, "guestscreen_audit_latest.md")

def parse_filials(filepath):
    filials = []
    if not os.path.exists(filepath):
        print(f"Error: File {filepath} not found!")
        return filials

    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("=") or line.startswith("ПРЕФИКС") or line.startswith("ИТОГО"):
                continue
            parts = [p.strip() for p in line.split("|")]
            if len(parts) >= 3:
                prefix = parts[0]
                name = parts[1]
                subnet = parts[2]
                filials.append({
                    "prefix": prefix,
                    "name": name,
                    "subnet": subnet
                })
    return filials

def check_tcp_port(ip, port=445, timeout=0.35):
    try:
        with socket.create_connection((ip, port), timeout=timeout):
            return True
    except:
        return False

def check_kassa(ip, filial_info):
    result = {
        "ip": ip,
        "filial_prefix": filial_info["prefix"],
        "filial_name": filial_info["name"],
        "subnet": filial_info["subnet"],
        "online": False,
        "gs_running": False,
        "watcher_running": False,
        "cefsharp_running": False,
        "details": ""
    }

    if not check_tcp_port(ip, 445, timeout=0.35) and not check_tcp_port(ip, 135, timeout=0.35):
        result["details"] = "Офлайн"
        return result

    result["online"] = True

    try:
        p = subprocess.run(
            ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", PS_SCRIPT, "-ip", ip],
            capture_output=True,
            text=True,
            timeout=10
        )
        stdout = p.stdout.strip()
        
        json_match = re.search(r'\{.*\}', stdout, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group(0))
            result["gs_running"] = data.get("gs", False)
            result["watcher_running"] = data.get("wt", False)
            result["cefsharp_running"] = data.get("cs", False)
            err = data.get("error", "")

            if result["gs_running"]:
                result["details"] = "🟢 Запущен (Штатный режим)"
            else:
                result["details"] = "🟡 Онлайн, но GuestScreen НЕ запущен"
                if err:
                    result["details"] += f" ({err[:25]})"
        else:
            result["details"] = "🟡 Онлайн (WMI закрыт)"
    except Exception as e:
        result["details"] = f"🟡 Онлайн (Таймаут)"

    return result

def main():
    print("=================================================================")
    print("   Запуск точного аудита GuestScreen по всем 103 филиалам")
    print(f"   Файл филиалов: {FILIALS_FILE}")
    print("=================================================================")

    filials = parse_filials(FILIALS_FILE)
    print(f"Найдено филиалов в списке: {len(filials)}")

    targets = []
    for f in filials:
        subnet = f["subnet"]
        for host in [201, 202, 203, 204, 205, 228]:
            targets.append((f"{subnet}.{host}", f))

    print(f"Всего кассовых IP-адресов на сканирование: {len(targets)}")
    print("Опрос касс в 50 параллельных потоков...")

    start_time = time.time()
    results = []

    with ThreadPoolExecutor(max_workers=50) as executor:
        futures = {executor.submit(check_kassa, ip, f_info): ip for ip, f_info in targets}
        done_count = 0
        total = len(futures)
        for fut in as_completed(futures):
            done_count += 1
            if done_count % 50 == 0 or done_count == total:
                print(f"Проверено: {done_count}/{total} ({(done_count/total*100):.1f}%)...")
            res = fut.result()
            results.append(res)

    elapsed = time.time() - start_time
    print(f"\nАудит завершен за {elapsed:.1f} сек.")

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

            f.write("## 🟢 1. Список касс, где GuestScreen ЗАПУЩЕН и работает в штатном режиме\n\n")
            if gs_running:
                f.write("| № | IP-адрес | Филиал | Префикс | Watcher | CefSharp | Статус |\n")
                f.write("| :- | :--- | :--- | :--- | :--- | :--- | :--- |\n")
                for idx, k in enumerate(gs_running, 1):
                    w_str = "🟢 Да" if k["watcher_running"] else "⚪ Нет"
                    c_str = "🟢 Да" if k["cefsharp_running"] else "⚪ Нет"
                    f.write(f"| {idx} | `{k['ip']}` | **{k['filial_name']}** | {k['filial_prefix']} | {w_str} | {c_str} | 🟢 Запущен (Штатный режим) |\n")
            else:
                f.write("*Нет обнаруженных касс с запущенным процессом*\n")

            f.write("\n---\n\n")
            f.write("## 🟡 2. Список касс ОНЛАЙН, где GuestScreen НЕ запущен\n\n")
            if gs_stopped:
                f.write("| № | IP-адрес | Филиал | Префикс | Состояние |\n")
                f.write("| :- | :--- | :--- | :--- | :--- |\n")
                for idx, k in enumerate(gs_stopped, 1):
                    f.write(f"| {idx} | `{k['ip']}` | **{k['filial_name']}** | {k['filial_prefix']} | 🟡 Онлайн, процесс не запущен |\n")
            else:
                f.write("*Все онлайн-кассы имеют запущенный GuestScreen*\n")

            f.write("\n---\n\n")
            f.write("## 🏢 3. Сводная таблица по филиалам (Где есть запущенный GuestScreen или онлайн-кассы)\n\n")
            
            filial_groups = {}
            for r in results:
                fname = r["filial_name"]
                if fname not in filial_groups:
                    filial_groups[fname] = {
                        "prefix": r["filial_prefix"],
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
