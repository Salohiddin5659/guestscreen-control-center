import os
import sys
import time
import socket
import subprocess
import re
from concurrent.futures import ThreadPoolExecutor, as_completed

if os.name == "nt":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

ips = [f"192.168.{s}.{h}" for s in range(114, 254) for h in range(201, 206)]
print(f"[*] Запуск тотального сканирования {len(ips)} IP-адресов (подсети 114-253, хосты 201-205)...")

def check_tcp(ip):
    try:
        with socket.create_connection((ip, 445), timeout=0.45):
            return ip, True
    except Exception:
        try:
            with socket.create_connection((ip, 135), timeout=0.45):
                return ip, True
        except Exception:
            return ip, False

t0 = time.time()
with ThreadPoolExecutor(max_workers=80) as ex:
    online_ips = [ip for ip, up in ex.map(check_tcp, ips) if up]
t1 = time.time()
print(f"    ✔ Найдено касс в сети: {len(online_ips)} (время проверки доступности: {t1-t0:.2f} сек)")

def query_ip(ip):
    res_fs = {"status": "NOT_INSTALLED", "pid": 0, "start_type": "-", "bin_path": ""}
    res_fd = {"status": "NOT_INSTALLED", "pid": 0, "start_type": "-", "bin_path": ""}
    try:
        # SMB connect
        subprocess.run(["net", "use", rf"\\{ip}\c$", "123", "/user:Administrator"], capture_output=True, timeout=3)
        
        def get_svc(name):
            try:
                q = subprocess.run(["sc.exe", rf"\\{ip}", "queryex", name], capture_output=True, text=True, encoding="cp866", errors="replace", timeout=3)
                if q.returncode != 0:
                    if "1060" in q.stdout or "1060" in q.stderr:
                        return {"status": "NOT_INSTALLED", "pid": 0, "start_type": "-", "bin_path": ""}
                    return {"status": "ACCESS_DENIED" if "5" in q.stdout else "ERROR", "pid": 0, "start_type": "-", "bin_path": ""}
                
                st = "RUNNING" if "RUNNING" in q.stdout else ("STOPPED" if "STOPPED" in q.stdout else "OTHER")
                m_pid = re.search(r'(?:PID|ID_[^\s:]+)\s*:\s*(\d+)', q.stdout, re.IGNORECASE)
                pid = int(m_pid.group(1)) if m_pid else 0
                
                qc = subprocess.run(["sc.exe", rf"\\{ip}", "qc", name], capture_output=True, text=True, encoding="cp866", errors="replace", timeout=3)
                start_type = "AUTO" if "AUTO_START" in qc.stdout else ("MANUAL" if "DEMAND_START" in qc.stdout else ("DISABLED" if "DISABLED" in qc.stdout else "UNKNOWN"))
                bin_path = ""
                m_path = re.search(r':\s*([a-zA-Z]:\\[^\r\n]+)', qc.stdout)
                if m_path:
                    bin_path = m_path.group(1).strip()
                    
                return {"status": st, "pid": pid, "start_type": start_type, "bin_path": bin_path}
            except Exception as e:
                return {"status": "TIMEOUT", "pid": 0, "start_type": "-", "bin_path": "", "error": str(e)}

        res_fs = get_svc("FiscalService")
        res_fd = get_svc("FiscalDriveAPI")
    except Exception as e:
        res_fs = {"status": "ERROR", "pid": 0, "start_type": "-", "bin_path": "", "error": str(e)}
        res_fd = {"status": "ERROR", "pid": 0, "start_type": "-", "bin_path": "", "error": str(e)}

    return ip, {"fs": res_fs, "fd": res_fd}

print(f"[*] Опрос служб на {len(online_ips)} активных кассах...")
results = {}
with ThreadPoolExecutor(max_workers=35) as ex:
    futures = {ex.submit(query_ip, ip): ip for ip in online_ips}
    for f in as_completed(futures):
        ip, data = f.result()
        results[ip] = data

t2 = time.time()
print(f"    ✔ Опрос служб завершен за {t2-t1:.2f} сек. Общее время: {t2-t0:.2f} сек.\n")

