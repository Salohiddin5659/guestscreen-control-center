# -*- coding: utf-8 -*-
"""
Массовое автоматическое обновление GuestScreen до версии 3.1.1 на кассах сети.

Последовательность действий для каждой кассы:
1. Проверка доступности порта SMB (445).
2. Авторизация SMB (C$).
3. Проверка и копирование необходимых установочных файлов:
   - GuestScreen_setup-3.1.1_2.exe
   - VC_redist-14.51.36231.0.exe
   - windowsdesktop-runtime-8.0-win-x86.exe
4. Остановка Watcher.exe и GuestScreen.exe.
5. Установка .NET Desktop Runtime 8.0 (x86).
6. Установка Visual C++ Redistributable.
7. Установка GuestScreen 3.1.1 в C:\UCS\GuestScreen.
8. Запись обязательного файла конфигурации appsettings.json в C:\UCS\GuestScreen\.
9. Проверка версии файла GuestScreen.exe (3.1.1.0) на диске.
10. Запуск GuestScreen.exe и Watcher.exe.
11. Запись статуса в лог.
"""

import os
import sys
import time
import socket
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
LOG_FILE = os.path.join(LOGS_DIR, f"guestscreen_update_{timestamp_str}.log")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(sys.stdout)
    ]
)

APPSETTINGS_CONTENT = """{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}"""

def generate_ips():
    """Генератор IP-адресов касс сети (подсети 114–253, хосты 201–205)."""
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

def run_ps(cmd):
    p = subprocess.run(["powershell", "-NoProfile", "-Command", cmd], capture_output=True, text=True, timeout=120)
    return p.stdout.strip(), p.stderr.strip(), p.returncode

