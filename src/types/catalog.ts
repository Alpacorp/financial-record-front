export interface Category {
  _id: string;
  name: string;
  type: "gasto" | "ingreso";
  isInvestment?: boolean;
  emoji?: string;
}

export interface PayChannel {
  _id: string;
  name: string;
  type: "contado" | "credito" | "ambos";
}
