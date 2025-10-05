import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_CONFIG } from "../../config";

export const recordingsApi = createApi({
  reducerPath: "recordingsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_CONFIG.BASE_URL,
    credentials: "include",
    prepareHeaders: (headers, { getState }) => {
      // console.log("Cookies:", document.cookie);
      return headers;
    },
  }),
  tagTypes: ["Recordings"],
  endpoints: (builder) => ({
    uploadRecording: builder.mutation({
      query: (formData) => ({
        url: API_CONFIG.ENDPOINTS.RECORDS.UPLOAD,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Recordings"],
      transformResponse: (response) => {
        console.log("[UPLOAD RECORDING] Server response:", response);
        return response;
      },
      transformErrorResponse: (response) => {
        console.error("[UPLOAD RECORDING] Server error:", response);
        return response;
      },
    }),
    getRecordings: builder.query({
      query: ({ userId, date, limit }) => ({
        url: API_CONFIG.ENDPOINTS.USER_RECORDS.GET_ALL.replace(
          ":userID",
          userId
        ),
        params: { date, limit },
      }),
      providesTags: ["Recordings"],
      transformResponse: (response) => {
        // console.log("[GET RECORDINGS] Success:", response);
        return response;
      },
      transformErrorResponse: (response) => {
        // console.error("[GET RECORDINGS] Error:", {
        //   status: response.status,
        //   data: response.data,
        // });
        return response;
      },
    }),
    getRecordingAnalysis: builder.query({
      query: (recordId) => ({
        url: API_CONFIG.ENDPOINTS.RECORDS.GET_ANALYSIS.replace(
          ":recordID",
          recordId
        ),
      }),
      providesTags: (recordId) => [{ type: "Recordings", id: recordId }],
      transformResponse: (response) => {
        // console.log("[GET ANALYSIS] Success:", response);
        return response;
      },
      transformErrorResponse: (response) => {
        // console.error("[GET ANALYSIS] Error:", {
        //   status: response.status,
        //   data: response.data,
        // });
        return response;
      },
    }),
    getRecordingInsights: builder.mutation({
      query: (insightsData) => ({
        url: API_CONFIG.ENDPOINTS.RECORDS.GET_INSIGHTS,
        method: "POST",
        body: insightsData,
        headers: {
          "Content-Type": "application/json",
        },
      }),
      transformResponse: (response) => {
        // console.log("[GET INSIGHTS] Success:", response);
        return response;
      },
      transformErrorResponse: (response) => {
        // console.error("[GET INSIGHTS] Error:", {
        //   status: response.status,
        //   data: response.data,
        // });
        return response;
      },
    }),
    deleteRecording: builder.mutation({
      query: (recordId) => ({
        url: API_CONFIG.ENDPOINTS.RECORDS.DELETE.replace(":recordID", recordId),
        method: "DELETE",
      }),
      invalidatesTags: ["Recordings"],
      transformResponse: (response) => {
        // console.log("[DELETE RECORDING] Success:", response);
        return response;
      },
      transformErrorResponse: (response) => {
        // console.error("[DELETE RECORDING] Error:", {
        //   status: response.status,
        //   data: response.data,
        // });
        return response;
      },
    }),
    setRecordingFeedback: builder.mutation({
      query: ({ recordId, feedback }) => ({
        url: API_CONFIG.ENDPOINTS.RECORDS.SET_FEEDBACK.replace(
          ":recordID",
          recordId
        ),
        method: "POST",
        body: { feedback },
        headers: {
          "Content-Type": "application/json",
        },
      }),
      invalidatesTags: ["Recordings"],
      transformResponse: (response) => {
        // console.log("[SET FEEDBACK] Success:", response);
        return response;
      },
      transformErrorResponse: (response) => {
        // console.error("[SET FEEDBACK] Error:", {
        //   status: response.status,
        //   data: response.data,
        // });
        return response;
      },
    }),
    getConsecutiveDays: builder.query({
      query: (userId) => ({
        url: API_CONFIG.ENDPOINTS.USER_RECORDS.GET_CONSECUTIVE_DAYS.replace(
          ":userID",
          userId
        ),
      }),
      providesTags: ["ConsecutiveDays"],
    }),
  }),
});

export const {
  useUploadRecordingMutation,
  useGetRecordingsQuery,
  useGetRecordingAnalysisQuery,
  useGetRecordingInsightsMutation,
  useDeleteRecordingMutation,
  useSetRecordingFeedbackMutation,
  useGetConsecutiveDaysQuery,
} = recordingsApi;
