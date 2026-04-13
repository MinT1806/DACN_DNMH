param(
	[switch]$SkipGit,
	[switch]$SkipNode,
	[switch]$SkipJava,
	[switch]$SkipMaven,
	[switch]$SkipDocker,
	[switch]$SkipPython,
	[switch]$AcceptPackageAgreements,
	[switch]$AcceptSourceAgreements
)

$ErrorActionPreference = "Stop"

function Write-Step {
	param([string]$Message)
	Write-Host "[INSTALL] $Message" -ForegroundColor Cyan
}

function Write-Ok {
	param([string]$Message)
	Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Warn {
	param([string]$Message)
	Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Test-CommandAvailable {
	param([string]$Name)
	return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

function Install-IfMissing {
	param(
		[string]$Name,
		[string]$CommandName,
		[string]$WingetId
	)

	if (Test-CommandAvailable -Name $CommandName) {
		Write-Ok "$Name da ton tai ($CommandName)."
		return
	}

	if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
		throw "Khong tim thay winget de cai $Name. Hay cai App Installer tu Microsoft Store truoc."
	}

	Write-Step "Dang cai $Name..."

	$args = @(
		"install",
		"--id", $WingetId,
		"-e",
		"--silent"
	)

	if ($AcceptPackageAgreements) {
		$args += "--accept-package-agreements"
	}

	if ($AcceptSourceAgreements) {
		$args += "--accept-source-agreements"
	}

	& winget @args
	if ($LASTEXITCODE -ne 0) {
		throw "Cai dat $Name that bai (winget id: $WingetId)."
	}

	Write-Ok "Da cai $Name."
}

Write-Step "Bat dau cai prerequisites cho he thong Luxury E-Commerce"

if (-not $SkipGit) {
	Install-IfMissing -Name "Git" -CommandName "git" -WingetId "Git.Git"
}
else {
	Write-Warn "Bo qua Git theo yeu cau."
}

if (-not $SkipNode) {
	Install-IfMissing -Name "Node.js LTS" -CommandName "node" -WingetId "OpenJS.NodeJS.LTS"
}
else {
	Write-Warn "Bo qua Node.js theo yeu cau."
}

if (-not $SkipJava) {
	Install-IfMissing -Name "JDK 17 (Temurin)" -CommandName "java" -WingetId "EclipseAdoptium.Temurin.17.JDK"
}
else {
	Write-Warn "Bo qua Java theo yeu cau."
}

if (-not $SkipMaven) {
	Install-IfMissing -Name "Apache Maven" -CommandName "mvn" -WingetId "Apache.Maven"
}
else {
	Write-Warn "Bo qua Maven theo yeu cau."
}

if (-not $SkipDocker) {
	Install-IfMissing -Name "Docker Desktop" -CommandName "docker" -WingetId "Docker.DockerDesktop"
}
else {
	Write-Warn "Bo qua Docker theo yeu cau."
}

if (-not $SkipPython) {
	Install-IfMissing -Name "Python 3.11" -CommandName "python" -WingetId "Python.Python.3.11"
}
else {
	Write-Warn "Bo qua Python theo yeu cau."
}

Write-Step "Hoan tat cai dat prerequisites."
Write-Host "Hay dong/mo lai terminal de cap nhat PATH neu can." -ForegroundColor DarkYellow
Write-Host "Sau do chay: powershell -ExecutionPolicy Bypass -File .\\check-system-requirements.ps1" -ForegroundColor Green
