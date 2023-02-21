import { useDispatch } from "react-redux";
import billsApi from "../apis/billsApi";
import {
  clearErrorMessageBills,
  onCheckingBills,
  onGetBillsFailure,
  onGetBillsSuccess,
} from "../store/bills/billsSlice";

export const useBills = () => {
  const dispatch = useDispatch();

  const getBillsStore = async () => {
    dispatch(onCheckingBills());

    try {
      const { data } = await billsApi.get("/bills");
      dispatch(onGetBillsSuccess(data.bills));
    } catch (error: any) {
      console.log("error", error);
      dispatch(onGetBillsFailure(error));
      setTimeout(() => {
        dispatch(clearErrorMessageBills());
      }, 0);
    }
  };

  const createBillStore = async (bill: any) => {
    alert("Registro enviado" + JSON.stringify({ bill }));

    dispatch(onCheckingBills());

    try {
      await billsApi.post("/bills/new", bill);
      getBillsStore();
    } catch (error) {
      console.log(error);
      dispatch(onGetBillsFailure(error));
    }
  };

  const updateBillStore = async (id: string, bill: any) => {
    alert("Registro actualizado" + JSON.stringify({ bill }));

    dispatch(onCheckingBills());

    try {
      await billsApi.put(`/bills/${id}`, bill);
      getBillsStore();
    } catch (error) {
      console.log(error);
      dispatch(onGetBillsFailure(error));
    }
  };

  const deleteBillStore = async (id: string) => {
    const confirm = prompt(
      `¿Estás seguro de borrar el registro? ${id} (escribe 'borrar' para confirmar)`
    );

    if (confirm === "borrar") {
      dispatch(onCheckingBills());
      try {
        await billsApi.delete(`/bills/${id}`);
        getBillsStore();
      } catch (error) {
        console.log(error);
        dispatch(onGetBillsFailure(error));
      }
    } else {
      alert("Operación cancelada");
      getBillsStore();
      return;
    }
  };

  return { getBillsStore, createBillStore, updateBillStore, deleteBillStore };
};
