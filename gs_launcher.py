# -*- coding: utf-8 -*-
import os, re, sys, json, time, socket, datetime, subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
USERNAME = 'Administrator'
PASSWORD = '123'
STOPPED_CASHIERS = [
    ('192.168.114.201','OL061FC','Golden Life Mall'),
    ('192.168.114.202','OL061FC','Golden Life Mall'),
    ('192.168.115.201','OL008SS','Xadra'),
    ('192.168.115.202','OL008SS','Xadra'),
    ('192.168.117.203','OL011RE','ToshMI'),
    ('192.168.118.201','OL001RE','Oqtepa Maydoni'),
    ('192.168.120.201','OL005SS','Vatan'),
    ('192.168.121.201','OL003SS','Qutbiniso'),
    ('192.168.121.202','OL003SS','Qutbiniso'),
    ('192.168.122.202','OL004SS','Gulzor'),
    ('192.168.127.202','OL037SS','Chilonzor-19'),
    ('192.168.129.201','OL025SS','Algoritm'),
    ('192.168.131.201','OL024SS','Xalqlar dostligi'),
    ('192.168.134.201','OL010RE','Universam'),
    ('192.168.135.201','OL020SS','Bodomzor'),
    ('192.168.136.201','OL035SS','Majnuntol'),
    ('192.168.136.202','OL035SS','Majnuntol'),
    ('192.168.137.202','OL027SS','Rakat'),
    ('192.168.138.201','OL042SS','Labzak'),
    ('192.168.139.201','OL044FC','Riviera'),
    ('192.168.140.201','OL046FC','Beruniy'),
    ('192.168.140.202','OL046FC','Beruniy'),
    ('192.168.141.202','OL077SS','Qushbegi'),
    ('192.168.142.202','OL050SS','Farhod bozori'),
    ('192.168.143.201','OL067SS','Erkin'),
    ('192.168.144.201','OL041SS','Vodnik'),
    ('192.168.144.202','OL041SS','Vodnik'),
    ('192.168.145.202','OL014FC','Compass Mall'),
    ('192.168.146.201','OL048SS','Yangihayot 5-bekat'),
    ('192.168.146.202','OL048SS','Yangihayot 5-bekat'),
    ('192.168.147.201','OL017RE','Sergeli 2'),
    ('192.168.147.202','OL017RE','Sergeli 2'),
    ('192.168.148.202','OL012RE','Sergeli 8'),
    ('192.168.150.201','OL060SS','Koksaroy'),
    ('192.168.151.201','OL028SS','Lunacharkiy markazi'),
    ('192.168.151.202','OL028SS','Lunacharkiy markazi'),
    ('192.168.153.202','OL023SS','Qorasuv 6'),
    ('192.168.154.201','OL047SS','Oxunboboyev'),
    ('192.168.154.202','OL047SS','Oxunboboyev'),
    ('192.168.155.202','OL029FC','Magic City'),
    ('192.168.156.201','OL038SS','Lisunova'),
    ('192.168.170.201','OL053SS','Nurafshon'),
    ('192.168.170.202','OL053SS','Nurafshon'),
    ('192.168.175.201','OL045FC','Navruz mall'),
    ('192.168.176.202','OL069SS','Fargona 2'),
    ('192.168.178.201','OL055SS','Chirchiq'),
    ('192.168.179.201','OL049SS','Nukus 1'),
    ('192.168.179.202','OL049SS','Nukus 1'),
    ('192.168.179.203','OL049SS','Nukus 1'),
    ('192.168.179.204','OL049SS','Nukus 1'),
    ('192.168.180.201','OL056FC','Nukus 2'),
    ('192.168.181.201','OL057SS','Lisunova 2 Drive'),
    ('192.168.181.202','OL057SS','Lisunova 2 Drive'),
    ('192.168.182.201','OL058SS','Yangibozor'),
    ('192.168.185.202','OL062FC','Samarqand Family Park'),
    ('192.168.186.201','OL063SS','Samarqand Bulvar'),
    ('192.168.186.202','OL063SS','Samarqand Bulvar'),
    ('192.168.187.202','OL065SS','Aviasozlar bozori'),
    ('192.168.189.202','OL066SS','Namangan 3'),
    ('192.168.190.201','OL073SS','Minor metro'),
    ('192.168.193.201','OL074SS','Piskent'),
    ('192.168.193.202','OL074SS','Piskent'),
    ('192.168.196.201','OL079SS','Dombirobod'),
    ('192.168.198.202','OL081SS','Qoyliq 2'),
    ('192.168.207.204','OL089SS','Buyuk Ipak Yoli'),
]


