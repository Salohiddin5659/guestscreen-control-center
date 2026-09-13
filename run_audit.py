# -*- coding: utf-8 -*-
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
PS_CHECKER = r"D:\Anti\check_single_kassa.ps1"
REPORT_FILE = r"D:\Anti\logs\guestscreen_audit_latest.md"

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

def check_tcp(ip):
    for p in [445, 135]:
        try:
            with socket.create_connection((ip, p), timeout=0.35):
                return True
        except:
            pass
    return False

def audit_target(target):
    ip = target["ip"]
    target["online"] = check_tcp(ip)
    target["gs"] = False
    target["wt"] = False
    target["cs"] = False
    target["err"] = ""

    if not target["online"]:
        return target

    try:
        p = subprocess.run(
            ["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", PS_CHECKER, "-ip", ip],
            capture_output=True,
            text=True,
            timeout=8
        )
        out = p.stdout.strip()
        m = re.search(r'\{.*\}', out)
        if m:
            data = json.loads(m.group(0))
            target["gs"] = data.get("gs", False)
            target["wt"] = data.get("wt", False)
            target["cs"] = data.get("cs", False)
            target["err"] = data.get("error", "")
    except Exception as e:
        target["err"] = str(e)

    return target

def main():
    print("=======================================================")
    print("   Starting GuestScreen Parallel Audit (103 Branches)")
    print("=======================================================")

    filials = parse_filials()
    print(f"Parsed {len(filials)} branches.")

    targets = []
    for f in filials:
        for h in [201, 202, 203, 204, 205, 228]:
            targets.append({
                "ip": f"{f['subnet']}.{h}",
                "prefix": f["prefix"],
                "name": f["name"],
                "subnet": f["subnet"]
            })

    print(f"Total targets: {len(targets)} IPs. Auditing with 35 workers...")
    start_t = time.time()
    results = []

    with ThreadPoolExecutor(max_workers=35) as executor:
        futures = {executor.submit(audit_target, t): t for t in targets}
        done = 0
        total = len(futures)
        for fut in as_completed(futures):
            done += 1
            if done % 50 == 0 or done == total:
                print(f"Progress: {done}/{total} ({(done/total*100):.1f}%)...")
            results.append(fut.result())

    elapsed = time.time() - start_t
    print(f"Audit completed in {elapsed:.1f}s.")

    def ip_key(r):
        parts = [int(p) if p.isdigit() else 0 for p in r["ip"].split(".")]
        while len(parts) < 4: parts.append(0)
        return parts

    results.sort(key=ip_key)

    online_list = [r for r in results if r["online"]]
    running_list = [r for r in results if r["gs"]]
    stopped_list = [r for r in results if r["online"] and not r["gs"]]
    offline_list = [r for r in results if not r["online"]]

    print("\n" + "="*60)
    print(" AUDIT RESULTS SUMMARY:")
    print(f" Total Targets: {len(results)}")
    print(f" Online Hosts: {len(online_list)}")
    print(f" [GREEN] GuestScreen RUNNING: {len(running_list)}")
    print(f" [YELLOW] Online but GuestScreen STOPPED: {len(stopped_list)}")
    print(f" [OFFLINE] Offline Hosts: {len(offline_list)}")
    print("="*60 + "\n")

    # Generate Markdown
    md = []
    ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    md.append("# 📋 Полный аудит системы GuestScreen по филиалам сети (103 филиала)\n")
    md.append(f"**Дата и время аудита:** {ts}  ")
    md.append(f"**Всего проверено кассовых IP:** {len(results)}  ")
    md.append(f"**Включено касс в сети (Онлайн):** {len(online_list)}  ")
    md.append(f"**🟢 Запущен и работает в штатном режиме:** {len(running_list)}  ")
    md.append(f"**🟡 Касса онлайн, но GuestScreen НЕ запущен:** {len(stopped_list)}  ")
    md.append(f"**⚪ Касса выключена / Офлайн:** {len(offline_list)}  \n")
    md.append("---\n")

    md.append(f"## 🟢 1. Список касс, где GuestScreen ЗАПУЩЕН и работает ({len(running_list)} касс)\n")
    if running_list:
        md.append("| № | IP-адрес | Филиал | Префикс | Watcher | CefSharp | Статус |")
        md.append("| :- | :--- | :--- | :--- | :--- | :--- | :--- |")
        for idx, k in enumerate(running_list, 1):
            w_str = "🟢 Да" if k["wt"] else "⚪ Нет"
            c_str = "🟢 Да" if k["cs"] else "⚪ Нет"
            md.append(f"| {idx} | `{k['ip']}` | **{k['name']}** | {k['prefix']} | {w_str} | {c_str} | 🟢 Запущен (Штатный режим) |")
    else:
        md.append("*Кассы с запущенным GuestScreen не обнаружены.*\n")

    md.append("\n---\n")
    md.append(f"## 🟡 2. Список касс ОНЛАЙН, где GuestScreen НЕ запущен ({len(stopped_list)} касс)\n")
    if stopped_list:
        md.append("| № | IP-адрес | Филиал | Префикс | Состояние |")
        md.append("| :- | :--- | :--- | :--- | :--- |")
        for idx, k in enumerate(stopped_list, 1):
            err_str = f" ({k['err'][:25]})" if k['err'] else ""
            md.append(f"| {idx} | `{k['ip']}` | **{k['name']}** | {k['prefix']} | 🟡 Онлайн, процесс не запущен{err_str} |")

    md.append("\n---\n")
    md.append("## 🏢 3. Сводная таблица по филиалам сети\n")
    
    branch_map = {}
    for r in results:
        b = r["name"]
        if b not in branch_map:
            branch_map[b] = {
                "prefix": r["prefix"],
                "subnet": r["subnet"],
                "items": []
            }
        branch_map[b]["items"].append(r)

    md.append("| Филиал | Подсеть | Онлайн | 🟢 Запущен | 🟡 Не запущен | ⚪ Офлайн | IP касс с запущенным GuestScreen |")
    md.append("| :--- | :--- | :--- | :--- | :--- | :--- | :--- |")
    for b_name, b_data in sorted(branch_map.items()):
        items = b_data["items"]
        on_c = sum(1 for x in items if x["online"])
        run_c = sum(1 for x in items if x["gs"])
        stop_c = sum(1 for x in items if x["online"] and not x["gs"])
        off_c = sum(1 for x in items if not x["online"])
        run_ips = ", ".join([f"`{x['ip']}`" for x in items if x["gs"]]) or "—"
        if on_c > 0:
            md.append(f"| **{b_name}** | `{b_data['subnet']}` | {on_c}/{len(items)} | **{run_c}** | {stop_c} | {off_c} | {run_ips} |")

    with open(REPORT_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(md))

    print(f"Report saved to {REPORT_FILE}")

if __name__ == "__main__":
    main()
