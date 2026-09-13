import subprocess, base64

ps_script = """
$pass = ConvertTo-SecureString '123' -AsPlainText -Force
$cred = New-Object System.Management.Automation.PSCredential('Administrator', $pass)
$p = Get-WmiObject -Class Win32_Process -ComputerName '192.168.118.203' -Credential $cred -ErrorAction Stop | Select-Object -ExpandProperty Name
$gs = $p -contains 'GuestScreen.exe'
$wt = $p -contains 'Watcher.exe'
Write-Output (ConvertTo-Json @{ gs = [bool]$gs; wt = [bool]$wt } -Compress)
"""

b64 = base64.b64encode(ps_script.encode('utf-16le')).decode('ascii')
p = subprocess.run(['powershell', '-NoProfile', '-EncodedCommand', b64], capture_output=True, text=True)
print('STDOUT:', p.stdout.strip())
print('STDERR:', p.stderr.strip())
