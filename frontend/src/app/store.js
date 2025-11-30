import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import authReducer from '../features/auth/authSlice';
import recordingsReducer from '../features/recordings/recordingsSlice';
import totalsReducer from '../features/calendar/totalSlice';
import achievementsReducer from '../features/achievements/achievementsSlice';
import { authApi } from '../features/auth/authApi';
import { recordingsApi } from '../features/recordings/recordingsApi';
import { totalsApi } from '../features/calendar/totalApi';
import { achievementsApi } from '../features/achievements/achievementsApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    recordings: recordingsReducer,
    totals: totalsReducer,
    achievements: achievementsReducer,
    [authApi.reducerPath]: authApi.reducer,
    [recordingsApi.reducerPath]: recordingsApi.reducer,
    [totalsApi.reducerPath]: totalsApi.reducer,
    [achievementsApi.reducerPath]: achievementsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      recordingsApi.middleware,
      totalsApi.middleware,
      achievementsApi.middleware
    ),
});

setupListeners(store.dispatch);