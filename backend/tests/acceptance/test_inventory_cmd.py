# -*- coding: utf-8 -*-
import asyncio
import json
import time
import asyncssh

from src.adapters.command_adapter import CashboxCommandAdapter

async def test():
    conn = await asyncssh.connect(
        "10.0.0.241", username="Administrator", password="123", known_hosts=None, client_keys=[]
    )
    cmd_obj = CashboxCommandAdapter()
    raw_cmd = (
        'powershell -NoProfile -ExecutionPolicy Bypass -Command "'
        "$target = 'C:\\UCS\\GuestScreen\\Front\\media\\uploads'; "
        "if (-not (Test-Path $target)) { New-Item -ItemType Directory -Path $target -Force | Out-Null }; "
        "Get-ChildItem -Path $target -File | Where-Object { $_.Name -notlike '.*' } | ForEach-Object { "
        "[PSCustomObject]@{ "
        "filename = $_.Name; "
        "size = $_.Length; "
        "sha256 = (Get-FileHash -Algorithm SHA256 -Path $_.FullName).Hash.ToLower(); "
        "modified_at = $_.LastWriteTimeUtc.ToString('o') "
        "} "
        "} | ConvertTo-Json -Compress\""
    )
    t0 = time.time()
    res = await conn.run(raw_cmd, timeout=60.0)
    print("ELAPSED:", time.time() - t0)
    print("EXIT:", res.exit_status)
    print("RETURNCODE:", res.returncode)
    print("STDOUT length:", len(res.stdout))
    print("STDOUT end:", repr(res.stdout[-300:]))
    print("STDERR:", repr(res.stderr))
    conn.close()

if __name__ == "__main__":
    asyncio.run(test())
