import asyncio
import socket
import time
import requests
from requests.auth import HTTPDigestAuth
from config import HIK_USER, HIK_PASS, DEVICES

COMMAND_TITLES = {
    "open": "🟢 Ochish (Impuls)",
    "close": "🔒 Qulflash (Normal)",
    "alwaysOpen": "🔓 Erkin o'tish (Doimiy ochiq)",
    "alwaysClose": "⛔ Bloklash (Doimiy yopiq)"
}

def _send_isapi_command_sync(ip: str, cmd: str) -> tuple[bool, str]:
    url = f"http://{ip}/ISAPI/AccessControl/RemoteControl/door/1"
    xml = f"<RemoteControlDoor><cmd>{cmd}</cmd></RemoteControlDoor>"
    headers = {"Content-Type": "application/xml"}
    try:
        r = requests.put(
            url,
            data=xml.encode("utf-8"),
            auth=HTTPDigestAuth(HIK_USER, HIK_PASS),
            headers=headers,
            timeout=4.0
        )
        if r.status_code == 200:
            return True, "Muvaffaqiyatli bajarildi"
        else:
            return False, f"Xatolik: HTTP {r.status_code}"
    except requests.exceptions.Timeout:
        return False, "Kutish vaqti tugadi (Timeout 4s)"
    except Exception as e:
        return False, f"Aloqa xatosi: {str(e)[:50]}"

async def send_door_command(ip: str, cmd: str) -> tuple[bool, str]:
    return await asyncio.to_thread(_send_isapi_command_sync, ip, cmd)

def _check_health_sync(ip: str) -> dict:
    t0 = time.time()
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.8)
            err = s.connect_ex((ip, 80))
            latency = (time.time() - t0) * 1000
            if err == 0:
                return {"online": True, "latency": latency, "ip": ip}
            else:
                return {"online": False, "latency": 0, "ip": ip}
    except Exception:
        return {"online": False, "latency": 0, "ip": ip}

async def check_device_health(ip: str) -> dict:
    return await asyncio.to_thread(_check_health_sync, ip)

async def check_all_health() -> dict[str, dict]:
    tasks = [check_device_health(dev["ip"]) for dev in DEVICES.values()]
    results = await asyncio.gather(*tasks)
    health = {}
    for dev, res in zip(DEVICES.values(), results):
        health[dev["id"]] = res
    return health
