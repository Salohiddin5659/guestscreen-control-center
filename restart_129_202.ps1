$pass = ConvertTo-SecureString "123" -AsPlainText -Force
$cred = New-Object System.Management.Automation.PSCredential("Administrator", $pass)

# Kill running Farcards on 192.168.129.202
$procs = Get-WmiObject -Class Win32_Process -ComputerName "192.168.129.202" -Credential $cred -Filter "Name = 'Farcards.exe'" -ErrorAction SilentlyContinue
foreach ($p in $procs) {
    Write-Host "Killing Farcards PID $($p.ProcessId) on 192.168.129.202"
    $p.Terminate() | Out-Null
}

Start-Sleep -Seconds 2

# Start Farcards.exe on 192.168.129.202
$res = Invoke-WmiMethod -Class Win32_Process -Name Create -ArgumentList '"C:\UCS\R Keeper 7 Cash\FoodPicasso Plugin\Farcards.exe" -desktop', 'C:\UCS\R Keeper 7 Cash\FoodPicasso Plugin' -ComputerName '192.168.129.202' -Credential $cred
Write-Host "Invoke-WmiMethod result: ReturnValue=$($res.ReturnValue), ProcessId=$($res.ProcessId)"
