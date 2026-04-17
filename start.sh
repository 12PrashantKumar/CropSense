#!/usr/bin/env bash
# CropSense startup script (Linux / macOS)
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo " ========================================="
echo "  CropSense  |  Starting Application"
echo " ========================================="
echo ""

# ── Check model file ──────────────────────────────────────────────────
if [ ! -f "$SCRIPT_DIR/model/crop_disease_model.keras" ]; then
    echo " [ERROR] Model file missing: model/crop_disease_model.keras"
    echo ""
    echo " Fix options:"
    echo "   1. Copy crop_disease_model.keras into the model/ folder"
    echo "   2. Run:  python setup.py --train   (needs dataset)"
    echo ""
    exit 1
fi

if [ ! -f "$SCRIPT_DIR/model/class_indices.json" ]; then
    echo " [ERROR] Class indices missing: model/class_indices.json"
    echo " Copy this file from the machine where the model was trained."
    echo ""
    exit 1
fi

echo " [OK] Model files found."
echo ""

# ── Start Backend ─────────────────────────────────────────────────────
echo " Starting backend on http://localhost:8000 ..."
cd "$SCRIPT_DIR/backend"
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# ── Start Frontend ────────────────────────────────────────────────────
echo " Starting frontend on http://localhost:3000 ..."
cd "$SCRIPT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo " Both servers are running."
echo " Open your browser at:  http://localhost:3000"
echo " Press Ctrl+C to stop both."
echo ""

# Wait and handle Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo ''; echo ' Stopped.'; exit 0" INT
wait
