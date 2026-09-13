# =====================================================================
# AntiGravity GuestScreen Native PowerShell Auditor (All 103 Branches)
# =====================================================================

$ErrorActionPreference = "SilentlyContinue"
$ProgressPreference = "SilentlyContinue"

$FilialsFile = "C:\Users\Administrator\Desktop\all_filials.txt"
$ReportFile = "D:\Anti\logs\guestscreen_audit_latest.md"
$Timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "   Starting Native GuestScreen Network Audit" -ForegroundColor Yellow
Write-Host "   Timestamp: $Timestamp" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Cyan

# 1. Parse all filials
$filials = @()
Get-Content $FilialsFile -Encoding UTF8 | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("=") -and -not $line.StartsWith("ПРЕФИКС") -and -not $line.StartsWith("ИТОГО")) {
        $parts = $line.Split("|") | ForEach-Object { $_.Trim() }
        if ($parts.Count -ge 3) {
            $filials += [PSCustomObject]@{
                Prefix = $parts[0]
                Name = $parts[1]
                Subnet = $parts[2]
            }
        }
    }
}

Write-Host "Parsed $($filials.Count) branches from $FilialsFile." -ForegroundColor Green

# 2. Build target IP list
$allTargets = @()
foreach ($f in $filials) {
    foreach ($h in @(201, 202, 203, 204, 205, 228)) {
        $allTargets += [PSCustomObject]@{
            IP = "$($f.Subnet).$h"
            Prefix = $f.Prefix
            Name = $f.Name
            Subnet = $f.Subnet
        }
    }
}

Write-Host "Total Cashier IPs to test: $($allTargets.Count)." -ForegroundColor Green
Write-Host "Pinging network..." -ForegroundColor Yellow

# 3. Fast Parallel TCP Ping on port 445 / 135
$onlineTargets = [System.Collections.Concurrent.ConcurrentBag[PSCustomObject]]::new()
$offlineTargets = [System.Collections.Concurrent.ConcurrentBag[PSCustomObject]]::new()

$pingScript = {
    param($t)
    $ip = $t.IP
    $online = $false
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $iar = $client.BeginConnect($ip, 445, $null, $null)
        $wh = $iar.AsyncWaitHandle.WaitOne(350, $false)
        if ($wh -and $client.Connected) {
            $client.EndConnect($iar)
            $online = $true
        }
        $client.Close()
    } catch {}

    if (-not $online) {
        try {
            $client2 = New-Object System.Net.Sockets.TcpClient
            $iar2 = $client2.BeginConnect($ip, 135, $null, $null)
            $wh2 = $iar2.AsyncWaitHandle.WaitOne(350, $false)
            if ($wh2 -and $client2.Connected) {
                $client2.EndConnect($iar2)
                $online = $true
            }
            $client2.Close()
        } catch {}
    }

    if ($online) {
        $using:onlineTargets.Add($t)
    } else {
        $using:offlineTargets.Add($t)
    }
}

# Run Ping in Parallel Runspaces
$pool = [RunspaceFactory]::CreateRunspacePool(1, 80)
$pool.Open()

$tasks = @()
foreach ($t in $allTargets) {
    $ps = [PowerShell]::Create().AddScript($pingScript).AddArgument($t)
    $ps.RunspacePool = $pool
    $tasks += [PSCustomObject]@{
        Pipe = $ps
        AsyncResult = $ps.BeginInvoke()
    }
}

foreach ($task in $tasks) {
    $task.Pipe.EndInvoke($task.AsyncResult)
    $task.Pipe.Dispose()
}
$pool.Close()

Write-Host "Ping complete: $($onlineTargets.Count) ONLINE hosts, $($offlineTargets.Count) OFFLINE hosts." -ForegroundColor Cyan
Write-Host "Auditing processes on $($onlineTargets.Count) online cashiers..." -ForegroundColor Yellow

# 4. Parallel WMI Process Check on Online Cashiers
$auditResults = [System.Collections.Concurrent.ConcurrentBag[PSCustomObject]]::new()

$wmiScript = {
    param($t)
    $ip = $t.IP
    $pass = ConvertTo-SecureString "123" -AsPlainText -Force
    $cred = New-Object System.Management.Automation.PSCredential("Administrator", $pass)

    $gs = $false
    $wt = $false
    $cs = $false
    $err = ""

    try {
        $p = Get-WmiObject -Class Win32_Process -ComputerName $ip -Credential $cred -ErrorAction Stop | Select-Object -ExpandProperty Name
        if ($p) {
            $gs = ($p -contains "GuestScreen.exe")
            $wt = ($p -contains "Watcher.exe")
            $cs = (($p | Where-Object { $_ -like "*CefSharp*" }).Count -gt 0)
        }
    } catch {
        $err = $_.Exception.Message
    }

    $res = [PSCustomObject]@{
        IP = $ip
        Name = $t.Name
        Prefix = $t.Prefix
        Subnet = $t.Subnet
        Online = $true
        GsRunning = $gs
        WatcherRunning = $wt
        CefSharpRunning = $cs
        Error = $err
    }
    $using:auditResults.Add($res)
}

$poolWmi = [RunspaceFactory]::CreateRunspacePool(1, 40)
$poolWmi.Open()

$wmiTasks = @()
foreach ($t in $onlineTargets) {
    $ps = [PowerShell]::Create().AddScript($wmiScript).AddArgument($t)
    $ps.RunspacePool = $poolWmi
    $wmiTasks += [PSCustomObject]@{
        Pipe = $ps
        AsyncResult = $ps.BeginInvoke()
    }
}