def check_tcp(ip, port=445, timeout=0.5):
    try:
        with socket.create_connection((ip, port), timeout=timeout):
            return True
    except:
        return False

def wmi_check_processes(ip):
    ps_cmd = f"""
    $pass = ConvertTo-SecureString '{PASSWORD}' -AsPlainText -Force
    $cred = New-Object System.Management.Automation.PSCredential('{USERNAME}', $pass)
    try {{
        $all = Get-WmiObject -Class Win32_Process -ComputerName '{ip}' -Credential $cred -ErrorAction Stop
        $gs_path = ($all | Where-Object {{ $_.Name -eq 'GuestScreen.exe' }}).ExecutablePath
        $wt_path = ($all | Where-Object {{ $_.Name -eq 'Watcher.exe' }}).ExecutablePath
        $gs_run = [bool]($gs_path -ne $null -and $gs_path -ne '')
        $wt_run = [bool]($wt_path -ne $null -and $wt_path -ne '')
        @{{ gs_run=$gs_run; wt_run=$wt_run; gs_path=$gs_path; wt_path=$wt_path }} | ConvertTo-Json -Compress
    }} catch {{
        @{{ error = $_.Exception.Message }} | ConvertTo-Json -Compress
    }}
    """
    try:
        p = subprocess.run(['powershell.exe', '-NoProfile', '-Command', ps_cmd],
                           capture_output=True, text=True, timeout=20)
        m = re.search(r'\{.*\}', p.stdout.strip())
        if m:
            return json.loads(m.group(0))
    except:
        pass
    return None

def mount_share(ip, drive='C'):
    share = f'\\\\{ip}\\{drive}$'
    subprocess.run(['net', 'use', share, '/user:' + USERNAME, PASSWORD],
                   capture_output=True, timeout=10)
    return share

def find_gs_path_via_share(ip):
    candidates = [
        ('C', r'UCS\GuestScreen\GuestScreen.exe'),
        ('C', r'GuestScreen\GuestScreen.exe'),
        ('C', r'Program Files\GuestScreen\GuestScreen.exe'),
        ('C', r'Program Files (x86)\GuestScreen\GuestScreen.exe'),
        ('D', r'UCS\GuestScreen\GuestScreen.exe'),
        ('D', r'GuestScreen\GuestScreen.exe'),
    ]
    mounted = set()
    for drive, cand in candidates:
        if drive not in mounted:
            mount_share(ip, drive)
            mounted.add(drive)
        sep = chr(92)
        unc = sep*2 + ip + sep + drive + chr(36) + sep + cand
        try:
            if os.path.exists(unc):
                return f'{drive}:\\{cand}'
        except:
            pass
    return None

def find_watcher_path_via_share(ip, gs_path):
    if gs_path:
        gs_dir = gs_path[:gs_path.rfind('\\')]
        drive = gs_path[0]
        sep = chr(92)
        wt_unc = sep*2 + ip + sep + drive + chr(36) + sep + gs_dir[3:] + sep + 'Watcher.exe'
        try:
            if os.path.exists(wt_unc):
                return gs_dir + '\\Watcher.exe'
        except:
            pass
    return None

def wmi_launch(ip, exe_path):
    exe_dir = os.path.dirname(exe_path)
    ps_cmd = f"""
    $pass = ConvertTo-SecureString '{PASSWORD}' -AsPlainText -Force
    $cred = New-Object System.Management.Automation.PSCredential('{USERNAME}', $pass)
    try {{
        $r = Invoke-WmiMethod -Class Win32_Process -Name Create -ComputerName '{ip}' -Credential $cred -ArgumentList '{exe_path}' -ErrorAction Stop
        @{{ rc = $r.ReturnValue; pid2 = $r.ProcessId }} | ConvertTo-Json -Compress
    }} catch {{
        @{{ error = $_.Exception.Message }} | ConvertTo-Json -Compress
    }}
    """
    try:
        p = subprocess.run(['powershell.exe', '-NoProfile', '-Command', ps_cmd],
                           capture_output=True, text=True, timeout=25)
        stdout = p.stdout.strip()
        m = re.search(r'\{.*\}', stdout)
        if m:
            return json.loads(m.group(0))
        # Return raw output for debugging
        return {'error': 'no_json: ' + stdout[:80] + ' ERR:' + p.stderr[:80]}
    except Exception as e:
        return {'error': str(e)}
    return None

