param(
    [string]$DbContainer = "luxury-postgres",
    [string]$DbName = "luxury_ecommerce",
    [string]$DbUser = "postgres",
    [string]$DbPassword = "postgres",
    [int]$DbPort = 5432,
    [switch]$ResetData
)

$ErrorActionPreference = "Stop"

$script:UseDockerDatabase = $true

# Avoid treating stderr text from native tools (docker, mvn, npm) as terminating errors.
if ($null -ne (Get-Variable -Name PSNativeCommandUseErrorActionPreference -ErrorAction SilentlyContinue)) {
    $PSNativeCommandUseErrorActionPreference = $false
}

function Write-Step {
    param([string]$Message)
    Write-Host "[RUN-SYSTEM] $Message" -ForegroundColor Cyan
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[RUN-SYSTEM] $Message" -ForegroundColor Yellow
}

function Require-Command {
    param([string]$CommandName)

    if (-not (Get-Command $CommandName -ErrorAction SilentlyContinue)) {
        throw "Khong tim thay lenh '$CommandName'. Vui long cai dat truoc khi chay script."
    }
}

function Invoke-Docker {
    param(
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$Arguments
    ) 
    $previousErrorActionPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = "Continue"
        $output = & docker @Arguments 2>&1
        $exitCode = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }

    $global:LASTEXITCODE = $exitCode
    return $output
}

function Wait-ForDockerReady {
    param(
        [int]$MaxAttempts = 45,
        [int]$DelaySeconds = 2
    )

    $currentContext = ""
    $contexts = @()
    $lastError = ""
    $canFallbackToDesktopLinux = $false

    $contextOutput = Invoke-Docker "context" "show"
    if ($LASTEXITCODE -eq 0) {
        $currentContext = ($contextOutput -join "").Trim()
    }

    $contextsOutput = Invoke-Docker "context" "ls" "--format" "{{.Name}}"
    if ($LASTEXITCODE -eq 0) {
        $contexts = @($contextsOutput)
    }

    $canFallbackToDesktopLinux = ($contexts -contains "desktop-linux") -and ($currentContext -ne "desktop-linux")

    for ($i = 1; $i -le $MaxAttempts; $i++) {
        $null = Invoke-Docker "info"
        if ($LASTEXITCODE -eq 0) {
            return
        }

        $probe = Invoke-Docker "info"

        $lastError = ($probe | Out-String).Trim()

        if ($canFallbackToDesktopLinux -and $i -eq 5) {
            Write-Warn "Docker context hien tai '$currentContext' chua san sang, thu chuyen sang 'desktop-linux'..."
            $switchOutput = Invoke-Docker "context" "use" "desktop-linux"
            if ($LASTEXITCODE -eq 0) {
                Write-Step "Da chuyen Docker context sang desktop-linux."
                $canFallbackToDesktopLinux = $false
            }
            else {
                $switchError = ($switchOutput | Out-String).Trim()
                Write-Warn "Khong the chuyen context tu dong: $switchError"
                $canFallbackToDesktopLinux = $false
            }
        }

        Start-Sleep -Seconds $DelaySeconds
    }

    if (-not $lastError) {
        $lastError = "Khong nhan duoc phan hoi tu Docker daemon."
    }

    throw "Docker daemon chua san sang sau $($MaxAttempts * $DelaySeconds) giay. Chi tiet: $lastError"
}

function Is-PortInUse {
    param([int]$Port)

    $conn = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue
    return $null -ne $conn
}

