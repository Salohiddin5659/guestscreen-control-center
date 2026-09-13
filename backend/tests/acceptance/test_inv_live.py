# -*- coding: utf-8 -*-
import asyncio
import asyncssh

async def test():
    conn = await asyncssh.connect(
        "10.0.0.241", username="Administrator", password="123", known_hosts=None, client_keys=[]
    )
    # Test 1: simple dir
    cmd1 = 'powershell -NoProfile -ExecutionPolicy Bypass -Command "$f = @(Get-ChildItem -Path \'C:\\UCS\\GuestScreen\\Front\\media\\uploads\' -File); $f.Count"'
    r1 = await conn.run(cmd1, timeout=15.0)
    print("Files count in uploads:", r1.stdout.strip())

    # Test 2: json output
    cmd2 = (
        'powershell -NoProfile -ExecutionPolicy Bypass -Command "'
        "$f = @(Get-ChildItem -Path 'C:\\UCS\\GuestScreen\\Front\\media\\uploads' -File | Where-Object { $_.Name -notlike '.*' }); "
        "$out = @(); "
        "foreach ($item in $f) { "
        "$h = (Get-FileHash -Algorithm SHA256 -LiteralPath $item.FullName).Hash.ToLower(); "
        "$out += [PSCustomObject]@{ filename = $item.Name; size = $item.Length; sha256 = $h; modified_at = $item.LastWriteTimeUtc.ToString('o') }; "
        "}; "
        "ConvertTo-Json -InputObject $out -Compress\""
    )
    r2 = await conn.run(cmd2, timeout=30.0)
    print("Test 2 exit:", r2.exit_status)
    if r2.exit_status != 0:
        print("Test 2 err:", r2.stderr)
    else:
        print("Test 2 stdout sample:", r2.stdout[:300])

    conn.close()

if __name__ == "__main__":
    asyncio.run(test())
