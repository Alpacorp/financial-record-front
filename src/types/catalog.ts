export interface Category {
  _id: string;
  name: string;
  type: "gasto" | "ingreso";
}

export interface PayChannel {
  _id: string;
  name: string;
  type: "contado" | "credito" | "ambos";
}
