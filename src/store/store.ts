import { configureStore } from "@reduxjs/toolkit";
import { billsSlice } from "./bills/billsSlice";
import { incomesSlice } from "./incomes/incomesSlice";
import { catalogSlice } from "./catalog/catalogSlice";
import { budgetsSlice } from "./budgets/budgetsSlice";

export const store = configureStore({
  reducer: {
    bills: billsSlice.reducer,
    incomes: incomesSlice.reducer,
    catalog: catalogSlice.reducer,
    budgets: budgetsSlice.reducer,
  },
});
