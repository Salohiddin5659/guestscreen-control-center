
def check_tcp(ip, port=445, timeout=0.5):
    try:
        with socket.create_connection((ip, port), timeout=timeout):
            return True
    except:
        return False

def wmi_check_processes(ip):
    ps_cmd = f"
     = ConvertTo-SecureString '{PASSWORD}' -AsPlainText -Force
     = New-Object System.Management.Automation.PSCredential('{USERNAME}', )
    try {{
         = Get-WmiObject -Class Win32_Process -ComputerName '{ip}' -Credential  -ErrorAction Stop
         = ( | Where-Object {{ .Name -eq 'GuestScreen.exe' }}).ExecutablePath
         = ( | Where-Object {{ .Name -eq 'Watcher.exe' }}).ExecutablePath
         = [bool]( -ne  -and  -ne '')
         = [bool]( -ne  -and  -ne '')
        @{{ gs_run=; wt_run=; gs_path=; wt_path= }} | ConvertTo-Json -Compress
    }} catch {{
        @{{ error = .Exception.Message }} | ConvertTo-Json -Compress
    }}
    "
    try:
        p = subprocess.run(['powershell.exe', '-NoProfile', '-Command', ps_cmd],
                           capture_output=True, text=True, timeout=20)
        m = re.search(r'\{.*\}', p.stdout.strip())
        if m:
            return json.loads(m.group(0))
    except:
        pass
    return None

def find_gs_path_via_share(ip):
    # Try to find GuestScreen.exe through network share C$
    candidates = [
        r'GuestScreen\GuestScreen.exe',
        r'Program Files\GuestScreen\GuestScreen.exe',
        r'Program Files (x86)\GuestScreen\GuestScreen.exe',
    ]
    for drive in ['C', 'D']:
        for cand in candidates:
            unc = f'\\\\{ip}\\{drive}$\\{cand}'
            try:
                if os.path.exists(unc):
                    return f'{drive}:\\{cand}'
            except:
                pass
    return None

def find_watcher_path_via_share(ip, gs_path):
    if gs_path:
        gs_dir = os.path.dirname(gs_path)
        wt_unc = gs_path.replace(gs_path[0] + ':\\', f'\\\\{ip}\\{gs_path[0]}$\\').replace('GuestScreen.exe', 'Watcher.exe')
        try:
            if os.path.exists(wt_unc):
                return gs_dir + '\\Watcher.exe'
        except:
            pass
    return None

def wmi_launch(ip, exe_path):
    exe_dir = os.path.dirname(exe_path)
    ps_cmd = f"
     = ConvertTo-SecureString '{PASSWORD}' -AsPlainText -Force
     = New-Object System.Management.Automation.PSCredential('{USERNAME}', )
    try {{
         = [wmiclass]\\\\{ip}\\root\\cimv2:Win32_Process
        .PSBase.Scope.Options.Username = '{USERNAME}'
        .PSBase.Scope.Options.Password = '{PASSWORD}'
         = .Create('{exe_path}', '{exe_dir}', )
        @{{ rc = .ReturnValue; pid2 = .ProcessId }} | ConvertTo-Json -Compress
    }} catch {{
        @{{ error = .Exception.Message }} | ConvertTo-Json -Compress
    }}
    "
    try:
        p = subprocess.run(['powershell.exe', '-NoProfile', '-Command', ps_cmd],
                           capture_output=True, text=True, timeout=20)
        m = re.search(r'\{.*\}', p.stdout.strip())
        if m:
            return json.loads(m.group(0))
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
            err = (gs_res or {}).get('error', str(gs_res))
            result['detail'] += f' GS_RC={(gs_res or {}).get(rc,?)}'

    # Launch Watcher if not running
    if result['wt_path'] and not result['wt_was_running']:
        time.sleep(3)  # give GS time to init
        wt_res = wmi_launch(ip, result['wt_path'])
        if wt_res and wt_res.get('rc') == 0:
            result['wt_launched'] = True
        else:
            result['detail'] += f' WT_RC={(wt_res or {}).get(rc,?)}'

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
            print(f'[{done:3}/{total}] {r[ip]:<18} {r[name]:<22} GS:{gs_ok} WT:{wt_ok} [{r[status]}] {r[detail]}')

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
        hdr = f'{N:<4} {IP-АДРЕС:<18} {ПРЕФИКС:<10} {ФИЛИАЛ:<25} {GS:<4} {WT:<4}'
        if show_detail:
            hdr += ' ДЕТАЛИ'
        lines.append(hdr)
        lines.append('-' * W)
        for i, r in enumerate(rows, 1):
            gs = 'ДА' if r['gs_confirmed'] else 'НЕТ'
            wt = 'ДА' if r['wt_confirmed'] else 'НЕТ'
            row = f'{i:<4} {r[ip]:<18} {r[prefix]:<10} {r[name]:<25} {gs:<4} {wt:<4}'
            if show_detail:
                row += f' [{r[status]}] {r[detail]}'
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
