import React, { useState, useEffect } from "react";
import AchievementCard from "../features/achievements/components/AchievementCard";
import "./AchievementsTab.css";

function AchievementsTab() {
  const [filter, setFilter] = useState("all");
  const [filteredAchievements, setFilteredAchievements] = useState([]);
  const [achievementsData, setAchievementsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const categories = [
    { id: "all", name: "Все", icon: "🌟" },
    { id: "voice", name: "Голос", icon: "🎤" },
    { id: "regularity", name: "Постоянство", icon: "📅" },
    { id: "variety", name: "Разнообразие", icon: "🎭" },
    { id: "reflection", name: "Самоанализ", icon: "🤔" },
    { id: "positivity", name: "Светлые мысли", icon: "✨" },
    { id: "analysis", name: "Глубина", icon: "🕵️" },
    { id: "social", name: "Общение", icon: "💬" },
  ];

  useEffect(() => {
    fetchAchievements();
  }, []);

  useEffect(() => {
    let filtered = achievementsData;
    if (filter !== "all") {
      filtered = filtered.filter((ach) => ach.category === filter);
    }
    setFilteredAchievements(filtered);
  }, [filter, achievementsData]);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/achievements', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch achievements');
      }
      
      const data = await response.json();
      setAchievementsData(data.achievements || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching achievements:', err);
    } finally {
      setLoading(false);
    }
  };

  const unlockedCount = achievementsData.filter((ach) => ach.unlocked).length;
  const totalCount = achievementsData.length;
  const completionPercentage = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <div className="achievements-tab">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Загрузка достижений...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="achievements-tab">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Ошибка загрузки</h3>
          <p>{error}</p>
          <button onClick={fetchAchievements} className="retry-button">
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="achievements-tab">
      <div className="achievements-header">
        <h1>Путь к себе</h1>
        <p>Ваши шаги в исследовании внутреннего мира</p>
      </div>

      <div className="stats-section">
        <div className="main-stats">
          <div className="completion-circle">
            <svg width="70" height="70" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="6"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="url(#progressGradient)"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="251"
                strokeDashoffset={251 - (251 * completionPercentage) / 100}
                transform="rotate(-90 50 50)"
              />
              <defs>
                <linearGradient
                  id="progressGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#5b21b6" />
                </linearGradient>
              </defs>
              <text
                x="50"
                y="52"
                textAnchor="middle"
                fill="#f3f4f6"
                fontSize="14"
                fontWeight="600"
              >
                {completionPercentage}%
              </text>
            </svg>
          </div>
          
          <div className="stats-info">
            <div className="stats-main">
              <span className="stats-count">
                {unlockedCount}<span className="stats-total">/{totalCount}</span>
              </span>
              <span className="stats-label">достижений</span>
            </div>
            
            <div className="stats-motivation">
              {completionPercentage >= 75
                ? "🎉 Большая часть пути пройдена!"
                : completionPercentage >= 50
                ? "🚀 Половина пути!"
                : completionPercentage >= 25
                ? "💫 Продолжайте в том же духе!"
                : "🌟 Сделайте первый шаг"}
            </div>
          </div>
        </div>
      </div>

      <div className="achievements-controls">
        <div className="filter-buttons">
          {categories.map((category) => (
            <button
              key={category.id}
              className={`filter-btn ${filter === category.id ? "active" : ""}`}
              onClick={() => setFilter(category.id)}
            >
              <span className="filter-icon">{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <div className="achievements-grid">
        {filteredAchievements.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </div>

      {filteredAchievements.length === 0 && (
        <div className="no-results">
          <div className="no-results-icon">🔍</div>
          <h3>Достижения не найдены</h3>
          <p>Попробуйте выбрать другую категорию</p>
        </div>
      )}
    </div>
  );
}

export default AchievementsTab;