import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import AchievementCard from "../features/achievements/components/AchievementCard";
import "./AchievementsPage.css";
import Header from "../features/Header/Header";
import {
  useGetMyAchievementsQuery,
  useGetAchievementStatsQuery,
} from "../features/achievements/achievementsApi";
import {
  selectUserAchievements,
  setUserAchievements,
  setStats,
} from "../features/achievements/achievementsSlice";

function AchievementsPage() {
  const [filter, setFilter] = useState("all");
  const [filteredAchievements, setFilteredAchievements] = useState([]);

  const dispatch = useDispatch();
  const userAchievements = useSelector(selectUserAchievements);

  const {
    data: achievementsData,
    isLoading: achievementsLoading,
    error: achievementsError,
  } = useGetMyAchievementsQuery();

  const { data: statsData, isLoading: statsLoading } =
    useGetAchievementStatsQuery();

  useEffect(() => {
    if (achievementsData) {
      dispatch(setUserAchievements(achievementsData));
    }
  }, [achievementsData, dispatch]);

  useEffect(() => {
    if (statsData) {
      dispatch(setStats(statsData));
    }
  }, [statsData, dispatch]);

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
    if (!userAchievements) return;

    let filtered = userAchievements;

    if (filter !== "all") {
      filtered = filtered.filter((ach) => ach.achievement?.category === filter);
    }
    const transformedAchievements = filtered.map((ach) => ({
      id: ach.achievement_id,
      title: ach.achievement?.title || "Неизвестное достижение",
      description: ach.achievement?.description || "",
      icon: ach.achievement?.icon || "🏆",
      category: ach.achievement?.category || "other",
      categoryIcon: ach.achievement?.category_icon || "🌟",
      rarity: ach.achievement?.rarity || "common",
      unlocked: ach.unlocked,
      progress: ach.progress || 0,
      required: ach.achievement?.required_value || 1,
      dateUnlocked: ach.unlocked_at,
    }));

    setFilteredAchievements(transformedAchievements);
  }, [filter, userAchievements]);

  const unlockedCount =
    userAchievements?.filter((ach) => ach.unlocked).length || 0;
  const totalCount = userAchievements?.length || 0;
  const completionPercentage =
    totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  if (achievementsLoading || statsLoading) {
    return (
      <div className="achievements-page">
        <Header />
        <div className="achievements-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Загружаем ваши достижения...</p>
          </div>
        </div>
      </div>
    );
  }

  if (achievementsError) {
    return (
      <div className="achievements-page">
        <Header />
        <div className="achievements-container">
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h3>Ошибка загрузки</h3>
            <p>Не удалось загрузить достижения. Попробуйте обновить страницу.</p>
          </div>
        </div>
      </div>
    );
  }
  
    return (
    <div className="achievements-page">
      <Header />
      <div className="gradient-ball"></div>
      <div className="gradient-ball-2"></div>
      <div className="gradient-ball-3"></div>
      <div className="gradient-ball-4"></div>
      <div className="gradient-ball-5"></div>

      <div className="achievements-container">
        <div className="achievements-header">
          <h1 className="achievements-title">Путь к себе</h1>
          <p className="achievements-subtitle">
            Ваши шаги в исследовании внутреннего мира через голосовой дневник
          </p>

          <div className="stats-section">
            <div className="main-stats">
              <div className="completion-circle">
                <svg width="100" height="100" viewBox="0 0 100 100">
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
                    {unlockedCount}
                    <span className="stats-total">/{totalCount}</span>
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
        </div>

        <div className="achievements-controls">
          <div className="filter-buttons">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`filter-btn ${
                  filter === category.id ? "active" : ""
                }`}
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
            <h3>Шаги не найдены</h3>
            <p>Попробуйте выбрать другую категорию пути</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AchievementsPage;
