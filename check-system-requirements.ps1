$ErrorActionPreference = "Stop"

# Avoid treating stderr text from native commands as terminating errors.
if ($null -ne (Get-Variable -Name PSNativeCommandUseErrorActionPreference -ErrorAction SilentlyContinue)) {
    $PSNativeCommandUseErrorActionPreference = $false
}

function Write-Step {
    param([string]$Message)
    Write-Host "[CHECK] $Message" -ForegroundColor Cyan
}

function Write-Ok {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Test-Command {
    param(
        [string]$Name,
        [string]$InstallHint
    )

    $cmd = Get-Command $Name -ErrorAction SilentlyContinue
    if ($null -eq $cmd) {
        Write-Warn "Thieu: $Name"
        Write-Host "       Cai goi y: $InstallHint" -ForegroundColor DarkYellow
        return $false
    }

    Write-Ok "Da co: $Name"
    return $true
}

function Show-Version {
    param(
        [string]$Label,
        [scriptblock]$Action
    )

    try {
        $result = & $Action 2>$null
        if ($LASTEXITCODE -eq 0 -and $result) {
            $firstLine = ($result | Select-Object -First 1)
            Write-Host "  - ${Label}: $firstLine" -ForegroundColor Gray
        }
    }
    catch {
        # Ignore version lookup failures.
    }
}

Write-Step "Kiem tra yeu cau he thong cho Luxury E-Commerce"

$missing = @()

if (-not (Test-Command -Name "git" -InstallHint "winget install --id Git.Git -e")) { $missing += "git" }
if (-not (Test-Command -Name "node" -InstallHint "winget install --id OpenJS.NodeJS.LTS -e")) { $missing += "node" }
if (-not (Test-Command -Name "npm" -InstallHint "Di kem Node.js LTS")) { $missing += "npm" }
if (-not (Test-Command -Name "java" -InstallHint "winget install --id EclipseAdoptium.Temurin.17.JDK -e")) { $missing += "java" }
if (-not (Test-Command -Name "mvn" -InstallHint "winget install --id Apache.Maven -e")) { $missing += "mvn" }
if (-not (Test-Command -Name "python" -InstallHint "winget install --id Python.Python.3.11 -e")) { $missing += "python" }

$hasDocker = Test-Command -Name "docker" -InstallHint "winget install --id Docker.DockerDesktop -e"
if (-not $hasDocker) {
    $missing += "docker (khuyen nghi)"
}

Write-Step "Kiem tra version"
Show-Version -Label "node" -Action { node --version }
Show-Version -Label "npm" -Action { npm --version }
Show-Version -Label "java" -Action { java -version }
Show-Version -Label "maven" -Action { mvn -version }
Show-Version -Label "python" -Action { python --version }

if ($hasDocker) {
    $previousErrorActionPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = "Continue"
        $dockerInfo = docker info 2>&1
        $dockerExitCode = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }

    if ($dockerExitCode -eq 0) {
        Write-Ok "Docker daemon dang san sang"
        Show-Version -Label "docker" -Action { docker --version }
    }
    else {
        Write-Warn "Da cai docker nhung daemon chua san sang. Hay mo Docker Desktop."
    }
}

Write-Step "Kiem tra file can thiet trong du an"
$requiredFiles = @(
    "run-system.ps1",
    "stop-system.ps1",
    "package.json",
    "backend/pom.xml",
    "backend/src/main/resources/application.properties",
    "backend/src/main/resources/schema.sql",
    "ai_advisor_service/requirements.txt",
    "ai_advisor_service/app/main.py"
)

$fileMissing = @()
foreach ($path in $requiredFiles) {
    if (Test-Path $path) {
        Write-Ok "Co file: $path"
    }
    else {
        Write-Warn "Thieu file: $path"
        $fileMissing += $path
    }
}

Write-Host ""
if ($missing.Count -eq 0 -and $fileMissing.Count -eq 0) {
    Write-Ok "May da du dieu kien co ban de chay he thong."
    Write-Host "Chay: powershell -ExecutionPolicy Bypass -File .\\run-system.ps1" -ForegroundColor Green
}
else {
    Write-Warn "Con thieu mot so thanh phan truoc khi chay he thong."
    if ($missing.Count -gt 0) {
        Write-Host "- Cong cu thieu: $($missing -join ', ')" -ForegroundColor Yellow
    }
    if ($fileMissing.Count -gt 0) {
        Write-Host "- File du an thieu: $($fileMissing -join ', ')" -ForegroundColor Yellow
    }
    Write-Host "Sau khi bo sung day du, chay lai script nay de kiem tra." -ForegroundColor DarkYellow
}
