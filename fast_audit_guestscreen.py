# -*- coding: utf-8 -*-
"""
Fast Parallel Auditor for GuestScreen across all restaurant branches (UTF-8 safe).
"""

import os
import re
import sys
import time
import socket
import datetime
import subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed

# Set UTF-8 for console output
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

USERNAME = "Administrator"
PASSWORD = "123"

FILIALS_FILE = r"C:\Users\Administrator\Desktop\all_filials.txt"
LOGS_DIR = r"D:\Anti\logs"
os.makedirs(LOGS_DIR, exist_ok=True)
timestamp_str = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
REPORT_FILE = os.path.join(LOGS_DIR, f"guestscreen_audit_report_{timestamp_str}.md")
SUMMARY_FILE = os.path.join(LOGS_DIR, "guestscreen_audit_latest.md")

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

def check_tcp_port(ip, port, timeout=0.6):
    try:
        with socket.create_connection((ip, port), timeout=timeout):
            return True
    except:
        return False

def is_host_online(ip):
    for p in [445, 135]:
        if check_tcp_port(ip, p, timeout=0.5):
            return True
    return False

def audit_single_kassa(ip, filial_info):
    result = {
        "ip": ip,
        "filial_prefix": filial_info["prefix"],
        "filial_name": filial_info["name"],
        "subnet": filial_info["subnet"],
        "online": False,
        "gs_folder_exists": False,
        "gs_running": False,
        "watcher_running": False,
        "monitors": 1,
        "details": ""
    }

    if not is_host_online(ip):
        result["details"] = "Офлайн"
        return result

    result["online"] = True

    ps_cmd = f"""
    $secPass = ConvertTo-SecureString "{PASSWORD}" -AsPlainText -Force
    $cred = New-Object System.Management.Automation.PSCredential ("{USERNAME}", $secPass)
    
    $out = @{{
        gsFolder = $false
        gsRunning = $false
        watcherRunning = $false
        monitors = 1
        error = ""
    }}

    try {{
        $cimOpt = New-CimSessionOption -Protocol DCOM
        $cim = New-CimSession -ComputerName "{ip}" -Credential $cred -SessionOption $cimOpt -OperationTimeoutSec 4 -ErrorAction Stop
        
        $procs = Get-CimInstance -CimSession $cim -ClassName Win32_Process -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Name
        if ($procs -contains "GuestScreen.exe") {{ $out.gsRunning = $true }}
        if ($procs -contains "Watcher.exe") {{ $out.watcherRunning = $true }}
        
        $mons = Get-CimInstance -CimSession $cim -ClassName Win32_DesktopMonitor -ErrorAction SilentlyContinue
        $out.monitors = if ($mons) {{ ($mons | Measure-Object).Count }} else {{ 1 }}

        Remove-CimSession $cim -ErrorAction SilentlyContinue
    }} catch {{
        $out.error = $_.Exception.Message
    }}

    $out | ConvertTo-Json -Compress
    """

    try:
        p = subprocess.run(["powershell", "-NoProfile", "-Command", ps_cmd], capture_output=True, text=True, timeout=10)
        stdout = p.stdout.strip()
        
        import json
        json_match = re.search(r'\{.*\}', stdout, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group(0))
            result["gs_running"] = data.get("gsRunning", False)
            result["watcher_running"] = data.get("watcherRunning", False)
            result["monitors"] = data.get("monitors", 1)
            err = data.get("error", "")

            if result["gs_running"]:
                result["details"] = "Запущен (Штатный режим)"
            else:
                result["details"] = "Онлайн, но GS не запущен"
        else:
            result["details"] = "Онлайн (WMI закрыт)"
    except Exception as e:
        result["details"] = f"Онлайн (Таймаут опроса)"

    return result

