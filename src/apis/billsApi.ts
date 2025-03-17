import axios from "axios";

let baseUrl: string | undefined = "";

if (process.env.REACT_APP_ENVIRONMENT === "development") {
  baseUrl = process.env.REACT_APP_URL_DEV ?? "http://localhost:4000";
} else {
  baseUrl = process.env.REACT_APP_URL_PROD;
}

const billsApi = axios.create({
  baseURL: baseUrl,
});

export default billsApi;
