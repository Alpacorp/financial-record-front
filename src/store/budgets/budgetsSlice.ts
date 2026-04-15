import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Budget {
  _id: string;
  category: string;
  amount: number;
}

interface BudgetsState {
  data: Budget[];
  status: "idle" | "checking" | "success" | "failure";
}

const initialState: BudgetsState = {
  data: [],
  status: "idle",
};

export const budgetsSlice = createSlice({
  name: "budgets",
  initialState,
  reducers: {
    onCheckingBudgets: (state) => {
      state.status = "checking";
    },
    onGetBudgetsSuccess: (state, action: PayloadAction<Budget[]>) => {
      state.status = "success";
      state.data = action.payload;
    },
    onBudgetsFailure: (state) => {
      state.status = "failure";
    },
  },
});

export const { onCheckingBudgets, onGetBudgetsSuccess, onBudgetsFailure } =
  budgetsSlice.actions;
