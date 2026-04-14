import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Bill } from "../../types/bill";

interface BillsState {
  status: "idle" | "checking" | "success" | "failure";
  data: Bill[];
  error: string | undefined;
}

const initialState: BillsState = {
  status: "idle",
  data: [],
  error: undefined,
};

export const billsSlice = createSlice({
  name: "bills",
  initialState,
  reducers: {
    onCheckingBills: (state) => {
      state.status = "checking";
      state.error = undefined;
    },
    onGetBillsSuccess: (state, action: PayloadAction<Bill[]>) => {
      state.status = "success";
      state.data = action.payload;
      state.error = undefined;
    },
    onGetBillsFailure: (state, action: PayloadAction<string>) => {
      state.status = "failure";
      state.error = action.payload;
    },
    clearErrorMessageBills: (state) => {
      state.error = undefined;
    },
  },
});

export const {
  onCheckingBills,
  onGetBillsSuccess,
  onGetBillsFailure,
  clearErrorMessageBills,
} = billsSlice.actions;
