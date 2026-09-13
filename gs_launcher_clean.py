# -*- coding: utf-8 -*-
import os, re, sys, json, time, socket, datetime, subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

USERNAME = 'Administrator'
PASSWORD = '123'

# 65 cashiers where GuestScreen is NOT running (from last audit)
STOPPED_CASHIERS = [
    ('192.168.114.201', 'OL061FC', 'Golden Life Mall'),
    ('192.168.114.202', 'OL061FC', 'Golden Life Mall'),
    ('192.168.115.201', 'OL008SS', 'Xadra'),
    ('192.168.115.202', 'OL008SS', 'Xadra'),
    ('192.168.117.203', 'OL011RE', 'ToshMI'),
    ('192.168.118.201', 'OL001RE', 'Oqtepa Maydoni'),
    ('192.168.120.201', 'OL005SS', 'Vatan'),
    ('192.168.121.201', 'OL003SS', 'Qutbiniso'),
    ('192.168.121.202', 'OL003SS', 'Qutbiniso'),
    ('192.168.122.202', 'OL004SS', 'Gulzor'),
    ('192.168.127.202', 'OL037SS', 'Chilonzor-19'),
    ('192.168.129.201', 'OL025SS', 'Algoritm'),
    ('192.168.131.201', 'OL024SS', Xalqlar do'stligi),
    ('192.168.134.201', 'OL010RE', 'Universam'),
    ('192.168.135.201', 'OL020SS', 'Bodomzor'),
    ('192.168.136.201', 'OL035SS', 'Majnuntol'),
    ('192.168.136.202', 'OL035SS', 'Majnuntol'),
    ('192.168.137.202', 'OL027SS', 'Rakat'),
    ('192.168.138.201', 'OL042SS', 'Labzak'),
    ('192.168.139.201', 'OL044FC', 'Riviera'),
    ('192.168.140.201', 'OL046FC', 'Beruniy'),
    ('192.168.140.202', 'OL046FC', 'Beruniy'),
    ('192.168.141.202', 'OL077SS', 'Qushbegi'),
    ('192.168.142.202', 'OL050SS', 'Farhod bozori'),
    ('192.168.143.201', 'OL067SS', 'Erkin'),
    ('192.168.144.201', 'OL041SS', 'Vodnik'),
    ('192.168.144.202', 'OL041SS', 'Vodnik'),
    ('192.168.145.202', 'OL014FC', 'Compass Mall'),
    ('192.168.146.201', 'OL048SS', 'Yangihayot 5-bekat'),
    ('192.168.146.202', 'OL048SS', 'Yangihayot 5-bekat'),
    ('192.168.147.201', 'OL017RE', 'Sergeli 2'),
    ('192.168.147.202', 'OL017RE', 'Sergeli 2'),
    ('192.168.148.202', 'OL012RE', 'Sergeli 8'),
    ('192.168.150.201', 'OL060SS', Ko'ksaroy),
    ('192.168.151.201', 'OL028SS', 'Lunacharkiy markazi'),
    ('192.168.151.202', 'OL028SS', 'Lunacharkiy markazi'),
    ('192.168.153.202', 'OL023SS', 'Qorasuv 6'),
    ('192.168.154.201', 'OL047SS', 'Oxunboboyev'),
    ('192.168.154.202', 'OL047SS', 'Oxunboboyev'),
    ('192.168.155.202', 'OL029FC', 'Magic City'),
    ('192.168.156.201', 'OL038SS', 'Lisunova'),
    ('192.168.170.201', 'OL053SS', 'Nurafshon'),
    ('192.168.170.202', 'OL053SS', 'Nurafshon'),
    ('192.168.175.201', 'OL045FC', 'Navruz mall'),
    ('192.168.176.202', 'OL069SS', Farg'ona 2),
    ('192.168.178.201', 'OL055SS', 'Chirchiq'),
    ('192.168.179.201', 'OL049SS', 'Nukus 1'),
    ('192.168.179.202', 'OL049SS', 'Nukus 1'),
    ('192.168.179.203', 'OL049SS', 'Nukus 1'),
    ('192.168.179.204', 'OL049SS', 'Nukus 1'),
    ('192.168.180.201', 'OL056FC', 'Nukus 2'),
    ('192.168.181.201', 'OL057SS', 'Lisunova 2 Drive'),
    ('192.168.181.202', 'OL057SS', 'Lisunova 2 Drive'),
    ('192.168.182.201', 'OL058SS', 'Yangibozor'),
    ('192.168.185.202', 'OL062FC', 'Samarqand Family Park'),
    ('192.168.186.201', 'OL063SS', 'Samarqand Bulvar'),
    ('192.168.186.202', 'OL063SS', 'Samarqand Bulvar'),
    ('192.168.187.202', 'OL065SS', 'Aviasozlar bozori'),
    ('192.168.189.202', 'OL066SS', 'Namangan 3'),
    ('192.168.190.201', 'OL073SS', 'Minor metro'),
    ('192.168.193.201', 'OL074SS', 'Piskent'),
    ('192.168.193.202', 'OL074SS', 'Piskent'),
    ('192.168.196.201', 'OL079SS', Do'mbirobod),
    ('192.168.198.202', 'OL081SS', Qo'yliq 2),
    ('192.168.207.204', 'OL089SS', Buyuk Ipak Yo'li),
]

GS_DEFAULT_PATHS = [
    r'C:\GuestScreen\GuestScreen.exe',
    r'C:\Program Files\GuestScreen\GuestScreen.exe',
    r'C:\Program Files (x86)\GuestScreen\GuestScreen.exe',
    r'D:\GuestScreen\GuestScreen.exe',
]
WATCHER_DEFAULT_PATHS = [
    r'C:\GuestScreen\Watcher.exe',
    r'C:\Program Files\GuestScreen\Watcher.exe',
    r'C:\Program Files (x86)\GuestScreen\Watcher.exe',
    r'D:\GuestScreen\Watcher.exe',
]

def check_tcp(ip, port=445, timeout=0.5):
    try:
        with socket.create_connection((ip, port), timeout=timeout):
            return True
    except:
        return False

def find_and_launch(ip, prefix, name):
    result = {
        'ip': ip, 'prefix': prefix, 'name': name,
        'online': False,
        'gs_path': None, 'watcher_path': None,
        'gs_was_running': False, 'watcher_was_running': False,
        'gs_launched': False, 'watcher_launched': False,
        'gs_confirmed': False, 'watcher_confirmed': False,
        'status': '??????', 'detail': ''
    }

    if not (check_tcp(ip, 445) or check_tcp(ip, 135)):
        result['status'] = '??????'
        result['detail'] = '????? ?????????? ? ????'
        return result

    result['online'] = True

    # Step 1: Find GuestScreen.exe path by searching common locations via WMI
    find_cmd = f"
     = ConvertTo-SecureString '{PASSWORD}' -AsPlainText -Force
     = New-Object System.Management.Automation.PSCredential('{USERNAME}', )
    try {{
         = Get-WmiObject -Class Win32_Process -ComputerName '{ip}' -Credential  -ErrorAction Stop
         = ( | Where-Object {{ .Name -eq 'GuestScreen.exe' }}).ExecutablePath
         = ( | Where-Object {{ .Name -eq 'Watcher.exe' }}).ExecutablePath
         = [bool]( -ne  -and  -ne '')
         = [bool]( -ne  -and  -ne '')
        # Find GS file if not running - check common paths
         = 
         = 
        foreach ( in @('C:\\GuestScreen\\GuestScreen.exe','C:\\Program Files\\GuestScreen\\GuestScreen.exe','C:\\Program Files (x86)\\GuestScreen\\GuestScreen.exe','D:\\GuestScreen\\GuestScreen.exe')) {{
             = Invoke-Command -ComputerName '{ip}' -Credential  -ScriptBlock {{ param() Test-Path  }} -ArgumentList  -ErrorAction SilentlyContinue
            if () {{  = ; break }}
        }}
        foreach ( in @('C:\\GuestScreen\\Watcher.exe','C:\\Program Files\\GuestScreen\\Watcher.exe','C:\\Program Files (x86)\\GuestScreen\\Watcher.exe','D:\\GuestScreen\\Watcher.exe')) {{
             = Invoke-Command -ComputerName '{ip}' -Credential  -ScriptBlock {{ param() Test-Path  }} -ArgumentList  -ErrorAction SilentlyContinue
            if () {{  = ; break }}
        }}
        @{{ gs_run=; wt_run=; gs_path=if(){{}}else{{}}; wt_path=if(){{}}else{{}} }} | ConvertTo-Json -Compress
    }} catch {{
        @{{ error = .Exception.Message }} | ConvertTo-Json -Compress
    }}
    "

    try:
        p = subprocess.run(['powershell.exe', '-NoProfile', '-Command', find_cmd],
                           capture_output=True, text=True, timeout=30)
        m = re.search(r'\{.*\}', p.stdout.strip())
        if m:
            data = json.loads(m.group(0))
            if 'error' in data:
                result['status'] = 'WMI_??????'
                result['detail'] = str(data.get('error', ''))[:100]
                return result
            result['gs_was_running'] = data.get('gs_run', False)
            result['watcher_was_running'] = data.get('wt_run', False)
            result['gs_path'] = data.get('gs_path')
            result['watcher_path'] = data.get('wt_path')
        else:
            result['status'] = 'WMI_???_??????'
            result['detail'] = p.stdout[:100]
            return result
    except Exception as e:
        result['status'] = '???????'
        result['detail'] = str(e)[:80]
        return result

    if result['gs_was_running']:
        result['gs_launched'] = True
        result['gs_confirmed'] = True

    gs_path = result['gs_path']
    wt_path = result['watcher_path']

    if not gs_path:
        result['status'] = '??_??????'
        result['detail'] = 'GuestScreen.exe ?? ?????? ?? ? ????? ??????????? ????'
        return result

    gs_dir = '\\'.join(gs_path.replace('/', '\\').split('\\')[:-1])

    # Step 2: Launch GuestScreen.exe remotely via WMI Create
    if not result['gs_was_running']:
        launch_gs = f"
         = ConvertTo-SecureString '{PASSWORD}' -AsPlainText -Force
         = New-Object System.Management.Automation.PSCredential('{USERNAME}', )
        try {{
             = [wmiclass]\\\\{ip}\\root\\cimv2:Win32_Process
            .PSBase.Scope.Options.Username = '{USERNAME}'
            .PSBase.Scope.Options.Password = '{PASSWORD}'
             = .Create('{gs_path}', '{gs_dir}', )
            @{{ rc = .ReturnValue; pid = .ProcessId }} | ConvertTo-Json -Compress
        }} catch {{
            @{{ error = .Exception.Message }} | ConvertTo-Json -Compress
        }}
        "
        try:
            p = subprocess.run(['powershell.exe', '-NoProfile', '-Command', launch_gs],
                               capture_output=True, text=True, timeout=30)
            m = re.search(r'\{.*\}', p.stdout.strip())
            if m:
                data = json.loads(m.group(0))
                rc = data.get('rc', -1)
                if rc == 0:
                    result['gs_launched'] = True
                else:
                    result['detail'] += f' GS_RC={rc}'
            else:
                result['detail'] += ' GS_???_??????'
        except Exception as e:
            result['detail'] += f' GS_err:{str(e)[:50]}'

    # Step 3: Launch Watcher.exe
    if wt_path and not result['watcher_was_running']:
        wt_dir = '\\'.join(wt_path.replace('/', '\\').split('\\')[:-1])
        launch_wt = f"
         = ConvertTo-SecureString '{PASSWORD}' -AsPlainText -Force
         = New-Object System.Management.Automation.PSCredential('{USERNAME}', )
        try {{
             = [wmiclass]\\\\{ip}\\root\\cimv2:Win32_Process
            .PSBase.Scope.Options.Username = '{USERNAME}'
            .PSBase.Scope.Options.Password = '{PASSWORD}'
             = .Create('{wt_path}', '{wt_dir}', )
            @{{ rc = .ReturnValue; pid = .ProcessId }} | ConvertTo-Json -Compress
        }} catch {{
            @{{ error = .Exception.Message }} | ConvertTo-Json -Compress
        }}
        "
        try:
            p = subprocess.run(['powershell.exe', '-NoProfile', '-Command', launch_wt],
                               capture_output=True, text=True, timeout=30)
            m = re.search(r'\{.*\}', p.stdout.strip())
            if m:
                data = json.loads(m.group(0))
                rc = data.get('rc', -1)
                if rc == 0:
                    result['watcher_launched'] = True
                else:
                    result['detail'] += f' WT_RC={rc}'
        except Exception as e:
            result['detail'] += f' WT_err:{str(e)[:50]}'

    # Step 4: Confirm after 8 seconds
    time.sleep(8)
    confirm_cmd = f"
     = ConvertTo-SecureString '{PASSWORD}' -AsPlainText -Force
     = New-Object System.Management.Automation.PSCredential('{USERNAME}', )
    try {{
         = (Get-WmiObject -Class Win32_Process -ComputerName '{ip}' -Credential  -ErrorAction Stop).Name
        @{{ gs = [bool]( -contains 'GuestScreen.exe'); wt = [bool]( -contains 'Watcher.exe') }} | ConvertTo-Json -Compress
    }} catch {{
        @{{ error = .Exception.Message }} | ConvertTo-Json -Compress
    }}
    "
    try:
        p = subprocess.run(['powershell.exe', '-NoProfile', '-Command', confirm_cmd],
                           capture_output=True, text=True, timeout=20)
        m = re.search(r'\{.*\}', p.stdout.strip())
        if m:
            data = json.loads(m.group(0))
            result['gs_confirmed'] = data.get('gs', False)
            result['watcher_confirmed'] = data.get('wt', False)
    except:
        pass

    if result['gs_confirmed'] and result['watcher_confirmed']:
        result['status'] = '?????_??????'
    elif result['gs_confirmed'] and not result['watcher_confirmed']:
        result['status'] = '?????_???_WATCHER'
    elif not result['gs_confirmed'] and result['gs_launched']:
        result['status'] = '???????_??_???????????'
    else:
        result['status'] = '???????'

    return result

def main():
    now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    total = len(STOPPED_CASHIERS)
    print(f'=================================================================')
    print(f'   ?????? GuestScreen ?? ????????????? ?????? ({total} ????)')
    print(f'   ??????: {now}')
    print(f'=================================================================')

    results = []
    done = 0

    with ThreadPoolExecutor(max_workers=10) as ex:
        futures = {ex.submit(find_and_launch, ip, prefix, name): (ip, prefix, name)
                   for (ip, prefix, name) in STOPPED_CASHIERS}
        for fut in as_completed(futures):
            r = fut.result()
            results.append(r)
            done += 1
            gs_ok = '??' if r['gs_confirmed'] else '??'
            wt_ok = '??' if r['watcher_confirmed'] else ('?' if not r.get('watcher_path') else '??')
            print(f'[{done:3d}/{total}] {r[ip]:<18} {r[name]:<25} GS:{gs_ok} WT:{wt_ok} [{r[status]}] {r[detail]}')

    # Sort by IP
    results.sort(key=lambda x: x['ip'])

    # Write report
    finish = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    success_full = [r for r in results if r['status'] == '?????_??????']
    success_no_wt = [r for r in results if r['status'] == '?????_???_WATCHER']
    failed = [r for r in results if r['status'] not in ('?????_??????', '?????_???_WATCHER')]

    lines = []
    lines.append('=' * 80)
    lines.append('   ????? ??????? GuestScreen ?? ?????? (????? .201-.205)')
    lines.append('=' * 80)
    lines.append(f'???? ??????: 2026-08-30 18:44:23')
    lines.append(f'???? ???????: {finish}')
    lines.append(f'????? ???? ??? ???????: {total}')
    lines.append(f'[?????] GuestScreen + Watcher ????????: {len(success_full)}')
    lines.append(f'[????????] GuestScreen ??? Watcher: {len(success_no_wt)}')
    lines.append(f'[???????] ?? ??????? ?????????: {len(failed)}')
    lines.append('=' * 80)

    lines.append('')
    lines.append('-' * 80)
    lines.append(f' 1. ??????? ???????? (GuestScreen + Watcher) ? {len(success_full)} ????')
    lines.append('-' * 80)
    lines.append(f'{?:<5} {IP-?????:<18} {???????:<10} {??????:<30} {GS:<5} {WT:<5} {??????}')
    lines.append('-' * 80)
    for i, r in enumerate(success_full, 1):
        gs = ?? if r[gs_confirmed] else ???
        wt = ?? if r[watcher_confirmed] else ???
        lines.append(f'{i:<5} {r[ip]:<18} {r[prefix]:<10} {r[name]:<30} {gs:<5} {wt:<5} {r[status]}')

    if success_no_wt:
        lines.append('')
        lines.append('-' * 80)
        lines.append(f' 2. ???????? (GuestScreen ??? Watcher) ? {len(success_no_wt)} ????')
        lines.append('-' * 80)
        lines.append(f'{?:<5} {IP-?????:<18} {???????:<10} {??????:<30} {GS:<5} {WT:<5} {??????}')
        lines.append('-' * 80)
        for i, r in enumerate(success_no_wt, 1):
            gs = ?? if r[gs_confirmed] else ???
            wt = ?? if r[watcher_confirmed] else ???
            lines.append(f'{i:<5} {r[ip]:<18} {r[prefix]:<10} {r[name]:<30} {gs:<5} {wt:<5} {r[detail]}')

    lines.append('')
    lines.append('-' * 80)
    lines.append(f' 3. ?? ??????? ????????? ? {len(failed)} ????')
    lines.append('-' * 80)
    lines.append(f'{?:<5} {IP-?????:<18} {???????:<10} {??????:<30} {???????}')
    lines.append('-' * 80)
    for i, r in enumerate(failed, 1):
        lines.append(f'{i:<5} {r[ip]:<18} {r[prefix]:<10} {r[name]:<30} [{r[status]}] {r[detail]}')

    report_txt = '\n'.join(lines)

    desktop_txt = r'C:\Users\Administrator\Desktop\GuestScreen_Launch_Report.txt'
    with open(desktop_txt, 'w', encoding='utf-8') as f:
        f.write(report_txt)

    print('')
    print('=================================================================')
    print(f' ???? ???????:')
    print(f'   ????? ????: {total}')
    print(f'   ?? ??????? (GS+WT): {len(success_full)}')
    print(f'   ?? ???????? (GS ??? WT): {len(success_no_wt)}')
    print(f'   ?? ???????: {len(failed)}')
    print(f'=================================================================')
    print(f'????? ????????: {desktop_txt}')

if __name__ == '__main__':
    main()
