# -*- coding: utf-8 -*-
"""
Full network audit and automated fix for GuestScreen & Watcher across all cash registers.
"""

import os
import sys
import time
import socket
import sqlite3
import logging
import datetime
import subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed

USERNAME = "Administrator"
PASSWORD = "123"

LOCAL_DISTR = r"C:\DISTR"
GS_SETUP_NAME = "GuestScreen_setup-3.1.1_2.exe"
VC_SETUP_NAME = "VC_redist-14.51.36231.0.exe"
DOTNET_SETUP_NAME = "windowsdesktop-runtime-8.0-win-x86.exe"

LOGS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
os.makedirs(LOGS_DIR, exist_ok=True)
timestamp_str = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
LOG_FILE = os.path.join(LOGS_DIR, f"guestscreen_all_audit_fix_{timestamp_str}.log")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(sys.stdout)
    ]
)

APPSETTINGS_CONTENT = """{
  "urls": "http://*:2121;http://*:2122",
  "Servers": {
    "Centralization": "https://do.r-keeper.ru",
    "License": "https://l.ucs.ru/ls5api",
    "LicenseReserve": "https://l.rkeeper.ru/ls5api",
    "Weblate": "https://weblate.rkeeper.ru",
    "WebDav": "https://webdav.ucs.ru",
    "SoftMetrics": "https://l.ucs.ru/lsproductmetrics"
  },
  "SoftMetrics": {
    "Port": 2121,
    "SendInterval": "00:30:00",
    "MaxPayloadBytes": 250000
  }
}"""

TASK_GS_XML = """<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>Run GuestScreen on Interactive Desktop</Description>
  </RegistrationInfo>
  <Triggers />
  <Principals>
    <Principal id="Author">
      <LogonType>InteractiveToken</LogonType>
      <RunLevel>HighestAvailable</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
    <IdleSettings>
      <StopOnIdleEnd>false</StopOnIdleEnd>
      <RestartOnIdle>false</RestartOnIdle>
    </IdleSettings>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <Hidden>false</Hidden>
    <RunOnlyIfIdle>false</RunOnlyIfIdle>
    <WakeToRun>false</WakeToRun>
    <ExecutionTimeLimit>PT0S</ExecutionTimeLimit>
    <Priority>7</Priority>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>C:\\UCS\\GuestScreen\\GuestScreen.exe</Command>
      <WorkingDirectory>C:\\UCS\\GuestScreen</WorkingDirectory>
    </Exec>
  </Actions>
</Task>"""

TASK_WATCHER_XML = """<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>Run Watcher on Interactive Desktop</Description>
  </RegistrationInfo>
  <Triggers />
  <Principals>
    <Principal id="Author">
      <LogonType>InteractiveToken</LogonType>
      <RunLevel>HighestAvailable</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
    <IdleSettings>
      <StopOnIdleEnd>false</StopOnIdleEnd>
      <RestartOnIdle>false</RestartOnIdle>
    </IdleSettings>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <Hidden>false</Hidden>
    <RunOnlyIfIdle>false</RunOnlyIfIdle>
    <WakeToRun>false</WakeToRun>
    <ExecutionTimeLimit>PT0S</ExecutionTimeLimit>
    <Priority>7</Priority>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>C:\\UCS\\GuestScreen\\Watcher.exe</Command>
      <Arguments>/watchpath="C:\\UCS\\GuestScreen\\GuestScreen.exe" /exceptionfile="setup.exe" /checktimeout="5"</Arguments>
      <WorkingDirectory>C:\\UCS\\GuestScreen</WorkingDirectory>
    </Exec>
  </Actions>
</Task>"""

def generate_ips():
    """Generates all target IPs (subnets 114-253, hosts 201-205)."""
    ips = []
    for subnet in range(114, 254):
        for host in range(201, 206):
            ips.append(f"192.168.{subnet}.{host}")
    return ips

def is_online(ip, timeout=0.8):
    try:
        with socket.create_connection((ip, 445), timeout=timeout):
            return True
    except:
        return False

def run_ps(cmd, timeout=30):
    try:
        p = subprocess.run(["powershell", "-NoProfile", "-Command", cmd], capture_output=True, text=True, timeout=timeout)
        return p.stdout.strip(), p.stderr.strip(), p.returncode
    except Exception as e:
        return "", str(e), -1

