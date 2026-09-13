import subprocess, json

def check_ip_direct(ip):
    ps_cmd = f"""
    $pass = ConvertTo-SecureString '123' -AsPlainText -Force
    $cred = New-Object System.Management.Automation.PSCredential('Administrator', $pass)
    try {{
        $procs = (Get-WmiObject -Class Win32_Process -ComputerName '{ip}' -Credential $cred -ErrorAction Stop).Name
        $is_gs = ($procs -contains 'GuestScreen.exe')
        $is_wt = ($procs -contains 'Watcher.exe')
        @{{ ip = '{ip}'; gs = [bool]$is_gs; wt = [bool]$is_wt; total = $procs.Count }} | ConvertTo-Json -Compress
    }} catch {{
        @{{ ip = '{ip}'; error = $_.Exception.Message }} | ConvertTo-Json -Compress
    }}
    """
    p = subprocess.run(["powershell.exe", "-NoProfile", "-Command", ps_cmd], capture_output=True, text=True, timeout=12)
    return p.stdout.strip()

print("Testing 192.168.176.202 (User's screenshot):", check_ip_direct("192.168.176.202"))
print("Testing 192.168.118.203 (Oqtepa Maydoni):", check_ip_direct("192.168.118.203"))
