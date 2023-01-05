import { createSlice } from "@reduxjs/toolkit";

export const billsSlice = createSlice({
  name: "bills",
  initialState: {
    status: "checking",
    bills: [],
    error: undefined,
  },
  reducers: {
    onCheckingBills: (state) => {
      state.status = "checking";
      state.bills = [];
      state.error = undefined;
    },
    onGetBillsSuccess: (state, action) => {
      state.status = "success";
      state.bills = action.payload;
      state.error = undefined;
    },
    onGetBillsFailure: (state, action) => {
      state.status = "failure";
      state.bills = [];
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
