import axios from "axios";
import billsApi from "../apis/billsApi";

const TOKEN_KEY = "x-token";

export const useAuth = () => {
  const login = async (
    email: string,
    password: string
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { data } = await billsApi.post("/auth", { email, password });
      localStorage.setItem(TOKEN_KEY, data.token);
      return { ok: true };
    } catch (error: unknown) {
      localStorage.removeItem(TOKEN_KEY);
      if (axios.isAxiosError(error) && error.response?.data?.msg) {
        return { ok: false, error: error.response.data.msg };
      }
      return { ok: false, error: "Error de conexión con el servidor" };
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
  };

  // Validates existing token and refreshes it. Returns true if session is still valid.
  const checkToken = async (): Promise<boolean> => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return false;
    try {
      const { data } = await billsApi.get("/auth/renew");
      localStorage.setItem(TOKEN_KEY, data.token);
      return true;
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      return false;
    }
  };

  return { login, logout, checkToken };
};
