import React from "react";
import { createApi } from "@reduxjs/toolkit/query/react";
import { API_CONFIG } from "../../config.js";
import { baseQueryWithReauth } from "../auth/authApi.js";

export const achievementsApi = createApi({
  reducerPath: "achievementsApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Achievements", "AchievementProgress"],
  endpoints: (builder) => ({
    getAllAchievements: builder.query({
      query: () => ({
        url: API_CONFIG.ENDPOINTS.ACHIEVEMENTS.GET_ALL,
      }),
      providesTags: ["Achievements"],
    }),
    getMyAchievements: builder.query({
      query: () => ({
        url: API_CONFIG.ENDPOINTS.ACHIEVEMENTS.GET_MY,
      }),
      providesTags: ["Achievements"],
    }),
    getAchievementStats: builder.query({
      query: () => ({
        url: API_CONFIG.ENDPOINTS.ACHIEVEMENTS.GET_STATS,
      }),
      providesTags: ["Achievements"],
    }),
    getAchievementProgress: builder.query({
      query: (achievementId) => ({
        url: API_CONFIG.ENDPOINTS.ACHIEVEMENTS.GET_PROGRESS.replace(
          "{achievementId}",
          achievementId
        ),
      }),
      providesTags: (result, error, achievementId) => [
        { type: "AchievementProgress", id: achievementId },
      ],
    }),
    updateAchievementProgress: builder.mutation({
      query: ({ achievementId, progressIncrement = 1 }) => ({
        url: API_CONFIG.ENDPOINTS.ACHIEVEMENTS.UPDATE_PROGRESS.replace(
          "{achievementId}",
          achievementId
        ),
        method: "POST",
        body: { progress_increment: progressIncrement },
      }),
      invalidatesTags: (result, error, { achievementId }) => [
        "Achievements",
        { type: "AchievementProgress", id: achievementId },
      ],
    }),
  }),
});

export const {
  useGetAllAchievementsQuery,
  useGetMyAchievementsQuery,
  useGetAchievementStatsQuery,
  useGetAchievementProgressQuery,
  useUpdateAchievementProgressMutation,
} = achievementsApi;