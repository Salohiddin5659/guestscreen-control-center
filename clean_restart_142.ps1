$pass = ConvertTo-SecureString "123" -AsPlainText -Force
$cred = New-Object System.Management.Automation.PSCredential("Administrator", $pass)

foreach ($ip in @("192.168.142.201", "192.168.142.202")) {
    Write-Host "=== Processing $($ip) ==="
    
    # 1. Kill ALL Farcards instances
    $procs = Get-WmiObject -Class Win32_Process -ComputerName $ip -Credential $cred -Filter "Name = 'Farcards.exe'" -ErrorAction SilentlyContinue
    if ($procs) {
        foreach ($p in $procs) {
            Write-Host "Terminating Farcards PID $($p.ProcessId) on $($ip)"
            $p.Terminate() | Out-Null
        }
        Start-Sleep -Seconds 2
    }
    
    # 2. Launch single clean instance via Startup shortcut
    $cmd = 'cmd.exe /c start "" "C:\Users\Administrator\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\Farcards.exe.lnk"'
    $res = Invoke-WmiMethod -Class Win32_Process -Name Create -ArgumentList $cmd, 'C:\UCS\R Keeper 7 Cash\FoodPicasso Plugin' -ComputerName $ip -Credential $cred
    Write-Host "Startup launch on $($ip): ReturnValue=$($res.ReturnValue), ProcessId=$($res.ProcessId)"
}

Start-Sleep -Seconds 3

# Verify running processes
foreach ($ip in @("192.168.142.201", "192.168.142.202")) {
    $active = Get-WmiObject -Class Win32_Process -ComputerName $ip -Credential $cred -Filter "Name = 'Farcards.exe'" | Select-Object ProcessId, ExecutablePath
    Write-Host "Active Farcards on $($ip):"
    $active | Format-Table -AutoSize
}
