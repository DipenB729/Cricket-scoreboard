import React from 'react';
import './Scoreboard.css';

const ScoreboardTable = ({ data }) => {
  return (
    <div className="scoreboard-overlay">
      <button className="close-scoreboard" onClick={() => window.location.reload()}>
        ✕
      </button>
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
              <td colSpan="5">Waiting for data...</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ScoreboardTable;
