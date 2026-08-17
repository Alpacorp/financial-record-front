import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CardPayment } from "../../types/cardPayment";

interface CardPaymentsState {
  status: "idle" | "checking" | "success" | "failure";
  data: CardPayment[];
  error: string | undefined;
}

const initialState: CardPaymentsState = {
  status: "idle",
  data: [],
  error: undefined,
};

export const cardPaymentsSlice = createSlice({
  name: "cardPayments",
  initialState,
  reducers: {
    onCheckingCardPayments: (state) => {
      state.status = "checking";
      state.error = undefined;
    },
    onGetCardPaymentsSuccess: (state, action: PayloadAction<CardPayment[]>) => {
      state.status = "success";
      state.data = action.payload;
      state.error = undefined;
    },
    onGetCardPaymentsFailure: (state, action: PayloadAction<string>) => {
      state.status = "failure";
      state.error = action.payload;
    },
    clearErrorMessageCardPayments: (state) => {
      state.error = undefined;
    },
  },
});

export const {
  onCheckingCardPayments,
  onGetCardPaymentsSuccess,
  onGetCardPaymentsFailure,
  clearErrorMessageCardPayments,
} = cardPaymentsSlice.actions;
