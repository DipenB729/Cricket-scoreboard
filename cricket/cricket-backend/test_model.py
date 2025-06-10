from ultralytics import YOLO

try:
    # Make sure the path is correct relative to this script
    model = YOLO("cricket-backend/best.pt")
    print("✅ Model loaded successfully!")
except Exception as e:
    print("❌ Failed to load model:", e)
