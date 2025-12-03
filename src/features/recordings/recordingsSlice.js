import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentRecording: null,
  isPlaying: false,
};

const recordingsSlice = createSlice({
  name: "recordings",
  initialState,
  reducers: {
    setCurrentRecording: (state, action) => {
      state.currentRecording = action.payload;
    },
    clearCurrentRecording: (state) => {
      state.currentRecording = null;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setCurrentRecording, clearCurrentRecording, setIsPlaying  } = recordingsSlice.actions;

export const selectCurrentRecording = (state) => state.recordings.currentRecording;
export const selectIsPlaying = (state) => state.recordings.isPlaying;

export default recordingsSlice.reducer;