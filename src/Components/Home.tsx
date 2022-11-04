import React, { useEffect, useMemo, useState } from "react";
import { DataGrid, GridCellParams, GridToolbar } from "@mui/x-data-grid";
import billsApi from "../apis/billsApi";
import { useForm } from "../hooks/useForm";
import Actions from "./Actions";

const Home = () => {
  const [rowId, setRowId] = useState(null);
  const [data, setData] = useState([]);

  const [formValues, handleInputChange, reset] = useForm({
    name: "",
    category: "",
    detail: "",
    amount: 0,
    date: "",
    type: "",
    paymethod: "",
    dues: 0,
  });

  const { name, category, detail, amount, date, type, paymethod, dues } =
    formValues;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(formValues);
    alert("Registro enviado" + JSON.stringify(formValues));

    try {
      const response = await billsApi.post("/bills/new", formValues);
      console.log("response post", response);
    } catch (error) {
      console.log(error);
    }
    reset();
  };

  const getBills = async () => {
    try {
      const response = await billsApi.get("/bills");
      setData(response.data.bills);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getBills();
  }, []);

  console.log("data", data);

  const columns = useMemo(
    () => [
      { field: "_id", headerName: "id", width: 120 },
      {
        field: "name",
        headerName: "Nombre Gasto",
        width: 250,
        editable: true,
        renderCell: (params: GridCellParams) => (
          <>
            <p title={params.value}>
              {params.value.charAt(0).toUpperCase() + params.value.slice(1)}
            </p>
          </>
        ),
      },
      {
        field: "category",
        headerName: "Categoría",
        width: 150,
        editable: true,
        renderCell: (params: GridCellParams) => (
          <>
            <p title={params.value}>
              {params.value.charAt(0).toUpperCase() + params.value.slice(1)}
            </p>
          </>
        ),
      },
      {
        field: "detail",
        headerName: "Detalle del Gasto",
        width: 250,
        editable: true,
        renderCell: (params: GridCellParams) => (
          <>
            <p title={params.value}>
              {params.value.charAt(0).toUpperCase() + params.value.slice(1)}
            </p>
          </>
        ),
      },
      {
        field: "amount",
        headerName: "Costo",
        type: "number",
        width: 100,
        editable: true,
      },
      {
        field: "date",
        headerName: "Fecha",
        width: 100,
        editable: true,
      },
      {
        field: "type",
        headerName: "Tipo",
        width: 100,
        editable: true,
        renderCell: (params: GridCellParams) => (
          <>{params.value.charAt(0).toUpperCase() + params.value.slice(1)}</>
        ),
      },
      {
        field: "paymethod",
        headerName: "Método de Pago",
        width: 130,
        editable: true,
        renderCell: (params: GridCellParams) => (
          <>{params.value.charAt(0).toUpperCase() + params.value.slice(1)}</>
        ),
      },
      {
        field: "dues",
        headerName: "Cuotas",
        type: "number",
        width: 70,
        editable: true,
      },
      {
        field: "actions",
        headerName: "actions",
        type: "actions",
        width: 200,
        renderCell: (params: any) => {
          return (
            <Actions
              {...{
                params,
                rowId,
                setRowId,
                // updateData,
                // storeData,
                // deleteData,
              }}
            />
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rowId]
  );

  return (
    <>
      <form onSubmit={handleSubmit}>
        <input
          onChange={handleInputChange}
          value={name}
          type="text"
          placeholder="Nombre del gasto"
          name="name"
          required
        />
        <select
          name="category"
          value={category}
          onChange={handleInputChange}
          required
        >
          <option value="-1">Selecciona</option>
          <option value="educación">Educación</option>
          <option value="comida">Comida</option>
          <option value="transporte">Transporte</option>
          <option value="diversion">Diversión</option>
          <option value="trabajo">Trabajo</option>
        </select>
        <input
          onChange={handleInputChange}
          type="text"
          placeholder="Detalle"
          name="detail"
          value={detail}
          required
        />
        <input
          onChange={handleInputChange}
          type="number"
          placeholder="Costo"
          name="amount"
          value={amount}
          required
        />
        <input
          onChange={handleInputChange}
          type="date"
          name="date"
          id=""
          value={date}
          required
        />
        <select onChange={handleInputChange} name="type" value={type} required>
          <option value="-1">Selecciona</option>
          <option value="contado">Contado</option>
          <option value="credito">Crédito</option>
        </select>
        <select
          onChange={handleInputChange}
          name="paymethod"
          value={paymethod}
          required
        >
          <option value="-1">Selecciona</option>
          <option value="efectivo">Efectivo</option>
          <option value="debito">Débito</option>
          <option value="tc davivienda">TC Davivienda</option>
          <option value="nequi">Nequi</option>
          <option value="daviplata">Daviplata</option>
          <option value="nu">Nu</option>
          <option value="rappy">Rappy</option>
        </select>
        <input
          onChange={handleInputChange}
          type="number"
          name="dues"
          placeholder="Cuotas"
          value={dues}
        />
        <input
          onChange={handleInputChange}
          type="submit"
          value="Registrar Gasto"
        />
      </form>
      <DataGrid
        rows={data}
        columns={columns}
        style={{ height: "800px", width: "100%" }}
        pageSize={10}
        getRowId={(row: any) => row._id}
        rowsPerPageOptions={[5, 10, 20, 50]}
        loading={data.length === 0}
        components={{
          Toolbar: GridToolbar,
        }}
        getRowSpacing={(params) => ({
          top: params.isFirstVisible ? 0 : 5,
          bottom: params.isLastVisible ? 0 : 5,
        })}
        onCellEditCommit={(params: any) => {
          setRowId(params.id);
        }}
      />
    </>
  );
};

export default Home;
