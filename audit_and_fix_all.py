r"""
Комплексный аудит и автоматическое исправление всех касс сети R-Keeper / FoodPicasso.

Проверяет для каждой кассы:
1. Корректность Url и AuthEndpointUrl в FARCARDS.INI (при необходимости точечно исправляет).
2. Наличие запущенного процесса Farcards.exe.
3. Ошибки в Farcards.LOG (Access Violation, Timeout 12002, Crash).
4. Перезапуск Farcards.exe строго через ярлык в Автозагрузке (Startup):
   C:\Users\Administrator\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\Farcards.exe.lnk
5. Формирует полный итоговый отчет со всеми статусами.
"""

import os
import re
import sys
import time
import shutil
import socket
import argparse
import datetime
import subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed

# ==================== НАСТРОЙКИ ====================
DEFAULT_USERNAME = "Administrator"
DEFAULT_PASSWORD = "123"

# Эталонные рабочие API эндпоинты
TARGET_URL = "https://api-uz18.posterix.pro/points"
TARGET_AUTH_URL = "https://api-uz18.posterix.pro/points/security/oauth/token"

REMOTE_REL_PATH = r"UCS\R Keeper 7 Cash\FoodPicasso Plugin\FARCARDS.INI"
FARCARDS_EXE_PATH = r"C:\UCS\R Keeper 7 Cash\FoodPicasso Plugin\Farcards.exe"
LOGS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")

DEFAULT_THREADS = 40
SOCKET_TIMEOUT = 0.8
# ===================================================


def generate_ips():
    """Генератор IP-адресов сети: подсети 114–253, хосты 201–205."""
    ips = []
    for subnet in range(114, 254):
        for host in range(201, 206):
            ips.append(f"192.168.{subnet}.{host}")
    return ips


def is_host_accessible(ip: str, timeout: float = SOCKET_TIMEOUT) -> bool:
    """Быстрая проверка доступности порта SMB (445)."""
    try:
        with socket.create_connection((ip, 445), timeout=timeout):
            return True
    except (OSError, socket.timeout):
        return False


def connect_smb(ip: str, username: str, password: str):
    """Подключение к C$ кассы."""
    share = rf"\\{ip}\c$"
    cmd = ["net", "use", share, password, f"/user:{username}"]
    res = subprocess.run(cmd, capture_output=True, text=True, encoding="cp866", errors="replace")
    if res.returncode != 0 and "уже" not in res.stderr.lower() and "already" not in res.stderr.lower():
        if not os.path.exists(share):
            raise Exception(f"Ошибка доступа к {share}: {res.stderr.strip() or res.stdout.strip()}")


def extract_current_urls(raw_bytes: bytes):
    """Извлекает Url и AuthEndpointUrl."""
    try:
        text = raw_bytes.decode("cp1251")
        encoding = "cp1251"
    except UnicodeDecodeError:
        text = raw_bytes.decode("utf-8")
        encoding = "utf-8"

    cur_url, cur_auth = None, None
    for line in text.splitlines():
        s = line.strip()
        if re.match(r"^Url\s*=", s, flags=re.IGNORECASE):
            cur_url = s.split("=", 1)[1].strip()
        elif re.match(r"^AuthEndpointUrl\s*=", s, flags=re.IGNORECASE):
            cur_auth = s.split("=", 1)[1].strip()

    return cur_url, cur_auth, encoding


def replace_urls_strictly(raw_bytes: bytes, target_url: str, target_auth_url: str):
    """Построчная замена только Url и AuthEndpointUrl."""
    try:
        text = raw_bytes.decode("cp1251")
        encoding = "cp1251"
    except UnicodeDecodeError:
        text = raw_bytes.decode("utf-8")
        encoding = "utf-8"

    lines = text.splitlines(keepends=True)
    new_lines = []
    for line in lines:
        s = line.strip()
        if re.match(r"^Url\s*=", s, flags=re.IGNORECASE):
            ending = "\r\n" if line.endswith("\r\n") else "\n"
            new_lines.append(f"Url={target_url}{ending}")
        elif re.match(r"^AuthEndpointUrl\s*=", s, flags=re.IGNORECASE):
            ending = "\r\n" if line.endswith("\r\n") else "\n"
            new_lines.append(f"AuthEndpointUrl={target_auth_url}{ending}")
        else:
            new_lines.append(line)

    return "".join(new_lines).encode(encoding)


