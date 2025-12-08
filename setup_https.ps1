
Write-Host "Setting up HTTPS for Local Development..." -ForegroundColor Cyan

# 1. Check for mkcert presence
if (-not (Get-Command mkcert -ErrorAction SilentlyContinue)) {
    Write-Host "mkcert command not found." -ForegroundColor Yellow
    Write-Host "Attempting to install via Chocolatey..."
    try {
        choco install mkcert -y
    } catch {
        Write-Host "Failed to run chocolatey. Please install mkcert manually." -ForegroundColor Red
        exit 1
    }
}

# 2. Install CA
Write-Host "Installing Local CA..." -ForegroundColor Green
mkcert -install

# 3. Generate Certificates
Write-Host "Generating Certificates for localhost..." -ForegroundColor Green
mkcert localhost 127.0.0.1 ::1

# 4. Rename and cleanup
if (Test-Path "localhost+2.pem") {
    Move-Item -Path "localhost+2.pem" -Destination "localhost.pem" -Force
    Write-Host "Created localhost.pem"
}
if (Test-Path "localhost+2-key.pem") {
    Move-Item -Path "localhost+2-key.pem" -Destination "localhost-key.pem" -Force
    Write-Host "Created localhost-key.pem"
}

Write-Host "------------------------------------------------" -ForegroundColor Cyan
Write-Host "HTTPS Setup Complete!" -ForegroundColor Green
Write-Host "1. vite.config.js has been configured to use these certificates."
Write-Host "2. Please manually update your .env file:"
Write-Host "   APP_URL=https://localhost" -ForegroundColor Yellow
Write-Host "3. Restart your development server (npm run dev)."
