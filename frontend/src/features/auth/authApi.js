import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_CONFIG } from "../../config";
import { logout, setToken, setCredentials } from "./authSlice";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_CONFIG.BASE_URL,
    credentials: "include",
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
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
} = authApi;
