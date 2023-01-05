import { configureStore } from "@reduxjs/toolkit";
import { billsSlice } from "./bills/billsSlice";

export const store = configureStore({
  reducer: {
    // Add your reducers here
    bills: billsSlice.reducer,
  },
});