def get_remote_farcards_status_and_restart(ip: str, username: str, password: str, restart_if_needed: bool = True):
    """
    Проверяет процесс Farcards.exe через WMI.
    Если процесс не запущен или требуется перезапуск — запускает через Startup ярлык.
    """
    ps_script = f"""
    $pass = ConvertTo-SecureString '{password}' -AsPlainText -Force
    $cred = New-Object System.Management.Automation.PSCredential('{username}', $pass)

    $procs = Get-WmiObject -Class Win32_Process -ComputerName '{ip}' -Credential $cred -Filter "Name = 'Farcards.exe'" -ErrorAction SilentlyContinue
    $pids = @()
    if ($procs) {{
        foreach ($p in $procs) {{ $pids += $p.ProcessId }}
    }}

    $needsRestart = {'$true' if restart_if_needed else '$false'}
    if (-not $procs -or $needsRestart) {{
        if ($procs) {{
            foreach ($p in $procs) {{ $p.Terminate() | Out-Null }}
            Start-Sleep -Seconds 1
        }}
        # Запуск через ярлык в Автозагрузке
        $cmd = 'cmd.exe /c start "" "C:\\Users\\Administrator\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\Farcards.exe.lnk"'
        $res = Invoke-WmiMethod -Class Win32_Process -Name Create -ArgumentList $cmd, 'C:\\UCS\\R Keeper 7 Cash\\FoodPicasso Plugin' -ComputerName '{ip}' -Credential $cred
        if ($res.ReturnValue -eq 0) {{
            Write-Output "RESTARTED_STARTUP"
        }} else {{
            $res2 = Invoke-WmiMethod -Class Win32_Process -Name Create -ArgumentList '"{FARCARDS_EXE_PATH}" -desktop', 'C:\\UCS\\R Keeper 7 Cash\\FoodPicasso Plugin' -ComputerName '{ip}' -Credential $cred
            if ($res2.ReturnValue -eq 0) {{
                Write-Output "RESTARTED_DIRECT"
            }} else {{
                Write-Output "START_FAIL_$($res2.ReturnValue)"
            }}
        }}
    }} else {{
        Write-Output "RUNNING_PIDS_$($pids -join ',')"
    }}
    """
    res = subprocess.run(["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", ps_script],
                         capture_output=True, text=True)
    return res.stdout.strip()


