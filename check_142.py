import wmi
import os
import socket
import re

IPS = ['192.168.142.201', '192.168.142.202', '192.168.142.206']
USER = 'Administrator'
PASS = '123'
LOG_PATH = r"c$\UCS\R Keeper 7 Cash\FoodPicasso Plugin\Farcards.LOG"
INI_PATH = r"c$\UCS\R Keeper 7 Cash\FoodPicasso Plugin\FARCARDS.INI"

def check_ip(ip):
    print(f"\n{'='*40}")
    print(f"Checking {ip}...")
    
    # Check port 445 (SMB) to see if host is online
    try:
        s = socket.create_connection((ip, 445), timeout=2)
        s.close()
    except Exception:
        print("[-] Host is OFFLINE (Port 445 unreachable)")
        return
        
    # Check WMI Process
    try:
        connection = wmi.WMI(ip, user=USER, password=PASS)
        processes = connection.Win32_Process(name="Farcards.exe")
        if not processes:
            print("[-] Farcards.exe is NOT RUNNING")
        else:
            print(f"[+] Farcards.exe is RUNNING (PIDs: {[p.ProcessId for p in processes]})")
    except Exception as e:
        print(f"[-] WMI Connection failed: {e}")
        
    # Check Log file
    log_smb = rf"\\{ip}\{LOG_PATH}"
    if os.path.exists(log_smb):
        print("[+] Log file found. Tail (last 5 lines):")
        try:
            with open(log_smb, 'r', encoding='cp1251', errors='replace') as f:
                lines = f.readlines()
                for line in lines[-5:]:
                    print("   " + line.strip())
        except Exception as e:
            print(f"   Error reading log: {e}")
    else:
        print("[-] Log file NOT FOUND")

    # Check INI file URL
    ini_smb = rf"\\{ip}\{INI_PATH}"
    if os.path.exists(ini_smb):
        try:
            with open(ini_smb, 'r', encoding='cp1251', errors='replace') as f:
                content = f.read()
                url_match = re.search(r'Url=(.+)', content, re.IGNORECASE)
                if url_match:
                    print(f"[*] INI Url: {url_match.group(1).strip()}")
                else:
                    print("[-] INI Url parameter not found")
        except Exception as e:
            print(f"   Error reading INI: {e}")
    else:
        print("[-] INI file NOT FOUND")

if __name__ == '__main__':
    for ip in IPS:
        check_ip(ip)