def process_cashier(ip, prefix, name):
    result = {
        'ip': ip, 'prefix': prefix, 'name': name,
        'online': False, 'gs_path': None, 'wt_path': None,
        'gs_was_running': False, 'wt_was_running': False,
        'gs_launched': False, 'wt_launched': False,
        'gs_confirmed': False, 'wt_confirmed': False,
        'status': 'ОШИБКА', 'detail': ''
    }
    if not (check_tcp(ip, 445) or check_tcp(ip, 135)):
        result['status'] = 'ОФЛАЙН'
        result['detail'] = 'Нет TCP-связи (445/135)'
        return result
    result['online'] = True

    # Get current process state + paths
    info = wmi_check_processes(ip)
    if info is None:
        result['status'] = 'WMI_ОШИБКА'
        result['detail'] = 'Нет ответа WMI'
        return result
    if 'error' in info:
        result['status'] = 'WMI_ОШИБКА'
        result['detail'] = str(info['error'])[:80]
        return result

    result['gs_was_running'] = info.get('gs_run', False)
    result['wt_was_running'] = info.get('wt_run', False)
    result['gs_path'] = info.get('gs_path') or None
    result['wt_path'] = info.get('wt_path') or None

    if result['gs_was_running']:
        result['gs_confirmed'] = True
    if result['wt_was_running']:
        result['wt_confirmed'] = True

    if result['gs_confirmed'] and result['wt_confirmed']:
        result['status'] = 'УЖЕ_РАБОТАЛ'
        return result

    # Find GS path via network share if not running
    if not result['gs_path']:
        result['gs_path'] = find_gs_path_via_share(ip)

    if not result['gs_path']:
        result['status'] = 'НЕ_НАЙДЕН'
        result['detail'] = 'GuestScreen.exe не найден ни в C$/D$ share, ни в процессах'
        return result

    if not result['wt_path']:
        result['wt_path'] = find_watcher_path_via_share(ip, result['gs_path'])

    # Launch GuestScreen if not running
    if not result['gs_was_running']:
        gs_res = wmi_launch(ip, result['gs_path'])
        if gs_res and gs_res.get('rc') == 0:
            result['gs_launched'] = True
        else:
            rc_val = (gs_res or {}).get('rc', '?')
            result['detail'] += ' GS_RC=' + str(rc_val)

    # Launch Watcher if not running
    if result['wt_path'] and not result['wt_was_running']:
        time.sleep(3)  # give GS time to init
        wt_res = wmi_launch(ip, result['wt_path'])
        if wt_res and wt_res.get('rc') == 0:
            result['wt_launched'] = True
        else:
            rc_val = (wt_res or {}).get('rc', '?')
            result['detail'] += ' WT_RC=' + str(rc_val)

    # Wait and confirm
    time.sleep(8)
    confirm = wmi_check_processes(ip)
    if confirm and 'error' not in confirm:
        result['gs_confirmed'] = confirm.get('gs_run', False)
        result['wt_confirmed'] = confirm.get('wt_run', False)

    if result['gs_confirmed'] and result['wt_confirmed']:
        result['status'] = 'УСПЕХ_ПОЛНЫЙ'
    elif result['gs_confirmed']:
        result['status'] = 'УСПЕХ_БЕЗ_WATCHER'
        result['detail'] += ' Watcher не запустился'
    elif result['gs_launched']:
        result['status'] = 'ЗАПУЩЕН_НЕ_ПОДТВЕРЖДЕН'
    else:
        result['status'] = 'НЕУДАЧА'

    return result

