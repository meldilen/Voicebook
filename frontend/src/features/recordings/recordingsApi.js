import { createApi } from "@reduxjs/toolkit/query/react";
import { API_CONFIG } from "../../config";
import { baseQueryWithReauth } from "../auth/authApi";

export const recordingsApi = createApi({
  reducerPath: "recordingsApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Recordings"],
  endpoints: (builder) => ({
    uploadRecording: builder.mutation({
      query: (formData) => ({
        url: API_CONFIG.ENDPOINTS.RECORDS.UPLOAD,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Recordings"],
    }),
    getRecordings: builder.query({
      query: ({
        skip = 0,
        limit = 100,
        emotion,
        start_date,
        end_date,
      } = {}) => {
        const params = new URLSearchParams();
        params.append("skip", skip);
        params.append("limit", limit);
        if (emotion) params.append("emotion", emotion);
        if (start_date) params.append("start_date", start_date);
        if (end_date) params.append("end_date", end_date);

        return {
          url: `${API_CONFIG.ENDPOINTS.RECORDS.GET_ALL}?${params.toString()}`,
        };
      },
      providesTags: ["Recordings"],
    }),
    deleteRecording: builder.mutation({
      query: (recordId) => ({
        url: API_CONFIG.ENDPOINTS.RECORDS.DELETE.replace(
          "{recordId}",
          recordId
        ),
        method: "DELETE",
      }),
      invalidatesTags: ["Recordings"],
    }),
    setRecordingFeedback: builder.mutation({
      query: ({ recordId, feedback }) => ({
        url: API_CONFIG.ENDPOINTS.RECORDS.UPDATE_FEEDBACK.replace(
          "{recordId}",
          recordId
        ),
        method: "PATCH",
        body: feedback,
      }),
      invalidatesTags: ["Recordings"],
    }),
  }),
});

export const {
  useUploadRecordingMutation,
  useGetRecordingsQuery,
  useDeleteRecordingMutation,
  useSetRecordingFeedbackMutation,
} = recordingsApi;
