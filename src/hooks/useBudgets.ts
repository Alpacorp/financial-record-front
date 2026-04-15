import { useDispatch } from "react-redux";
import billsApi from "../apis/billsApi";
import {
  onCheckingBudgets,
  onGetBudgetsSuccess,
  onBudgetsFailure,
} from "../store/budgets/budgetsSlice";
import { useNotification } from "../context/NotificationContext";

export const useBudgets = () => {
  const dispatch = useDispatch();
  const { notify } = useNotification();

  const getBudgetsStore = async () => {
    dispatch(onCheckingBudgets());
    try {
      const { data } = await billsApi.get("/budgets");
      dispatch(onGetBudgetsSuccess(data.budgets));
    } catch {
      dispatch(onBudgetsFailure());
    }
  };

  // Create or update budget for a category (upsert on backend)
  const saveBudgetStore = async (category: string, amount: number) => {
    try {
      await billsApi.post("/budgets", { category, amount });
      await getBudgetsStore();
    } catch {
      notify({ message: "Error al guardar el presupuesto", severity: "error" });
    }
  };

  const deleteBudgetStore = async (id: string) => {
    try {
      await billsApi.delete(`/budgets/${id}`);
      await getBudgetsStore();
    } catch {
      notify({ message: "Error al eliminar el presupuesto", severity: "error" });
    }
  };

  return { getBudgetsStore, saveBudgetStore, deleteBudgetStore };
};
