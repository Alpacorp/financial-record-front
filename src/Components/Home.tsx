import billsApi from "../apis/billsApi";
import { useForm } from "../hooks/useForm";

const Home = () => {
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
      await billsApi.post("/bills/new", formValues);
    } catch (error) {
      console.log(error);
    }

    reset();
  };

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
          <option value="tarjeta">Tarjeta</option>
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
    </>
  );
};

export default Home;
