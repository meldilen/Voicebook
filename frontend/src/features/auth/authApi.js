import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_CONFIG } from "../../config";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_CONFIG.BASE_URL,
    credentials: "include",
    prepareHeaders: (headers, { getState }) => {
      // console.log("Cookies:", document.cookie);
      return headers;
    },
  }),
  endpoints: (builder) => ({
    vkAuth: builder.mutation({
      query: (vkData) => ({
        url: API_CONFIG.ENDPOINTS.VK.AUTH,
        method: "POST",
        body: vkData,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    }),
    register: builder.mutation({
      query: (credentials) => ({
        url: API_CONFIG.ENDPOINTS.AUTH.REGISTER,
        method: "POST",
        body: credentials,
        headers: {
          "Content-Type": "application/json",
        },
      }),
      transformResponse: (response) => {
        // console.log("[REGISTER] Server response:", response);
        return response;
      },
      transformErrorResponse: (response) => {
        // console.error("[REGISTER] Server error:", response);
        return response;
      },
    }),
    login: builder.mutation({
      query: (credentials) => ({
        url: API_CONFIG.ENDPOINTS.AUTH.LOGIN,
        method: "POST",
        body: credentials,
        headers: {
          "Content-Type": "application/json",
        },
      }),
      transformResponse: (response) => {
        // console.log("[LOGIN] Success:", {
        //   endpoint: API_CONFIG.ENDPOINTS.AUTH.LOGIN,
        //   response,
        // });
        return response;
      },
      transformErrorResponse: (response) => {
        // console.error("[LOGIN] Error:", {
        //   endpoint: API_CONFIG.ENDPOINTS.AUTH.LOGIN,
        //   status: response.status,
        //   data: response.data,
        // });
        return response;
      },
    }),
    getMe: builder.query({
      query: () => ({
        url: API_CONFIG.ENDPOINTS.AUTH.ME,
        credentials: "include",
      }),
      transformResponse: (response) => {
        // console.log("[ME] User data:", response);
        return response;
      },
      transformErrorResponse: (response) => {
        // console.error("[ME] Error fetching user:", {
        //   status: response.status,
        //   data: response.data,
        // });
        return response;
      },
    }),
    logout: builder.mutation({
      query: () => ({
        url: API_CONFIG.ENDPOINTS.AUTH.LOGOUT,
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      }),
      transformResponse: (response) => {
        // console.log("[LOGOUT] Success:", response);
        return response;
      },
      transformErrorResponse: (response) => {
        // console.error("[LOGOUT] Error:", {
        //   status: response.status,
        //   data: response.data,
        // });
        return response;
      },
    }),
    updateProfile: builder.mutation({
      query: (profileData) => ({
        url: API_CONFIG.ENDPOINTS.AUTH.UPDATE_PROFILE,
        method: "PATCH",
        body: profileData,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }),
      transformResponse: (response) => {
        // console.log("[UPDATE PROFILE] Success:", response);
        return response;
      },
      transformErrorResponse: (response) => {
        // console.error("[UPDATE PROFILE] Error:", {
        //   status: response.status,
        //   data: response.data,
        // });
        return response;
      },
    }),
    deleteAccount: builder.mutation({
      query: () => ({
        url: API_CONFIG.ENDPOINTS.AUTH.DELETE_ACCOUNT,
        method: "DELETE",
        credentials: "include",
      }),
      transformResponse: (response) => {
        // console.log("[DELETE ACCOUNT] Success:", response);
        return response;
      },
      transformErrorResponse: (response) => {
        // console.error("[DELETE ACCOUNT] Error:", {
        //   status: response.status,
        //   data: response.data,
        // });
        return response;
      },
    }),
  }),
});

export const {
  useVkAuthMutation,
  useRegisterMutation,
  useLoginMutation,
  useGetMeQuery,
  useLogoutMutation,
  useUpdateProfileMutation,
  useDeleteAccountMutation,
} = authApi;
