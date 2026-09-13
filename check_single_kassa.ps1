param(
    [Parameter(Mandatory=$true)]
    [string]$ip
)

$ErrorActionPreference = "SilentlyContinue"
$ProgressPreference = "SilentlyContinue"

$pass = ConvertTo-SecureString "123" -AsPlainText -Force
$cred = New-Object System.Management.Automation.PSCredential("Administrator", $pass)

try {
    $p = Get-WmiObject -Class Win32_Process -ComputerName $ip -Credential $cred -ErrorAction Stop | Select-Object -ExpandProperty Name
    $gs = ($p -contains "GuestScreen.exe")
    $wt = ($p -contains "Watcher.exe")
    $cs = (($p | Where-Object { $_ -like "*CefSharp*" }).Count -gt 0)
    
    $obj = @{
        ip = $ip
        gs = $gs
        wt = $wt
        cs = $cs
        totalProcs = ($p | Measure-Object).Count
    }
    $obj | ConvertTo-Json -Compress
} catch {
    $errObj = @{
        ip = $ip
        error = $_.Exception.Message
    }
    $errObj | ConvertTo-Json -Compress
}
