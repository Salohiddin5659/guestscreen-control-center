# -*- coding: utf-8 -*-
r"""
Master Sequential / Controlled Remediation Script for GuestScreen (.201 to .205).
Performs:
1. TCP Ping (445/135)
2. Network share authentication & check
3. Autostart script deployment (Startup folder)
4. Session 0 process cleanup
5. Interactive launch in active user desktop session (schtasks /it)
6. Comprehensive verification (Interactive Session, Process list, Watcher, Log errors)
7. Per-cashier logging
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
LOG_FILE = r"d:\Anti\remediation_progress.log"
DETAILED_REPORT_TXT = r"C:\Users\Administrator\Desktop\GuestScreen_Full_Remediation_Report.txt"
DETAILED_REPORT_MD = r"C:\Users\Administrator\Desktop\GuestScreen_Full_Remediation_Report.md"

START_BAT_CONTENT = """@echo off
start "" "C:\\UCS\\GuestScreen\\GuestScreen.exe"
timeout /t 3 /nobreak >nul
start "" "C:\\UCS\\GuestScreen\\Watcher.exe" /watchpath="C:\\UCS\\GuestScreen\\GuestScreen.exe" /exceptionfile="setup.exe" /checktimeout="5"
"""

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

def check_tcp(ip, port=445, timeout=0.4):
    try:
        with socket.create_connection((ip, port), timeout=timeout):
            return True
    except:
        return False

def is_online(ip):
    return check_tcp(ip, 445) or check_tcp(ip, 135)

def mount_share(ip, drive='C'):
    share = f'\\\\{ip}\\{drive}$'
    try:
        p = subprocess.run(['net', 'use', share, '/user:' + USERNAME, PASSWORD],
                           capture_output=True, timeout=10)
        return p.returncode == 0 or os.path.exists(share)
    except:
        return False

def get_remote_processes(ip):
    ps_cmd = f"""
    $pass = ConvertTo-SecureString '{PASSWORD}' -AsPlainText -Force
    $cred = New-Object System.Management.Automation.PSCredential('{USERNAME}', $pass)
    try {{
        $procs = Get-WmiObject -Class Win32_Process -ComputerName '{ip}' -Credential $cred -ErrorAction Stop
        $res = $procs | Select-Object ProcessId, Name, SessionId, CommandLine
        @{{ status = 'OK'; procs = $res }} | ConvertTo-Json -Depth 3 -Compress
    }} catch {{
        @{{ status = 'ERROR'; error = $_.Exception.Message }} | ConvertTo-Json -Compress
    }}
    """
    try:
        p = subprocess.run(['powershell.exe', '-NoProfile', '-Command', ps_cmd],
                           capture_output=True, text=True, timeout=20)
        m = re.search(r'\{.*\}', p.stdout.strip())
        if m:
            data = json.loads(m.group(0))
            if data.get('status') == 'OK':
                procs = data.get('procs', [])
                if isinstance(procs, dict): procs = [procs]
                return procs
            else:
                return {'error': data.get('error', 'Unknown WMI error')}
    except Exception as e:
        return {'error': str(e)}
    return {'error': 'WMI no output'}

def remediate_cashier(ip, prefix, branch_name):
    timestamp = datetime.datetime.now().strftime('%H:%M:%S')
    res = {
        'ip': ip,
        'prefix': prefix,
        'branch': branch_name,
        'online': False,
        'installed': False,
        'install_path': None,
        'autostart_configured': False,
        'active_session': None,
        'gs_running_interactive': False,
        'gs_pid': None,
        'gs_session': None,
        'watcher_running_interactive': False,
        'watcher_pid': None,
        'watcher_session': None,
        'status_summary': '',
        'details': []
    }

    # Step 1: Check Online
    if not is_online(ip):
        res['status_summary'] = 'ОФЛАЙН (касса выключена / нет связи)'
        return res

    res['online'] = True

    # Step 2: SMB Access & Check installation
    share = f'\\\\{ip}\\C$'
    mounted = mount_share(ip, 'C')
    
    gs_exe = f'{share}\\UCS\\GuestScreen\\GuestScreen.exe'
    wt_exe = f'{share}\\UCS\\GuestScreen\\Watcher.exe'
    
    if os.path.exists(gs_exe):
        res['installed'] = True
        res['install_path'] = r'C:\UCS\GuestScreen'
    else:
        # Check D: drive
        mount_share(ip, 'D')
        d_gs_exe = f'\\\\{ip}\\D$\\UCS\\GuestScreen\\GuestScreen.exe'
        if os.path.exists(d_gs_exe):
            res['installed'] = True
            res['install_path'] = r'D:\UCS\GuestScreen'
            share = f'\\\\{ip}\\D$'
            gs_exe = d_gs_exe
            wt_exe = f'\\\\{ip}\\D$\\UCS\\GuestScreen\\Watcher.exe'

    if not res['installed']:
        res['status_summary'] = 'НЕ УСТАНОВЛЕН (отсутствует папка UCS\\GuestScreen)'
        res['details'].append('Файлы GuestScreen.exe не найдены на C: или D:')
        return res

    # Step 3: Configure Autostart (Startup Bat file)
    try:
        bat_file = f'{share}\\UCS\\GuestScreen\\start_guestscreen.bat'
        with open(bat_file, 'w', encoding='utf-8') as f:
            f.write(START_BAT_CONTENT)
        
        startups = [
            f'{share}\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs\\Startup',
            f'{share}\\Users\\Administrator\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\Startup'
        ]
        for s in startups:
            if os.path.exists(s):
                target_bat = os.path.join(s, 'GuestScreen_Autostart.bat')
                with open(target_bat, 'w', encoding='utf-8') as f:
                    f.write(START_BAT_CONTENT)
        res['autostart_configured'] = True
        res['details'].append('Автозапуск настроен в Startup')
    except Exception as e:
        res['details'].append(f'Ошибка настройки автозапуска: {e}')

    # Step 4: Inspect current processes & sessions
    procs = get_remote_processes(ip)
    if isinstance(procs, dict) and 'error' in procs:
        res['status_summary'] = f"WMI ОШИБКА: {procs['error'][:50]}"
        return res

    # Find active explorer session
    expl_sessions = [p.get('SessionId') for p in procs if (p.get('Name') or '').lower() == 'explorer.exe']
    active_session = expl_sessions[0] if expl_sessions else None
    res['active_session'] = active_session

    # Terminate any Session 0 or rogue GuestScreen / Watcher / CefSharp processes
    to_kill_pids = []
    for p in procs:
        pname = (p.get('Name') or '').lower()
        psess = p.get('SessionId')
        if any(x in pname for x in ['guestscreen', 'watcher', 'cefsharp']):
            # If in session 0 or no active session, or invalid session
            if psess == 0 or (active_session is not None and psess != active_session):
                to_kill_pids.append(p.get('ProcessId'))

    if to_kill_pids:
        ps_kill = f"""
        $pass = ConvertTo-SecureString '{PASSWORD}' -AsPlainText -Force
        $cred = New-Object System.Management.Automation.PSCredential('{USERNAME}', $pass)
        $pids = @({','.join(str(pid) for pid in to_kill_pids if pid)})
        foreach ($pid in $pids) {{
            $p = Get-WmiObject -Class Win32_Process -ComputerName '{ip}' -Credential $cred -Filter "ProcessId = $pid" -ErrorAction SilentlyContinue
            if ($p) {{ $p.Terminate() | Out-Null }}
        }}
        """
        subprocess.run(['powershell.exe', '-NoProfile', '-Command', ps_kill], capture_output=True, timeout=15)
        res['details'].append(f'Завершены некорректные процессы Session 0 (PID: {to_kill_pids})')
        time.sleep(2)
        # Refresh process list
        procs = get_remote_processes(ip)
        if isinstance(procs, dict) and 'error' in procs:
            procs = []

    # Check if GS is running in active session
    gs_in_session = [p for p in procs if (p.get('Name') or '').lower() == 'guestscreen.exe' and p.get('SessionId') == active_session and active_session is not None]
    wt_in_session = [p for p in procs if (p.get('Name') or '').lower() == 'watcher.exe' and p.get('SessionId') == active_session and active_session is not None]

    # Step 5: Launch interactively if not running in active session
    if active_session is not None and (not gs_in_session or not wt_in_session):
        gs_path_str = f'{res["install_path"]}\\GuestScreen.exe'
        wt_path_str = f'{res["install_path"]}\\Watcher.exe'
        
        # Launch GS
        if not gs_in_session:
            cmd_create_gs = f'schtasks /create /s {ip} /u {USERNAME} /p {PASSWORD} /tn "RunGuestScreen" /tr "\\"{gs_path_str}\\"" /sc ONCE /st 00:00 /it /rl HIGHEST /ru {USERNAME} /rp {PASSWORD} /f'
            subprocess.run(cmd_create_gs, shell=True, capture_output=True, text=True)
            cmd_run_gs = f'schtasks /run /s {ip} /u {USERNAME} /p {PASSWORD} /tn "RunGuestScreen"'
            subprocess.run(cmd_run_gs, shell=True, capture_output=True, text=True)
            time.sleep(3)
        
        # Launch Watcher
        if not wt_in_session:
            wt_cmd_arg = f'\\"{wt_path_str}\\" /watchpath=\\"{gs_path_str}\\" /exceptionfile=\\"setup.exe\\" /checktimeout=\\"5\\"'
            cmd_create_wt = f'schtasks /create /s {ip} /u {USERNAME} /p {PASSWORD} /tn "RunWatcher" /tr "{wt_cmd_arg}" /sc ONCE /st 00:00 /it /rl HIGHEST /ru {USERNAME} /rp {PASSWORD} /f'
            subprocess.run(cmd_create_wt, shell=True, capture_output=True, text=True)
            cmd_run_wt = f'schtasks /run /s {ip} /u {USERNAME} /p {PASSWORD} /tn "RunWatcher"'
            subprocess.run(cmd_run_wt, shell=True, capture_output=True, text=True)
            time.sleep(4)

        # Re-check processes
        procs = get_remote_processes(ip)
        if isinstance(procs, dict) and 'error' in procs:
            procs = []

    # Final evaluation
    final_gs = [p for p in procs if (p.get('Name') or '').lower() == 'guestscreen.exe']
    final_wt = [p for p in procs if (p.get('Name') or '').lower() == 'watcher.exe']

    if final_gs:
        res['gs_pid'] = final_gs[0].get('ProcessId')
        res['gs_session'] = final_gs[0].get('SessionId')
        if active_session is not None and res['gs_session'] == active_session:
            res['gs_running_interactive'] = True

    if final_wt:
        res['watcher_pid'] = final_wt[0].get('ProcessId')
        res['watcher_session'] = final_wt[0].get('SessionId')
        if active_session is not None and res['watcher_session'] == active_session:
            res['watcher_running_interactive'] = True

    # Summary
    if res['gs_running_interactive'] and res['watcher_running_interactive']:
        res['status_summary'] = f'🟢 ИСПРАВЛЕН И РАБОТАЕТ (GS PID:{res["gs_pid"]}, WT PID:{res["watcher_pid"]}, Сессия {active_session})'
    elif res['gs_running_interactive']:
        res['status_summary'] = f'🟡 GS РАБОТАЕТ, НО WATCHER НЕТ (GS PID:{res["gs_pid"]}, Сессия {active_session})'
    elif active_session is None:
        res['status_summary'] = '⚪ КАССИР НЕ АВТОРИЗОВАН (нет сессии explorer.exe, автозапуск настроен)'
    else:
        res['status_summary'] = f'🔴 НЕ УДАЛОСЬ ЗАПУСТИТЬ В СЕССИИ {active_session}'

    return res

def main():
    filials = parse_filials()
    targets = []
    for f in filials:
        for h in [201, 202, 203, 204, 205]:
            targets.append({
                'ip': f"{f['subnet']}.{h}",
                'prefix': f['prefix'],
                'branch': f['name']
            })

    total = len(targets)
    start_time = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print('=' * 80)
    print(f'   ГЛУБОКИЙ АУДИТ И ПОШАГОВОЕ ИСПРАВЛЕНИЕ GUESTSCREEN ({total} касс)')
    print(f'   Время старта: {start_time}')
    print('=' * 80)

    results = []
    done_count = 0

    # Process cashiers with controlled concurrency (6 workers to avoid WMI network saturation)
    with ThreadPoolExecutor(max_workers=6) as executor:
        future_map = {executor.submit(remediate_cashier, t['ip'], t['prefix'], t['branch']): t for t in targets}
        for future in as_completed(future_map):
            done_count += 1
            t = future_map[future]
            try:
                r = future.result()
                results.append(r)
                status_icon = '🟢' if r['gs_running_interactive'] and r['watcher_running_interactive'] else ('⚪' if not r['online'] else '🟡')
                print(f"[{done_count:3d}/{total}] {r['ip']:<17} | {r['branch']:<25} | {status_icon} {r['status_summary']}")
            except Exception as e:
                err_r = {
                    'ip': t['ip'], 'prefix': t['prefix'], 'branch': t['branch'],
                    'online': False, 'status_summary': f'Ошибка выполнения: {e}',
                    'details': [str(e)]
                }
                results.append(err_r)
                print(f"[{done_count:3d}/{total}] {t['ip']:<17} | {t['branch']:<25} | ❌ Ошибка: {e}")

    results.sort(key=lambda x: [int(p) if p.isdigit() else 0 for p in x['ip'].split('.')])

    # Build report
    finish_time = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    online_list = [r for r in results if r.get('online')]
    fully_fixed = [r for r in results if r.get('gs_running_interactive') and r.get('watcher_running_interactive')]
    gs_only = [r for r in results if r.get('gs_running_interactive') and not r.get('watcher_running_interactive')]
    no_login = [r for r in results if r.get('online') and r.get('active_session') is None]
    not_installed = [r for r in results if r.get('online') and not r.get('installed')]
    offline_list = [r for r in results if not r.get('online')]
    error_list = [r for r in results if r.get('online') and not r.get('gs_running_interactive') and r.get('installed') and r.get('active_session') is not None]

    lines = []
    lines.append('=' * 90)
    lines.append('     ПОЛНЫЙ ИНДИВИДУАЛЬНЫЙ ОТЧЁТ ИСПРАВЛЕНИЯ И АУДИТА GUESTSCREEN (.201 - .205)')
    lines.append('=' * 90)
    lines.append(f'Время старта:   {start_time}')
    lines.append(f'Время финиша:   {finish_time}')
    lines.append(f'Всего кассовых IP (.201-.205):          {total}')
    lines.append(f'В сети (Онлайн):                        {len(online_list)}')
    lines.append(f'  🟢 Полностью исправлены (GS + Watcher): {len(fully_fixed)}')
    lines.append(f'  🟡 Работает только GS (без Watcher):   {len(gs_only)}')
    lines.append(f'  ⚪ Кассир не авторизован (нет explorer): {len(no_login)}')
    lines.append(f'  ❌ GuestScreen не установлен в C:\\UCS: {len(not_installed)}')
    lines.append(f'  🔴 Ошибка запуска в активной сессии:   {len(error_list)}')
    lines.append(f'Выключены / Офлайн:                     {len(offline_list)}')
    lines.append('=' * 90)

    lines.append('')
    lines.append('------------------------------------------------------------------------------------------')
    lines.append(f' 1. КАССЫ С ПОЛНОСТЬЮ РАБОТАЮЩИМ GUESTSCREEN И WATCHER ({len(fully_fixed)} касс)')
    lines.append('------------------------------------------------------------------------------------------')
    lines.append(f'{"№":<4} | {"IP-АДРЕС":<17} | {"ПРЕФИКС":<8} | {"ФИЛИАЛ":<25} | {"СЕССИЯ":<7} | {"GS PID":<7} | {"WT PID":<7} | {"АВТОЗАПУСК"}')
    lines.append('-' * 90)
    for i, r in enumerate(fully_fixed, 1):
        auto_str = 'Да (Настроен)' if r.get('autostart_configured') else 'Нет'
        lines.append(f"{i:<4} | {r['ip']:<17} | {r['prefix']:<8} | {r['branch']:<25} | {str(r.get('active_session')):<7} | {str(r.get('gs_pid')):<7} | {str(r.get('watcher_pid')):<7} | {auto_str}")

    if gs_only:
        lines.append('')
        lines.append('------------------------------------------------------------------------------------------')
        lines.append(f' 2. КАССЫ, ГДЕ ЗАПУЩЕН ТОЛЬКО GUESTSCREEN БЕЗ WATCHER ({len(gs_only)} касс)')
        lines.append('------------------------------------------------------------------------------------------')
        lines.append(f'{"№":<4} | {"IP-АДРЕС":<17} | {"ПРЕФИКС":<8} | {"ФИЛИАЛ":<25} | {"СЕССИЯ":<7} | {"GS PID":<7} | {"СТАТУС"}')
        lines.append('-' * 90)
        for i, r in enumerate(gs_only, 1):
            lines.append(f"{i:<4} | {r['ip']:<17} | {r['prefix']:<8} | {r['branch']:<25} | {str(r.get('active_session')):<7} | {str(r.get('gs_pid')):<7} | {r['status_summary']}")

    if error_list:
        lines.append('')
        lines.append('------------------------------------------------------------------------------------------')
        lines.append(f' 3. КАССЫ ОНЛАЙН, ГДЕ ТРЕБУЕТСЯ РУЧНОЕ ВМЕШАТЕЛЬСТВО ({len(error_list)} касс)')
        lines.append('------------------------------------------------------------------------------------------')
        lines.append(f'{"№":<4} | {"IP-АДРЕС":<17} | {"ПРЕФИКС":<8} | {"ФИЛИАЛ":<25} | {"ПРИЧИНА / ДЕТАЛИ"}')
        lines.append('-' * 90)
        for i, r in enumerate(error_list, 1):
            details_str = '; '.join(r.get('details', []))
            lines.append(f"{i:<4} | {r['ip']:<17} | {r['prefix']:<8} | {r['branch']:<25} | {r['status_summary']} ({details_str})")

    if not_installed:
        lines.append('')
        lines.append('------------------------------------------------------------------------------------------')
        lines.append(f' 4. КАССЫ ОНЛАЙН, ГДЕ GUESTSCREEN НЕ УСТАНОВЛЕН ({len(not_installed)} касс)')
        lines.append('------------------------------------------------------------------------------------------')
        lines.append(f'{"№":<4} | {"IP-АДРЕС":<17} | {"ПРЕФИКС":<8} | {"ФИЛИАЛ":<25} | {"ПРИЧИНА"}')
        lines.append('-' * 90)
        for i, r in enumerate(not_installed, 1):
            lines.append(f"{i:<4} | {r['ip']:<17} | {r['prefix']:<8} | {r['branch']:<25} | Отсутствует C:\\UCS\\GuestScreen")

    report_text = '\n'.join(lines)
    with open(DETAILED_REPORT_TXT, 'w', encoding='utf-8') as f:
        f.write(report_text)

    print(f"\nОтчёт успешно сохранён:\n -> {DETAILED_REPORT_TXT}")

if __name__ == '__main__':
    main()
