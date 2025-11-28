import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_CONFIG } from "../../config";
import { logout, setToken, setCredentials } from "./authSlice";


const baseQuery = fetchBaseQuery({
  baseUrl: API_CONFIG.BASE_URL,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

export const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  
  // Если получили 401 ошибку (токен истек)
  if (result.error && result.error.status === 401) {
    console.log('Access token expired, attempting refresh...');
    
    try {
      const refreshResult = await baseQuery(
        { 
          url: API_CONFIG.ENDPOINTS.AUTH.REFRESH, 
          method: 'POST' 
        }, 
        api, 
        extraOptions
      );
      
      if (refreshResult.data) {
        const { access_token } = refreshResult.data;
        
        api.dispatch(setToken(access_token));
        
        result = await baseQuery(args, api, extraOptions);
      } else {
        console.log('Refresh token expired, logging out...');
        api.dispatch(logout());
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      api.dispatch(logout());
    }
  }
  
  return result;
};

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["User"],
  endpoints: (builder) => ({
    register: builder.mutation({
      query: (credentials) => {
        return {
          url: API_CONFIG.ENDPOINTS.AUTH.REGISTER,
          method: "POST",
          body: credentials,
        };
      },
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.tokens && data.tokens.access_token) {
            dispatch(setToken(data.tokens.access_token));
            if (data.user) {
              dispatch(
                setCredentials({
                  user: data.user,
                  tokens: data.tokens,
                })
              );
            }
          }
        } catch (error) {
          console.error("authApi: Registration error:", error);
        }
      },
    }),
    login: builder.mutation({
      query: (credentials) => {
        return {
          url: API_CONFIG.ENDPOINTS.AUTH.LOGIN,
          method: "POST",
          body: credentials,
        };
      },
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.tokens) {
            dispatch(setToken(data.tokens.access_token));
            if (data.user) {
              dispatch(
                setCredentials({
                  user: data.user,
                  tokens: data.tokens,
                })
              );
            }
          }
        } catch (error) {
          console.error("authApi: Login error:", error);
        }
      },
    }),
    getMe: builder.query({
      query: () => {
        return {
          url: API_CONFIG.ENDPOINTS.AUTH.ME,
        };
      },
      providesTags: ["User"],
    }),
    logout: builder.mutation({
      query: () => ({
        url: API_CONFIG.ENDPOINTS.AUTH.LOGOUT,
        method: "POST",
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          dispatch(logout());
        }
      },
    }),
    logoutAll: builder.mutation({
      query: () => ({
        url: API_CONFIG.ENDPOINTS.AUTH.LOGOUT_ALL,
        method: "POST",
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          dispatch(logout());
        }
      },
    }),
    refreshToken: builder.mutation({
      query: () => ({
        url: API_CONFIG.ENDPOINTS.AUTH.REFRESH,
        method: "POST",
      }),
    }),
    updateProfile: builder.mutation({
      query: (profileData) => ({
        url: API_CONFIG.ENDPOINTS.AUTH.UPDATE_PROFILE,
        method: "PUT",
        body: profileData,
      }),
      invalidatesTags: ["User"],
    }),
    deleteAccount: builder.mutation({
      query: () => ({
        url: API_CONFIG.ENDPOINTS.AUTH.DELETE_ACCOUNT,
        method: "DELETE",
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          dispatch(logout());
        }
      },
    }),
    getUserSessions: builder.query({
      query: () => ({
        url: API_CONFIG.ENDPOINTS.USER.SESSIONS,
      }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useGetMeQuery,
  useLogoutMutation,
  useLogoutAllMutation,
  useRefreshTokenMutation,
  useUpdateProfileMutation,
  useDeleteAccountMutation,
  useGetUserSessionsQuery,
} = authApi;
