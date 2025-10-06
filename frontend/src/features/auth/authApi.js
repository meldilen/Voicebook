import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_CONFIG } from "../../config";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_CONFIG.BASE_URL,
    credentials: "include",
    prepareHeaders: (headers, { getState }) => {
      console.log("[authApi] Preparing headers, cookies present:", document.cookie.length > 0);
      return headers;
    },
  }),
  endpoints: (builder) => ({
    vkAuth: builder.mutation({
      query: (vkData) => {
        console.log("[authApi/vkAuth] Sending VK auth request:", {
          vkUserId: vkData.vkUserId,
          hasLaunchParams: !!vkData.launchParams
        });
        
        return {
          url: API_CONFIG.ENDPOINTS.VK.AUTH,
          method: "POST",
          body: vkData,
          headers: {
            "Content-Type": "application/json",
          },
        };
      },
      transformResponse: (response) => {
        console.log("[authApi/vkAuth] Success response:", {
          userId: response.user?.id,
          vkUserId: response.user?.vkUserId
        });
        return response;
      },
      transformErrorResponse: (response) => {
        console.error("[authApi/vkAuth] Error response:", {
          status: response.status,
          data: response.data
        });
        return response;
      },
    }),
    register: builder.mutation({
      query: (credentials) => {
        console.log("[authApi/register] Sending registration:", {
          email: credentials.email ? "***" : "not provided",
          username: credentials.username
        });
        
        return {
          url: API_CONFIG.ENDPOINTS.AUTH.REGISTER,
          method: "POST",
          body: credentials,
          headers: {
            "Content-Type": "application/json",
          },
        };
      },
      transformResponse: (response) => {
        console.log("[authApi/register] Success:", {
          userId: response.user?.id,
          email: response.user?.email ? "***" : "not provided"
        });
        return response;
      },
      transformErrorResponse: (response) => {
        console.error("[authApi/register] Error:", {
          status: response.status,
          error: response.data
        });
        return response;
      },
    }),
    login: builder.mutation({
      query: (credentials) => {
        console.log("[authApi/login] Sending login:", {
          email: credentials.email ? "***" : "not provided",
          hasPassword: !!credentials.password
        });
        
        return {
          url: API_CONFIG.ENDPOINTS.AUTH.LOGIN,
          method: "POST",
          body: credentials,
          headers: {
            "Content-Type": "application/json",
          },
        };
      },
      transformResponse: (response) => {
        console.log("[authApi/login] Success:", {
          endpoint: API_CONFIG.ENDPOINTS.AUTH.LOGIN,
          userId: response.user?.id
        });
        return response;
      },
      transformErrorResponse: (response) => {
        console.error("[authApi/login] Error:", {
          endpoint: API_CONFIG.ENDPOINTS.AUTH.LOGIN,
          status: response.status,
          error: response.data
        });
        return response;
      },
    }),
    getMe: builder.query({
      query: () => {
        console.log("[authApi/getMe] Fetching user data");
        return {
          url: API_CONFIG.ENDPOINTS.AUTH.ME,
          credentials: "include",
        };
      },
      transformResponse: (response) => {
        console.log("[authApi/getMe] User data received:", {
          userId: response.id,
          vkUserId: response.vkUserId
        });
        return response;
      },
      transformErrorResponse: (response) => {
        console.error("[authApi/getMe] Error fetching user:", {
          status: response.status,
          error: response.data
        });
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
