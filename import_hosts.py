import os
import re
from pyzabbix import ZabbixAPI

ZABBIX_URL = 'http://10.0.0.111:8081'
ZABBIX_USER = 'Admin'
ZABBIX_PASS = 'zabbix'

def get_ips():
    ips = set()
    log_dir = r"d:\Anti\logs"
    for filename in os.listdir(log_dir):
        if filename.endswith(".log"):
            filepath = os.path.join(log_dir, filename)
            with open(filepath, "r", encoding="utf-8-sig") as f:
                text = f.read()
                matches = re.findall(r'(192\.168\.(?:1\d{2}|2\d{2})\.\d{1,3})', text)
                for m in matches:
                    ips.add(m)
    return list(ips)

def import_hosts():
    ips = get_ips()
    if not ips:
        print("No IPs found in logs.")
        return

    print(f"[*] Found {len(ips)} IPs in logs.")

    print("[*] Connecting to Zabbix API...")
    zapi = ZabbixAPI(ZABBIX_URL)
    zapi.login(ZABBIX_USER, ZABBIX_PASS)

    host_group_name = "RKeeper Cash Registers"
    hgroups = zapi.hostgroup.get(filter={"name": host_group_name})
    host_group_id = hgroups[0]["groupid"]

    template_name = "Template App FoodPicasso"
    templates = zapi.template.get(filter={"host": template_name})
    template_id = templates[0]["templateid"]

    added = 0
    for ip in ips:
        hostname = f"Kassa_{ip.replace('.', '_')}"
        existing = zapi.host.get(filter={"host": hostname})
        if not existing:
            zapi.host.create(
                host=hostname,
                name=hostname,
                interfaces=[{
                    "type": 1, # Zabbix agent
                    "main": 1,
                    "useip": 1,
                    "ip": ip,
                    "dns": "",
                    "port": "10050"
                }],
                groups=[{"groupid": host_group_id}],
                templates=[{"templateid": template_id}]
            )
            added += 1
            print(f"[+] Added {hostname}")
        else:
            print(f"[*] {hostname} already exists")
    
    print(f"[+] Import complete! Added {added} new hosts.")

if __name__ == "__main__":
    import_hosts()
