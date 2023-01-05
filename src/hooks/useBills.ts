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

  const billsStore = async () => {
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

  return { billsStore };
};
