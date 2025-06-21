import React from "react";
import "./Insights.css";

const Insights = () => {
  return (
    <div className="insights-container">
      <h1>📊 CricAI Game Insights</h1>
      <p>
        Welcome to CricAI’s advanced analytics hub! Our AI-driven engine transforms live cricket data into meaningful insights — empowering fans, players, and analysts with real-time intelligence.
      </p>

      <h2>🌟 What You Get</h2>
      <ul>
        <li><strong>Live Win Probability</strong>: Real-time prediction of match outcomes as the game unfolds.</li>
        <li><strong>Player Performance Tracker</strong>: Dynamic form charts for batters, bowlers, and fielders.</li>
        <li><strong>Key Moments Detector</strong>: AI highlights critical game-changing events instantly.</li>
        <li><strong>Strategy Suggestions</strong>: Suggested batting or bowling tactics based on live conditions.</li>
        <li><strong>Post-Match Reports</strong>: Automatically generated summaries with key stats and AI commentary.</li>
      </ul>

      <h2>⚡ Why CricAI Insights?</h2>
      <p>
        CricAI bridges the gap between cricket passion and technology. Whether you’re following your favorite team or analyzing performance — our insights help you see the game like never before!
      </p>
    </div>
  );
};

export default Insights;
