# -*- coding: utf-8 -*-
import asyncio
import asyncssh

async def check():
    conn = await asyncssh.connect(
        "10.0.0.241", username="Administrator", password="123", known_hosts=None, client_keys=[]
    )
    res = await conn.run("powershell -NoProfile -ExecutionPolicy Bypass -Command \"$PSVersionTable.PSVersion.ToString()\"")
    print("PSVersion:", res.stdout.strip())
    res_os = await conn.run("powershell -NoProfile -ExecutionPolicy Bypass -Command \"(Get-WmiObject Win32_OperatingSystem).Caption\"")
    print("OS Caption:", res_os.stdout.strip())
    conn.close()

if __name__ == "__main__":
    asyncio.run(check())
