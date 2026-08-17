/**
 * Marca aplicable a un gasto (factura electrónica, hijos, trabajo…).
 * Un gasto puede llevar varias; en Bill se guardan por nombre en `tags`.
 */
export interface Tag {
  _id: string;
  name: string;
  emoji?: string;
  /** Pista para que la IA sepa cuándo aplicarla al interpretar lenguaje natural. */
  description?: string;
}

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
  /**
   * Marca los canales que son tarjeta de crédito. El gasto se causa al comprar,
   * pero el dinero sale de la caja cuando se paga la tarjeta (ver CardPayment).
   */
  isCreditCard?: boolean;
}