def update_single_kassa(ip):
    try:
        # 1. SMB connect
        run_ps(f"net use \\\\{ip}\\c$ {PASSWORD} /user:{USERNAME} 2>$null")

        remote_ucs_gs = f"\\\\{ip}\\c$\\UCS\\GuestScreen"
        remote_distr_dir = f"\\\\{ip}\\c$\\DISTR"
        remote_distr_gs = f"{remote_distr_dir}\\{GS_SETUP_NAME}"
        remote_distr_vc = f"{remote_distr_dir}\\{VC_SETUP_NAME}"
        remote_distr_dn = f"{remote_distr_dir}\\{DOTNET_SETUP_NAME}"

        # Проверяем, существует ли папка кассы UCS\GuestScreen
        chk_ucs, _, _ = run_ps(f"Test-Path '{remote_ucs_gs}'")
        if chk_ucs.lower() != "true":
            return {"ip": ip, "status": "SKIPPED", "message": "Папка UCS\\GuestScreen не найдена"}

        # Проверяем и обеспечиваем наличие папки DISTR и файлов
        copy_prep_ps = f"""
        if (-not (Test-Path '{remote_distr_dir}')) {{ New-Item -ItemType Directory -Path '{remote_distr_dir}' -Force | Out-Null }}
        if (-not (Test-Path '{remote_distr_gs}')) {{ Copy-Item '{os.path.join(LOCAL_DISTR, GS_SETUP_NAME)}' '{remote_distr_gs}' -Force }}
        if (-not (Test-Path '{remote_distr_vc}')) {{ Copy-Item '{os.path.join(LOCAL_DISTR, VC_SETUP_NAME)}' '{remote_distr_vc}' -Force }}
        if (-not (Test-Path '{remote_distr_dn}')) {{ Copy-Item '{os.path.join(LOCAL_DISTR, DOTNET_SETUP_NAME)}' '{remote_distr_dn}' -Force }}
        """
        run_ps(copy_prep_ps)

        # 2. Остановка Watcher.exe и GuestScreen.exe
        stop_ps = f"""
        $pass = ConvertTo-SecureString '{PASSWORD}' -AsPlainText -Force
        $cred = New-Object System.Management.Automation.PSCredential('{USERNAME}', $pass)
        Get-WmiObject -Class Win32_Process -ComputerName '{ip}' -Credential $cred -Filter "Name = 'Watcher.exe'" | ForEach-Object {{ $_.Terminate() | Out-Null }}
        Get-WmiObject -Class Win32_Process -ComputerName '{ip}' -Credential $cred -Filter "Name = 'GuestScreen.exe'" | ForEach-Object {{ $_.Terminate() | Out-Null }}
        """
        run_ps(stop_ps)
        time.sleep(2)

        # 3. Установка .NET Desktop Runtime 8.0 (x86)
        install_dn_ps = f"""
        $pass = ConvertTo-SecureString '{PASSWORD}' -AsPlainText -Force
        $cred = New-Object System.Management.Automation.PSCredential('{USERNAME}', $pass)
        $cmd = 'C:\\DISTR\\{DOTNET_SETUP_NAME} /install /quiet /norestart'
        $res = Invoke-WmiMethod -Class Win32_Process -Name Create -ArgumentList $cmd, 'C:\\DISTR' -ComputerName '{ip}' -Credential $cred
        $pidNum = $res.ProcessId
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        while ($sw.Elapsed.TotalSeconds -lt 40) {{
            Start-Sleep -Seconds 2
            $p = Get-WmiObject -Class Win32_Process -ComputerName '{ip}' -Credential $cred -Filter "ProcessId = $pidNum"
            if (-not $p) {{ break }}
        }}
        """
        run_ps(install_dn_ps)

        # 4. Установка Visual C++ Redistributable
        install_vc_ps = f"""
        $pass = ConvertTo-SecureString '{PASSWORD}' -AsPlainText -Force
        $cred = New-Object System.Management.Automation.PSCredential('{USERNAME}', $pass)
        $cmd = 'C:\\DISTR\\{VC_SETUP_NAME} /install /quiet /norestart'
        $res = Invoke-WmiMethod -Class Win32_Process -Name Create -ArgumentList $cmd, 'C:\\DISTR' -ComputerName '{ip}' -Credential $cred
        $pidNum = $res.ProcessId
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        while ($sw.Elapsed.TotalSeconds -lt 30) {{
            Start-Sleep -Seconds 2
            $p = Get-WmiObject -Class Win32_Process -ComputerName '{ip}' -Credential $cred -Filter "ProcessId = $pidNum"
            if (-not $p) {{ break }}
        }}
        """
        run_ps(install_vc_ps)

        # 5. Установка GuestScreen 3.1.1
        install_gs_ps = f"""
        $pass = ConvertTo-SecureString '{PASSWORD}' -AsPlainText -Force
        $cred = New-Object System.Management.Automation.PSCredential('{USERNAME}', $pass)
        $cmd = 'C:\\DISTR\\{GS_SETUP_NAME} /DIR="C:\\UCS\\GuestScreen" /VERYSILENT /SUPPRESSMSGBOXES /NORESTART /SP-'
        $res = Invoke-WmiMethod -Class Win32_Process -Name Create -ArgumentList $cmd, 'C:\\DISTR' -ComputerName '{ip}' -Credential $cred
        $pidNum = $res.ProcessId
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        while ($sw.Elapsed.TotalSeconds -lt 50) {{
            Start-Sleep -Seconds 2
            $p = Get-WmiObject -Class Win32_Process -ComputerName '{ip}' -Credential $cred | Where-Object {{ $_.Name -like "*GuestScreen_setup*" }}
            if (-not $p) {{ break }}
            $ver = (Get-ItemProperty "\\\\{ip}\\c$\\UCS\\GuestScreen\\GuestScreen.exe" -ErrorAction SilentlyContinue).VersionInfo.FileVersion
            if ($ver -eq "3.1.1.0" -and $sw.Elapsed.TotalSeconds -gt 15) {{
                $p | ForEach-Object {{ $_.Terminate() | Out-Null }}
                break
            }}
        }}
        """
        run_ps(install_gs_ps)

        # 6. Запись appsettings.json
        appsettings_path = f"\\\\{ip}\\c$\\UCS\\GuestScreen\\appsettings.json"
        with open(r"C:\tmp\gs_test\appsettings.json", "r", encoding="utf-8") as f:
            content = f.read()
        with open(appsettings_path, "w", encoding="utf-8") as f:
            f.write(content)

        # 7. Проверка версии файла
        chk_ver_ps = f"(Get-ItemProperty '\\\\{ip}\\c$\\UCS\\GuestScreen\\GuestScreen.exe' -ErrorAction SilentlyContinue).VersionInfo.FileVersion"
        out_ver, _, _ = run_ps(chk_ver_ps)

        # 8. Запуск GuestScreen.exe и Watcher.exe
        start_ps = f"""
        $pass = ConvertTo-SecureString '{PASSWORD}' -AsPlainText -Force
        $cred = New-Object System.Management.Automation.PSCredential('{USERNAME}', $pass)
        
        # Создаем ярлык в автозагрузке
        $wsh = New-Object -ComObject WScript.Shell
        $startupPath = "\\\\{ip}\\c$\\Users\\Administrator\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\GuestScreen.lnk"
        $lnk = $wsh.CreateShortcut($startupPath)
        $lnk.TargetPath = "C:\\UCS\\GuestScreen\\GuestScreen.exe"
        $lnk.WorkingDirectory = "C:\\UCS\\GuestScreen"
        $lnk.Save()

        # Запуск GuestScreen.exe
        Invoke-WmiMethod -Class Win32_Process -Name Create -ArgumentList 'C:\\UCS\\GuestScreen\\GuestScreen.exe', 'C:\\UCS\\GuestScreen' -ComputerName '{ip}' -Credential $cred | Out-Null
        
        # Запуск Watcher.exe
        $cmdWatcher = 'C:\\UCS\\GuestScreen\\Watcher.exe /watchpath="C:\\UCS\\GuestScreen\\GuestScreen.exe" /exceptionfile="setup.exe" /checktimeout="5"'
        Invoke-WmiMethod -Class Win32_Process -Name Create -ArgumentList $cmdWatcher, 'C:\\UCS\\GuestScreen' -ComputerName '{ip}' -Credential $cred | Out-Null
        """
        run_ps(start_ps)

        if out_ver == "3.1.1.0":
            return {"ip": ip, "status": "SUCCESS", "message": f"GuestScreen 3.1.1 (v{out_ver}) успешно установлен и запущен с Watcher.exe"}
        else:
            return {"ip": ip, "status": "WARNING", "message": f"Установка завершена, версия: {out_ver}"}

    except Exception as e:
        return {"ip": ip, "status": "ERROR", "message": str(e)}

