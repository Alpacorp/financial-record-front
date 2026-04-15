import { configureStore } from "@reduxjs/toolkit";
import { billsSlice } from "./bills/billsSlice";
import { incomesSlice } from "./incomes/incomesSlice";

export const store = configureStore({
  reducer: {
    bills: billsSlice.reducer,
    incomes: incomesSlice.reducer,
  },
});
