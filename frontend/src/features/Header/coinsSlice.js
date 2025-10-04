// features/coins/coinsSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  balance: 150, 
};

export const coinsSlice = createSlice({
  name: 'coins',
  initialState,
  reducers: {
    addCoins: (state, action) => {
      state.balance += action.payload;
    },
    setCoins: (state, action) => {
      state.balance = action.payload;
    },
  },
});

export const { addCoins, setCoins } = coinsSlice.actions;
export const selectCoinsBalance = (state) => state.coins.balance;
export default coinsSlice.reducer;
//