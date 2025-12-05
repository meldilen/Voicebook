import React from "react";
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import authReducer from '../features/auth/authSlice';
import recordingsReducer from '../features/recordings/recordingsSlice';
import achievementsReducer from '../features/achievements/achievementsSlice';
import { authApi } from '../features/auth/authApi';
import { recordingsApi } from '../features/recordings/recordingsApi';
import { calendarApi } from '../features/calendar/calendarApi';
import { achievementsApi } from '../features/achievements/achievementsApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    recordings: recordingsReducer,
    achievements: achievementsReducer,
    [authApi.reducerPath]: authApi.reducer,
    [recordingsApi.reducerPath]: recordingsApi.reducer,
    [calendarApi.reducerPath]: calendarApi.reducer,
    [achievementsApi.reducerPath]: achievementsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      recordingsApi.middleware,
      calendarApi.middleware,
      achievementsApi.middleware
    ),
});

setupListeners(store.dispatch);