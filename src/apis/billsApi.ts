import axios from "axios";

const billsApi = axios.create({
  baseURL: "https://financial-record-app.herokuapp.com/api/v1",
});

export default billsApi;