def check_and_heal_host(ip: str, username: str, password: str):
    """Полная диагностика и устранение проблем на одной кассе."""
    ip = ip.strip()
    if not ip or ip.startswith("#"):
        return ip, "SKIPPED", "Пропущено", {}

    if not is_host_accessible(ip):
        return ip, "OFFLINE", "Выключен / Недоступен", {}

    target_ini_path = rf"\\{ip}\c$\{REMOTE_REL_PATH}"
    target_log_path = rf"\\{ip}\c$\UCS\R Keeper 7 Cash\FoodPicasso Plugin\Farcards.LOG"
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")

    info = {
        "ini_status": "OK",
        "old_url": "",
        "action": "",
        "proc_status": "",
        "log_status": "OK",
    }

    try:
        connect_smb(ip, username, password)

        if not os.path.exists(target_ini_path):
            alt_path = rf"\\{ip}\c$\FARCARDS.INI"
            if os.path.exists(alt_path):
                target_ini_path = alt_path
            else:
                return ip, "NO_FARCARDS", "Плагин FarCards не установлен на этой станции", info

        # 1. Читаем INI файл
        with open(target_ini_path, "rb") as f:
            raw_bytes = f.read()

        cur_url, cur_auth, encoding = extract_current_urls(raw_bytes)
        info["old_url"] = cur_url

        needs_ini_fix = (cur_url != TARGET_URL or cur_auth != TARGET_AUTH_URL)

        # 2. Если адрес некорректный — исправляем
        if needs_ini_fix:
            backup_path = target_ini_path + f".bak_{timestamp}"
            shutil.copy2(target_ini_path, backup_path)
            updated_bytes = replace_urls_strictly(raw_bytes, TARGET_URL, TARGET_AUTH_URL)
            with open(target_ini_path, "wb") as f:
                f.write(updated_bytes)
            info["ini_status"] = f"ИСПРАВЛЕН (был: '{cur_url}')"
        else:
            info["ini_status"] = "КОРРЕКТЕН"

        # 3. Проверяем последние логи на ошибки
        has_log_error = False
        if os.path.exists(target_log_path):
            try:
                with open(target_log_path, "rb") as lf:
                    lf.seek(max(0, os.path.getsize(target_log_path) - 4096))
                    tail = lf.read().decode("cp1251", errors="replace")
                if "Access violation" in tail or "12002" in tail:
                    has_log_error = True
                    info["log_status"] = "ОШИБКА В ЛОГЕ"
            except Exception:
                pass

        # 4. Проверка и перезапуск через Startup ярлык
        must_restart = needs_ini_fix or has_log_error
        restart_res = get_remote_farcards_status_and_restart(ip, username, password, restart_if_needed=must_restart)

        if "RESTARTED_STARTUP" in restart_res:
            info["proc_status"] = "ПЕРЕЗАПУЩЕН (через Startup)"
            info["action"] = "Исправлен и перезапущен через Startup" if needs_ini_fix else "Перезапущен через Startup"
        elif "RESTARTED_DIRECT" in restart_res:
            info["proc_status"] = "ПЕРЕЗАПУЩЕН (напрямую)"
            info["action"] = "Перезапущен напрямую"
        elif "RUNNING" in restart_res:
            info["proc_status"] = f"АКТИВЕН ({restart_res})"
            info["action"] = "Работает штатно (без изменений)"
        else:
            info["proc_status"] = f"ОШИБКА ЗАПУСКА ({restart_res})"
            info["action"] = "Не удалось запустить"
            return ip, "START_ERROR", f"INI: {info['ini_status']}, Процесс: {info['proc_status']}", info

        summary_msg = f"INI: {info['ini_status']} | Процесс: {info['proc_status']}"
        return ip, "OK", summary_msg, info

    except Exception as e:
        return ip, "ERROR", str(e), info


def save_audit_report(results, start_time, end_time):
    """Сохранение лог-файла комплексной проверки."""
    os.makedirs(LOGS_DIR, exist_ok=True)
    ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    log_path = os.path.join(LOGS_DIR, f"audit_and_fix_{ts}.log")

    ok_list = [r for r in results if r[1] == "OK"]
    err_list = [r for r in results if r[1] in ("ERROR", "START_ERROR")]
    no_fc_list = [r for r in results if r[1] == "NO_FARCARDS"]
    offline_list = [r for r in results if r[1] == "OFFLINE"]

    duration = round(end_time - start_time, 2)

    with open(log_path, "w", encoding="utf-8-sig") as f:
        f.write("=" * 90 + "\n")
        f.write(" ОТЧЕТ КОМПЛЕКСНОЙ ПРОВЕРКИ И ИСПРАВЛЕНИЯ FOODPICASSO (FARCARDS)\n")
        f.write("=" * 90 + "\n")
        f.write(f"Дата и время проверки: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Время выполнения:      {duration} сек.\n")
        f.write(f"Целевой API URL:       {TARGET_URL}\n")
        f.write(f"Целевой Auth URL:      {TARGET_AUTH_URL}\n")
        f.write(f"Запуск через:          Startup\\Farcards.exe.lnk\n")
        f.write(f"Всего хостов:          {len(results)}\n")
        f.write(f"  - Исправно/Активно:  {len(ok_list)}\n")
        f.write(f"  - Ошибки/Сбои:       {len(err_list)}\n")
        f.write(f"  - Без FarCards:      {len(no_fc_list)}\n")
        f.write(f"  - Выключены/Оффлайн: {len(offline_list)}\n")
        f.write("=" * 90 + "\n\n")

        f.write(f"[+] РАБОТАЮТ ШТАТНО И ИСПРАВЛЕНЫ ({len(ok_list)} шт.):\n")
        f.write("-" * 90 + "\n")
        for ip, _, msg, info in ok_list:
            f.write(f"  {ip:16} | {msg}\n")
        f.write("\n")

        if err_list:
            f.write(f"[-] ОШИБКИ ДОСТУПА ИЛИ ЗАПУСКА ({len(err_list)} шт.):\n")
            f.write("-" * 90 + "\n")
            for ip, _, msg, _ in err_list:
                f.write(f"  {ip:16} | {msg}\n")
            f.write("\n")

        if no_fc_list:
            f.write(f"[!] СТАНЦИИ БЕЗ ПЛАГИНА FARCARDS ({len(no_fc_list)} шт.):\n")
            f.write("-" * 90 + "\n")
            for ip, _, msg, _ in no_fc_list:
                f.write(f"  {ip:16} | {msg}\n")
            f.write("\n")

        f.write(f"[.] ВЫКЛЮЧЕНЫ / ОФФЛАЙН ({len(offline_list)} шт.):\n")
        f.write("-" * 90 + "\n")
        for i, (ip, _, _, _) in enumerate(offline_list, 1):
            f.write(f"{ip:16} ")
            if i % 4 == 0:
                f.write("\n")
        f.write("\n\n" + "=" * 90 + "\n")

    return log_path, len(ok_list), len(err_list), len(no_fc_list), len(offline_list)


