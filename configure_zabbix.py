import time
from pyzabbix import ZabbixAPI

ZABBIX_URL = 'http://10.0.0.111:8081'
ZABBIX_USER = 'Admin'
ZABBIX_PASS = 'zabbix'

def configure_zabbix():
    print("[*] Connecting to Zabbix API...")
    zapi = ZabbixAPI(ZABBIX_URL)
    zapi.login(ZABBIX_USER, ZABBIX_PASS)
    print(f"[+] Connected to Zabbix API Version {zapi.api_version()}")

    # 1. Create Host Group (for hosts)
    host_group_name = "RKeeper Cash Registers"
    hgroups = zapi.hostgroup.get(filter={"name": host_group_name})
    if not hgroups:
        hgroup = zapi.hostgroup.create(name=host_group_name)
        host_group_id = hgroup["groupids"][0]
        print(f"[+] Created Host Group '{host_group_name}' (ID: {host_group_id})")
    else:
        host_group_id = hgroups[0]["groupid"]
        print(f"[*] Host Group '{host_group_name}' exists (ID: {host_group_id})")

    # 1.5 Create Template Group (required for Zabbix 6.2+)
    tpl_group_name = "Templates/FoodPicasso"
    tgroups = zapi.templategroup.get(filter={"name": tpl_group_name})
    if not tgroups:
        tgroup = zapi.templategroup.create(name=tpl_group_name)
        tpl_group_id = tgroup["groupids"][0]
        print(f"[+] Created Template Group '{tpl_group_name}' (ID: {tpl_group_id})")
    else:
        tpl_group_id = tgroups[0]["groupid"]
        print(f"[*] Template Group '{tpl_group_name}' exists (ID: {tpl_group_id})")

    # 2. Create Template
    template_name = "Template App FoodPicasso"
    templates = zapi.template.get(filter={"host": template_name})
    if not templates:
        template = zapi.template.create(
            host=template_name,
            groups=[{"groupid": tpl_group_id}],
            description="Monitor Farcards.exe for FoodPicasso"
        )
        template_id = template["templateids"][0]
        print(f"[+] Created Template '{template_name}' (ID: {template_id})")
    else:
        template_id = templates[0]["templateid"]
        print(f"[*] Template '{template_name}' exists (ID: {template_id})")

    # 3. Create Items in Template
    items = zapi.item.get(filter={"hostid": template_id, "key_": "proc.num[Farcards.exe]"})
    if not items:
        zapi.item.create(
            hostid=template_id,
            name="Farcards.exe Process Count",
            key_="proc.num[Farcards.exe]",
            type=0,          # Zabbix agent
            value_type=3,    # Numeric (unsigned)
            delay="30s",
            tags=[{"tag": "Application", "value": "FoodPicasso"}]
        )
        print(f"[+] Created Item: proc.num[Farcards.exe]")

    items_mem = zapi.item.get(filter={"hostid": template_id, "key_": "proc.mem[Farcards.exe]"})
    if not items_mem:
        zapi.item.create(
            hostid=template_id,
            name="Farcards.exe Memory Usage",
            key_="proc.mem[Farcards.exe]",
            type=0,          # Zabbix agent
            value_type=3,    # Numeric (unsigned)
            units="B",
            delay="60s",
            tags=[{"tag": "Application", "value": "FoodPicasso"}]
        )
        print(f"[+] Created Item: proc.mem[Farcards.exe]")

    # 4. Create Trigger in Template
    triggers = zapi.trigger.get(filter={"description": "Farcards.exe is DOWN on {HOST.NAME}"})
    if not triggers:
        zapi.trigger.create(
            description="Farcards.exe is DOWN on {HOST.NAME}",
            expression=f"last(/{template_name}/proc.num[Farcards.exe])=0",
            priority=4, # High
            comments="Process Farcards.exe stopped or crashed."
        )
        print(f"[+] Created Trigger: Farcards.exe is DOWN")

    print("[+] Zabbix Configuration Complete!")

if __name__ == "__main__":
    configure_zabbix()
