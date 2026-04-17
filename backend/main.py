from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
import uvicorn
import os
import shutil
from datetime import timedelta
import uuid
import json
import numpy as np
from PIL import Image
import tensorflow as tf

import models
from database import engine, get_db
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from pydantic import BaseModel
from typing import List, Optional

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Crop Disease Detection API")

# Configure CORS — allow local dev + any Vercel deployment
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
]
FRONTEND_URL = os.getenv("FRONTEND_URL", "")
if FRONTEND_URL:
    ALLOWED_ORIGINS.append(FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# --- Load ML Model ---
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "model", "crop_disease_model.keras")
CLASS_INDICES_PATH = os.path.join(os.path.dirname(__file__), "..", "model", "class_indices.json")
IMG_HEIGHT = 224
IMG_WIDTH = 224

print("Loading crop disease model...")

# Auto-download model from Hugging Face Hub if not present locally
HF_REPO_ID = os.getenv("HF_REPO_ID", "")   # e.g. "your-username/cropsense-model"

if not os.path.exists(MODEL_PATH):
    if HF_REPO_ID:
        print(f"Model not found locally. Downloading from Hugging Face: {HF_REPO_ID} ...")
        try:
            from huggingface_hub import hf_hub_download
            os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
            downloaded = hf_hub_download(
                repo_id=HF_REPO_ID,
                filename="crop_disease_model.keras",
                local_dir=os.path.dirname(MODEL_PATH),
            )
            print(f"Model downloaded to: {downloaded}")
        except Exception as e:
            print(f"ERROR: Failed to download model from Hugging Face: {e}")
            raise SystemExit(1)
    else:
        print("\n" + "=" * 60)
        print("  ERROR: Model file not found!")
        print(f"  Expected: {os.path.abspath(MODEL_PATH)}")
        print()
        print("  To fix, choose one option:")
        print("  OPTION 1 — Set HF_REPO_ID env var to auto-download from Hugging Face")
        print("  OPTION 2 — Copy crop_disease_model.keras into the model/ folder")
        print("  OPTION 3 — Run: python setup.py --train")
        print("=" * 60 + "\n")
        raise SystemExit(1)

if not os.path.exists(CLASS_INDICES_PATH):
    if HF_REPO_ID:
        print("Downloading class_indices.json from Hugging Face ...")
        try:
            from huggingface_hub import hf_hub_download
            hf_hub_download(
                repo_id=HF_REPO_ID,
                filename="class_indices.json",
                local_dir=os.path.dirname(CLASS_INDICES_PATH),
            )
        except Exception as e:
            print(f"ERROR: Failed to download class_indices.json: {e}")
            raise SystemExit(1)
    else:
        print("\n" + "=" * 60)
        print("  ERROR: Class indices file not found!")
        print(f"  Expected: {os.path.abspath(CLASS_INDICES_PATH)}")
        print("  Copy model/class_indices.json from the original machine.")
        print("=" * 60 + "\n")
        raise SystemExit(1)

ml_model = tf.keras.models.load_model(MODEL_PATH)
with open(CLASS_INDICES_PATH, "r") as f:
    class_indices = json.load(f)
index_to_class = {v: k for k, v in class_indices.items()}
print(f"Model loaded. {len(class_indices)} classes detected.")

RECOMMENDATIONS = {
    "Corn___Common_Rust": "Apply fungicide (e.g., mancozeb or propiconazole). Ensure proper plant spacing for air circulation.",
    "Corn___Gray_Leaf_Spot": "Use resistant hybrids. Apply foliar fungicides like azoxystrobin. Practice crop rotation.",
    "Corn___Healthy": "No disease detected. Continue regular monitoring and maintenance.",
    "Corn___Northern_Leaf_Blight": "Apply fungicides at early stages. Use resistant varieties. Remove crop debris after harvest.",
    "Potato___Early_Blight": "Apply chlorothalonil or mancozeb fungicide. Remove infected leaves. Ensure proper irrigation.",
    "Potato___Healthy": "No disease detected. Continue regular monitoring and maintenance.",
    "Potato___Late_Blight": "Apply metalaxyl-based fungicide immediately. Remove and destroy infected plants. Avoid overhead irrigation.",
    "Rice___Brown_Spot": "Apply fungicides like iprodione. Ensure balanced fertilization, especially potassium. Use certified seeds.",
    "Rice___Healthy": "No disease detected. Continue regular monitoring and maintenance.",
    "Rice___Leaf_Blast": "Apply tricyclazole or isoprothiolane. Avoid excessive nitrogen fertilization. Use resistant varieties.",
    "Rice___Neck_Blast": "Apply systemic fungicides early. Reduce nitrogen input. Use blast-resistant varieties.",
    "Sugarcane_Bacterial Blight": "Remove and burn infected plants. Use disease-free seed cane. Apply copper-based bactericides.",
    "Sugarcane_Healthy": "No disease detected. Continue regular monitoring and maintenance.",
    "Sugarcane_Red Rot": "Use resistant varieties. Remove infected stools. Treat seed cane with fungicide before planting.",
    "Wheat___Brown_Rust": "Apply propiconazole or tebuconazole fungicide. Use resistant varieties. Monitor fields regularly.",
    "Wheat___Healthy": "No disease detected. Continue regular monitoring and maintenance.",
    "Wheat___Yellow_Rust": "Apply triazole fungicides early. Use resistant varieties. Avoid late sowing.",
}

def predict_image(image_path: str):
    """Run inference on a single image using the loaded model."""
    img = Image.open(image_path).convert("RGB")
    img = img.resize((IMG_WIDTH, IMG_HEIGHT))
    img_array = np.array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)

    predictions = ml_model.predict(img_array)
    predicted_index = int(np.argmax(predictions[0]))
    confidence = float(predictions[0][predicted_index])
    disease_name = index_to_class[predicted_index]
    recommendation = RECOMMENDATIONS.get(disease_name, "Consult a local agricultural expert for guidance.")

    return disease_name, confidence, recommendation

# --- Pydantic Schemas ---
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class PredictionResponse(BaseModel):
    id: int
    disease_name: str
    confidence: float
    recommendation: str
    image_path: str
    timestamp: Optional[str] = None

    @classmethod
    def from_orm(cls, obj):
        data = {
            "id": obj.id,
            "disease_name": obj.disease_name,
            "confidence": obj.confidence,
            "recommendation": obj.recommendation,
            "image_path": obj.image_path,
            "timestamp": obj.timestamp.isoformat() if obj.timestamp else None,
        }
        return cls(**data)

    class Config:
        from_attributes = True

# --- API Routes ---

@app.post("/api/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    db_username = db.query(models.User).filter(models.User.username == user.username).first()
    if db_username:
        raise HTTPException(status_code=400, detail="Username already taken")

    hashed_password = get_password_hash(user.password)
    new_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/predict", response_model=PredictionResponse)
async def predict_disease(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")
        
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Run model inference
    disease_name, confidence, recommendation = predict_image(file_path)

    # Save to history
    new_prediction = models.PredictionHistory(
        disease_name=disease_name,
        confidence=confidence,
        recommendation=recommendation,
        image_path=file_path,
        owner_id=current_user.id
    )
    db.add(new_prediction)
    db.commit()
    db.refresh(new_prediction)
    
    return new_prediction

@app.get("/api/history", response_model=List[PredictionResponse])
def get_history(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    history = db.query(models.PredictionHistory).filter(models.PredictionHistory.owner_id == current_user.id).all()
    return history

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
