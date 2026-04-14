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
}

export type BillFormValues = Omit<Bill, "_id">;
