import axios from "axios";

const billsApi = axios.create({
  baseURL:
    import.meta.env.VITE_ENVIRONMENT === "development"
      ? (import.meta.env.VITE_URL_DEV ?? "http://localhost:4000/api/v1")
      : import.meta.env.VITE_URL_PROD,
});

// Attach JWT on every request if present
billsApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("x-token");
  if (token) {
    config.headers["x-token"] = token;
  }
  return config;
});

export default billsApi;
