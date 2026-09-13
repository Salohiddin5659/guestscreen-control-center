"""
Скрипт точечной построчной замены URL в FARCARDS.INI на кассовых серверах R-Keeper / FoodPicasso.

Особенности:
1. Строгая построчная замена: меняются ТОЛЬКО строки с Url=... и AuthEndpointUrl=...
2. Все остальные строки (комментарии, ClientID, ClientSecret, настройки портов и кодировок) остаются 100% нетронутыми.
3. Сохранение оригинальной кодировки CP1251 и переносов строк Windows (CRLF).
4. Автоматический перезапуск Farcards.exe через WMI.
5. Генерация диапазона IP (подсети 114–253, хосты 201–205) + возможность запуска по конкретному IP (--ips).
6. Запись подробного лог-файла в папку logs/.
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

# Корректные API URL-адреса для плагина FoodPicasso (JSON-RPC)
NEW_URL = "https://api-uz18.posterix.pro/points"
NEW_AUTH_URL = "https://api-uz18.posterix.pro/points/security/oauth/token"

# Относительный путь к файлу на кассе
REMOTE_REL_PATH = r"UCS\R Keeper 7 Cash\FoodPicasso Plugin\FARCARDS.INI"
FARCARDS_EXE_PATH = r"C:\UCS\R Keeper 7 Cash\FoodPicasso Plugin\Farcards.exe"
LOGS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")

# Количество параллельных потоков и таймаут быстрой проверки
DEFAULT_THREADS = 40
SOCKET_TIMEOUT = 0.8
# ===================================================


# 🔥 Генератор диапазона IP-адресов (114–253, хосты 201–205)
def generate_ips():
    ips = []
    for subnet in range(114, 254):  # 114–253
        for host in range(201, 206):  # 201–205
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
    """Подключение к административному сетевому ресурсу C$ кассы."""
    share = rf"\\{ip}\c$"
    cmd = ["net", "use", share, password, f"/user:{username}"]
    res = subprocess.run(cmd, capture_output=True, text=True, encoding="cp866", errors="replace")
    if res.returncode != 0 and "уже" not in res.stderr.lower() and "already" not in res.stderr.lower():
        if not os.path.exists(share):
            raise Exception(f"Ошибка доступа к {share}: {res.stderr.strip() or res.stdout.strip()}")


def replace_urls_strict_line_by_line(raw_bytes: bytes, new_url: str, new_auth_url: str):
    """
    Строгая построчная замена только строк Url и AuthEndpointUrl.
    Не трогает ни одного другого символа или комментария в файле.
    """
    # Определяем кодировку
    try:
        text = raw_bytes.decode("cp1251")
        encoding = "cp1251"
    except UnicodeDecodeError:
        text = raw_bytes.decode("utf-8")
        encoding = "utf-8"

    lines = text.splitlines(keepends=True)
    new_lines = []
    old_url = None
    old_auth = None
    changed = False

    for line in lines:
        stripped = line.strip()
        # Проверяем, является ли строка параметром Url= (и не закомментирована)
        if re.match(r"^Url\s*=", stripped, flags=re.IGNORECASE):
            old_url = stripped.split("=", 1)[1].strip()
            # Определяем окончание строки (\r\n или \n)
            ending = "\r\n" if line.endswith("\r\n") else "\n"
            new_lines.append(f"Url={new_url}{ending}")
            if old_url != new_url:
                changed = True
        # Проверяем параметр AuthEndpointUrl=
        elif re.match(r"^AuthEndpointUrl\s*=", stripped, flags=re.IGNORECASE):
            old_auth = stripped.split("=", 1)[1].strip()
            ending = "\r\n" if line.endswith("\r\n") else "\n"
            new_lines.append(f"AuthEndpointUrl={new_auth_url}{ending}")
            if old_auth != new_auth_url:
                changed = True
        else:
            # Все остальные строки (комментарии, ClientID, ClientSecret и т.д.) сохраняем 1 в 1
            new_lines.append(line)

    result_bytes = "".join(new_lines).encode(encoding)
    return result_bytes, old_url, old_auth, changed


def restart_remote_farcards(ip: str, username: str, password: str) -> str:
    """Перезапуск процесса Farcards.exe на удаленном компьютере через ярлык в Автозагрузке (Startup)."""
    ps_script = f"""
    $pass = ConvertTo-SecureString '{password}' -AsPlainText -Force
    $cred = New-Object System.Management.Automation.PSCredential('{username}', $pass)

    # Завершаем старые процессы Farcards.exe
    $procs = Get-WmiObject -Class Win32_Process -ComputerName '{ip}' -Credential $cred -Filter "Name = 'Farcards.exe'" -ErrorAction SilentlyContinue
    if ($procs) {{
        foreach ($p in $procs) {{
            $p.Terminate() | Out-Null
        }}
        Start-Sleep -Seconds 1
    }}

    # Запускаем через ярлык в Startup
    $cmd = 'cmd.exe /c start "" "C:\\Users\\Administrator\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\Farcards.exe.lnk"'
    $res = Invoke-WmiMethod -Class Win32_Process -Name Create -ArgumentList $cmd, '{os.path.dirname(FARCARDS_EXE_PATH)}' -ComputerName '{ip}' -Credential $cred
    if ($res.ReturnValue -eq 0) {{
        Write-Output "STARTED (Startup PID $($res.ProcessId))"
    }} else {{
        # Резервный запуск напрямую из папки плагина
        $res = Invoke-WmiMethod -Class Win32_Process -Name Create -ArgumentList '"{FARCARDS_EXE_PATH}" -desktop', '{os.path.dirname(FARCARDS_EXE_PATH)}' -ComputerName '{ip}' -Credential $cred
        if ($res.ReturnValue -eq 0) {{
            Write-Output "STARTED (Direct PID $($res.ProcessId))"
        }} else {{
            Write-Output "START_FAILED (Code $($res.ReturnValue))"
        }}
    }}
    """
    res = subprocess.run(["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", ps_script],
                         capture_output=True, text=True)
    out = res.stdout.strip()
    if "STARTED" in out:
        return out
    elif "START_FAILED" in out:
        return f"WMI ошибка: {out}"
    else:
        return f"Предупреждение: {res.stderr.strip() or out}"


def process_host(ip: str, username: str, password: str, new_url: str, new_auth_url: str, restart: bool = True, dry_run: bool = False):
    """Обработка одной кассы."""
    ip = ip.strip()
    if not ip or ip.startswith("#"):
        return ip, "SKIPPED", "Пустая строка или комментарий", {}

    if not is_host_accessible(ip):
        return ip, "OFFLINE", "Хост недоступен по сети (порт 445 закрыт/выключен)", {}

    target_ini_path = rf"\\{ip}\c$\{REMOTE_REL_PATH}"
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = target_ini_path + f".bak_{timestamp}"

    details = {}
    try:
        connect_smb(ip, username, password)

        if not os.path.exists(target_ini_path):
            alt_path = rf"\\{ip}\c$\FARCARDS.INI"
            if os.path.exists(alt_path):
                target_ini_path = alt_path
                backup_path = alt_path + f".bak_{timestamp}"
            else:
                return ip, "NOT_FOUND", f"Файл FARCARDS.INI не найден по пути: {target_ini_path}", {}

        # 1. Читаем байты как есть
        with open(target_ini_path, "rb") as f:
            raw_bytes = f.read()

        # 2. Строгая точечная построчная замена
        updated_bytes, old_url, old_auth, is_changed = replace_urls_strict_line_by_line(raw_bytes, new_url, new_auth_url)
        details["old_url"] = old_url
        details["new_url"] = new_url

        if dry_run:
            status_text = f"ГОТОВ К ЗАМЕНЕ: '{old_url}' -> '{new_url}'" if is_changed else f"УЖЕ ОБНОВЛЕН: '{old_url}'"
            return ip, "DRY_RUN", status_text, details

        # 3. Резервная копия перед записью
        shutil.copy2(target_ini_path, backup_path)
        details["backup"] = os.path.basename(backup_path)

        # 4. Запись обновленных байтов
        with open(target_ini_path, "wb") as f:
            f.write(updated_bytes)

        # 5. Перезапуск
        restart_info = ""
        if restart:
            restart_info = f" | Перезапуск: {restart_remote_farcards(ip, username, password)}"

        change_info = f"ИЗМЕНЕН: '{old_url}' -> '{new_url}'" if is_changed else f"ПЕРЕЗАПИСАН (уже стоял '{new_url}')"
        msg = f"{change_info} (Бэкап: {details['backup']}){restart_info}"

        return ip, "SUCCESS", msg, details

    except Exception as e:
        return ip, "ERROR", str(e), details


def save_log_report(results, start_time, end_time, new_url, new_auth_url, dry_run=False):
    """Формирует и сохраняет подробный лог-файл."""
    os.makedirs(LOGS_DIR, exist_ok=True)
    ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    log_filename = f"farcards_update_{ts}.log"
    log_path = os.path.join(LOGS_DIR, log_filename)

    success_list = [r for r in results if r[1] in ("SUCCESS", "DRY_RUN")]
    error_list = [r for r in results if r[1] in ("ERROR", "NOT_FOUND")]
    offline_list = [r for r in results if r[1] == "OFFLINE"]

    duration = round(end_time - start_time, 2)

    with open(log_path, "w", encoding="utf-8-sig") as f:
        f.write("=" * 85 + "\n")
        f.write(f" ОТЧЕТ ОБ ОБНОВЛЕНИИ FARCARDS.INI (FoodPicasso / Posterix)\n")
        f.write("=" * 85 + "\n")
        f.write(f"Дата и время:       {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Время выполнения:   {duration} сек.\n")
        f.write(f"Режим работы:       {'ПРОВЕРКА (DRY RUN, без записи)' if dry_run else 'ПРИМЕНЕНИЕ ИЗМЕНЕНИЙ'}\n")
        f.write(f"Целевой Url:        {new_url}\n")
        f.write(f"Целевой Auth URL:   {new_auth_url}\n")
        f.write(f"Всего хостов:       {len(results)}\n")
        f.write(f"  - Успешно:        {len(success_list)}\n")
        f.write(f"  - Ошибки:         {len(error_list)}\n")
        f.write(f"  - Не в сети:      {len(offline_list)}\n")
        f.write("=" * 85 + "\n\n")

        f.write(f"[+] УСПЕШНО ОБРАБОТАНЫ ({len(success_list)} шт.):\n")
        f.write("-" * 85 + "\n")
        if success_list:
            for ip, status, msg, _ in success_list:
                f.write(f"  {ip:16} | {msg}\n")
        else:
            f.write("  (нет)\n")
        f.write("\n")

        if error_list:
            f.write(f"[-] ОШИБКИ ПРИ ОБРАБОТКЕ ({len(error_list)} шт.):\n")
            f.write("-" * 85 + "\n")
            for ip, status, msg, _ in error_list:
                f.write(f"  {ip:16} | [{status}] {msg}\n")
            f.write("\n")

        f.write(f"[.] ВЫКЛЮЧЕНЫ / НЕДОСТУПНЫ ПО СЕТИ ({len(offline_list)} шт.):\n")
        f.write("-" * 85 + "\n")
        if offline_list:
            for i, (ip, _, _, _) in enumerate(offline_list, 1):
                f.write(f"{ip:16} ")
                if i % 4 == 0:
                    f.write("\n")
            f.write("\n")
        f.write("\n" + "=" * 85 + "\n")

    return log_path, len(success_list), len(error_list), len(offline_list)


def main():
    parser = argparse.ArgumentParser(description="Построчное обновление FARCARDS.INI для FoodPicasso")
    parser.add_argument("--ips", type=str, help="Список IP через запятую (например: 192.168.129.202)")
    parser.add_argument("--file", type=str, help="Файл со списком IP-адресов")
    parser.add_argument("--user", type=str, default=DEFAULT_USERNAME, help=f"Имя пользователя (по умолч.: {DEFAULT_USERNAME})")
    parser.add_argument("--password", type=str, default=DEFAULT_PASSWORD, help="Пароль администратора")
    parser.add_argument("--url", type=str, default=NEW_URL, help=f"Новый Url (по умолч.: {NEW_URL})")
    parser.add_argument("--auth-url", type=str, default=NEW_AUTH_URL, help=f"Новый AuthEndpointUrl (по умолч.: {NEW_AUTH_URL})")
    parser.add_argument("--no-restart", action="store_true", help="Не перезапускать Farcards.exe")
    parser.add_argument("--dry-run", action="store_true", help="Режим проверки без внесения изменений")
    parser.add_argument("--threads", type=int, default=DEFAULT_THREADS, help=f"Потоков (по умолч.: {DEFAULT_THREADS})")

    args = parser.parse_args()

    if args.ips:
        ip_list = [x.strip() for x in args.ips.split(",") if x.strip()]
    elif args.file:
        if not os.path.exists(args.file):
            print(f"Ошибка: файл '{args.file}' не найден.")
            sys.exit(1)
        with open(args.file, "r", encoding="utf-8") as f:
            ip_list = [line.strip() for line in f if line.strip() and not line.strip().startswith("#")]
    else:
        ip_list = generate_ips()

    if not ip_list:
        print("Список IP-адресов пуст. Завершение работы.")
        sys.exit(0)

    start_time = time.time()

    print("=" * 90)
    print(" ТОЧЕЧНОЕ ОБНОВЛЕНИЕ URL В FARCARDS.INI (FoodPicasso / Posterix)")
    print("=" * 90)
    print(f"  Новый Url:             {args.url}")
    print(f"  Новый AuthEndpointUrl: {args.auth_url}")
    print(f"  Авто-перезапуск:       {'Отключен' if args.no_restart else 'Включен (через WMI)'}")
    print(f"  Режим работы:          {'ПРОВЕРКА (DRY RUN, без записи)' if args.dry_run else 'ПРИМЕНЕНИЕ ИЗМЕНЕНИЙ'}")
    print(f"  Касс к проверке:       {len(ip_list)} шт.")
    print(f"  Параллельных потоков:  {args.threads}")
    print("-" * 90)

    results = []
    max_workers = min(args.threads, len(ip_list)) or 1

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {
            executor.submit(
                process_host,
                ip,
                args.user,
                args.password,
                args.url,
                args.auth_url,
                restart=(not args.no_restart),
                dry_run=args.dry_run
            ): ip for ip in ip_list
        }

        for future in as_completed(futures):
            ip, status, message, details = future.result()
            results.append((ip, status, message, details))

            if status in ("SUCCESS", "DRY_RUN"):
                print(f"[+ УСПЕХ   ] | {ip:16} | {message}")
            elif status in ("ERROR", "NOT_FOUND"):
                print(f"[- ОШИБКА  ] | {ip:16} | {message}")

    end_time = time.time()

    log_path, count_ok, count_err, count_off = save_log_report(
        results, start_time, end_time, args.url, args.auth_url, dry_run=args.dry_run
    )

    print("=" * 90)
    print(" ИТОГИ ВЫПОЛНЕНИЯ:")
    print(f"  [+] Успешно обработано:   {count_ok} касс")
    print(f"  [-] Ошибки при обработке: {count_err} касс")
    print(f"  [.] Выключены / оффлайн:  {count_off} касс")
    print(f"  Время работы:             {round(end_time - start_time, 2)} сек.")
    print("-" * 90)
    print(f"  ПОЛНЫЙ ОТЧЕТ СОХРАНЕН В ФАЙЛ:\n  -> {log_path}")
    print("=" * 90)


if __name__ == "__main__":
    main()