def main():
    parser = argparse.ArgumentParser(description="Аудит и исправление касс FoodPicasso")
    parser.add_argument("--ips", type=str, help="Список конкретных IP через запятую")
    parser.add_argument("--threads", type=int, default=DEFAULT_THREADS, help="Количество потоков")
    args = parser.parse_args()

    if args.ips:
        ip_list = [x.strip() for x in args.ips.split(",") if x.strip()]
    else:
        ip_list = generate_ips()

    start_time = time.time()

    print("=" * 95)
    print(" КОМПЛЕКСНЫЙ АУДИТ И АВТОМАТИЧЕСКОЕ ИСПРАВЛЕНИЕ FARCARDS (FOODPICASSO)")
    print("=" * 95)
    print(f"  Целевой API URL:       {TARGET_URL}")
    print(f"  Целевой Auth URL:      {TARGET_AUTH_URL}")
    print(f"  Способ запуска:        Автозагрузка (Startup\\Farcards.exe.lnk)")
    print(f"  Касс на проверку:      {len(ip_list)} шт. (подсети 114–253, хосты 201–205)")
    print(f"  Параллельных потоков:  {args.threads}")
    print("-" * 95)

    results = []
    max_workers = min(args.threads, len(ip_list)) or 1

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {
            executor.submit(
                check_and_heal_host,
                ip,
                DEFAULT_USERNAME,
                DEFAULT_PASSWORD
            ): ip for ip in ip_list
        }

        for future in as_completed(futures):
            ip, status, msg, info = future.result()
            results.append((ip, status, msg, info))

            if status == "OK":
                print(f"[+ ИСПРАВНО] | {ip:16} | {msg}")
            elif status in ("ERROR", "START_ERROR"):
                print(f"[- ОШИБКА  ] | {ip:16} | {msg}")

    end_time = time.time()

    log_path, count_ok, count_err, count_nofc, count_off = save_audit_report(results, start_time, end_time)

    print("=" * 95)
    print(" ИТОГИ АУДИТА И ИСПРАВЛЕНИЯ:")
    print(f"  [+] Исправны и работают штатно: {count_ok} касс")
    print(f"  [-] Ошибки запуска/доступа:     {count_err} касс")
    print(f"  [!] Станции без плагина:        {count_nofc} касс")
    print(f"  [.] Выключены / оффлайн:         {count_off} касс")
    print(f"  Время выполнения:               {round(end_time - start_time, 2)} сек.")
    print("-" * 95)
    print(f"  ПОЛНЫЙ ОТЧЕТ СОХРАНЕН В:\n  -> {log_path}")
    print("=" * 95)


if __name__ == "__main__":
    main()
