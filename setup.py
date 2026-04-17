#!/usr/bin/env python3
"""
CropSense Setup & Model Checker
================================
Run this script on any new system to verify that all required model files
are present BEFORE starting the application. No retraining needed if you
copy the model file from your original machine.

Usage:
    python setup.py             # Check status only
    python setup.py --train     # Check + auto-train if model is missing
"""

import os
import sys
import argparse
import subprocess

BASE_DIR       = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH     = os.path.join(BASE_DIR, "model", "crop_disease_model.keras")
INDICES_PATH   = os.path.join(BASE_DIR, "model", "class_indices.json")
DATASET_PATH   = os.path.join(BASE_DIR, "DataSet", "Crop Diseases")
TRAIN_SCRIPT   = os.path.join(BASE_DIR, "model", "train.py")


def check_model():
    if os.path.exists(MODEL_PATH):
        size_mb = os.path.getsize(MODEL_PATH) / (1024 * 1024)
        print(f"  [OK] crop_disease_model.keras found  ({size_mb:.0f} MB)")
        return True
    print("  [MISSING] model/crop_disease_model.keras")
    return False


def check_indices():
    if os.path.exists(INDICES_PATH):
        print("  [OK] class_indices.json found")
        return True
    print("  [MISSING] model/class_indices.json")
    return False


def check_dataset():
    if os.path.exists(DATASET_PATH):
        classes = [
            d for d in os.listdir(DATASET_PATH)
            if os.path.isdir(os.path.join(DATASET_PATH, d))
        ]
        print(f"  [OK] Dataset found  ({len(classes)} classes)")
        return True
    print("  [NOT FOUND] DataSet/Crop Diseases/  (only needed for training)")
    return False


def run_training():
    print("\nStarting model training — this may take several minutes...\n")
    model_dir = os.path.join(BASE_DIR, "model")
    result = subprocess.run(
        [sys.executable, TRAIN_SCRIPT],
        cwd=model_dir   # train.py saves files relative to its own directory
    )
    if result.returncode == 0:
        print("\n[SUCCESS] Model saved to model/crop_disease_model.keras")
    else:
        print("\n[ERROR] Training failed. See output above.")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description="CropSense setup checker")
    parser.add_argument(
        "--train", action="store_true",
        help="Automatically train the model if it is missing"
    )
    args = parser.parse_args()

    print()
    print("=" * 52)
    print("  CropSense  —  Setup & Model Check")
    print("=" * 52)
    print()

    print("Checking model files:")
    model_ok   = check_model()
    indices_ok = check_indices()

    print("\nChecking dataset:")
    dataset_ok = check_dataset()

    print()

    # ------------------------------------------------------------------ #
    #  All good — ready to run                                            #
    # ------------------------------------------------------------------ #
    if model_ok and indices_ok:
        print("All required files are present.")
        print("You can start the application now:\n")
        print("  Backend  →  cd backend && python -m uvicorn main:app --reload")
        print("  Frontend →  cd frontend && npm run dev")
        print()
        print("  Or just run:  start.bat  (Windows)  /  ./start.sh  (Linux/Mac)")
        sys.exit(0)

    # ------------------------------------------------------------------ #
    #  Files missing                                                       #
    # ------------------------------------------------------------------ #
    print("Some required model files are missing.\n")

    if args.train:
        if dataset_ok:
            run_training()
        else:
            print("ERROR: --train flag used but no dataset found.")
            print(f"  Expected: {DATASET_PATH}")
            sys.exit(1)
    else:
        print("  HOW TO FIX — choose one option:\n")
        print("  OPTION 1  Copy from the machine where the model was trained")
        print("  ─────────────────────────────────────────────────────────")
        print("  Copy both files into the  model/  folder of this project:")
        print("    • model/crop_disease_model.keras   (~509 MB)")
        print("    • model/class_indices.json         (< 1 KB)")
        print()
        print("  OPTION 2  Retrain (requires the dataset to be present)")
        print("  ─────────────────────────────────────────────────────────")
        print("    python setup.py --train")
        print()
        sys.exit(1)


if __name__ == "__main__":
    main()
