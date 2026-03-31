# Script para detectar imports duplicados en archivos PHP
# Uso: .\scripts\check-duplicate-imports.ps1

Write-Host "Buscando imports duplicados en archivos PHP..." -ForegroundColor Cyan
Write-Host ""

$foundDuplicates = $false

# Buscar en todos los archivos PHP
Get-ChildItem -Path "app" -Filter "*.php" -Recurse | ForEach-Object {
    $file = $_.FullName
    $relativePath = $file.Replace((Get-Location).Path + "\", "")
    
    # Leer el archivo y extraer lineas de use
    $uses = Get-Content $file | Where-Object { $_ -match "^use " }
    
    if ($uses.Count -gt 0) {
        # Agrupar y contar
        $grouped = $uses | Group-Object | Where-Object { $_.Count -gt 1 }
        
        if ($grouped) {
            $foundDuplicates = $true
            Write-Host "Duplicados encontrados en: $relativePath" -ForegroundColor Red
            
            foreach ($dup in $grouped) {
                Write-Host "   - $($dup.Name) (aparece $($dup.Count) veces)" -ForegroundColor Yellow
            }
            
            Write-Host ""
        }
    }
}

if (-not $foundDuplicates) {
    Write-Host "No se encontraron imports duplicados" -ForegroundColor Green
    exit 0
} else {
    Write-Host "Se encontraron imports duplicados. Por favor, corrigelos." -ForegroundColor Yellow
    exit 1
}
