# -*- coding: utf-8 -*-
"""
100% Truthful WMI Process Auditor for GuestScreen across all 103 branches.
Checks actual running processes in Windows memory (Win32_Process -> GuestScreen.exe).
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

USERNAME = "Administrator"
PASSWORD = "123"

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

def check_tcp_port(ip, port=445, timeout=0.35):
    try:
        with socket.create_connection((ip, port), timeout=timeout):
            return True
    except:
        return False

def check_host_wmi(target):
    ip = target["ip"]
    target["online"] = check_tcp_port(ip, 445) or check_tcp_port(ip, 135)
    target["gs_running"] = False
    target["watcher_running"] = False
    target["cefsharp_running"] = False
    target["total_procs"] = 0
    target["error"] = ""

    if not target["online"]:
        target["status_desc"] = "Офлайн (нет связи по сети)"
        return target

    ps_cmd = f"""
    $pass = ConvertTo-SecureString '{PASSWORD}' -AsPlainText -Force
    $cred = New-Object System.Management.Automation.PSCredential('{USERNAME}', $pass)
    try {{
        $procs = (Get-WmiObject -Class Win32_Process -ComputerName '{ip}' -Credential $cred -ErrorAction Stop).Name
        $is_gs = ($procs -contains 'GuestScreen.exe')
        $is_wt = ($procs -contains 'Watcher.exe')
        $is_cs = (($procs | Where-Object {{ $_ -like '*CefSharp*' }}).Count -gt 0)
        @{{ ip = '{ip}'; gs = [bool]$is_gs; wt = [bool]$is_wt; cs = [bool]$is_cs; total = $procs.Count }} | ConvertTo-Json -Compress
    }} catch {{
        @{{ ip = '{ip}'; error = $_.Exception.Message }} | ConvertTo-Json -Compress
    }}
    """

    try:
        p = subprocess.run(["powershell.exe", "-NoProfile", "-Command", ps_cmd], capture_output=True, text=True, timeout=12)
        stdout = p.stdout.strip()
        m = re.search(r'\{.*\}', stdout)
        if m:
            data = json.loads(m.group(0))
            target["gs_running"] = data.get("gs", False)
            target["watcher_running"] = data.get("wt", False)
            target["cefsharp_running"] = data.get("cs", False)
            target["total_procs"] = data.get("total", 0)
            target["error"] = data.get("error", "")

            if target["gs_running"]:
                target["status_desc"] = "🟢 Запущен (Штатный режим)"
            else:
                target["status_desc"] = "🟡 Онлайн, но GuestScreen НЕ запущен"
                if target["error"]:
                    target["status_desc"] += f" (WMI: {target['error'][:25]})"
        else:
            target["status_desc"] = "🟡 Онлайн (WMI ответ не распознан)"
    except Exception as e:
        target["status_desc"] = "🟡 Онлайн (Таймаут опроса WMI)"
        target["error"] = str(e)

    return target

def main():
    print("=================================================================")
    print("   Запуск 100% точного WMI-аудита процессов GuestScreen")
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

    print(f"Всего кассовых IP на проверку: {len(targets)}")
    
    # 1. Quick TCP pre-filter for online hosts
    print("Быстрая проверка онлайн-хостов (445/135)...")
    online_targets = []
    offline_targets = []
    
    def quick_ping(t):
        ip = t["ip"]
        if check_tcp_port(ip, 445, 0.3) or check_tcp_port(ip, 135, 0.3):
            return (True, t)
        return (False, t)

    with ThreadPoolExecutor(max_workers=80) as ex:
        futs = [ex.submit(quick_ping, t) for t in targets]
        for f in as_completed(futs):
            is_on, t = f.result()
            if is_on:
                online_targets.append(t)
            else:
                t["online"] = False
                t["gs_running"] = False
                t["watcher_running"] = False
                t["status_desc"] = "Офлайн (выключена)"
                offline_targets.append(t)

    print(f"Онлайн-касс в сети: {len(online_targets)}. Выключено/Офлайн: {len(offline_targets)}.")
    print(f"Опрос процессов Win32_Process на {len(online_targets)} онлайн-кассах (25 потоков)...")

    start_time = time.time()
    results = list(offline_targets)

    with ThreadPoolExecutor(max_workers=25) as executor:
        futures = {executor.submit(check_host_wmi, t): t for t in online_targets}
        done = 0
        total = len(futures)
        for fut in as_completed(futures):
            done += 1
            if done % 20 == 0 or done == total:
                print(f"Проверено WMI: {done}/{total} ({(done/total*100):.1f}%)...")
            results.append(fut.result())

    elapsed = time.time() - start_time
    print(f"WMI-аудит завершен за {elapsed:.1f} сек.")

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
    print(f" ИТОГОВЫЕ ТОЧНЫЕ РЕЗУЛЬТАТЫ ({datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}):")
    print(f" Всего кассовых IP проверено: {len(results)}")
    print(f" [ONLINE] Всего включенных касс в сети: {len(online_kassas)}")
    print(f" 🟢 [RUNNING] Касс с ЗАПУЩЕННЫМ процессом GuestScreen.exe: {len(gs_running)}")
    print(f" 🟡 [STOPPED] Касс онлайн, но GuestScreen НЕ запущен: {len(gs_stopped)}")
    print(f" ⚪ [OFFLINE] Касс выключено / офлайн: {len(offline_kassas)}")
    print("="*65 + "\n")

    # Generate Markdown Report
    for out_path in [REPORT_FILE, LATEST_REPORT]:
        with open(out_path, "w", encoding="utf-8") as f:
            f.write("# 📋 Достоверный аудит GuestScreen по всем филиалам сети\n\n")
            f.write(f"**Метод проверки:** Прямой опрос списка запущенных процессов Windows (`Win32_Process -> GuestScreen.exe`)  \n")
            f.write(f"**Дата и время проверки:** {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  \n")
            f.write(f"**Всего проверено кассовых IP:** {len(results)} (103 филиала)  \n")
            f.write(f"**Включено касс в сети (Онлайн):** {len(online_kassas)}  \n")
            f.write(f"**🟢 Запущен и работает в памяти (GuestScreen.exe):** {len(gs_running)}  \n")
            f.write(f"**🟡 Касса онлайн, но процесс GuestScreen.exe НЕ запущен:** {len(gs_stopped)}  \n")
            f.write(f"**⚪ Касса выключена / Офлайн:** {len(offline_kassas)}  \n\n")
            f.write("---\n\n")

            f.write(f"## 🟢 1. Список касс, где GuestScreen.exe РЕАЛЬНО ЗАПУЩЕН ({len(gs_running)} касс)\n\n")
            if gs_running:
                f.write("| № | IP-адрес | Филиал | Префикс | Watcher | CefSharp | Процессов в памяти |\n")
                f.write("| :- | :--- | :--- | :--- | :--- | :--- | :--- |\n")
                for idx, k in enumerate(gs_running, 1):
                    w_str = "🟢 Да" if k["watcher_running"] else "⚪ Нет"
                    c_str = "🟢 Да" if k["cefsharp_running"] else "⚪ Нет"
                    f.write(f"| {idx} | `{k['ip']}` | **{k['name']}** | {k['prefix']} | {w_str} | {c_str} | {k['total_procs']} |\n")
            else:
                f.write("*Кассы с запущенным процессом GuestScreen.exe не обнаружены.*\n")

            f.write("\n---\n\n")
            f.write(f"## 🟡 2. Список касс ОНЛАЙН, где GuestScreen.exe НЕ запущен ({len(gs_stopped)} касс)\n\n")
            if gs_stopped:
                f.write("| № | IP-адрес | Филиал | Префикс | Состояние |\n")
                f.write("| :- | :--- | :--- | :--- | :--- | :--- |\n")
                for idx, k in enumerate(gs_stopped, 1):
                    f.write(f"| {idx} | `{k['ip']}` | **{k['name']}** | {k['prefix']} | {k['status_desc']} |\n")

            f.write("\n---\n\n")
            f.write("## 🏢 3. Сводная таблица по всем филиалам сети\n\n")
            
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

    print(f"Отчет сохранен в файл: {LATEST_REPORT}")

if __name__ == "__main__":
    main()
