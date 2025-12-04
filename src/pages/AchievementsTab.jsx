import React from "react";
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import AchievementCard from "../features/achievements/components/AchievementCard";
import "./AchievementsTab.css";
import {
  useGetMyAchievementsQuery,
  useGetAchievementStatsQuery,
} from "../features/achievements/achievementsApi";
import {
  selectUserAchievements,
  setUserAchievements,
  setStats,
} from "../features/achievements/achievementsSlice";

function AchievementsTab() {
  const [filter, setFilter] = useState("all");
  const [filteredAchievements, setFilteredAchievements] = useState([]);
  const { t } = useTranslation();
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
    { id: "all", name: t("achievements.categories.all"), icon: "🌟" },
    { id: "voice", name: t("achievements.categories.voice"), icon: "🎤" },
    { id: "regularity", name: t("achievements.categories.regularity"), icon: "📅" },
    { id: "variety", name: t("achievements.categories.variety"), icon: "🎭" },
    { id: "reflection", name: t("achievements.categories.reflection"), icon: "🤔" },
    { id: "positivity", name: t("achievements.categories.positivity"), icon: "✨" },
    { id: "analysis", name: t("achievements.categories.analysis"), icon: "🕵️" },
    { id: "social", name: t("achievements.categories.social"), icon: "💬" },
  ];

  useEffect(() => {
    if (!userAchievements) return;

    let filtered = userAchievements;

    if (filter !== "all") {
      filtered = filtered.filter((ach) => ach.achievement?.category === filter);
    }
    const transformedAchievements = filtered.map((ach) => ({
      id: ach.achievement_id,
      title: ach.achievement?.title || t("achievements.unknown"),
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
  }, [filter, userAchievements, t]);

  const unlockedCount =
    userAchievements?.filter((ach) => ach.unlocked).length || 0;
  const totalCount = userAchievements?.length || 0;
  const completionPercentage =
    totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  if (achievementsLoading || statsLoading) {
    return (
      <div className="achievements-page">
        <div className="achievements-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>{t("achievements.loading")}</p>
          </div>
        </div>
      </div>
    );
  }
  if (achievementsError) {
    return (
      <div className="achievements-page">
        <div className="achievements-container">
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h3>{t("achievements.error.title")}</h3>
            <p>
              {t("achievements.error.message")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="achievements-tab">
      <div className="achievements-header">
        <h1>{t("achievements.title")}</h1>
        <p>{t("achievements.subtitle")}</p>
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
                {unlockedCount}
                <span className="stats-total">/{totalCount}</span>
              </span>
              <span className="stats-label">
                {t("achievements.stats.achievements")}
              </span>
            </div>

            <div className="stats-motivation">
              {completionPercentage >= 75
                ? t("achievements.motivation.high")
                : completionPercentage >= 50
                ? t("achievements.motivation.medium")
                : completionPercentage >= 25
                ? t("achievements.motivation.low")
                : t("achievements.motivation.start")}
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
          <h3>{t("achievements.noResults.title")}</h3>
          <p>{t("achievements.noResults.message")}</p>
        </div>
      )}
    </div>
  );
}

export default AchievementsTab;