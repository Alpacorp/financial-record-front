import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export const billsSlice = createSlice({
  name: "bills",
  initialState: {
    status: "checking",
    data: [],
    error: undefined,
  },
  reducers: {
    onCheckingBills: (state) => {
      state.status = "checking";
      state.data = [];
      state.error = undefined;
    },
    onGetBillsSuccess: (state, action: PayloadAction<[]>) => {
      state.status = "success";
      state.data = action.payload;
      state.error = undefined;
    },
    onGetBillsFailure: (state, action: PayloadAction<[] | any>) => {
      state.status = "failure";
      state.data = [];
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
