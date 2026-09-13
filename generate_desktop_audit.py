# -*- coding: utf-8 -*-
r"""
Accurate WMI Process Auditor for GuestScreen across all 103 branches.
STRICTLY for Cashier IPs .201 to .205 only.
Saves report to C:\Users\Administrator\Desktop\GuestScreen_Audit.txt and .md
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
DESKTOP_TXT = r"C:\Users\Administrator\Desktop\GuestScreen_Audit.txt"
DESKTOP_MD = r"C:\Users\Administrator\Desktop\GuestScreen_Audit.md"

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

def check_kassa_processes(target):
    ip = target["ip"]
    target["online"] = check_tcp_port(ip, 445) or check_tcp_port(ip, 135)
    target["gs_running"] = False
    target["watcher_running"] = False
    target["cefsharp_running"] = False
    target["rk7_running"] = False
    target["total_procs"] = 0
    target["status_desc"] = ""

    if not target["online"]:
        target["status_desc"] = "Выключена / Офлайн"
        return target

    ps_cmd = f"""
    $pass = ConvertTo-SecureString '{PASSWORD}' -AsPlainText -Force
    $cred = New-Object System.Management.Automation.PSCredential('{USERNAME}', $pass)
    try {{
        $procs = (Get-WmiObject -Class Win32_Process -ComputerName '{ip}' -Credential $cred -ErrorAction Stop).Name
        $is_gs = ($procs -contains 'GuestScreen.exe')
        $is_wt = ($procs -contains 'Watcher.exe')
        $is_cs = (($procs | Where-Object {{ $_ -like '*CefSharp*' }}).Count -gt 0)
        $is_rk = ($procs -contains 'DOSCASH.EXE') -or ($procs -contains 'rk7.exe')
        @{{ ip = '{ip}'; gs = [bool]$is_gs; wt = [bool]$is_wt; cs = [bool]$is_cs; rk = [bool]$is_rk; total = $procs.Count }} | ConvertTo-Json -Compress
    }} catch {{
        @{{ ip = '{ip}'; error = $_.Exception.Message }} | ConvertTo-Json -Compress
    }}
    """

    for attempt in range(2):
        try:
            p = subprocess.run(["powershell.exe", "-NoProfile", "-Command", ps_cmd], capture_output=True, text=True, timeout=12)
            stdout = p.stdout.strip()
            m = re.search(r'\{.*\}', stdout)
            if m:
                data = json.loads(m.group(0))
                if "gs" in data:
                    target["gs_running"] = data.get("gs", False)
                    target["watcher_running"] = data.get("wt", False)
                    target["cefsharp_running"] = data.get("cs", False)
                    target["rk7_running"] = data.get("rk", False)
                    target["total_procs"] = data.get("total", 0)

                    if target["gs_running"]:
                        target["status_desc"] = "ЗАПУЩЕН (Штатный режим)"
                    else:
                        target["status_desc"] = "Онлайн, но GuestScreen НЕ запущен"
                    break
                else:
                    target["status_desc"] = "Онлайн, WMI ошибка: " + str(data.get("error", ""))[:30]
            else:
                target["status_desc"] = "Онлайн, нет ответа WMI"
        except Exception as e:
            target["status_desc"] = "Онлайн, таймаут WMI"
            time.sleep(0.5)

    return target

def main():
    print("=================================================================")
    print("   Запуск аудита GuestScreen строго по кассам .201 - .205")
    print("=================================================================")

    filials = parse_filials()
    print(f"Загружено филиалов: {len(filials)}")

    targets = []
    for f in filials:
        # STRICTLY 201 to 205 only
        for h in [201, 202, 203, 204, 205]:
            targets.append({
                "ip": f"{f['subnet']}.{h}",
                "host_num": h,
                "prefix": f["prefix"],
                "name": f["name"],
                "subnet": f["subnet"]
            })

    print(f"Всего кассовых IP (.201-.205) на проверку: {len(targets)}")
    
    # 1. TCP Ping check
    print("1. Быстрая проверка доступности касс в сети...")
    online_targets = []
    offline_targets = []

    def ping_worker(t):
        ip = t["ip"]
        is_on = check_tcp_port(ip, 445, 0.35) or check_tcp_port(ip, 135, 0.35)
        return (is_on, t)

    with ThreadPoolExecutor(max_workers=80) as ex:
        futs = [ex.submit(ping_worker, t) for t in targets]
        for f in as_completed(futs):
            is_on, t = f.result()
            if is_on:
                online_targets.append(t)
            else:
                t["online"] = False
                t["gs_running"] = False
                t["status_desc"] = "Выключена / Офлайн"
                offline_targets.append(t)

    print(f"Онлайн касс (.201-.205): {len(online_targets)}. Офлайн: {len(offline_targets)}.")
    print("2. Опрос процессов Windows (Win32_Process) на всех онлайн-кассах...")

    start_time = time.time()
    results = list(offline_targets)

    with ThreadPoolExecutor(max_workers=20) as executor:
        futures = {executor.submit(check_kassa_processes, t): t for t in online_targets}
        done = 0
        total = len(futures)
        for fut in as_completed(futures):
            done += 1
            if done % 20 == 0 or done == total:
                print(f"Проверено WMI: {done}/{total} ({(done/total*100):.1f}%)...")
            results.append(fut.result())

    elapsed = time.time() - start_time
    print(f"Аудит завершен за {elapsed:.1f} сек.")

    def ip_sort_key(r):
        parts = [int(p) if p.isdigit() else 0 for p in r["ip"].split(".")]
        while len(parts) < 4: parts.append(0)
        return parts

    results.sort(key=ip_sort_key)

    online_kassas = [r for r in results if r["online"]]
    gs_running = [r for r in results if r["gs_running"]]
    gs_stopped = [r for r in results if r["online"] and not r["gs_running"]]
    offline_kassas = [r for r in results if not r["online"]]

    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    print("\n" + "="*65)
    print(f" ИТОГИ АУДИТА GUESTSCREEN (ТОЛЬКО КАССЫ .201-.205) ({now_str}):")
    print(f" Всего проверено IP (.201-.205): {len(results)}")
    print(f" Включено касс в сети (Онлайн): {len(online_kassas)}")
    print(f" 🟢 ЗАПУЩЕН GuestScreen: {len(gs_running)}")
    print(f" 🟡 НЕ ЗАПУЩЕН GuestScreen: {len(gs_stopped)}")
    print(f" ⚪ ВЫКЛЮЧЕНЫ / ОФЛАЙН: {len(offline_kassas)}")
    print("="*65 + "\n")

    # Generate Desktop TXT Report
    txt_lines = []
    txt_lines.append("================================================================================")
    txt_lines.append("        ОТЧЕТ АУДИТА СИСТЕМЫ GUESTSCREEN ПО КАССАМ СЕТИ (.201 - .205)")
    txt_lines.append("================================================================================")
    txt_lines.append(f"Дата и время аудита: {now_str}")
    txt_lines.append(f"Диапазон IP касс: строго с .201 по .205 (103 филиала)")
    txt_lines.append(f"Метод проверки: Прямой опрос процессов Windows (Win32_Process -> GuestScreen.exe)")
    txt_lines.append(f"Всего кассовых IP проверено: {len(results)}")
    txt_lines.append(f"Включено касс в сети (Онлайн): {len(online_kassas)}")
    txt_lines.append(f"[ЗАПУЩЕН] Касс с работающим GuestScreen.exe: {len(gs_running)}")
    txt_lines.append(f"[НЕ ЗАПУЩЕН] Касс онлайн, но GuestScreen отсутствует: {len(gs_stopped)}")
    txt_lines.append(f"[ОФЛАЙН] Касс выключено / нет связи: {len(offline_kassas)}")
    txt_lines.append("================================================================================\n")

    txt_lines.append("--------------------------------------------------------------------------------")
    txt_lines.append(f" 1. СПИСОК КАСС, ГДЕ GUESTSCREEN ЗАПУЩЕН И РАБОТАЕТ В ШТАТНОМ РЕЖИМЕ ({len(gs_running)} касс)")
    txt_lines.append("--------------------------------------------------------------------------------")
    txt_lines.append(f"{'№':<4} | {'IP-АДРЕС':<16} | {'ПРЕФИКС':<8} | {'ФИЛИАЛ':<30} | {'WATCHER':<8} | {'СТАТУС'}")
    txt_lines.append("-" * 90)
    for idx, k in enumerate(gs_running, 1):
        w_str = "Да" if k["watcher_running"] else "Нет"
        txt_lines.append(f"{idx:<4} | {k['ip']:<16} | {k['prefix']:<8} | {k['name']:<30} | {w_str:<8} | ЗАПУЩЕН (Штатный режим)")

    txt_lines.append("\n" + "-" * 90)
    txt_lines.append(f" 2. СПИСОК КАСС ОНЛАЙН, ГДЕ GUESTSCREEN НЕ ЗАПУЩЕН ({len(gs_stopped)} касс)")
    txt_lines.append("-" * 90)
    txt_lines.append(f"{'№':<4} | {'IP-АДРЕС':<16} | {'ПРЕФИКС':<8} | {'ФИЛИАЛ':<30} | {'СОСТОЯНИЕ'}")
    txt_lines.append("-" * 90)
    for idx, k in enumerate(gs_stopped, 1):
        txt_lines.append(f"{idx:<4} | {k['ip']:<16} | {k['prefix']:<8} | {k['name']:<30} | {k['status_desc']}")

    txt_lines.append("\n" + "-" * 90)
    txt_lines.append(" 3. СВОДКА ПО ФИЛИАЛАМ СЕТИ (103 филиала, кассы .201-.205)")
    txt_lines.append("-" * 90)
    txt_lines.append(f"{'ФИЛИАЛ':<30} | {'ПОДСЕТЬ':<15} | {'ОНЛАЙН':<8} | {'ЗАПУЩЕН':<8} | {'НЕ ЗАПУЩЕН':<12} | {'ОФЛАЙН':<8} | {'IP С GUESTSCREEN'}")
    txt_lines.append("-" * 110)

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

    for fname, g in sorted(filial_groups.items()):
        klist = g["kassas"]
        on_count = sum(1 for k in klist if k["online"])
        run_count = sum(1 for k in klist if k["gs_running"])
        stop_count = sum(1 for k in klist if k["online"] and not k["gs_running"])
        off_count = sum(1 for k in klist if not k["online"])
        running_ips = ", ".join([k['ip'] for k in klist if k["gs_running"]]) or "—"
        if on_count > 0:
            txt_lines.append(f"{fname:<30} | {g['subnet']:<15} | {on_count:<8} | {run_count:<8} | {stop_count:<12} | {off_count:<8} | {running_ips}")

    with open(DESKTOP_TXT, "w", encoding="utf-8") as f:
        f.write("\n".join(txt_lines))

    # Generate Markdown on Desktop
    md_lines = []
    md_lines.append("# 📋 Результаты аудита системы GuestScreen (Кассы .201 - .205)\n")
    md_lines.append(f"**Дата и время проверки:** {now_str}  ")
    md_lines.append(f"**Диапазон IP касс:** строго с `.201` по `.205` (103 филиала)  ")
    md_lines.append(f"**Метод проверки:** Прямой опрос списка запущенных процессов Windows (`Win32_Process -> GuestScreen.exe`)  ")
    md_lines.append(f"**Всего проверено кассовых IP:** {len(results)}  ")
    md_lines.append(f"**Включено касс в сети (Онлайн):** {len(online_kassas)}  ")
    md_lines.append(f"**🟢 Запущен и работает в штатном режиме:** {len(gs_running)}  ")
    md_lines.append(f"**🟡 Касса онлайн, но GuestScreen НЕ запущен:** {len(gs_stopped)}  ")
    md_lines.append(f"**⚪ Касса выключена / Офлайн:** {len(offline_kassas)}  \n")
    md_lines.append("---\n")

    md_lines.append(f"## 🟢 1. Список касс, где GuestScreen ЗАПУЩЕН и работает ({len(gs_running)} касс)\n")
    if gs_running:
        md_lines.append("| № | IP-адрес | Филиал | Префикс | Watcher | CefSharp | Статус |")
        md_lines.append("| :- | :--- | :--- | :--- | :--- | :--- | :--- |")
        for idx, k in enumerate(gs_running, 1):
            w_str = "🟢 Да" if k["watcher_running"] else "⚪ Нет"
            c_str = "🟢 Да" if k["cefsharp_running"] else "⚪ Нет"
            md_lines.append(f"| {idx} | `{k['ip']}` | **{k['name']}** | {k['prefix']} | {w_str} | {c_str} | 🟢 Запущен (Штатный режим) |")

    md_lines.append("\n---\n")
    md_lines.append(f"## 🟡 2. Список касс ОНЛАЙН, где GuestScreen НЕ запущен ({len(gs_stopped)} касс)\n")
    if gs_stopped:
        md_lines.append("| № | IP-адрес | Филиал | Префикс | Состояние |")
        md_lines.append("| :- | :--- | :--- | :--- | :--- |")
        for idx, k in enumerate(gs_stopped, 1):
            md_lines.append(f"| {idx} | `{k['ip']}` | **{k['name']}** | {k['prefix']} | {k['status_desc']} |")

    md_lines.append("\n---\n")
    md_lines.append("## 🏢 3. Сводная таблица по всем филиалам сети (Кассы .201-.205)\n")
    md_lines.append("| Филиал | Подсеть | Онлайн | 🟢 Запущен | 🟡 Не запущен | ⚪ Офлайн | IP-адреса с запущенным GuestScreen |")
    md_lines.append("| :--- | :--- | :--- | :--- | :--- | :--- | :--- |")
    for fname, g in sorted(filial_groups.items()):
        klist = g["kassas"]
        on_count = sum(1 for k in klist if k["online"])
        run_count = sum(1 for k in klist if k["gs_running"])
        stop_count = sum(1 for k in klist if k["online"] and not k["gs_running"])
        off_count = sum(1 for k in klist if not k["online"])
        running_ips = ", ".join([f"`{k['ip']}`" for k in klist if k["gs_running"]]) or "—"
        if on_count > 0:
            md_lines.append(f"| **{fname}** | `{g['subnet']}` | {on_count}/{len(klist)} | **{run_count}** | {stop_count} | {off_count} | {running_ips} |")

    with open(DESKTOP_MD, "w", encoding="utf-8") as f:
        f.write("\n".join(md_lines))

    print(f"Отчет успешно сохранен на рабочий стол:")
    print(f"  -> {DESKTOP_TXT}")
    print(f"  -> {DESKTOP_MD}")

if __name__ == "__main__":
    main()