fs_running = []
fs_stopped = []
fs_not_installed = []
fs_errors = []

fd_running = []
fd_stopped = []

def ip_key(ip):
    return [int(x) for x in ip.split(".")]

for ip in sorted(online_ips, key=ip_key):
    d = results.get(ip, {})
    fs = d.get("fs", {})
    fd = d.get("fd", {})
    
    if fs.get("status") == "RUNNING":
        fs_running.append((ip, fs, fd))
    elif fs.get("status") == "STOPPED":
        fs_stopped.append((ip, fs, fd))
    elif fs.get("status") == "NOT_INSTALLED":
        fs_not_installed.append((ip, fs, fd))
    else:
        fs_errors.append((ip, fs, fd))
        
    if fd.get("status") == "RUNNING":
        fd_running.append((ip, fd))
    elif fd.get("status") == "STOPPED":
        fd_stopped.append((ip, fd))

print("=" * 100)
print(f" РЕЗУЛЬТАТЫ ДЕТАЛЬНОГО АУДИТА СЛУЖБ (FiscalService vs FiscalDriveAPI)")
print("=" * 100)
print(f" Всего проверено IP в диапазоне: {len(ips)}")
print(f" Касс в сети (Online):          {len(online_ips)}")
print(f" Касс выключено / оффлайн:      {len(ips) - len(online_ips)}")
print("-" * 100)
print(f" 🟢 Служба FiscalService РАБОТАЕТ (RUNNING):     {len(fs_running)} шт.")
print(f" 🔴 Служба FiscalService ОСТАНОВЛЕНА (STOPPED):  {len(fs_stopped)} шт.")
print(f" ⚪ Служба FiscalService НЕ УСТАНОВЛЕНА:       {len(fs_not_installed)} шт.")
if fs_errors:
    print(f" ⚠️ Ошибки доступа / таймаут:                   {len(fs_errors)} шт.")
print("-" * 100)
print(f" 🟢 Альтернативная служба FiscalDriveAPI РАБОТАЕТ (RUNNING): {len(fd_running)} шт.")
print(f" 🔴 Альтернативная служба FiscalDriveAPI ОСТАНОВЛЕНА:        {len(fd_stopped)} шт.")
print("=" * 100)

print("\n" + "=" * 30 + f" [1] КАССЫ ГДЕ FiscalService РАБОТАЕТ ({len(fs_running)} шт.) " + "=" * 30)
if fs_running:
    print(f"{'IP АДРЕС':17} | {'СТАТУС':10} | {'PID':6} | {'АВТОЗАПУСК':10} | {'FiscalDriveAPI':16} | {'ПУТЬ К ФАЙЛУ'}")
    print("-" * 100)
    for ip, fs, fd in fs_running:
        print(f"{ip:17} | {fs['status']:10} | {fs['pid']:<6} | {fs['start_type']:10} | DriveAPI:{fd['status']:8} | {fs['bin_path']}")
else:
    print("  [!] Служба FiscalService НЕ запущена ни на одной кассе.")

print("\n" + "=" * 30 + f" [2] КАССЫ ГДЕ FiscalService ОСТАНОВЛЕНА ({len(fs_stopped)} шт.) " + "=" * 30)
print(f"{'IP АДРЕС':17} | {'СТАТУС':10} | {'PID':6} | {'АВТОЗАПУСК':10} | {'FiscalDriveAPI':16} | {'ПУТЬ К ФАЙЛУ'}")
print("-" * 100)
for ip, fs, fd in fs_stopped:
    print(f"{ip:17} | {fs['status']:10} | {fs['pid']:<6} | {fs['start_type']:10} | DriveAPI:{fd['status']:8} | {fs['bin_path']}")

print("\n" + "=" * 30 + f" [3] ОШИБКИ ИЛИ ТАЙМАУТЫ ({len(fs_errors)} шт.) " + "=" * 30)
for ip, fs, fd in fs_errors:
    print(f"  {ip:17} | FiscalService Status: {fs.get('status')} | DriveAPI Status: {fd.get('status')}")