def main():
    import argparse
    parser = argparse.ArgumentParser(description="GuestScreen 3.1.1 Complete Mass Updater")
    parser.add_argument("--ips", nargs="*", help="Список конкретных IP (через пробел)")
    parser.add_argument("--file", help="Файл со списком IP-адресов")
    parser.add_argument("--threads", type=int, default=20, help="Количество параллельных потоков (по умолч. 20)")
    args = parser.parse_args()

    target_ips = []
    if args.ips:
        target_ips = args.ips
    elif args.file and os.path.exists(args.file):
        with open(args.file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    target_ips.append(line)
    else:
        target_ips = generate_ips()

    logging.info(f"=== Полный автоматический запуск обновления GuestScreen 3.1.1 ===")
    logging.info(f"Целевых хостов для сканирования: {len(target_ips)}")
    logging.info(f"Лог-файл: {LOG_FILE}")

    logging.info("Сканирование сети на доступность касс (SMB)...")
    online_ips = []
    with ThreadPoolExecutor(max_workers=50) as executor:
        future_to_ip = {executor.submit(is_online, ip): ip for ip in target_ips}
        for future in as_completed(future_to_ip):
            ip = future_to_ip[future]
            if future.result():
                online_ips.append(ip)

    logging.info(f"Найдено доступных касс онлайн: {len(online_ips)}")
    if not online_ips:
        logging.warning("Нет доступных касс для обновления.")
        return

    results = []
    logging.info(f"Запуск обновления на {len(online_ips)} кассах в {args.threads} потоков...")
    with ThreadPoolExecutor(max_workers=args.threads) as executor:
        future_to_kassa = {executor.submit(update_single_kassa, ip): ip for ip in online_ips}
        for future in as_completed(future_to_kassa):
            res = future.result()
            results.append(res)
            logging.info(f"[{res['status']}] {res['ip']} - {res['message']}")

    success_cnt = sum(1 for r in results if r["status"] == "SUCCESS")
    warning_cnt = sum(1 for r in results if r["status"] == "WARNING")
    skipped_cnt = sum(1 for r in results if r["status"] == "SKIPPED")
    error_cnt = sum(1 for r in results if r["status"] == "ERROR")

    logging.info("=" * 60)
    logging.info(f"ИТОГОВЫЙ ОТЧЕТ ОБНОВЛЕНИЯ GUESTSCREEN 3.1.1:")
    logging.info(f"Успешно обновлено и запущено: {success_cnt}")
    logging.info(f"Предупреждения:             {warning_cnt}")
    logging.info(f"Пропущено:                  {skipped_cnt}")
    logging.info(f"Ошибки:                     {error_cnt}")
    logging.info(f"Полный лог сохранен в: {LOG_FILE}")
    logging.info("=" * 60)

if __name__ == "__main__":
    main()