function Start-Database {
    Write-Step "Kiem tra Docker va container PostgreSQL..."

    Require-Command "docker"
    Wait-ForDockerReady

    $existing = Invoke-Docker "ps" "-a" "--filter" "name=^${DbContainer}$" "--format" "{{.Names}}"
    if ($LASTEXITCODE -ne 0) {
        $message = ($existing | Out-String).Trim()
        throw "Khong the lay thong tin Docker container. Chi tiet: $message"
    }

    if (-not $existing) {
        if (Is-PortInUse -Port $DbPort) {
            Write-Warn "Port $DbPort dang duoc su dung. Se dung PostgreSQL dang chay san tren localhost:$DbPort."
            $script:UseDockerDatabase = $false
            return
        }

        Write-Step "Tao container PostgreSQL moi: $DbContainer"
        $runResult = Invoke-Docker "run" "-d" `
            "--name" $DbContainer `
            "-e" "POSTGRES_DB=$DbName" `
            "-e" "POSTGRES_USER=$DbUser" `
            "-e" "POSTGRES_PASSWORD=$DbPassword" `
            "-p" "${DbPort}:5432" `
            "postgres:16"

        if ($LASTEXITCODE -ne 0) {
            $message = ($runResult | Out-String).Trim()
            throw "Khong the tao container PostgreSQL. Chi tiet: $message"
        }
    }
    else {
        $isRunning = Invoke-Docker "ps" "--filter" "name=^${DbContainer}$" "--format" "{{.Names}}"
        if ($LASTEXITCODE -ne 0) {
            $message = ($isRunning | Out-String).Trim()
            throw "Khong the kiem tra trang thai container DB. Chi tiet: $message"
        }

        if (-not $isRunning) {
            Write-Step "Khoi dong lai container DB: $DbContainer"
            $startResult = Invoke-Docker "start" $DbContainer
            if ($LASTEXITCODE -ne 0) {
                $message = ($startResult | Out-String).Trim()
                throw "Khong the khoi dong container DB. Chi tiet: $message"
            }
        }
        else {
            Write-Step "Container DB dang chay: $DbContainer"
        }
    }

    Write-Step "Doi PostgreSQL san sang..."
    $ready = $false
    for ($i = 1; $i -le 30; $i++) {
        $probe = Invoke-Docker "exec" $DbContainer "pg_isready" "-U" $DbUser "-d" $DbName
        if ($LASTEXITCODE -eq 0) {
            $ready = $true
            break
        }
        Start-Sleep -Seconds 1
    }

    if (-not $ready) {
        throw "PostgreSQL khong san sang sau 30 giay."
    }

    Write-Step "PostgreSQL da san sang tren localhost:$DbPort"
    $script:UseDockerDatabase = $true
}

function Seed-DatabaseIfNeeded {
    $schemaPath = Join-Path $PSScriptRoot "backend\src\main\resources\schema.sql"
    if (-not (Test-Path $schemaPath)) {
        Write-Warn "Khong tim thay schema.sql. Bo qua buoc seed du lieu."
        return
    }

    if ($script:UseDockerDatabase) {
        $tableExistsRaw = Invoke-Docker "exec" $DbContainer "psql" "-U" $DbUser "-d" $DbName "-tAc" "SELECT to_regclass('public.users') IS NOT NULL;"
        if ($LASTEXITCODE -ne 0) {
            $message = ($tableExistsRaw | Out-String).Trim()
            throw "Khong the kiem tra bang users trong DB. Chi tiet: $message"
        }

        $tableExists = ($tableExistsRaw -join "").Trim() -eq "t"
    }
    else {
        Write-Step "Dang dung PostgreSQL ben ngoai Docker. Thu kiem tra schema qua psql..."

        if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
            Write-Warn "Khong tim thay psql. Bo qua seed tu dong cho DB local."
            return
        }

        $previousPgPassword = $env:PGPASSWORD
        $previousErrorActionPreference = $ErrorActionPreference
        try {
            $env:PGPASSWORD = $DbPassword
            $ErrorActionPreference = "Continue"
            $tableExistsRaw = psql -h localhost -p $DbPort -U $DbUser -d $DbName -tAc "SELECT to_regclass('public.users') IS NOT NULL;" 2>$null
            $checkExitCode = $LASTEXITCODE
        }
        finally {
            $ErrorActionPreference = $previousErrorActionPreference
            $env:PGPASSWORD = $previousPgPassword
        }

        if ($checkExitCode -ne 0) {
            Write-Warn "Khong the truy van DB local de kiem tra schema. Bo qua seed tu dong."
            return
        }

        $tableExists = ($tableExistsRaw -join "").Trim() -eq "t"
    }

    if ($ResetData -or -not $tableExists) {
        if ($ResetData) {
            Write-Step "Reset data duoc bat. Dang nap lai schema.sql..."
        }
        else {
            Write-Step "Chua co bang users. Dang khoi tao schema.sql..."
        }

        if ($script:UseDockerDatabase) {
            $previousErrorActionPreference = $ErrorActionPreference
            try {
                $ErrorActionPreference = "Continue"
                Get-Content -Raw $schemaPath | docker exec -i $DbContainer psql -U $DbUser -d $DbName | Out-Null
                $seedExitCode = $LASTEXITCODE
            }
            finally {
                $ErrorActionPreference = $previousErrorActionPreference
            }
        }
        else {
            $previousPgPassword = $env:PGPASSWORD
            $previousErrorActionPreference = $ErrorActionPreference
            try {
                $env:PGPASSWORD = $DbPassword
                $ErrorActionPreference = "Continue"
                Get-Content -Raw $schemaPath | psql -h localhost -p $DbPort -U $DbUser -d $DbName | Out-Null
                $seedExitCode = $LASTEXITCODE
            }
            finally {
                $ErrorActionPreference = $previousErrorActionPreference
                $env:PGPASSWORD = $previousPgPassword
            }
        }

        if ($seedExitCode -ne 0) {
            throw "Khong the nap schema vao PostgreSQL."
        }

        Write-Step "Da nap schema va du lieu mau thanh cong."
    }
    else {
        Write-Step "DB da co du lieu nen bo qua buoc seed."
    }
}

