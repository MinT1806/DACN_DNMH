$ErrorActionPreference = "Stop"

Write-Host "[DOCKER-RUN] Start full system with Docker Compose" -ForegroundColor Cyan

docker compose up --build -d
if ($LASTEXITCODE -ne 0) {
    throw "Khong the khoi dong docker compose."
}

Write-Host "[DOCKER-RUN] Hoan tat" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "Backend : http://localhost:8080" -ForegroundColor Green
Write-Host "AI API  : http://localhost:8001" -ForegroundColor Green
