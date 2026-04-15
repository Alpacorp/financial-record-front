import { useDispatch } from "react-redux";
import billsApi from "../apis/billsApi";
import {
  clearErrorMessageIncomes,
  onCheckingIncomes,
  onGetIncomesFailure,
  onGetIncomesSuccess,
} from "../store/incomes/incomesSlice";
import { useNotification } from "../context/NotificationContext";
import { Ingreso } from "../mocks/ingresosMock";

// Payload sent to the backend (maps front field names to API field names)
export interface IncomePayload {
  concept: string;   // ← front: name
  category: string;
  detail: string;
  amount: number;
  date: string;
  channel: string;   // ← front: paymethod (reused as channel)
  paymethod: string;
}

// Map the API response shape to the front Ingreso interface
const toIngreso = (doc: Record<string, unknown>): Ingreso => ({
  _id:       String(doc._id ?? ""),
  name:      String(doc.concept ?? ""),
  category:  String(doc.category ?? ""),
  detail:    String(doc.detail ?? ""),
  amount:    Number(doc.amount ?? 0),
  date:      String(doc.date ?? ""),
  paymethod: String(doc.paymethod ?? doc.channel ?? ""),
});

export const useIncomes = () => {
  const dispatch = useDispatch();
  const { notify } = useNotification();

  const getIncomesStore = async () => {
    dispatch(onCheckingIncomes());
    try {
      const { data } = await billsApi.get("/incomes");
      dispatch(onGetIncomesSuccess(data.incomes.map(toIngreso)));
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Error al cargar ingresos";
      dispatch(onGetIncomesFailure(msg));
      setTimeout(() => dispatch(clearErrorMessageIncomes()), 0);
    }
  };

  const createIncomeStore = async (income: IncomePayload) => {
    dispatch(onCheckingIncomes());
    try {
      await billsApi.post("/incomes/new", income);
      await getIncomesStore();
      notify({ message: "Ingreso registrado correctamente", severity: "success" });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Error al registrar";
      dispatch(onGetIncomesFailure(msg));
      notify({ message: "Error al registrar el ingreso", severity: "error" });
    }
  };

  const updateIncomeStore = async (id: string, income: IncomePayload) => {
    dispatch(onCheckingIncomes());
    try {
      await billsApi.put(`/incomes/${id}`, income);
      await getIncomesStore();
      notify({ message: "Ingreso actualizado", severity: "success" });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Error al actualizar";
      dispatch(onGetIncomesFailure(msg));
      notify({ message: "Error al actualizar el ingreso", severity: "error" });
    }
  };

  const deleteIncomeStore = async (id: string) => {
    dispatch(onCheckingIncomes());
    try {
      await billsApi.delete(`/incomes/${id}`);
      await getIncomesStore();
      notify({ message: "Ingreso eliminado", severity: "success" });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Error al eliminar";
      dispatch(onGetIncomesFailure(msg));
      notify({ message: "Error al eliminar el ingreso", severity: "error" });
    }
  };

  return { getIncomesStore, createIncomeStore, updateIncomeStore, deleteIncomeStore };
};
