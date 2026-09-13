# -*- coding: utf-8 -*-
import asyncio
import asyncssh

async def test():
    conn = await asyncssh.connect(
        "10.0.0.241", username="Administrator", password="123", known_hosts=None, client_keys=[]
    )
    import time
    t0 = time.time()
    cmd = (
        'powershell -NoProfile -ExecutionPolicy Bypass -Command "'
        "$target = 'C:\\UCS\\GuestScreen\\Front\\media\\uploads'; "
        "if (-not (Test-Path $target)) { New-Item -ItemType Directory -Path $target -Force | Out-Null }; "
        "$items = @(Get-ChildItem -Path $target -File | Where-Object { $_.Name -notlike '.*' } | ForEach-Object { "
        "[PSCustomObject]@{ "
        "filename = $_.Name; "
        "size = $_.Length; "
        "sha256 = (Get-FileHash -Algorithm SHA256 -Path $_.FullName).Hash.ToLower(); "
        "modified_at = $_.LastWriteTimeUtc.ToString('o') "
        "} "
        "}); "
        "ConvertTo-Json -InputObject $items -Compress\""
    )
    cmd = (
        'powershell -NoProfile -ExecutionPolicy Bypass -Command "'
        "$target = 'C:\\UCS\\GuestScreen\\Front\\media\\uploads'; "
        "$tmp = 'C:\\UCS\\GuestScreen\\Front\\media\\uploads\\.inv.tmp'; "
        "if (-not (Test-Path $target)) { New-Item -ItemType Directory -Path $target -Force | Out-Null }; "
        "Get-ChildItem -Path $target -File | Where-Object { $_.Name -notlike '.*' } | ForEach-Object { "
        "[PSCustomObject]@{ "
        "filename = $_.Name; "
        "size = $_.Length; "
        "sha256 = (Get-FileHash -Algorithm SHA256 -Path $_.FullName).Hash.ToLower(); "
        "modified_at = $_.LastWriteTimeUtc.ToString('o') "
        "} "
        "} | ConvertTo-Json -Compress | Out-File -FilePath $tmp -Encoding UTF8\""
    )
    async with asyncssh.connect("10.0.0.241", username="Administrator", password="123", known_hosts=None, client_keys=[]) as conn:
        res = await conn.run(cmd, timeout=30.0)
        print("EXIT:", res.exit_status)
        async with conn.start_sftp_client() as sftp:
            try:
                async with sftp.open("C:/UCS/GuestScreen/Front/media/uploads/.inv.tmp", "rb") as f:
                    raw = await f.read()
                from src.adapters.command_parsers import parse_inventory_json
                inv = parse_inventory_json(raw.decode("utf-8-sig"))
                print("INVENTORY PARSED SUCCESSFULLY! Total items:", len(inv))
                for item in inv[:3]:
                    print(f"  {item.filename} ({item.size} bytes): {item.sha256}")
            finally:
                await sftp.remove("C:/UCS/GuestScreen/Front/media/uploads/.inv.tmp")
                print("CLEANED UP .inv.tmp")

if __name__ == "__main__":
    asyncio.run(test())
