from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import shutil, os, uuid, cv2, logging, numpy as np
from typing import List, Union
from ultralytics import YOLO
import torch

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Cricket Video Processing API"}

# Load YOLO model once at startup
try:
    model = YOLO("best.pt")
    model.conf = 0.4
    model.eval()
    logging.info("YOLO model loaded successfully.")
except Exception as e:
    logging.error(f"Failed to load YOLO model: {e}")
    raise RuntimeError("Failed to load YOLO model.")

class Scoreboard(BaseModel):
    team: str
    player1: str
    player2: str
    score: Union[int, str]
    decision: str
    out_detected: bool

@app.post("/process-video", response_model=List[Scoreboard])
async def process_video(file: UploadFile = File(...)):
    if not file.filename.endswith(".mp4"):
        raise HTTPException(status_code=400, detail="Only .mp4 files are supported.")

    temp_filename = f"temp_{uuid.uuid4().hex}.mp4"
    try:
        # Save the uploaded video temporarily
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        logging.info(f"Temporary video saved as {temp_filename}")

        cap = cv2.VideoCapture(temp_filename)
        if not cap.isOpened():
            raise HTTPException(status_code=500, detail="Could not open video file.")

        frame_rate = cap.get(cv2.CAP_PROP_FPS)
        if frame_rate == 0:
            frame_rate = 30  # fallback if FPS is zero or not detected
            logging.warning("Frame rate not detected. Defaulting to 30 FPS.")

        total_runs_match = 0
        umpire_out_signal_detected = False
        wide_detected = False

        run_detection_state = 0
        last_run_completed_frame = -float('inf')
        RUN_COOLDOWN_FRAMES = int(frame_rate * 0.5)

        frame_idx = 0
        player1_data = player2_data = umpire_data = line1_data = line2_data = None

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            frame_idx += 1
            # Process every 5th frame to reduce computation
            if frame_idx % 5 != 0:
                continue

            resized = cv2.resize(frame, (640, 640))

            with torch.no_grad():
                results = model(resized, verbose=False, stream=False)[0]

            detections = results.boxes.data.cpu().numpy()

            curr = {"player_1": None, "player_2": None, "umpire": None, "line 1": None, "line 2": None}
            for det in detections:
                x1, y1, x2, y2, conf, cls = det
                label = model.names[int(cls)]
                center_y = (y1 + y2) / 2
                bbox = [x1, y1, x2, y2]

                # Detect "out" gesture
                if label == "out" and conf > 0.6:
                    umpire_out_signal_detected = True
                    logging.info(f"Frame {frame_idx}: Detected 'OUT' gesture!")
                    break

                # Detect "wide"
                elif label == "wide" and conf > 0.6:
                    wide_detected = True
                    logging.info(f"Frame {frame_idx}: Wide detected!")
                    break

                elif label in curr:
                    curr[label] = {'bbox': bbox, 'center_y': center_y}

            player1_data = curr["player_1"] or player1_data
            player2_data = curr["player_2"] or player2_data
            umpire_data = curr["umpire"] or umpire_data
            line1_data = curr["line 1"] or line1_data
            line2_data = curr["line 2"] or line2_data

            if player1_data and player2_data and line1_data and line2_data:
                y1, y2 = line1_data['center_y'], line2_data['center_y']
                # Determine which crease is batting crease and non-striker crease based on y-position
                y_batting_crease, y_non_striker_crease = (y1, y2) if y1 > y2 else (y2, y1)

                # Check if players crossed crease lines (simplified logic)
                p1_crossed = player1_data['center_y'] < y_non_striker_crease if y_batting_crease > y_non_striker_crease else player1_data['center_y'] > y_non_striker_crease
                p2_crossed = player2_data['center_y'] > y_batting_crease if y_batting_crease > y_non_striker_crease else player2_data['center_y'] < y_batting_crease

                if run_detection_state == 0 and p1_crossed and p2_crossed:
                    if (frame_idx - last_run_completed_frame) > RUN_COOLDOWN_FRAMES:
                        total_runs_match += 1
                        logging.info(f"Frame {frame_idx}: Run detected! Total runs: {total_runs_match}")
                        last_run_completed_frame = frame_idx
                        run_detection_state = 1
                elif run_detection_state == 1 and not (p1_crossed and p2_crossed):
                    run_detection_state = 0

            if umpire_out_signal_detected or wide_detected:
                logging.info(f"Early stopping at frame {frame_idx} due to umpire signal or wide.")
                break  # Early stop if out or wide detected

        cap.release()

        # Prepare final scoreboard decision
        if umpire_out_signal_detected:
            final_decision = "OUT!"
            runs_scored_this_ball = "O"
        elif wide_detected:
            final_decision = "Wide"
            runs_scored_this_ball = 1
        elif total_runs_match > 0:
            final_decision = f"{total_runs_match} run{'s' if total_runs_match != 1 else ''}"
            runs_scored_this_ball = total_runs_match
        else:
            final_decision = "No action"
            runs_scored_this_ball = 0

        return [
            Scoreboard(
                team="Team Dil",
                player1="Batsman_Name_Placeholder",
                player2="NonStriker_Name_Placeholder",
                score=runs_scored_this_ball,
                decision=final_decision,
                out_detected=umpire_out_signal_detected
            )
        ]

    except Exception as e:
        logging.error(f"Error processing video: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        # Clean up temporary file
        if os.path.exists(temp_filename):
            os.remove(temp_filename)
            logging.info(f"Removed temporary video file: {temp_filename}")