def main():
    print("=================================================================")
    print("   Запуск аудита GuestScreen по всем филиалам и кассам")
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
    print("Сканирование сети с высокой параллельностью (80 потоков)...")

    start_time = time.time()
    results = []

    with ThreadPoolExecutor(max_workers=80) as executor:
        futures = {executor.submit(audit_single_kassa, ip, f_info): ip for ip, f_info in targets}
        done_count = 0
        total = len(futures)
        for fut in as_completed(futures):
            done_count += 1
            if done_count % 100 == 0 or done_count == total:
                print(f"Проверено: {done_count}/{total} ({(done_count/total*100):.1f}%)...")
            res = fut.result()
            results.append(res)

    elapsed = time.time() - start_time
    print(f"\nСканирование завершено за {elapsed:.1f} сек.")

    # Sort results
    def ip_sort_key(r):
        parts = [int(p) if p.isdigit() else 0 for p in r["ip"].split(".")]
        while len(parts) < 4: parts.append(0)
        return parts

    results.sort(key=ip_sort_key)

    online_kassas = [r for r in results if r["online"]]
    gs_running_kassas = [r for r in results if r["gs_running"]]
    gs_stopped_kassas = [r for r in results if r["online"] and not r["gs_running"]]
    offline_kassas = [r for r in results if not r["online"]]

    print("\n" + "="*65)
    print(f" СВОДКА АУДИТА GUESTSCREEN ({datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}):")
    print(f" Всего проверено IP: {len(results)}")
    print(f" [ONLINE] Всего онлайн-касс в сети: {len(online_kassas)}")
    print(f" [RUNNING] Касс с ЗАПУЩЕННЫМ GuestScreen: {len(gs_running_kassas)}")
    print(f" [STOPPED] Касс ОНЛАЙН, но GuestScreen НЕ запущен: {len(gs_stopped_kassas)}")
    print(f" [OFFLINE] Касс ВЫКЛЮЧЕНО / ОФЛАЙН: {len(offline_kassas)}")
    print("="*65 + "\n")

    # Generate Markdown Report
    for out_path in [REPORT_FILE, SUMMARY_FILE]:
        with open(out_path, "w", encoding="utf-8") as f:
            f.write("# 📋 Результаты аудита GuestScreen по всем филиалам сети\n\n")
            f.write(f"**Дата и время проверки:** {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  \n")
            f.write(f"**Всего проверено кассовых IP:** {len(results)} (103 филиала)  \n")
            f.write(f"**🟢 Запущен и работает в штатном режиме:** {len(gs_running_kassas)}  \n")
            f.write(f"**🟡 Касса онлайн, но GuestScreen НЕ запущен:** {len(gs_stopped_kassas)}  \n")
            f.write(f"**⚪ Касса выключена / Офлайн:** {len(offline_kassas)}  \n\n")
            f.write("---\n\n")

            f.write("## 🟢 1. Список касс, где GuestScreen ЗАПУЩЕН и работает в штатном режиме\n\n")
            if gs_running_kassas:
                f.write("| № | IP-адрес | Филиал | Префикс | Watcher | Мониторы | Статус |\n")
                f.write("| :- | :--- | :--- | :--- | :--- | :--- | :--- |\n")
                for idx, k in enumerate(gs_running_kassas, 1):
                    w_str = "Да" if k["watcher_running"] else "Нет"
                    f.write(f"| {idx} | `{k['ip']}` | **{k['filial_name']}** | {k['filial_prefix']} | {w_str} | {k['monitors']} | 🟢 Запущен (Штатный режим) |\n")
            else:
                f.write("*Нет обнаруженных касс с запущенным процессом*\n")

            f.write("\n---\n\n")
            f.write("## 🟡 2. Список касс ОНЛАЙН, где GuestScreen НЕ запущен\n\n")
            if gs_stopped_kassas:
                f.write("| № | IP-адрес | Филиал | Префикс | Состояние |\n")
                f.write("| :- | :--- | :--- | :--- | :--- |\n")
                for idx, k in enumerate(gs_stopped_kassas, 1):
                    f.write(f"| {idx} | `{k['ip']}` | **{k['filial_name']}** | {k['filial_prefix']} | 🟡 Онлайн, процесс не запущен |\n")
            else:
                f.write("*Все онлайн-кассы имеют запущенный GuestScreen*\n")

            f.write("\n---\n\n")
            f.write("## 🏢 3. Сводная таблица по всем филиалам сети (103 филиала)\n\n")
            
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
                f.write(f"| **{fname}** | `{g['subnet']}` | {on_count}/{len(klist)} | **{run_count}** | {stop_count} | {off_count} | {running_ips} |\n")

    print(f"Отчет успешно сохранен в файл: {SUMMARY_FILE}")

if __name__ == "__main__":
    main()
