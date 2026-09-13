$testIps = @('192.168.118.201', '192.168.114.201', '192.168.120.201', '192.168.132.206', '10.20.104.201', '192.168.116.201')
$pass = ConvertTo-SecureString "123" -AsPlainText -Force
$cred = New-Object System.Management.Automation.PSCredential("Administrator", $pass)

foreach ($ip in $testIps) {
    Write-Host "================ Checking $ip ================" -ForegroundColor Cyan
    try {
        $p = Get-WmiObject -Class Win32_Process -ComputerName $ip -Credential $cred -ErrorAction Stop
        $gsProcs = $p | Where-Object { $_.Name -match "GuestScreen|Watcher|CefSharp" }
        if ($gsProcs) {
            Write-Host "[FOUND] Running Processes on $ip :" -ForegroundColor Green
            $gsProcs | Select-Object ProcessId, Name | Format-Table -AutoSize
        } else {
            Write-Host "[NONE] No GuestScreen processes running on $ip." -ForegroundColor Yellow
        }
    } catch {
        Write-Host "[ERROR on $ip]: $($_.Exception.Message)" -ForegroundColor Red
    }
}
