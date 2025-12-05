import React from "react";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_CONFIG } from "../../config.js";

export const calendarApi = createApi({
  reducerPath: "calendarApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_CONFIG.BASE_URL,
    credentials: "include",
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Calendar"],
  endpoints: (builder) => ({
    // Получить данные календаря за месяц
    getCalendarMonth: builder.query({
      query: ({ year, month }) => ({
        url: API_CONFIG.ENDPOINTS.CALENDAR.GET_MONTH
          .replace('{year}', year)
          .replace('{month}', month),
      }),
      providesTags: ["Calendar"],
      transformResponse: (response) => {
        return response;
      },
    }),

    // Получить детальную информацию за день
    getCalendarDay: builder.query({
      query: ({ date }) => ({
        url: API_CONFIG.ENDPOINTS.CALENDAR.GET_DAY
          .replace('{date}', date),
      }),
      providesTags: ["Calendar"],
    }),

    // Принудительно сгенерировать статистику за день
    generateCalendarDay: builder.mutation({
      query: ({ date }) => ({
        url: API_CONFIG.ENDPOINTS.CALENDAR.GENERATE_DAY
          .replace('{date}', date),
        method: "POST",
      }),
      invalidatesTags: ["Calendar"],
    }),
  }),
});

export const { 
  useGetCalendarMonthQuery, 
  useGetCalendarDayQuery, 
  useGenerateCalendarDayMutation 
} = calendarApi;