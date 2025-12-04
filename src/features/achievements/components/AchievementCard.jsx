import React from "react";
import "./AchievementCard.css";
import { useState } from "react";

function AchievementCard({ achievement }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const isUnlocked = achievement.unlocked;
  const progressPercentage = Math.min(100, (achievement.progress / achievement.required) * 100);
  
  const getRarityGradient = () => {
    switch (achievement.rarity) {
      case "common": return "linear-gradient(135deg, #6b7280, #9ca3af)";
      case "rare": return "linear-gradient(135deg, #3b82f6, #60a5fa)";
      case "epic": return "linear-gradient(135deg, #8b5cf6, #a78bfa)";
      case "legendary": return "linear-gradient(135deg, #f59e0b, #fbbf24)";
      default: return "linear-gradient(135deg, #6b7280, #9ca3af)";
    }
  };

  const getRarityColor = () => {
    switch (achievement.rarity) {
      case "common": return "#6b7280";
      case "rare": return "#3b82f6";
      case "epic": return "#8b5cf6";
      case "legendary": return "#f59e0b";
      default: return "#6b7280";
    }
  };

  const getRarityLabel = () => {
    switch (achievement.rarity) {
      case "common": return "Обычный";
      case "rare": return "Редкий";
      case "epic": return "Эпический";
      case "legendary": return "Легендарный";
      default: return "Обычный";
    }
  };

  const rarityColor = getRarityColor();

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div 
      className={`achievement-card ${isFlipped ? "flipped" : ""} ${isUnlocked ? "unlocked" : "locked"}`}
      onClick={handleCardClick}
    >      
      <div className="card-inner">
        <div className="card-face card-front">
          <div 
            className="achievement-icon" 
            style={{ 
              background: isUnlocked ? getRarityGradient() : "rgba(55, 65, 81, 0.5)",
              boxShadow: isUnlocked ? "0 8px 25px rgba(0, 0, 0, 0.3)" : "0 4px 15px rgba(0, 0, 0, 0.2)"
            }}
          >
            {achievement.icon}
          </div>
          
          <div className="achievement-content">
            <h3 className="achievement-title">{achievement.title}</h3>
            <span 
              className="achievement-rarity" 
              style={{ 
                color: rarityColor,
                background: `rgba(${parseInt(rarityColor.slice(1, 3), 16)}, ${parseInt(rarityColor.slice(3, 5), 16)}, ${parseInt(rarityColor.slice(5, 7), 16)}, 0.1)`
              }}
            >
              {getRarityLabel()}
            </span>
            
            <div className="achievement-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${progressPercentage}%`,
                    background: isUnlocked ? getRarityGradient() : "linear-gradient(135deg, #4b5563, #6b7280)"
                  }}
                ></div>
              </div>
              <span className="progress-text">
                {achievement.progress}/{achievement.required}
              </span>
            </div>
          </div>
        </div>

        <div className="card-face card-back">
          <div className="back-content">
            <div 
              className="back-icon"
              style={{ 
                background: isUnlocked ? getRarityGradient() : "rgba(55, 65, 81, 0.5)",
              }}
            >
              {achievement.icon}
            </div>
            <h3 className="back-title">{achievement.title}</h3>
            <p className="back-description">{achievement.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AchievementCard;