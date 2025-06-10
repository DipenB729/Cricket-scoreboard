import React from "react";
import "./Home.css";

const Home = () => {
  return (
    <div className="home-container">
      {/* Hero Section */}
    <section className="hero">
  <div className="hero-overlay">
    <h1>Welcome to SportsLive!</h1>
    <p>Get the latest scores and updates for all your favorite matches</p>
    <a href="/scoreboard" className="cta-button">View Scoreboard</a>
  </div>
</section>

      {/* Features Section */}
      <section className="features">
        <div className="feature-card">
          <img
            src="https://cdn-icons-png.flaticon.com/512/197/197484.png"
            alt="Live Scores"
            className="feature-img"
          />
          <h3>Live Scores</h3>
          <p>Real-time updates from ongoing matches around the world.</p>
        </div>

        <div className="feature-card">
          <img
            src="https://cdn-icons-png.flaticon.com/512/883/883407.png"
            alt="Match Highlights"
            className="feature-img"
          />
          <h3>Match Highlights</h3>
          <p>Catch up with the best moments and goals of each game.</p>
        </div>

        <div className="feature-card">
          <img
            src="https://cdn-icons-png.flaticon.com/512/1828/1828640.png"
            alt="Team Stats"
            className="feature-img"
          />
          <h3>Team Stats</h3>
          <p>In-depth statistics and performance insights of your teams.</p>
        </div>
      </section>

      {/* Match Summary Section */}
      <section className="match-summary">
        <h2>Today's Top Match</h2>
        <div className="summary-card">
          <p>Barcelona 3 - 2 Real Madrid</p>
          <p>Full Time</p>
          <p>Goals: Messi (2), Lewandowski | Benzema (2)</p>
        </div>
        <a href="/scoreboard" className="details-link">View Full Scoreboard</a>
      </section>

      {/* Live Matches Section */}
      <section className="match-summary">
        <h2>Live Matches</h2>
        <div className="summary-card">
          <p>Manchester United 1 - 1 Liverpool</p>
          <p>65'</p>
          <p>Scorers: Rashford | Salah</p>
        </div>
        <div className="summary-card" style={{ marginTop: "1.2rem" }}>
          <p>Juventus 0 - 2 Napoli</p>
          <p>Half Time</p>
          <p>Scorers: Osimhen (2)</p>
        </div>
        <a href="/live" className="details-link">Watch Live Commentary</a>
      </section>
    </div>
  );
};

export default Home;
