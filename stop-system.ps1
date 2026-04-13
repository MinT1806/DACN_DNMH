param(
    [string]$DbContainer = "luxury-postgres",
    [switch]$KeepDatabase
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host "[STOP-SYSTEM] $Message" -ForegroundColor Cyan
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[STOP-SYSTEM] $Message" -ForegroundColor Yellow
}

function Stop-ProcessByIdSafe {
    param([int]$ProcessId)

    try {
        Stop-Process -Id $ProcessId -Force -ErrorAction Stop
        Write-Step "Da dung process PID $ProcessId"
    }
    catch {
        Write-Warn "Khong the dung PID ${ProcessId}: $($_.Exception.Message)"
    }
}

function Stop-ProcessesByCommandLine {
    param(
        [string]$Pattern,
        [string]$Label
    )

    $processes = Get-CimInstance Win32_Process -Filter "Name='powershell.exe' OR Name='pwsh.exe' OR Name='cmd.exe' OR Name='node.exe' OR Name='java.exe' OR Name='python.exe'" |
        Where-Object { $_.CommandLine -and $_.CommandLine -match $Pattern }

    if (-not $processes) {
        Write-Step "Khong tim thay process theo mau cho $Label"
        return
    }

    Write-Step "Dang dung $($processes.Count) process cho $Label"
    foreach ($proc in $processes) {
        Stop-ProcessByIdSafe -ProcessId $proc.ProcessId
    }
}

function Stop-ProcessesByPort {
    param(
        [int]$Port,
        [string]$Label
    )

    $listeners = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if (-not $listeners) {
        Write-Step "Khong co process listen tren cong $Port ($Label)"
        return
    }

    $pids = $listeners | Select-Object -ExpandProperty OwningProcess -Unique
    Write-Step "Dang dung process tren cong $Port ($Label): $($pids -join ', ')"

    foreach ($procId in $pids) {
        Stop-ProcessByIdSafe -ProcessId $procId
    }
}

function Stop-DatabaseContainer {
    if ($KeepDatabase) {
        Write-Step "Giua DB theo yeu cau (-KeepDatabase)."
        return
    }

    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Warn "Khong tim thay docker. Bo qua buoc dung DB container."
        return
    }

    $running = docker ps --filter "name=^${DbContainer}$" --format "{{.Names}}" 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Warn "Khong the kiem tra trang thai container DB."
        return
    }

    if (-not $running) {
        Write-Step "DB container '$DbContainer' khong dang chay."
        return
    }

    Write-Step "Dang dung DB container '$DbContainer'..."
    $null = docker stop $DbContainer 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Step "Da dung DB container '$DbContainer'."
    }
    else {
        Write-Warn "Khong the dung DB container '$DbContainer'."
    }
}

Write-Step "Bat dau dung he thong FE + BE + AI + DB"

# Dung theo command line pattern truoc
Stop-ProcessesByCommandLine -Pattern "npm run dev|vite" -Label "Frontend"
Stop-ProcessesByCommandLine -Pattern "spring-boot-maven-plugin:run|mvn spring-boot:run" -Label "Backend"
Stop-ProcessesByCommandLine -Pattern "uvicorn app\.main:app" -Label "Python AI Service"

# Dung theo cong de dam bao khong sot process
Stop-ProcessesByPort -Port 5173 -Label "Frontend"
Stop-ProcessesByPort -Port 8080 -Label "Backend"
Stop-ProcessesByPort -Port 8001 -Label "Python AI Service"

# Dung DB container neu khong yeu cau giu lai
Stop-DatabaseContainer

Write-Step "Hoan tat."
Write-Host "Neu muon giu DB khi stop, chay: .\stop-system.ps1 -KeepDatabase" -ForegroundColor DarkYellow