$done = 0
foreach ($task in $wmiTasks) {
    $task.Pipe.EndInvoke($task.AsyncResult)
    $task.Pipe.Dispose()
    $done++
    if ($done % 30 -eq 0 -or $done -eq $wmiTasks.Count) {
        Write-Host "Audited $done / $($wmiTasks.Count) ($([Math]::Round($done/$wmiTasks.Count*100))%)..."
    }
}
$poolWmi.Close()

# 5. Compile Final Results
$runningList = $auditResults | Where-Object { $_.GsRunning -eq $true } | Sort-Object { [version]($_.IP -replace '^', '0.') }
$stoppedList = $auditResults | Where-Object { $_.GsRunning -ne $true } | Sort-Object { [version]($_.IP -replace '^', '0.') }
$offlineList = $offlineTargets | Sort-Object { [version]($_.IP -replace '^', '0.') }

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "   AUDIT SUMMARY:" -ForegroundColor Yellow
Write-Host "   Total Cashiers Checked: $($allTargets.Count)"
Write-Host "   Online Hosts: $($onlineTargets.Count)"
Write-Host "   [GREEN] GuestScreen RUNNING: $($runningList.Count)" -ForegroundColor Green
Write-Host "   [YELLOW] Online but GuestScreen STOPPED: $($stoppedList.Count)" -ForegroundColor Yellow
Write-Host "   [GRAY] Offline Hosts: $($offlineList.Count)" -ForegroundColor Gray
Write-Host "=======================================================" -ForegroundColor Cyan

# 6. Generate Markdown Report
$md = @()
$md += "# 📋 Полный аудит GuestScreen по всем филиалам сети (103 филиала)"
$md += ""
$md += "**Дата и время аудита:** $Timestamp  "
$md += "**Всего проверено кассовых IP:** $($allTargets.Count) (103 филиала)  "
$md += "**Включено касс в сети (Онлайн):** $($onlineTargets.Count)  "
$md += "**🟢 Запущен и работает в штатном режиме:** $($runningList.Count)  "
$md += "**🟡 Касса онлайн, но GuestScreen НЕ запущен:** $($stoppedList.Count)  "
$md += "**⚪ Касса выключена / Офлайн:** $($offlineList.Count)  "
$md += ""
$md += "---"
$md += ""
$md += "## 🟢 1. Список касс, где GuestScreen ЗАПУЩЕН и работает в штатном режиме ($($runningList.Count) касс)"
$md += ""
if ($runningList.Count -gt 0) {
    $md += "| № | IP-адрес | Филиал | Префикс | Watcher | CefSharp | Статус |"
    $md += "| :- | :--- | :--- | :--- | :--- | :--- | :--- |"
    $idx = 1
    foreach ($k in $runningList) {
        $w = if ($k.WatcherRunning) { "🟢 Да" } else { "⚪ Нет" }
        $c = if ($k.CefSharpRunning) { "🟢 Да" } else { "⚪ Нет" }
        $md += "| $idx | `$($k.IP)` | **$($k.Name)** | $($k.Prefix) | $w | $c | 🟢 Запущен (Штатный режим) |"
        $idx++
    }
} else {
    $md += "*Кассы с запущенным процессом не обнаружены.*"
}

$md += ""
$md += "---"
$md += ""
$md += "## 🟡 2. Список касс ОНЛАЙН, где GuestScreen НЕ запущен ($($stoppedList.Count) касс)"
$md += ""
if ($stoppedList.Count -gt 0) {
    $md += "| № | IP-адрес | Филиал | Префикс | Состояние |"
    $md += "| :- | :--- | :--- | :--- | :--- |"
    $idx = 1
    foreach ($k in $stoppedList) {
        $errNote = if ($k.Error) { " ($($k.Error.Substring(0, [Math]::Min(25, $k.Error.Length))))" } else { "" }
        $md += "| $idx | `$($k.IP)` | **$($k.Name)** | $($k.Prefix) | 🟡 Онлайн, процесс не запущен$errNote |"
        $idx++
    }
}

$md += ""
$md += "---"
$md += ""
$md += "## 🏢 3. Сводная таблица по филиалам (103 филиала)"
$md += ""
$md += "| Филиал | Подсеть | Онлайн | 🟢 Запущен | 🟡 Не запущен | ⚪ Офлайн | IP-адреса с запущенным GuestScreen |"
$md += "| :--- | :--- | :--- | :--- | :--- | :--- | :--- |"

$groupedByBranch = @{}
foreach ($t in $allTargets) {
    if (-not $groupedByBranch.ContainsKey($t.Name)) {
        $groupedByBranch[$t.Name] = @{
            Prefix = $t.Prefix
            Subnet = $t.Subnet
            IPs = @()
        }
    }
    $groupedByBranch[$t.Name].IPs += $t.IP
}

foreach ($bName in ($groupedByBranch.Keys | Sort-Object)) {
    $b = $groupedByBranch[$bName]
    $branchIps = $b.IPs
    
    $onCount = ($auditResults | Where-Object { $branchIps -contains $_.IP }).Count
    $runList = $auditResults | Where-Object { $branchIps -contains $_.IP -and $_.GsRunning -eq $true }
    $runCount = $runList.Count
    $stopCount = ($auditResults | Where-Object { $branchIps -contains $_.IP -and $_.GsRunning -ne $true }).Count
    $offCount = ($offlineTargets | Where-Object { $branchIps -contains $_.IP }).Count
    $runIps = if ($runCount -gt 0) { ($runList | ForEach-Object { "`$($_.IP)`" }) -join ", " } else { "—" }

    if ($onCount -gt 0) {
        $md += "| **$bName** | `$($b.Subnet)` | $onCount/$($branchIps.Count) | **$runCount** | $stopCount | $offCount | $runIps |"
    }
}

[System.IO.File]::WriteAllLines($ReportFile, $md, [System.Text.Encoding]::UTF8)
Write-Host "Report written to $ReportFile" -ForegroundColor Green
