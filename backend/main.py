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
MODEL_DIR          = os.path.join(os.path.dirname(__file__), "..", "model")
TFLITE_MODEL_PATH  = os.path.join(MODEL_DIR, "crop_disease_model.tflite")
KERAS_MODEL_PATH   = os.path.join(MODEL_DIR, "crop_disease_model.keras")
CLASS_INDICES_PATH = os.path.join(MODEL_DIR, "class_indices.json")
IMG_HEIGHT = 224
IMG_WIDTH  = 224

HF_REPO_ID = os.getenv("HF_REPO_ID", "")  # e.g. "yourname/cropsense-model"

def _download_from_hf(filename: str):
    """Download a file from Hugging Face Hub into the model directory."""
    from huggingface_hub import hf_hub_download
    print(f"Downloading {filename} from Hugging Face ({HF_REPO_ID}) ...")
    hf_hub_download(repo_id=HF_REPO_ID, filename=filename,
                    local_dir=os.path.abspath(MODEL_DIR))
    print(f"Downloaded: {filename}")

# Download class_indices if missing
if not os.path.exists(CLASS_INDICES_PATH):
    if not HF_REPO_ID:
        print("ERROR: class_indices.json missing and HF_REPO_ID not set.")
        raise SystemExit(1)
    _download_from_hf("class_indices.json")

with open(CLASS_INDICES_PATH, "r") as f:
    class_indices = json.load(f)
index_to_class = {v: k for k, v in class_indices.items()}

# ── Prefer TFLite (lightweight, works on Render free tier) ──────────────
USE_TFLITE = os.getenv("USE_TFLITE", "false").lower() == "true"

if USE_TFLITE:
    if not os.path.exists(TFLITE_MODEL_PATH):
        if not HF_REPO_ID:
            print("ERROR: TFLite model missing and HF_REPO_ID not set.")
            raise SystemExit(1)
        _download_from_hf("crop_disease_model.tflite")

    print("Loading TFLite model (production mode)...")
    try:
        from ai_edge_litert.interpreter import Interpreter
    except ImportError:
        import tensorflow as tf
        Interpreter = tf.lite.Interpreter

    _interpreter = Interpreter(model_path=os.path.abspath(TFLITE_MODEL_PATH))
    _interpreter.allocate_tensors()
    _input_details  = _interpreter.get_input_details()
    _output_details = _interpreter.get_output_details()
    ml_model = None
    print(f"TFLite model loaded. {len(class_indices)} classes.")

else:
    # Local dev — use full Keras model
    if not os.path.exists(KERAS_MODEL_PATH):
        if HF_REPO_ID:
            _download_from_hf("crop_disease_model.keras")
        else:
            print("ERROR: crop_disease_model.keras missing. Copy it or set HF_REPO_ID.")
            raise SystemExit(1)

    print("Loading Keras model (local mode)...")
    import tensorflow as tf
    ml_model    = tf.keras.models.load_model(KERAS_MODEL_PATH)
    _interpreter = None
    print(f"Keras model loaded. {len(class_indices)} classes.")

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
    """Run inference using TFLite (production) or Keras (local)."""
    img = Image.open(image_path).convert("RGB")
    img = img.resize((IMG_WIDTH, IMG_HEIGHT))
    img_array = np.array(img, dtype=np.float32) / 255.0
    img_array = np.expand_dims(img_array, axis=0)

    if _interpreter is not None:
        # TFLite inference
        _interpreter.set_tensor(_input_details[0]['index'], img_array)
        _interpreter.invoke()
        predictions = _interpreter.get_tensor(_output_details[0]['index'])
    else:
        # Keras inference
        predictions = ml_model.predict(img_array)

    predicted_index = int(np.argmax(predictions[0]))
    confidence      = float(predictions[0][predicted_index])
    disease_name    = index_to_class[predicted_index]
    recommendation  = RECOMMENDATIONS.get(disease_name, "Consult a local agricultural expert for guidance.")
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
