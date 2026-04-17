"""
Converts crop_disease_model.keras → crop_disease_model.tflite
with dynamic range quantization (~4x smaller, much less RAM on inference).
Run once from the model/ directory:
    python convert_to_tflite.py
"""
import os
import tensorflow as tf

THIS_DIR   = os.path.dirname(os.path.abspath(__file__))
KERAS_PATH = os.path.join(THIS_DIR, "crop_disease_model.keras")
TFLITE_PATH = os.path.join(THIS_DIR, "crop_disease_model.tflite")

print("Loading Keras model...")
model = tf.keras.models.load_model(KERAS_PATH)

print("Converting to TFLite with dynamic range quantization...")
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]   # quantize → ~4x smaller
tflite_model = converter.convert()

with open(TFLITE_PATH, "wb") as f:
    f.write(tflite_model)

size_mb = os.path.getsize(TFLITE_PATH) / (1024 * 1024)
print(f"Saved: {TFLITE_PATH}  ({size_mb:.1f} MB)")
print("Done! Upload crop_disease_model.tflite to Hugging Face.")
