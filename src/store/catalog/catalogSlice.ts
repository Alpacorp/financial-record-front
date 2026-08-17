import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Category, PayChannel, Tag } from "../../types/catalog";

interface CatalogState {
  categories: Category[];
  payChannels: PayChannel[];
  tags: Tag[];
  status: "idle" | "checking" | "success" | "failure";
  error: string | undefined;
}

const initialState: CatalogState = {
  categories: [],
  payChannels: [],
  tags: [],
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
      action: PayloadAction<{ categories: Category[]; payChannels: PayChannel[]; tags: Tag[] }>
    ) => {
      state.status = "success";
      state.categories = action.payload.categories;
      state.payChannels = action.payload.payChannels;
      state.tags = action.payload.tags;
      state.error = undefined;
    },
    onSetCategories: (state, action: PayloadAction<Category[]>) => {
      state.categories = action.payload;
    },
    onSetPayChannels: (state, action: PayloadAction<PayChannel[]>) => {
      state.payChannels = action.payload;
    },
    onSetTags: (state, action: PayloadAction<Tag[]>) => {
      state.tags = action.payload;
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
  onSetTags,
  onCatalogFailure,
} = catalogSlice.actions;