function Ensure-FrontendDeps {
    Write-Step "Kiem tra frontend dependencies..."
    $nodeModules = Join-Path $PSScriptRoot "node_modules"

    if (-not (Test-Path $nodeModules)) {
        Require-Command "npm"
        Write-Step "Dang cai npm packages..."
        Push-Location $PSScriptRoot
        try {
            npm install
            if ($LASTEXITCODE -ne 0) {
                throw "npm install that bai."
            }
        }
        finally {
            Pop-Location
        }
    }
    else {
        Write-Step "Frontend dependencies da san sang."
    }
}

function Start-PythonAdvisorService {
    $pythonServicePath = Join-Path $PSScriptRoot "ai_advisor_service"
    $pythonEntryPoint = Join-Path $pythonServicePath "app\main.py"

    if (-not (Test-Path $pythonServicePath) -or -not (Test-Path $pythonEntryPoint)) {
        Write-Warn "Khong tim thay Python AI advisor service. Bo qua buoc khoi dong AI Python."
        return
    }

    if (Is-PortInUse -Port 8001) {
        Write-Step "Python AI advisor da dang chay tren cong 8001."
        return
    }

    if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
        Write-Warn "Khong tim thay lenh python. Bo qua khoi dong AI Python."
        return
    }

    Write-Step "Mo terminal Python AI advisor (FastAPI)..."
    $pythonCommand = @"
Set-Location '$pythonServicePath'
if (-not (Test-Path '.venv\Scripts\python.exe')) {
    python -m venv .venv
}
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8001
"@

    Start-Process powershell -ArgumentList "-NoExit", "-Command", $pythonCommand | Out-Null
}

function Start-Backend {
    $backendPath = Join-Path $PSScriptRoot "backend"
    $backendPom = Join-Path $backendPath "pom.xml"
    if (-not (Test-Path $backendPath)) {
        throw "Khong tim thay thu muc backend."
    }

    if (-not (Test-Path $backendPom)) {
        throw "Khong tim thay file pom.xml trong backend."
    }

    if (Is-PortInUse -Port 8080) {
        Write-Warn "Port 8080 dang su dung. Bo qua khoi dong backend moi."
        return
    }

    Require-Command "mvn"

    Write-Step "Mo terminal backend..."
    # Use explicit pom path and fully-qualified plugin goal so startup does not depend on current directory.
    $backendCommand = "mvn -f '$backendPom' org.springframework.boot:spring-boot-maven-plugin:run"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCommand | Out-Null
}

function Start-Frontend {
    if (Is-PortInUse -Port 5173) {
        Write-Warn "Port 5173 dang su dung. Bo qua khoi dong frontend moi."
        return
    }

    Write-Step "Mo terminal frontend..."
    $frontendCommand = "Set-Location '$PSScriptRoot'; npm run dev"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCommand | Out-Null
}

Write-Step "Bat dau chay nhanh he thong FE + BE + DB"
Start-Database
Seed-DatabaseIfNeeded
Ensure-FrontendDeps
Start-PythonAdvisorService
Start-Backend
Start-Frontend

Write-Step "Hoan tat!"
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "Backend : http://localhost:8080" -ForegroundColor Green
Write-Host "AI Python Service: http://localhost:8001" -ForegroundColor Green
if ($script:UseDockerDatabase) {
    Write-Host "Database: localhost:$DbPort (container: $DbContainer)" -ForegroundColor Green
}
else {
    Write-Host "Database: localhost:$DbPort (external/local PostgreSQL)" -ForegroundColor Green
}
Write-Host ""
Write-Host "Neu muon nap lai du lieu mau, chay: .\run-system.ps1 -ResetData" -ForegroundColor DarkYellow
