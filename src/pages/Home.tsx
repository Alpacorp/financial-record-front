import React from "react";
import { useSelector } from "react-redux";

import BillForm from "../components/bills/BillForm";
import BillsTable from "../components/bills/BillsTable";
import { useBills } from "../hooks/useBills";
import { Bill } from "../types/bill";

interface BillsState {
  data: Bill[];
  status: "idle" | "checking" | "success" | "failure";
  error: string | undefined;
}

const Home = () => {
  const { data, status } = useSelector(
    (state: { bills: BillsState }) => state.bills
  );
  const { createBillStore, updateBillStore, deleteBillStore } = useBills();

  return (
    <>
      <BillForm onSubmit={createBillStore} loading={status === "checking"} />
      <BillsTable
        data={data}
        loading={status === "checking"}
        onUpdate={updateBillStore}
        onDelete={deleteBillStore}
      />
    </>
  );
};

export default Home;
