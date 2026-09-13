$wsh = New-Object -ComObject WScript.Shell
$lnk1 = $wsh.CreateShortcut('\\192.168.127.201\c$\Users\Administrator\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\Farcards.exe.lnk')
Write-Host "Target: $($lnk1.TargetPath)"
Write-Host "Arguments: $($lnk1.Arguments)"
Write-Host "WorkingDirectory: $($lnk1.WorkingDirectory)"
