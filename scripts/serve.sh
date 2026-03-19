#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# AmneziaWG Architect — Local Server Launcher (Linux / macOS)
#
# Автоматически находит доступный способ запустить статический сервер:
#   1. bun   → bunx serve dist
#   2. npx   → npx serve dist
#   3. python3 / python → python -m http.server
#   4. Если ничего нет → скачивает bun и использует его
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"
PORT="${1:-8080}"

# ── Цвета ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
AMBER='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC} $*"; }
ok()    { echo -e "${GREEN}[OK]${NC} $*"; }
warn()  { echo -e "${AMBER}[WARN]${NC} $*"; }
fail()  { echo -e "${RED}[FAIL]${NC} $*"; exit 1; }

# ── Проверка dist ────────────────────────────────────────────────────────────
if [ ! -d "$DIST_DIR" ] || [ ! -f "$DIST_DIR/index.html" ]; then
    fail "Папка dist/ не найдена или пуста. Сначала выполните сборку: bun run build"
fi

ok "Найден dist/ ($(du -sh "$DIST_DIR" | cut -f1))"
echo ""

# ── Попытка 1: bun ──────────────────────────────────────────────────────────
if command -v bun &>/dev/null; then
    ok "Найден bun $(bun --version)"
    info "Запуск: bunx serve dist -l $PORT"
    echo -e "${GREEN}→ http://localhost:${PORT}${NC}"
    echo ""
    cd "$ROOT_DIR"
    exec bun x serve dist -l "$PORT" --single
fi

# ── Попытка 2: npx (Node.js) ────────────────────────────────────────────────
if command -v npx &>/dev/null; then
    ok "Найден npx ($(node --version 2>/dev/null || echo 'node'))"
    info "Запуск: npx serve dist -l $PORT"
    echo -e "${GREEN}→ http://localhost:${PORT}${NC}"
    echo ""
    cd "$ROOT_DIR"
    exec npx serve dist -l "$PORT" --single
fi

# ── Попытка 3: Python ───────────────────────────────────────────────────────
PYTHON_CMD=""
if command -v python3 &>/dev/null; then
    PYTHON_CMD="python3"
elif command -v python &>/dev/null; then
    # Убедимся что это Python 3
    PY_VER=$(python -c "import sys; print(sys.version_info.major)" 2>/dev/null || echo "2")
    if [ "$PY_VER" = "3" ]; then
        PYTHON_CMD="python"
    fi
fi

if [ -n "$PYTHON_CMD" ]; then
    ok "Найден $PYTHON_CMD ($($PYTHON_CMD --version 2>&1))"
    info "Запуск: $PYTHON_CMD -m http.server $PORT -d dist"
    warn "Python http.server не поддерживает SPA fallback — глубокие ссылки могут не работать"
    echo -e "${GREEN}→ http://localhost:${PORT}${NC}"
    echo ""
    cd "$ROOT_DIR"
    exec "$PYTHON_CMD" -m http.server "$PORT" -d dist
fi

# ── Попытка 4: Установить bun ───────────────────────────────────────────────
warn "Не найдено ни одного пакетного менеджера (bun, npm, python3)"
info "Устанавливаю bun..."
echo ""

if command -v curl &>/dev/null; then
    curl -fsSL https://bun.sh/install | bash
elif command -v wget &>/dev/null; then
    wget -qO- https://bun.sh/install | bash
else
    fail "Для установки bun нужен curl или wget. Установите один из них и повторите."
fi

# Подхватить bun из ~/.bun/bin
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

if command -v bun &>/dev/null; then
    ok "bun установлен ($(bun --version))"
    info "Запуск: bunx serve dist -l $PORT"
    echo -e "${GREEN}→ http://localhost:${PORT}${NC}"
    echo ""
    cd "$ROOT_DIR"
    exec bun x serve dist -l "$PORT" --single
else
    fail "Не удалось установить bun. Установите вручную: https://bun.sh"
fi
