$pass = ConvertTo-SecureString "123" -AsPlainText -Force
$cred = New-Object System.Management.Automation.PSCredential("Administrator", $pass)

# Kill old Farcards.exe on 192.168.127.202
$procs = Get-WmiObject -Class Win32_Process -ComputerName "192.168.127.202" -Credential $cred -Filter "Name = 'Farcards.exe'" -ErrorAction SilentlyContinue
foreach ($p in $procs) {
    $p.Terminate() | Out-Null
}
Start-Sleep -Seconds 1

# Launch via Startup shortcut
$cmd = 'cmd.exe /c start "" "C:\Users\Administrator\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\Farcards.exe.lnk"'
$res = Invoke-WmiMethod -Class Win32_Process -Name Create -ArgumentList $cmd, "C:\UCS\R Keeper 7 Cash\FoodPicasso Plugin" -ComputerName "192.168.127.202" -Credential $cred
Write-Host "Startup launch result: ReturnValue=$($res.ReturnValue), ProcessId=$($res.ProcessId)"

Start-Sleep -Seconds 2
$procsNew = Get-WmiObject -Class Win32_Process -ComputerName "192.168.127.202" -Credential $cred -Filter "Name = 'Farcards.exe'" -ErrorAction SilentlyContinue
Write-Host "Running Farcards processes on 192.168.127.202:" ($procsNew | Select-Object ProcessId, ExecutablePath | Out-String)
