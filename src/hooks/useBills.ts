import { useDispatch } from "react-redux";
import billsApi from "../apis/billsApi";
import {
  clearErrorMessageBills,
  onCheckingBills,
  onGetBillsFailure,
  onGetBillsSuccess,
} from "../store/bills/billsSlice";
import { useNotification } from "../context/NotificationContext";
import { BillFormValues } from "../types/bill";

export const useBills = () => {
  const dispatch = useDispatch();
  const { notify } = useNotification();

  const getBillsStore = async () => {
    dispatch(onCheckingBills());
    try {
      const { data } = await billsApi.get("/bills");
      dispatch(onGetBillsSuccess(data.bills));
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Error al cargar registros";
      dispatch(onGetBillsFailure(msg));
      setTimeout(() => dispatch(clearErrorMessageBills()), 0);
    }
  };

  const createBillStore = async (bill: BillFormValues) => {
    dispatch(onCheckingBills());
    try {
      await billsApi.post("/bills/new", bill);
      await getBillsStore();
      notify({ message: "Gasto registrado correctamente", severity: "success" });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Error al registrar";
      dispatch(onGetBillsFailure(msg));
      notify({ message: "Error al registrar el gasto", severity: "error" });
    }
  };

  const updateBillStore = async (id: string, bill: BillFormValues) => {
    dispatch(onCheckingBills());
    try {
      await billsApi.put(`/bills/${id}`, bill);
      await getBillsStore();
      notify({ message: "Registro actualizado", severity: "success" });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Error al actualizar";
      dispatch(onGetBillsFailure(msg));
      notify({ message: "Error al actualizar el registro", severity: "error" });
    }
  };

  const deleteBillStore = async (id: string) => {
    dispatch(onCheckingBills());
    try {
      await billsApi.delete(`/bills/${id}`);
      await getBillsStore();
      notify({ message: "Registro eliminado", severity: "success" });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Error al eliminar";
      dispatch(onGetBillsFailure(msg));
      notify({ message: "Error al eliminar el registro", severity: "error" });
    }
  };

  return { getBillsStore, createBillStore, updateBillStore, deleteBillStore };
};
