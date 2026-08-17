/**
 * Pago a una tarjeta de crédito.
 *
 * NO es un gasto: el gasto ya se causó cuando se hizo la compra con la tarjeta.
 * Este registro solo mueve dinero de la caja hacia la deuda de la tarjeta, así que
 * nunca debe sumarse a los totales de gastos ni a los presupuestos por categoría.
 * Solo afecta el flujo de caja del período y el saldo pendiente de la tarjeta.
 */
export interface CardPayment {
  _id: string;
  /** Nombre del PayChannel de la tarjeta que se paga. */
  card: string;
  amount: number;
  /** YYYY-MM-DD, igual que Bill.date. */
  date: string;
  /** Canal desde el que salió el dinero (cuenta, Nequi, efectivo…). */
  source?: string;
  detail?: string;
}

export type CardPaymentFormValues = Omit<CardPayment, "_id">;
