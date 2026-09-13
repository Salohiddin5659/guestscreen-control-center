import urllib.request
import ssl
import re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

base = 'https://192.168.129.201:8085/'
endpoints = ['', 'Connects', 'Settings', 'WorkModules', 'LogData']

for ep in endpoints:
    url = base + ep
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, context=ctx, timeout=5) as resp:
            raw = resp.read().decode('cp1251', errors='replace')
            clean = re.sub(r'<[^>]+>', ' ', raw)
            clean = re.sub(r'\s+', ' ', clean).strip()
            name = ep if ep else "Main Page"
            print(f"=== {name} ===")
            print(clean[:600])
            print("-" * 50)
    except Exception as e:
        print(f"=== {ep} ERROR ===", e)
