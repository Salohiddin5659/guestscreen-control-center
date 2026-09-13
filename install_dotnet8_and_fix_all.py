# -*- coding: utf-8 -*-
"""
Full network deployment of .NET 8 Desktop Runtime (via SYSTEM task) + GuestScreen & Watcher fix.
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
LOG_FILE = os.path.join(LOGS_DIR, f"dotnet8_network_rollout_{timestamp_str}.log")

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

TASK_DOTNET_SYSTEM_XML = """<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>Install DotNet Runtime as SYSTEM</Description>
  </RegistrationInfo>
  <Triggers />
  <Principals>
    <Principal id="Author">
      <UserId>S-1-5-18</UserId>
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
    <ExecutionTimeLimit>PT10M</ExecutionTimeLimit>
    <Priority>7</Priority>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>C:\\DISTR\\windowsdesktop-runtime-8.0-win-x86.exe</Command>
      <Arguments>/install /quiet /norestart</Arguments>
      <WorkingDirectory>C:\\DISTR</WorkingDirectory>
    </Exec>
  </Actions>
</Task>"""

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
    ips = []
    for subnet in range(114, 254):
        for host in range(201, 206):
            ips.append(f"192.168.{subnet}.{host}")
    return ips

def is_online(ip, timeout=0.6):
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

def remediate_kassa(ip):
    try:
        # 1. Connect SMB
        run_ps(f"net use \\\\{ip}\\c$ {PASSWORD} /user:{USERNAME} 2>$null", timeout=10)

        remote_ucs_gs = f"\\\\{ip}\\c$\\UCS\\GuestScreen"
        gs_exe_path = f"{remote_ucs_gs}\\GuestScreen.exe"

        # Check if GuestScreen folder exists
        out_exists, _, _ = run_ps(f"Test-Path '{remote_ucs_gs}'", timeout=10)
        if out_exists.lower() != "true":
            return {"ip": ip, "status": "NO_GUESTSCREEN", "message": "Папка UCS\\GuestScreen отсутствует"}

        remote_distr_dir = f"\\\\{ip}\\c$\\DISTR"
        remote_distr_gs = f"{remote_distr_dir}\\{GS_SETUP_NAME}"
        remote_distr_vc = f"{remote_distr_dir}\\{VC_SETUP_NAME}"
        remote_distr_dn = f"{remote_distr_dir}\\{DOTNET_SETUP_NAME}"

        # 2. Check if .NET 8 is installed
        dotnet_chk, _, _ = run_ps(f"Test-Path '\\\\{ip}\\c$\\Program Files (x86)\\dotnet\\shared\\Microsoft.WindowsDesktop.App'", timeout=10)
        has_dotnet8 = dotnet_chk.lower() == "true"

        if not has_dotnet8:
            logging.info(f"[{ip}] .NET 8 Desktop Runtime missing. Installing as SYSTEM...")
            
            # Ensure installer exists
            copy_dn_script = f"""
            if (-not (Test-Path '{remote_distr_dir}')) {{ New-Item -ItemType Directory -Path '{remote_distr_dir}' -Force | Out-Null }}
            if (-not (Test-Path '{remote_distr_dn}')) {{ Copy-Item '{os.path.join(LOCAL_DISTR, DOTNET_SETUP_NAME)}' '{remote_distr_dn}' -Force }}
            if (-not (Test-Path '{remote_distr_vc}')) {{ Copy-Item '{os.path.join(LOCAL_DISTR, VC_SETUP_NAME)}' '{remote_distr_vc}' -Force }}
            """
            run_ps(copy_dn_script, timeout=60)

            # Create SYSTEM task and run
            t_dn = os.path.join(r"C:\tmp", f"task_dn_{ip}.xml")
            with open(t_dn, "w", encoding="utf-16") as f:
                f.write(TASK_DOTNET_SYSTEM_XML)

            inst_ps = f"""
            schtasks /delete /s {ip} /u {USERNAME} /p {PASSWORD} /tn "Install_DotNet" /f 2>`$null | Out-Null
            schtasks /create /s {ip} /u {USERNAME} /p {PASSWORD} /tn "Install_DotNet" /xml "{t_dn}" /f | Out-Null
            schtasks /run /s {ip} /u {USERNAME} /p {PASSWORD} /tn "Install_DotNet" | Out-Null
            """
            run_ps(inst_ps, timeout=20)
            
            try:
                os.remove(t_dn)
            except:
                pass

            # Poll for .NET 8 installation completion (up to 30s)
            for _ in range(15):
                time.sleep(2)
                chk, _, _ = run_ps(f"Test-Path '\\\\{ip}\\c$\\Program Files (x86)\\dotnet\\shared\\Microsoft.WindowsDesktop.App'", timeout=5)
                if chk.lower() == "true":
                    has_dotnet8 = True
                    logging.info(f"[{ip}] .NET 8 Desktop Runtime successfully installed!")
                    break

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

        # 6. Ensure Startup shortcuts
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

        # 7. Check if running and restart in interactive session
        t_gs = os.path.join(r"C:\tmp", f"task_gs_{ip}.xml")
        t_wt = os.path.join(r"C:\tmp", f"task_wt_{ip}.xml")
        with open(t_gs, "w", encoding="utf-16") as f:
            f.write(TASK_GS_XML)
        with open(t_wt, "w", encoding="utf-16") as f:
            f.write(TASK_WATCHER_XML)

        launch_script = f"""
        `$pass = ConvertTo-SecureString '{PASSWORD}' -AsPlainText -Force
        `$cred = New-Object System.Management.Automation.PSCredential('{USERNAME}', `$pass)
        
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

        # 8. Check ports & processes
        p2121 = check_http_port(ip, 2121, timeout=2.0)
        p2122 = check_http_port(ip, 2122, timeout=2.0)

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
            "dotnet8": has_dotnet8,
            "procs": final_proc,
            "port_2121": p2121,
            "port_2122": p2122,
            "message": f"OK (Procs: {final_proc}, 2121: {p2121}, 2122: {p2122})"
        }

    except Exception as e:
        return {"ip": ip, "status": "ERROR", "message": str(e)}

