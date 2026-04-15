import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Ingreso } from "../../mocks/ingresosMock";

interface IncomesState {
  status: "idle" | "checking" | "success" | "failure";
  data: Ingreso[];
  error: string | undefined;
}

const initialState: IncomesState = {
  status: "idle",
  data: [],
  error: undefined,
};

export const incomesSlice = createSlice({
  name: "incomes",
  initialState,
  reducers: {
    onCheckingIncomes: (state) => {
      state.status = "checking";
      state.error = undefined;
    },
    onGetIncomesSuccess: (state, action: PayloadAction<Ingreso[]>) => {
      state.status = "success";
      state.data = action.payload;
      state.error = undefined;
    },
    onGetIncomesFailure: (state, action: PayloadAction<string>) => {
      state.status = "failure";
      state.error = action.payload;
    },
    clearErrorMessageIncomes: (state) => {
      state.error = undefined;
    },
  },
});

export const {
  onCheckingIncomes,
  onGetIncomesSuccess,
  onGetIncomesFailure,
  clearErrorMessageIncomes,
} = incomesSlice.actions;
