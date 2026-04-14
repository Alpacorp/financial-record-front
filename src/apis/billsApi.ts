import axios from "axios";

const billsApi = axios.create({
  baseURL:
    import.meta.env.VITE_ENVIRONMENT === "development"
      ? (import.meta.env.VITE_URL_DEV ?? "http://localhost:4000/api/v1")
      : import.meta.env.VITE_URL_PROD,
});

export default billsApi;
