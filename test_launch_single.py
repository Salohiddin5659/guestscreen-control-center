import subprocess, re, json, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
ip = '192.168.118.201'
USERNAME = 'Administrator'
PASSWORD = '123'
exe_path = 'C:\\UCS\\GuestScreen\\GuestScreen.exe'
ps_cmd = f'''
     = ConvertTo-SecureString '{PASSWORD}' -AsPlainText -Force
     = New-Object System.Management.Automation.PSCredential('{USERNAME}', )
    try {{
         = Invoke-WmiMethod -Class Win32_Process -Name Create -ComputerName '{ip}' -Credential  -ArgumentList '{exe_path}' -ErrorAction Stop
        @{{ rc = .ReturnValue; pid2 = .ProcessId }} | ConvertTo-Json -Compress
    }} catch {{
        @{{ error = .Exception.Message }} | ConvertTo-Json -Compress
    }}
'''
p = subprocess.run(['powershell.exe', '-NoProfile', '-Command', ps_cmd], capture_output=True, text=True, timeout=30)
print('STDOUT:', repr(p.stdout[:300]))
print('STDERR:', p.stderr[:200])