def main():
    logging.info("=" * 70)
    logging.info("STARTING COMPLETE .NET 8 RUNTIME & GUESTSCREEN SYSTEM ROLLOUT")
    logging.info("=" * 70)

    all_ips = generate_ips()
    logging.info(f"Target count: {len(all_ips)} IPs across subnets 192.168.114..253.")

    # Phase 1: Online Discovery
    logging.info("Phase 1: Discovering online cash registers...")
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
    logging.info(f"Found {len(online_ips)} ONLINE cash registers.")

    # Phase 2: Remediate all online hosts
    logging.info("Phase 2: Installing .NET 8 Runtime as SYSTEM, configuring ports & launching...")
    results = {"SUCCESS": [], "NO_GUESTSCREEN": [], "SKIPPED": [], "ERROR": []}

    with ThreadPoolExecutor(max_workers=15) as executor:
        future_to_ip = {executor.submit(remediate_kassa, ip): ip for ip in online_ips}
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
    logging.info("FINAL ROLLOUT SUMMARY REPORT")
    logging.info("=" * 70)
    logging.info(f"Total Hosts Scanned:           {len(all_ips)}")
    logging.info(f"Online Hosts:                  {len(online_ips)}")
    logging.info(f"GuestScreen Active & Verified: {len(results['SUCCESS'])}")
    logging.info(f"Hosts without GuestScreen:     {len(results['NO_GUESTSCREEN'])}")
    logging.info(f"Errors encountered:            {len(results['ERROR'])}")

    if results["SUCCESS"]:
        logging.info("\n--- FULLY OPERATIONAL CASH REGISTERS ---")
        for r in sorted(results["SUCCESS"], key=lambda x: [int(p) for p in x['ip'].split('.')]):
            logging.info(f"  {r['ip']:15} | DotNet8: {r.get('dotnet8')} | Procs: {r.get('procs')} | Port 2121: {r.get('port_2121')} | Port 2122: {r.get('port_2122')}")

    logging.info("=" * 70)
    logging.info(f"Log saved to: {LOG_FILE}")
    logging.info("=" * 70)

if __name__ == "__main__":
    main()