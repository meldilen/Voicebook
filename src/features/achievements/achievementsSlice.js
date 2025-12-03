import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  achievements: [],
  userAchievements: [],
  stats: null,
  loading: false,
  error: null,
};

const achievementsSlice = createSlice({
  name: "achievements",
  initialState,
  reducers: {
    setAchievements: (state, action) => {
      state.achievements = action.payload;
    },
    setUserAchievements: (state, action) => {
      state.userAchievements = action.payload;
    },
    setStats: (state, action) => {
      state.stats = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    updateUserAchievement: (state, action) => {
      const { achievementId, progress, unlocked } = action.payload;
      const index = state.userAchievements.findIndex(
        (ach) => ach.achievement_id === achievementId
      );
      if (index !== -1) {
        state.userAchievements[index] = {
          ...state.userAchievements[index],
          progress,
          unlocked,
        };
      }
    },
  },
});

export const {
  setAchievements,
  setUserAchievements,
  setStats,
  setLoading,
  setError,
  updateUserAchievement,
} = achievementsSlice.actions;

export const selectAchievements = (state) => state.achievements.achievements;
export const selectUserAchievements = (state) =>
  state.achievements.userAchievements;
export const selectAchievementStats = (state) => state.achievements.stats;
export const selectAchievementsLoading = (state) => state.achievements.loading;
export const selectAchievementsError = (state) => state.achievements.error;

export default achievementsSlice.reducer;