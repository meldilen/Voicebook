import React, { useState, useEffect } from "react";
import AchievementCard from "../features/achievements/components/AchievementCard";
import "./AchievementsTab.css";

const achievementsData = [
  {
    id: 1,
    title: "Первый шаг",
    description: "Сделал первую голосовую запись в дневнике",
    icon: "🎤",
    category: "voice",
    categoryIcon: "🎤",
    rarity: "common",
    unlocked: true,
    progress: 1,
    required: 1,
    dateUnlocked: "2025-01-15",
  },
  {
    id: 2,
    title: "7 дней подряд",
    description: "Вел голосовой дневник неделю без пропусков",
    icon: "🔥",
    category: "regularity",
    categoryIcon: "📅",
    rarity: "rare",
    unlocked: true,
    progress: 7,
    required: 7,
    dateUnlocked: "2025-01-21",
  },
  {
    id: 3,
    title: "Месячный марафон",
    description: "30 дней ведения голосового дневника",
    icon: "🏆",
    category: "regularity",
    categoryIcon: "📅",
    rarity: "epic",
    unlocked: true,
    progress: 30,
    required: 30,
    dateUnlocked: "2025-07-12",
  },
  {
    id: 4,
    title: "Радуга эмоций",
    description: "Выразил 5 или более разных эмоций в записях",
    icon: "🌈",
    category: "variety",
    categoryIcon: "🎭",
    rarity: "rare",
    unlocked: true,
    progress: 5,
    required: 5,
    dateUnlocked: "2025-01-18",
  },
  {
    id: 5,
    title: "Взгляд в прошлое",
    description: "Прослушал записи за другой день (месяц назад)",
    icon: "🔍",
    category: "reflection",
    categoryIcon: "🤔",
    rarity: "rare",
    unlocked: false,
    progress: 0,
    required: 1,
    dateUnlocked: null,
  },
  {
    id: 6,
    title: "Луч света",
    description: "Серия из 5 позитивных записей после грустной",
    icon: "✨",
    category: "positivity",
    categoryIcon: "😊",
    rarity: "epic",
    unlocked: false,
    progress: 2,
    required: 5,
    dateUnlocked: null,
  },
  {
    id: 7,
    title: "Эмоциональный детектив",
    description: "Проанализировал 50 различных записей",
    icon: "🕵️",
    category: "analysis",
    categoryIcon: "📊",
    rarity: "legendary",
    unlocked: false,
    progress: 32,
    required: 50,
    dateUnlocked: null,
  },
  {
    id: 8,
    title: "Голос сердца",
    description: "Записал 100 минут размышлений",
    icon: "💖",
    category: "voice",
    categoryIcon: "🎤",
    rarity: "common",
    unlocked: false,
    progress: 45,
    required: 100,
    dateUnlocked: null,
  },
  {
    id: 9,
    title: "Сердечный друг",
    description: "Поделился достижениями с друзьями",
    icon: "💖",
    category: "social",
    rarity: "common",
    unlocked: false,
    progress: 0,
    required: 1,
    dateUnlocked: null,
  },
];

function AchievementsTab() {
  const [filter, setFilter] = useState("all");
  const [filteredAchievements, setFilteredAchievements] = 
    useState(achievementsData);

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
    let filtered = achievementsData;
    if (filter !== "all") {
      filtered = filtered.filter((ach) => ach.category === filter);
    }
    setFilteredAchievements(filtered);
  }, [filter]);

  const unlockedCount = achievementsData.filter((ach) => ach.unlocked).length;
  const totalCount = achievementsData.length;
  const completionPercentage = Math.round((unlockedCount / totalCount) * 100);


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