import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Category, PayChannel } from "../../types/catalog";

interface CatalogState {
  categories: Category[];
  payChannels: PayChannel[];
  status: "idle" | "checking" | "success" | "failure";
  error: string | undefined;
}

const initialState: CatalogState = {
  categories: [],
  payChannels: [],
  status: "idle",
  error: undefined,
};

export const catalogSlice = createSlice({
  name: "catalog",
  initialState,
  reducers: {
    onCheckingCatalog: (state) => {
      state.status = "checking";
      state.error = undefined;
    },
    onGetCatalogSuccess: (
      state,
      action: PayloadAction<{ categories: Category[]; payChannels: PayChannel[] }>
    ) => {
      state.status = "success";
      state.categories = action.payload.categories;
      state.payChannels = action.payload.payChannels;
      state.error = undefined;
    },
    onSetCategories: (state, action: PayloadAction<Category[]>) => {
      state.categories = action.payload;
    },
    onSetPayChannels: (state, action: PayloadAction<PayChannel[]>) => {
      state.payChannels = action.payload;
    },
    onCatalogFailure: (state, action: PayloadAction<string>) => {
      state.status = "failure";
      state.error = action.payload;
    },
  },
});

export const {
  onCheckingCatalog,
  onGetCatalogSuccess,
  onSetCategories,
  onSetPayChannels,
  onCatalogFailure,
} = catalogSlice.actions;
