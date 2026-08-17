import { useDispatch } from "react-redux";
import billsApi from "../apis/billsApi";
import {
  clearErrorMessageCardPayments,
  onCheckingCardPayments,
  onGetCardPaymentsFailure,
  onGetCardPaymentsSuccess,
} from "../store/cardPayments/cardPaymentsSlice";
import { useNotification } from "../context/NotificationContext";
import { CardPaymentFormValues } from "../types/cardPayment";

export const useCardPayments = () => {
  const dispatch = useDispatch();
  const { notify } = useNotification();

  const getCardPaymentsStore = async () => {
    dispatch(onCheckingCardPayments());
    try {
      const { data } = await billsApi.get("/card-payments");
      dispatch(onGetCardPaymentsSuccess(data.cardPayments));
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Error al cargar los pagos de tarjeta";
      dispatch(onGetCardPaymentsFailure(msg));
      setTimeout(() => dispatch(clearErrorMessageCardPayments()), 0);
    }
  };

  const createCardPaymentStore = async (payment: CardPaymentFormValues) => {
    dispatch(onCheckingCardPayments());
    try {
      await billsApi.post("/card-payments/new", payment);
      await getCardPaymentsStore();
      notify({ message: "Pago de tarjeta registrado", severity: "success" });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Error al registrar";
      dispatch(onGetCardPaymentsFailure(msg));
      notify({ message: "Error al registrar el pago", severity: "error" });
    }
  };

  const deleteCardPaymentStore = async (id: string) => {
    dispatch(onCheckingCardPayments());
    try {
      await billsApi.delete(`/card-payments/${id}`);
      await getCardPaymentsStore();
      notify({ message: "Pago eliminado", severity: "success" });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Error al eliminar";
      dispatch(onGetCardPaymentsFailure(msg));
      notify({ message: "Error al eliminar el pago", severity: "error" });
    }
  };

  return { getCardPaymentsStore, createCardPaymentStore, deleteCardPaymentStore };
};
