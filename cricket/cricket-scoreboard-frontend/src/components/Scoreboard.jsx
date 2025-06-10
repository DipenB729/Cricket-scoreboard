import React, { useState } from 'react';
import './Scoreboard.css';

function Scoreboard() {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [data, setData] = useState([]); // Scoreboard data
  const [loading, setLoading] = useState(false);

  const handleVideoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Only accept mp4 videos
      if (!file.type.includes('video/mp4')) {
        alert('Please upload an MP4 video file.');
        return;
      }
      setSelectedVideo(file);
      setVideoPreview(URL.createObjectURL(file));
      setData([]); // Clear previous results when new video selected
    }
  };

  const handleProcessVideo = async () => {
    if (!selectedVideo) {
      alert('Please upload a video first.');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('file', selectedVideo);

    try {
      const response = await fetch('http://localhost:8000/process-video', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || 'Video processing failed');
      }

      const result = await response.json();
      console.log('Received from FastAPI:', result);
      setData(result); // Update scoreboard table
    } catch (error) {
      console.error('Error processing video:', error);
      alert(`Failed to process video: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="live-score-container">
      <h2>Live Score - Video Input</h2>

      <div className="video-upload-section">
        <input
          type="file"
          accept="video/mp4"
          onChange={handleVideoChange}
          disabled={loading}
        />
        <button
          onClick={handleProcessVideo}
          className="process-button"
          disabled={loading || !selectedVideo}
        >
          {loading ? 'Processing...' : 'Process Video'}
        </button>
      </div>

      {videoPreview && (
        <div className="video-preview">
          <h4>Uploaded Video Preview:</h4>
          <video controls width="400" src={videoPreview} />
        </div>
      )}

      <div className="scoreboard-sticky">
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
            {data.length > 0 ? (
              data.map(({ team, player1, player2, score, decision }, idx) => (
                <tr key={idx}>
                  <td>{team}</td>
                  <td>{player1}</td>
                  <td>{player2}</td>
                  <td>{score}</td>
                  <td>{decision}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">No data yet. Upload and process a video.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Scoreboard;
