# ─────────────────────────────────────────────────────────────────────────────
# AmneziaWG Architect — Local Server Launcher (Windows PowerShell)
#
# Автоматически находит доступный способ запустить статический сервер:
#   1. bun   → bunx serve dist
#   2. npx   → npx serve dist
#   3. python → python -m http.server
#   4. Если ничего нет → скачивает bun и использует его
# ─────────────────────────────────────────────────────────────────────────────
param(
    [int]$Port = 8080
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$DistDir = Join-Path $RootDir "dist"

function Write-Info($msg)  { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Ok($msg)    { Write-Host "[OK]   $msg" -ForegroundColor Green }
function Write-Warn($msg)  { Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Fail($msg)  { Write-Host "[FAIL] $msg" -ForegroundColor Red; exit 1 }

# ── Проверка dist ────────────────────────────────────────────────────────────
if (-not (Test-Path (Join-Path $DistDir "index.html"))) {
    Write-Fail "Папка dist/ не найдена или пуста. Сначала выполните сборку: bun run build"
}

$distSize = "{0:N1} MB" -f ((Get-ChildItem $DistDir -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB)
Write-Ok "Найден dist/ ($distSize)"
Write-Host ""

# ── Попытка 1: bun ──────────────────────────────────────────────────────────
$bunPath = Get-Command bun -ErrorAction SilentlyContinue
if ($bunPath) {
    $bunVer = & bun --version 2>$null
    Write-Ok "Найден bun $bunVer"
    Write-Info "Запуск: bunx serve dist -l $Port"
    Write-Host "-> http://localhost:$Port" -ForegroundColor Green
    Write-Host ""
    Set-Location $RootDir
    & bun x serve dist -l $Port --single
    exit $LASTEXITCODE
}

# ── Попытка 2: npx (Node.js) ────────────────────────────────────────────────
$npxPath = Get-Command npx -ErrorAction SilentlyContinue
if ($npxPath) {
    $nodeVer = & node --version 2>$null
    Write-Ok "Найден npx ($nodeVer)"
    Write-Info "Запуск: npx serve dist -l $Port"
    Write-Host "-> http://localhost:$Port" -ForegroundColor Green
    Write-Host ""
    Set-Location $RootDir
    & npx serve dist -l $Port --single
    exit $LASTEXITCODE
}

# ── Попытка 3: Python ───────────────────────────────────────────────────────
$pythonCmd = $null
foreach ($cmd in @("python3", "python")) {
    $p = Get-Command $cmd -ErrorAction SilentlyContinue
    if ($p) {
        $ver = & $cmd -c "import sys; print(sys.version_info.major)" 2>$null
        if ($ver -eq "3") {
            $pythonCmd = $cmd
            break
        }
    }
}

if ($pythonCmd) {
    $pyVer = & $pythonCmd --version 2>&1
    Write-Ok "Найден $pythonCmd ($pyVer)"
    Write-Info "Запуск: $pythonCmd -m http.server $Port -d dist"
    Write-Warn "Python http.server не поддерживает SPA fallback — глубокие ссылки могут не работать"
    Write-Host "-> http://localhost:$Port" -ForegroundColor Green
    Write-Host ""
    Set-Location $RootDir
    & $pythonCmd -m http.server $Port -d dist
    exit $LASTEXITCODE
}

# ── Попытка 4: Установить bun ───────────────────────────────────────────────
Write-Warn "Не найдено ни одного пакетного менеджера (bun, npm, python3)"
Write-Info "Устанавливаю bun..."
Write-Host ""

try {
    irm bun.sh/install.ps1 | iex
} catch {
    Write-Fail "Не удалось установить bun. Установите вручную: https://bun.sh"
}

# Обновить PATH
$env:PATH = "$env:USERPROFILE\.bun\bin;$env:PATH"

$bunCheck = Get-Command bun -ErrorAction SilentlyContinue
if ($bunCheck) {
    $bunVer = & bun --version 2>$null
    Write-Ok "bun установлен ($bunVer)"
    Write-Info "Запуск: bunx serve dist -l $Port"
    Write-Host "-> http://localhost:$Port" -ForegroundColor Green
    Write-Host ""
    Set-Location $RootDir
    & bun x serve dist -l $Port --single
    exit $LASTEXITCODE
} else {
    Write-Fail "Не удалось установить bun. Установите вручную: https://bun.sh"
}
