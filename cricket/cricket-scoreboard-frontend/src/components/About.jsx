import React from "react";
import { FaChartLine, FaRobot, FaUsers, FaTrophy } from "react-icons/fa"; // cricket-related icons alternative
import "./About.css";

const About = () => {
  return (
    <div className="about-container">
      <div className="about-text">
        <h1>About CricAI</h1>
        <p>
          CricAI is a cutting-edge platform bringing AI-powered cricket analytics
          to fans, players, and analysts in real-time.
        </p>
        <p>
          We combine sports science, machine learning, and software engineering 
          to deliver insights that transform the way cricket is watched and played.
        </p>
        <div className="features">
          <div className="feature-card">
            <FaChartLine className="feature-icon" />
            <h3>Real-time Analytics</h3>
            <p>Instant data-driven insights during matches.</p>
          </div>
          <div className="feature-card">
            <FaRobot className="feature-icon" />
            <h3>AI-Powered Predictions</h3>
            <p>Advanced models to predict player and match outcomes.</p>
          </div>
          <div className="feature-card">
            <FaUsers className="feature-icon" />
            <h3>User Friendly</h3>
            <p>Designed for fans, players, and analysts alike.</p>
          </div>
          <div className="feature-card">
            <FaTrophy className="feature-icon" />
            <h3>Passion for Cricket</h3>
            <p>A dedicated team passionate about the sport and technology.</p>
          </div>
        </div>
      </div>
      <div className="about-image">
       
      </div>
    </div>
  );
};

export default About;
