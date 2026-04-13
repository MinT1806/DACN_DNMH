$ErrorActionPreference = "Stop"

Write-Host "[DOCKER-STOP] Stop full system with Docker Compose" -ForegroundColor Cyan

docker compose down
if ($LASTEXITCODE -ne 0) {
    throw "Khong the dung docker compose."
}

Write-Host "[DOCKER-STOP] Hoan tat" -ForegroundColor Green
Write-Host "Neu muon xoa ca volume DB, chay: docker compose down -v" -ForegroundColor DarkYellow
