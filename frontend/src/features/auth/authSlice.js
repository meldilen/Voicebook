import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  token: null,
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setVKCredentials: (state, action) => {
      console.log("[authSlice] Setting VK credentials:", {
        userId: action.payload.user?.id,
        vkUserId: action.payload.user?.vkUserId
      });
      
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.launchParams = action.payload.launchParams;
      state.isAuthenticated = true;
      state.error = null;
    },
    setCredentials: (state, action) => {
      console.log("[authSlice] Setting credentials:", {
        userId: action.payload.user?.id
      });
      
      state.user = action.payload.user;
      state.token = action.payload.token || 'existing';
      state.isAuthenticated = true;
      state.error = null;
    },
    updateUser: (state, action) => {
      console.log("[authSlice] Updating user:", {
        updates: Object.keys(action.payload)
      });
      
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    logout: (state) => {
      console.log("[authSlice] Logging out user");
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    setError: (state, action) => {
      console.error("[authSlice] Setting error:", action.payload);
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        (action) => action.type.endsWith("/pending"),
        (state, action) => {
          console.log(`[authSlice] ${action.type} - status: loading`);
          state.status = "loading";
        }
      )
      .addMatcher(
        (action) => action.type.endsWith("/fulfilled"),
        (state, action) => {
          console.log(`[authSlice] ${action.type} - status: succeeded`);
          state.status = "succeeded";
        }
      )
      .addMatcher(
        (action) => action.type.endsWith("/rejected"),
        (state, action) => {
          console.error(`[authSlice] ${action.type} - status: failed`, {
            error: action.error
          });
          state.status = "failed";
        }
      );
  },
});

export const { setVKCredentials, setCredentials, updateUser, logout, setError } = authSlice.actions;

export const selectCurrentUser = (state) => state.auth.user;
export const selectAuthError = (state) => state.auth.error;
export const selectAuthStatus = (state) => state.auth.status;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;

export default authSlice.reducer;