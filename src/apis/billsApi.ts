import axios from "axios";

const billsApi = axios.create({
  baseURL: "https://financial-record-back-production.up.railway.app/api/v1",
});

export default billsApi;
