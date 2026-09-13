$testIps = @('192.168.118.201', '192.168.118.202', '192.168.118.203', '192.168.114.201', '10.20.104.201', '192.168.116.201')
$pass = ConvertTo-SecureString "123" -AsPlainText -Force
$cred = New-Object System.Management.Automation.PSCredential("Administrator", $pass)

foreach ($ip in $testIps) {
    Write-Host "================ Checking [$ip] ================" -ForegroundColor Cyan
    try {
        $p = Get-WmiObject -Class Win32_Process -ComputerName $ip -Credential $cred -ErrorAction Stop
        $gs = ($p | Where-Object { $_.Name -match "GuestScreen|Watcher|CefSharp" })
        if ($gs) {
            $names = ($gs | Select-Object -ExpandProperty Name) -join ', '
            Write-Host "[RUNNING on $ip] -> $names" -ForegroundColor Green
        } else {
            Write-Host "[NOT RUNNING on $ip] -> (Total procs: $($p.Count))" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "[ERROR on $ip] -> $($_.Exception.Message)" -ForegroundColor Red
    }
}