def check_http_port(ip, port, timeout=2.0):
    try:
        with socket.create_connection((ip, port), timeout=timeout):
            return True
    except:
        return False

def process_kassa(ip):
    try:
        # 1. Connect SMB
        run_ps(f"net use \\\\{ip}\\c$ {PASSWORD} /user:{USERNAME} 2>$null", timeout=10)

        remote_ucs_gs = f"\\\\{ip}\\c$\\UCS\\GuestScreen"
        gs_exe_path = f"{remote_ucs_gs}\\GuestScreen.exe"

        # Check if GuestScreen folder exists
        out_exists, _, _ = run_ps(f"Test-Path '{remote_ucs_gs}'", timeout=10)
        if out_exists.lower() != "true":
            return {"ip": ip, "status": "NO_GUESTSCREEN", "message": "Папка UCS\\GuestScreen отсутствует"}

        # 2. Check GuestScreen.exe version
        ver_cmd = f"(Get-ItemProperty '{gs_exe_path}').VersionInfo.FileVersion"
        ver_out, _, _ = run_ps(ver_cmd, timeout=10)
        
        need_full_install = False
        if not ver_out or not ver_out.startswith("3.1"):
            need_full_install = True

        remote_distr_dir = f"\\\\{ip}\\c$\\DISTR"
        remote_distr_gs = f"{remote_distr_dir}\\{GS_SETUP_NAME}"
        remote_distr_vc = f"{remote_distr_dir}\\{VC_SETUP_NAME}"
        remote_distr_dn = f"{remote_distr_dir}\\{DOTNET_SETUP_NAME}"

        if need_full_install:
            logging.info(f"[{ip}] Updating GuestScreen to 3.1.1 (currently '{ver_out}')...")
            # Copy installers
            copy_script = f"""
            if (-not (Test-Path '{remote_distr_dir}')) {{ New-Item -ItemType Directory -Path '{remote_distr_dir}' -Force | Out-Null }}
            if (-not (Test-Path '{remote_distr_gs}')) {{ Copy-Item '{os.path.join(LOCAL_DISTR, GS_SETUP_NAME)}' '{remote_distr_gs}' -Force }}
            if (-not (Test-Path '{remote_distr_vc}')) {{ Copy-Item '{os.path.join(LOCAL_DISTR, VC_SETUP_NAME)}' '{remote_distr_vc}' -Force }}
            if (-not (Test-Path '{remote_distr_dn}')) {{ Copy-Item '{os.path.join(LOCAL_DISTR, DOTNET_SETUP_NAME)}' '{remote_distr_dn}' -Force }}
            """
            run_ps(copy_script, timeout=60)

            # Stop existing processes
            stop_script = f"""
            `$pass = ConvertTo-SecureString '{PASSWORD}' -AsPlainText -Force
            `$cred = New-Object System.Management.Automation.PSCredential('{USERNAME}', `$pass)
            Get-WmiObject -Class Win32_Process -ComputerName {ip} -Credential `$cred | Where-Object {{ `$_.Name -like '*GuestScreen*' -or `$_.Name -like '*Watcher*' -or `$_.Name -like '*CefSharp*' }} | ForEach-Object {{ `$_.Terminate() | Out-Null }}
            """
            run_ps(stop_script, timeout=20)
            time.sleep(2)

            # Install .NET 8, VC++, GuestScreen 3.1.1
            inst_script = f"""
            `$pass = ConvertTo-SecureString '{PASSWORD}' -AsPlainText -Force
            `$cred = New-Object System.Management.Automation.PSCredential('{USERNAME}', `$pass)
            
            # .NET Desktop Runtime
            `$cmd1 = 'cmd /c C:\\DISTR\\{DOTNET_SETUP_NAME} /install /quiet /norestart'
            Invoke-WmiMethod -Class Win32_Process -Name Create -ArgumentList `$cmd1, 'C:\\DISTR' -ComputerName {ip} -Credential `$cred | Out-Null
            Start-Sleep -Seconds 12
            
            # VC++
            `$cmd2 = 'cmd /c C:\\DISTR\\{VC_SETUP_NAME} /install /quiet /norestart'
            Invoke-WmiMethod -Class Win32_Process -Name Create -ArgumentList `$cmd2, 'C:\\DISTR' -ComputerName {ip} -Credential `$cred | Out-Null
            Start-Sleep -Seconds 8
            
            # GuestScreen setup
            `$cmd3 = 'cmd /c C:\\DISTR\\{GS_SETUP_NAME} /DIR="C:\\UCS\\GuestScreen" /VERYSILENT /SUPPRESSMSGBOXES /NORESTART'
            Invoke-WmiMethod -Class Win32_Process -Name Create -ArgumentList `$cmd3, 'C:\\DISTR' -ComputerName {ip} -Credential `$cred | Out-Null
            Start-Sleep -Seconds 15
            """
            run_ps(inst_script, timeout=60)

        # 3. Update appsettings.json
        remote_appsettings = f"{remote_ucs_gs}\\appsettings.json"
        try:
            with open(remote_appsettings, "w", encoding="utf-8") as f:
                f.write(APPSETTINGS_CONTENT)
        except Exception as e:
            logging.warning(f"[{ip}] Failed to write appsettings.json: {e}")

        # 4. Fix URLACL
        urlacl_script = f"""
        `$pass = ConvertTo-SecureString '{PASSWORD}' -AsPlainText -Force
        `$cred = New-Object System.Management.Automation.PSCredential('{USERNAME}', `$pass)
        `$c1 = 'cmd /c netsh http add urlacl url=http://+:2121/ sddl=D:(A;;GX;;;WD)'
        `$c2 = 'cmd /c netsh http add urlacl url=http://+:2122/ sddl=D:(A;;GX;;;WD)'
        Invoke-WmiMethod -Class Win32_Process -Name Create -ArgumentList `$c1, 'C:\\Windows\\System32' -ComputerName {ip} -Credential `$cred | Out-Null
        Invoke-WmiMethod -Class Win32_Process -Name Create -ArgumentList `$c2, 'C:\\Windows\\System32' -ComputerName {ip} -Credential `$cred | Out-Null
        """
        run_ps(urlacl_script, timeout=15)

        # 5. Fix gs.db
        temp_db = os.path.join(r"C:\tmp", f"gs_fix_{ip}.db")
        try:
            db_remote = f"{remote_ucs_gs}\\gs.db"
            if os.path.exists(db_remote):
                subprocess.run(["powershell", "-NoProfile", "-Command", f"Copy-Item '{db_remote}' '{temp_db}' -Force"], timeout=10)
                if os.path.exists(temp_db):
                    conn = sqlite3.connect(temp_db)
                    cur = conn.cursor()
                    cur.execute("UPDATE settings SET Raw='[]' WHERE Type='FatalErrors'")
                    cur.execute("UPDATE settings SET Raw='2122' WHERE Type='SelfHostingPort'")
                    cur.execute("UPDATE settings SET Raw='true' WHERE Type='RunWatcherOnStartup'")
                    cur.execute("UPDATE settings SET Raw='true' WHERE Type='AutoRun'")
                    conn.commit()
                    conn.close()
                    subprocess.run(["powershell", "-NoProfile", "-Command", f"Copy-Item '{temp_db}' '{db_remote}' -Force"], timeout=10)
                    try:
                        os.remove(temp_db)
                    except:
                        pass
        except Exception as e:
            logging.warning(f"[{ip}] Failed to update gs.db: {e}")

        # 6. Ensure Startup shortcut for Watcher & GuestScreen in Windows Startup folder
        startup_lnk_script = f"""
        `$startupPath = "\\\\{ip}\\c$\\Users\\Administrator\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\Startup"
        if (Test-Path `$startupPath) {{
            `$wsh = New-Object -ComObject WScript.Shell
            `$wLnk = `$wsh.CreateShortcut("`$startupPath\\Watcher.lnk")
            `$wLnk.TargetPath = "C:\\UCS\\GuestScreen\\Watcher.exe"
            `$wLnk.Arguments = '/watchpath="C:\\UCS\\GuestScreen\\GuestScreen.exe" /exceptionfile="setup.exe" /checktimeout="5"'
            `$wLnk.WorkingDirectory = "C:\\UCS\\GuestScreen"
            `$wLnk.Save()

            `$gLnk = `$wsh.CreateShortcut("`$startupPath\\GuestScreen.lnk")
            `$gLnk.TargetPath = "C:\\UCS\\GuestScreen\\GuestScreen.exe"
            `$gLnk.WorkingDirectory = "C:\\UCS\\GuestScreen"
            `$gLnk.Save()
        }}
        """
        run_ps(startup_lnk_script, timeout=15)

        # 7. Check if processes are running in active session
        proc_chk_script = f"""
        `$pass = ConvertTo-SecureString '{PASSWORD}' -AsPlainText -Force
        `$cred = New-Object System.Management.Automation.PSCredential('{USERNAME}', `$pass)
        `$procs = Get-WmiObject -Class Win32_Process -ComputerName {ip} -Credential `$cred | Where-Object {{ `$_.Name -like "*GuestScreen*" -or `$_.Name -like "*Watcher*" }}
        `$gs = `$procs | Where-Object {{ `$_.Name -eq "GuestScreen.exe" -and `$_.SessionId -ne 0 }}
        `$wt = `$procs | Where-Object {{ `$_.Name -eq "Watcher.exe" -and `$_.SessionId -ne 0 }}
        if (`$gs -and `$wt) {{ "RUNNING_OK" }} else {{ "NEED_RESTART" }}
        """
        proc_status, _, _ = run_ps(proc_chk_script, timeout=15)

        # 8. If not running properly or if we updated, launch via Task Scheduler in interactive session
        if "NEED_RESTART" in proc_status or need_full_install:
            logging.info(f"[{ip}] Starting GuestScreen & Watcher in user desktop session...")
            t_gs = os.path.join(r"C:\tmp", f"task_gs_{ip}.xml")
            t_wt = os.path.join(r"C:\tmp", f"task_wt_{ip}.xml")
            with open(t_gs, "w", encoding="utf-16") as f:
                f.write(TASK_GS_XML)
            with open(t_wt, "w", encoding="utf-16") as f:
                f.write(TASK_WATCHER_XML)

            launch_script = f"""
            `$pass = ConvertTo-SecureString '{PASSWORD}' -AsPlainText -Force
            `$cred = New-Object System.Management.Automation.PSCredential('{USERNAME}', `$pass)
            
            # Kill dead/Session 0 processes
            Get-WmiObject -Class Win32_Process -ComputerName {ip} -Credential `$cred | Where-Object {{ `$_.Name -like "*GuestScreen*" -or `$_.Name -like "*Watcher*" -or `$_.Name -like "*CefSharp*" }} | ForEach-Object {{ `$_.Terminate() | Out-Null }}
            Start-Sleep -Seconds 2

            schtasks /delete /s {ip} /u {USERNAME} /p {PASSWORD} /tn "GuestScreen_UI" /f 2>`$null | Out-Null
            schtasks /create /s {ip} /u {USERNAME} /p {PASSWORD} /tn "GuestScreen_UI" /xml "{t_gs}" /f | Out-Null
            schtasks /run /s {ip} /u {USERNAME} /p {PASSWORD} /tn "GuestScreen_UI" | Out-Null
            Start-Sleep -Seconds 2

            schtasks /delete /s {ip} /u {USERNAME} /p {PASSWORD} /tn "Watcher_UI" /f 2>`$null | Out-Null
            schtasks /create /s {ip} /u {USERNAME} /p {PASSWORD} /tn "Watcher_UI" /xml "{t_wt}" /f | Out-Null
            schtasks /run /s {ip} /u {USERNAME} /p {PASSWORD} /tn "Watcher_UI" | Out-Null
            """
            run_ps(launch_script, timeout=30)
            time.sleep(3)

            try:
                os.remove(t_gs)
                os.remove(t_wt)
            except:
                pass

        # 9. Verify ports
        p2121 = check_http_port(ip, 2121, timeout=2.0)
        p2122 = check_http_port(ip, 2122, timeout=2.0)

        # 10. Check final process status
        final_chk_script = f"""
        `$pass = ConvertTo-SecureString '{PASSWORD}' -AsPlainText -Force
        `$cred = New-Object System.Management.Automation.PSCredential('{USERNAME}', `$pass)
        `$gs = Get-WmiObject -Class Win32_Process -ComputerName {ip} -Credential `$cred -Filter "Name = 'GuestScreen.exe'" | Select-Object -ExpandProperty ProcessId -First 1
        `$wt = Get-WmiObject -Class Win32_Process -ComputerName {ip} -Credential `$cred -Filter "Name = 'Watcher.exe'" | Select-Object -ExpandProperty ProcessId -First 1
        "GS:`$gs|WT:`$wt"
        """
        final_proc, _, _ = run_ps(final_chk_script, timeout=15)

        return {
            "ip": ip,
            "status": "SUCCESS",
            "version": ver_out if not need_full_install else "3.1.1.0",
            "procs": final_proc,
            "port_2121": p2121,
            "port_2122": p2122,
            "message": f"OK (Procs: {final_proc}, 2121: {p2121}, 2122: {p2122})"
        }

    except Exception as e:
        return {"ip": ip, "status": "ERROR", "message": str(e)}

