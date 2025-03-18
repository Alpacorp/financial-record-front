import React, { useEffect, useMemo, useState } from "react";
import { DataGrid, GridCellParams, GridToolbar } from "@mui/x-data-grid";
import { useSelector } from "react-redux";

import Actions from "../components/Actions";

import { useForm } from "../hooks/useForm";
import { useBills } from "../hooks/useBills";
import capitalize from "../utils/capitalize";

const accessValue = process.env.REACT_APP_ACCESS;

const Home = () => {
  const { data } = useSelector((state: any) => state.bills);

  const [rowId, setRowId] = useState(null);
  const [dataGrid, setDataGrid] = useState<any>([]);
  const [loading, setLoading] = useState(false);
  const [counted, setCounted] = useState<any>(null);
  const [showContent, setShowContent] = useState(false);

  const { getBillsStore, createBillStore, updateBillStore, deleteBillStore } =
    useBills();

  const [formValues, handleInputChange, reset] = useForm({
    name: "",
    category: "",
    detail: "",
    amount: "",
    date: "",
    type: "",
    paymethod: "",
    dues: "",
    access: "",
  });

  const {
    name,
    category,
    detail,
    amount,
    date,
    type,
    paymethod,
    dues,
    access,
  } = formValues;

  console.log("logale, access out", access);

  const handleType = () => {
    if (type === "Contado") {
      setCounted(true);
    } else if (type === "Crédito") {
      setCounted(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createBillStore(formValues);
    reset();
  };

  const handleShowContent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const access = e.currentTarget.access.value;

    if (access === accessValue) {
      setShowContent(true);
    } else {
      alert("Acceso denegado");
    }
  };

  useEffect(() => {
    setLoading(true);
    getBillsStore();
    setTimeout(() => {
      setLoading(false);
    }, 1000);
    setShowContent(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setDataGrid(data);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    handleType();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const columns = useMemo(
    () => [
      { field: "_id", headerName: "id", width: 120 },
      {
        field: "name",
        headerName: "Nombre Gasto",
        width: 250,
        editable: true,
        renderCell: (params: GridCellParams) => (
          <p title={params.value}>
            {params.value.charAt(0).toUpperCase() + params.value.slice(1)}
          </p>
        ),
      },
      {
        field: "category",
        headerName: "Categoría",
        width: 150,
        editable: true,
        renderCell: (params: GridCellParams) => (
          <p title={params.value}>
            {params.value.charAt(0).toUpperCase() + params.value.slice(1)}
          </p>
        ),
      },
      {
        field: "detail",
        headerName: "Detalle del Gasto",
        width: 250,
        editable: true,
        renderCell: (params: GridCellParams) => (
          <p title={params.value}>
            {params.value.charAt(0).toUpperCase() + params.value.slice(1)}
          </p>
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
                updateData: updateBillStore,
                deleteData: deleteBillStore,
              }}
            />
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rowId]
  );

  if (!showContent) {
    return (
      <div>
        <h1>Welcome</h1>
        <form onSubmit={handleShowContent}>
          <input
            type="text"
            placeholder="Acceso"
            name="access"
            required
            autoFocus
            onChange={handleInputChange}
            value={access}
          />
          <input type="submit" value="Ingresar" />
        </form>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <input
          onChange={handleInputChange}
          value={capitalize(name)}
          type="text"
          placeholder="Nombre del gasto"
          name="name"
          required
          autoFocus
        />
        <select
          name="category"
          value={category}
          onChange={handleInputChange}
          required
        >
          <option value="-1">Selecciona la categoria del gasto</option>
          <option value="Apoyo Mamá">Apoyo Mamá</option>
          <option value="Apoyo Papá">Apoyo Papá</option>
          <option value="Arriendo">Arriendo</option>
          <option value="Carro">Carro</option>
          <option value="Comida">Comida</option>
          <option value="Mercado">Mercado</option>
          <option value="Cuotas">Cuotas</option>
          <option value="Diversión">Diversión</option>
          <option value="Educación">Educación</option>
          <option value="Hogar">Hogar</option>
          <option value="Impuestos">Impuestos</option>
          <option value="Inversiones">Inversiones</option>
          <option value="Plataformas Web">Plataformas Web</option>
          <option value="Prestamos">Préstamos</option>
          <option value="Ropa">Ropa</option>
          <option value="Salud">Salud</option>
          <option value="Servicios Públicos">Servicios Públicos</option>
          <option value="Servicios Streaming">Servicios Streaming</option>
          <option value="Trabajo">Trabajo</option>
          <option value="Transporte">Transporte</option>
        </select>
        <input
          onChange={handleInputChange}
          type="text"
          placeholder="Detalle del gasto"
          name="detail"
          value={capitalize(detail)}
          required
        />
        <input
          onChange={handleInputChange}
          type="number"
          placeholder="Valor del gasto"
          name="amount"
          value={amount}
          required
        />
        <input
          onChange={handleInputChange}
          type="date"
          placeholder="Fecha del gasto"
          name="date"
          id=""
          value={date}
          required
        />
        <select onChange={handleInputChange} name="type" value={type} required>
          <option value="-1">Selecciona el tipo de pago</option>
          <option value="Contado">Contado</option>
          <option value="Crédito">Crédito</option>
        </select>

        {counted !== null ? (
          <>
            <select
              onChange={handleInputChange}
              name="paymethod"
              value={paymethod}
              required
            >
              <option value="-1">Selecciona el método de pago</option>

              {counted ? (
                <>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Debito">Débito</option>
                  <option value="DebitoDavivienda">Débito Davivienda</option>
                  <option value="Nequi">Nequi</option>
                  <option value="Daviplata">Daviplata</option>
                  <option value="RappyCuenta">Rappy Cuenta</option>
                </>
              ) : (
                <>
                  <option value="Tc Davivienda">TC Davivienda</option>
                  <option value="Daviplata">Daviplata</option>
                  <option value="Nu">Nu</option>
                  <option value="Rappy">Rappy</option>
                  <option value="Rappy 2">Rappy 2</option>
                </>
              )}
            </select>
            {!counted && (
              <input
                onChange={handleInputChange}
                type="number"
                name="dues"
                placeholder="Número de cuotas"
                value={dues}
              />
            )}
          </>
        ) : (
          ""
        )}
        <input
          onChange={handleInputChange}
          type="submit"
          value="Registrar Gasto"
        />
      </form>
      <DataGrid
        rows={dataGrid}
        columns={columns}
        style={{ height: "800px", width: "100%" }}
        pageSize={10}
        getRowId={(row: any) => row._id}
        rowsPerPageOptions={[5, 10, 20, 50]}
        loading={loading}
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
