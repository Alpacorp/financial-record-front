import axios from "axios";

const baseUrl = process.env.REACT_APP_URL;

const billsApi = axios.create({
  baseURL: baseUrl,
});

export default billsApi;
