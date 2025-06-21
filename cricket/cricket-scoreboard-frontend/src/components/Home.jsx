import React, { useState, useRef } from "react";
import "./Home.css";

const Home = () => {
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [scoreboardData, setScoreboardData] = useState([]);
  const intervalRef = useRef(null);
  const streamRef = useRef(null);

  const cleanupPreview = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const saveLog = async (eventData) => {
    try {
      await fetch("http://127.0.0.1:8000/save-log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          event: eventData,
          timestamp: new Date().toISOString()
        })
      });
    } catch (err) {
      console.error("Failed to save log:", err);
    }
  };

  const handleLivePreview = async () => {
    cleanupPreview();
    setShowScoreboard(true);

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      streamRef.current = stream;

      const videoElement = document.createElement("video");
      videoElement.srcObject = stream;
      await videoElement.play();

      const videoTrack = stream.getVideoTracks()[0];
      const imageCapture = new ImageCapture(videoTrack);

      intervalRef.current = setInterval(async () => {
        try {
          const bitmap = await imageCapture.grabFrame();
          const canvas = document.createElement("canvas");
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(bitmap, 0, 0);

          const blob = await new Promise((resolve) =>
            canvas.toBlob(resolve, "image/png")
          );

          const formData = new FormData();
          formData.append("file", blob, "frame.png");

          const res = await fetch("http://127.0.0.1:8000/process-frame", {
            method: "POST",
            body: formData,
          });

          if (res.ok) {
            const data = await res.json();
            console.log("Received data:", data);

            if (data.length > 0) {
              const decision = data[0].decision.toLowerCase();

              if (decision !== "no action") {
                setScoreboardData(data);

                // Save to log
                await saveLog(data[0]); 
              }
            }
          } else {
            console.error("Server error while processing frame");
          }
        } catch (error) {
          console.error("Error capturing or sending frame:", error);
        }
      }, 1000);
    } catch (err) {
      console.error("Error starting live preview:", err);
      alert("Failed to start live preview: " + err.message);
    }
  };

  const handleCloseScoreboard = () => {
    cleanupPreview();
    setShowScoreboard(false);
  };

  return (
    <div className="home-container">
      <section className="hero">
        <div className="hero-overlay">
          <h1>Welcome to SportsLive!</h1>
          <p>Get the latest scores and updates for all your favorite matches</p>
          <div className="cta-button-group">
            <a href="/scoreboard" className="cta-button">
              View Scoreboard
            </a>
            <button className="cta-button" onClick={handleLivePreview}>
              Start Live Preview
            </button>
          </div>
        </div>
      </section>

      {(showScoreboard || scoreboardData.length > 0) && (
        <div className="scoreboard-overlay">
          {showScoreboard && (
            <button className="close-button" onClick={handleCloseScoreboard}>
              ✕
            </button>
          )}
          <h2>Live Scoreboard</h2>
          <table className="scoreboard-table">
            <thead>
              <tr>
                <th>Team</th>
                <th>Player 1</th>
                <th>Player 2</th>
                <th>Score</th>
                <th>Decision</th>
              </tr>
            </thead>
            <tbody>
              {scoreboardData.length > 0 ? (
                scoreboardData.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.team}</td>
                    <td>{item.player1}</td>
                    <td>{item.player2}</td>
                    <td>{item.score}</td>
                    <td>{item.decision}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">Waiting for data...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Home; 