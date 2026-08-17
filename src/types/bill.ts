export interface Bill {
  _id: string;
  name: string;
  category: string;
  detail: string;
  amount: number;
  date: string;
  type: "Contado" | "Crédito";
  paymethod: string;
  dues?: number;
  /** Marcas del gasto, por nombre. Ver Tag en types/catalog.ts. */
  tags?: string[];
}

export type BillFormValues = Omit<Bill, "_id">;