def main():
    logging.info("=" * 70)
    logging.info("STARTING FULL NETWORK AUDIT & FIX FOR GUESTSCREEN")
    logging.info("=" * 70)

    all_ips = generate_ips()
    logging.info(f"Generated {len(all_ips)} target IP addresses across subnets 192.168.114..253.")

    # Phase 1: Fast Online Discovery
    logging.info("Phase 1: Discovering online cash registers (port 445)...")
    online_ips = []
    with ThreadPoolExecutor(max_workers=60) as executor:
        future_to_ip = {executor.submit(is_online, ip, 0.6): ip for ip in all_ips}
        for future in as_completed(future_to_ip):
            ip = future_to_ip[future]
            try:
                if future.result():
                    online_ips.append(ip)
            except:
                pass

    online_ips.sort(key=lambda x: [int(p) for p in x.split('.')])
    logging.info(f"Found {len(online_ips)} ONLINE hosts out of {len(all_ips)} scanned.")

    # Phase 2: Audit & Fix GuestScreen on online hosts
    logging.info("Phase 2: Checking and fixing GuestScreen & Watcher on online hosts...")
    results = {"SUCCESS": [], "NO_GUESTSCREEN": [], "SKIPPED": [], "ERROR": []}

    with ThreadPoolExecutor(max_workers=20) as executor:
        future_to_ip = {executor.submit(process_kassa, ip): ip for ip in online_ips}
        for future in as_completed(future_to_ip):
            ip = future_to_ip[future]
            try:
                res = future.result()
                status = res.get("status", "ERROR")
                results.setdefault(status, []).append(res)
                if status == "SUCCESS":
                    logging.info(f"[+] {ip:15} -> {res.get('message')}")
                elif status == "NO_GUESTSCREEN":
                    logging.info(f"[-] {ip:15} -> {res.get('message')}")
                else:
                    logging.warning(f"[!] {ip:15} [{status}] -> {res.get('message')}")
            except Exception as e:
                logging.error(f"[X] {ip:15} -> Exception: {e}")
                results["ERROR"].append({"ip": ip, "status": "ERROR", "message": str(e)})

    # Summary Report
    logging.info("\n" + "=" * 70)
    logging.info("AUDIT & FIX SUMMARY REPORT")
    logging.info("=" * 70)
    logging.info(f"Total Hosts Scanned:           {len(all_ips)}")
    logging.info(f"Online Hosts:                  {len(online_ips)}")
    logging.info(f"GuestScreen Active & Fixed:    {len(results['SUCCESS'])}")
    logging.info(f"Hosts without GuestScreen:     {len(results['NO_GUESTSCREEN'])}")
    logging.info(f"Errors encountered:            {len(results['ERROR'])}")

    if results["SUCCESS"]:
        logging.info("\n--- SUCCESSFULLY CONFIGURED CASH REGISTERS ---")
        for r in sorted(results["SUCCESS"], key=lambda x: [int(p) for p in x['ip'].split('.')]):
            logging.info(f"  {r['ip']:15} | Procs: {r.get('procs')} | Port 2121: {r.get('port_2121')} | Port 2122: {r.get('port_2122')}")

    if results["ERROR"]:
        logging.info("\n--- CASH REGISTERS WITH ERRORS ---")
        for r in sorted(results["ERROR"], key=lambda x: [int(p) for p in x['ip'].split('.')]):
            logging.info(f"  {r['ip']:15} | Error: {r.get('message')}")

    logging.info("=" * 70)
    logging.info(f"Log saved to: {LOG_FILE}")
    logging.info("=" * 70)

if __name__ == "__main__":
    main()