def main():
    now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    total = len(STOPPED_CASHIERS)
    print('=' * 65)
    print(f'  ЗАПУСК GuestScreen + Watcher ({total} касс)')
    print(f'  Начало: {now}')
    print('=' * 65)

    results = []
    done = 0

    with ThreadPoolExecutor(max_workers=8) as ex:
        futures = {ex.submit(process_cashier, ip, prefix, name): (ip, prefix, name)
                   for (ip, prefix, name) in STOPPED_CASHIERS}
        for fut in as_completed(futures):
            r = fut.result()
            results.append(r)
            done += 1
            gs_ok = 'OK' if r['gs_confirmed'] else 'NO'
            wt_ok = 'OK' if r['wt_confirmed'] else 'NO'
            print(f'[{done:3}/{total}] {r["ip"]:<18} {r["name"]:<22} GS:{gs_ok} WT:{wt_ok} [{r["status"]}] {r["detail"]}')

    results.sort(key=lambda x: x['ip'])

    finish = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    success_full  = [r for r in results if r['status'] == 'УСПЕХ_ПОЛНЫЙ']
    success_no_wt = [r for r in results if r['status'] == 'УСПЕХ_БЕЗ_WATCHER']
    already_run   = [r for r in results if r['status'] == 'УЖЕ_РАБОТАЛ']
    not_found     = [r for r in results if r['status'] in ('НЕ_НАЙДЕН','WMI_ОШИБКА','ЗАПУЩЕН_НЕ_ПОДТВЕРЖДЕН','НЕУДАЧА')]
    offline       = [r for r in results if r['status'] == 'ОФЛАЙН']

    W = 80
    lines = []
    lines.append('=' * W)
    lines.append('  ОТЧЕТ ЗАПУСКА GuestScreen + Watcher НА КАССАХ (.201-.205)')
    lines.append('=' * W)
    lines.append(f'Дата запуска: {finish}')
    lines.append(f'Всего касс для запуска: {total}')
    lines.append(f'[УСПЕХ ПОЛНЫЙ]  GS + WT запущены:   {len(success_full)}')
    lines.append(f'[ЧАСТИЧНО]      GS без Watcher:     {len(success_no_wt)}')
    lines.append(f'[УЖЕ РАБОТАЛ]   Уже работал до:     {len(already_run)}')
    lines.append(f'[НЕУДАЧА]       Не запустился:      {len(not_found)}')
    lines.append(f'[ОФЛАЙН]        Не в сети:          {len(offline)}')
    lines.append('=' * W)

    def section(title, rows, show_detail=False):
        lines.append('')
        lines.append('-' * W)
        lines.append(f'  {title} ({len(rows)})')
        lines.append('-' * W)
        if not rows:
            lines.append('  (нет)')
            return
        hdr = '{:<4} {:<18} {:<10} {:<25} {:<4} {:<4}'.format('N', 'IP-АДРЕС', 'ПРЕФИКС', 'ФИЛИАЛ', 'GS', 'WT')
        if show_detail:
            hdr += ' ДЕТАЛИ'
        lines.append(hdr)
        lines.append('-' * W)
        for i, r in enumerate(rows, 1):
            gs = 'ДА' if r['gs_confirmed'] else 'НЕТ'
            wt = 'ДА' if r['wt_confirmed'] else 'НЕТ'
            row = '{:<4} {:<18} {:<10} {:<25} {:<4} {:<4}'.format(i, r['ip'], r['prefix'], r['name'], gs, wt)
            if show_detail:
                row += f' [{r["status"]}] {r["detail"]}'
            lines.append(row)

    section('УСПЕШНО ЗАПУЩЕНЫ (GS + Watcher)', success_full)
    section('ЧАСТИЧНО (GS запущен, Watcher НЕТ)', success_no_wt, True)
    section('УЖЕ РАБОТАЛИ ДО ЗАПУСКА', already_run)
    section('НЕУДАЧА / НЕ НАЙДЕН / ОШИБКА', not_found, True)
    section('ОФЛАЙН (касса недоступна)', offline, True)

    txt = '\n'.join(lines)
    out = r'C:\Users\Administrator\Desktop\GuestScreen_Launch_Report.txt'
    with open(out, 'w', encoding='utf-8') as f:
        f.write(txt)

    print('')
    print('=' * 65)
    print(f'  ИТОГ:')
    print(f'    Успех полный  (GS+WT): {len(success_full)}')
    print(f'    Частично      (GS):    {len(success_no_wt)}')
    print(f'    Уже работал:           {len(already_run)}')
    print(f'    Неудача:               {len(not_found)}')
    print(f'    Офлайн:                {len(offline)}')
    print('=' * 65)
    print(f'  Отчет: {out}')

if __name__ == '__main__':
    main()
