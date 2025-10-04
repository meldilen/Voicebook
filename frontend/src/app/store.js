import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import authReducer from '../features/auth/authSlice';
import recordingsReducer from '../features/recordings/recordingsSlice';
import totalsReducer from '../features/calendar/totalSlice';
import { authApi } from '../features/auth/authApi';
import { recordingsApi } from '../features/recordings/recordingsApi';
import { totalsApi } from '../features/calendar/totalApi';
import coinsReducer from '../features/Header/coinsSlice';
export const store = configureStore({
  reducer: {
    auth: authReducer,
    recordings: recordingsReducer,
    totals: totalsReducer,
    coins: coinsReducer,
    [authApi.reducerPath]: authApi.reducer,
    [recordingsApi.reducerPath]: recordingsApi.reducer,
    [totalsApi.reducerPath]: totalsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      recordingsApi.middleware,
      totalsApi.middleware
    ),
});

setupListeners(store.dispatch);