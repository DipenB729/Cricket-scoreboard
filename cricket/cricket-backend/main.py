# backend/main.py
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import cv2
import logging
from typing import List, Union
from ultralytics import YOLO
import numpy as np
import torch
import datetime

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

# Load YOLO model once
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

def append_to_log(scoreboard: Scoreboard):
    """ Append the scoreboard update to the log file in order """
    with open("scoreboard_log.txt", "a") as f:
        timestamp = datetime.datetime.now().isoformat()
        f.write(
            f"{timestamp} - Team: {scoreboard.team}, Player1: {scoreboard.player1}, "
            f"Player2: {scoreboard.player2}, Score: {scoreboard.score}, "
            f"Decision: {scoreboard.decision}, Out: {scoreboard.out_detected}\n"
        )

# Global tracker to prevent duplicate log entries
last_logged_decision = None

total_score = 0  # Make sure this is defined globally at the top!

@app.post("/process-frame", response_model=List[Scoreboard])
async def process_frame(file: UploadFile = File(...)):
    global last_logged_decision
    global total_score
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame is None:
            raise HTTPException(status_code=400, detail="Invalid frame received.")

        resized = cv2.resize(frame, (640, 640))

        with torch.no_grad():
            results = model(resized, verbose=False, stream=False)[0]
        
        detections = results.boxes.data.cpu().numpy()

        umpire_out_signal_detected = False
        wide_detected = False
        four_detected = False
        six_detected = False

        for det in detections:
            x1, y1, x2, y2, conf, cls = det
            label = model.names[int(cls)]

            if conf < 0.6:
                continue

            if label == "out":
                umpire_out_signal_detected = True
                logging.info("Detected OUT gesture!")
            elif label == "wide":
                wide_detected = True
                logging.info("Detected WIDE gesture!")
            elif label == "four":
                four_detected = True
                logging.info("Detected FOUR gesture!")
            elif label == "six":
                six_detected = True
                logging.info("Detected SIX gesture!")

        # Decision priority + proper run handling
        if umpire_out_signal_detected:
            final_decision = "OUT!"
            runs_scored_this_ball = 0
        elif wide_detected:
            final_decision = "Wide"
            runs_scored_this_ball = 1
        elif six_detected:
            final_decision = "Six"
            runs_scored_this_ball = 6
        elif four_detected:
            final_decision = "Four"
            runs_scored_this_ball = 4
        else:
            final_decision = "No action"
            runs_scored_this_ball = 0

        # Only update total score + log for new meaningful actions
        if final_decision != "No action" and final_decision != last_logged_decision:
            total_score += runs_scored_this_ball

            scoreboard = Scoreboard(
                team="Team Dil",
                player1="Batsman_Name_Placeholder",
                player2="NonStriker_Name_Placeholder",
                score=total_score,
                decision=final_decision,
                out_detected=umpire_out_signal_detected
            )

            append_to_log(scoreboard)
            last_logged_decision = final_decision

            return [scoreboard]

        # Return current cumulative score if no new action
        scoreboard = Scoreboard(
            team="Team Dil",
            player1="Batsman_Name_Placeholder",
            player2="NonStriker_Name_Placeholder",
            score=total_score,
            decision="No action",
            out_detected=False
        )

        return [scoreboard]

    except Exception as e:
        logging.error(f"Error processing frame: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# Add this at the top (global tracker)
total_score = 0  # Global tracker for cumulative score

@app.post("/process-video", response_model=List[Scoreboard])
async def process_video(file: UploadFile = File(...)):
    global last_logged_decision
    global total_score

    try:
        # Save uploaded video temporarily
        temp_filename = f"temp_video_{datetime.datetime.now().timestamp()}.mp4"
        with open(temp_filename, "wb") as f:
            f.write(await file.read())

        cap = cv2.VideoCapture(temp_filename)
        if not cap.isOpened():
            raise HTTPException(status_code=400, detail="Could not open video file.")

        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        results_list = []
        frame_interval = 10
        final_decision_found = None

        for i in range(frame_count):
            ret, frame = cap.read()
            if not ret:
                break

            if i % frame_interval != 0:
                continue

            resized = cv2.resize(frame, (640, 640))
            with torch.no_grad():
                results = model(resized, verbose=False, stream=False)[0]

            detections = results.boxes.data.cpu().numpy()

            # Flags
            umpire_out_signal_detected = False
            wide_detected = False
            four_detected = False
            six_detected = False

            for det in detections:
                x1, y1, x2, y2, conf, cls = det
                label = model.names[int(cls)]

                if conf < 0.6:
                    continue

                if label == "out":
                    umpire_out_signal_detected = True
                    logging.info(f"Frame {i}: Detected OUT gesture")
                elif label == "wide":
                    wide_detected = True
                    logging.info(f"Frame {i}: Detected WIDE gesture")
                elif label == "four":
                    four_detected = True
                    logging.info(f"Frame {i}: Detected FOUR gesture")
                elif label == "six":
                    six_detected = True
                    logging.info(f"Frame {i}: Detected SIX gesture")

            # Priority decision
            if umpire_out_signal_detected:
                final_decision = "OUT!"
                runs_scored_this_ball = "O"  # Non-numeric for out
            elif wide_detected:
                final_decision = "Wide"
                runs_scored_this_ball = 1
            elif six_detected:
                final_decision = "Six"
                runs_scored_this_ball = 6
            elif four_detected:
                final_decision = "Four"
                runs_scored_this_ball = 4
            else:
                continue  # No action this frame

            if final_decision_found is None:
                # Update cumulative score (ignore "O")
                if isinstance(runs_scored_this_ball, int):
                    total_score += runs_scored_this_ball

                scoreboard = Scoreboard(
                    team="Team Dil",
                    player1="Batsman_Name_Placeholder",
                    player2="NonStriker_Name_Placeholder",
                    score=total_score,
                    decision=final_decision,
                    out_detected=umpire_out_signal_detected
                )

                append_to_log(scoreboard)
                last_logged_decision = final_decision
                results_list.append(scoreboard)
                final_decision_found = final_decision
                break  # Stop after first meaningful decision

        cap.release()
        import os
        os.remove(temp_filename)

        if not results_list:
            results_list.append(Scoreboard(
                team="Team Dil",
                player1="Batsman_Name_Placeholder",
                player2="NonStriker_Name_Placeholder",
                score=total_score,
                decision="No meaningful action detected in video.",
                out_detected=False
            ))

        return results_list

    except Exception as e:
        logging.error(f"Error processing video: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
