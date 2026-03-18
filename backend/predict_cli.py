import sys
import json
import os
import argparse
import numpy as np
from PIL import Image
import tensorflow as tf

def main():
    parser = argparse.ArgumentParser(description="Run inference on crop images.")
    parser.add_argument("--image", type=str, required=True, help="Path to the image file")
    parser.add_argument("--model", type=str, required=True, help="Path to the keras model file")
    parser.add_argument("--classes", type=str, required=True, help="Path to the class_indices.json file")
    
    args = parser.parse_args()

    # Load Model
    model = tf.keras.models.load_model(args.model)
    
    # Load Classes
    with open(args.classes, "r") as f:
        class_indices = json.load(f)
    index_to_class = {v: k for k, v in class_indices.items()}

    # Prepare Image
    IMG_HEIGHT = 224
    IMG_WIDTH = 224
    img = Image.open(args.image).convert("RGB")
    img = img.resize((IMG_WIDTH, IMG_HEIGHT))
    img_array = np.array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)

    # Predict
    predictions = model.predict(img_array, verbose=0)
    predicted_index = int(np.argmax(predictions[0]))
    confidence = float(predictions[0][predicted_index])
    disease_name = index_to_class.get(predicted_index, "Unknown")
    
    # Output JSON string for backend to parse
    result = {
        "disease": disease_name,
        "confidence": confidence
    }
    print(json.dumps(result))

if __name__ == "__main__":
    # Suppress tensorflow logs to keep stdout clean
    os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3' 
    main()
