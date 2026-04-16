import { useDispatch } from "react-redux";
import billsApi from "../apis/billsApi";
import {
  onCheckingCatalog,
  onGetCatalogSuccess,
  onSetCategories,
  onSetPayChannels,
  onCatalogFailure,
} from "../store/catalog/catalogSlice";
import { useNotification } from "../context/NotificationContext";
import { Category, PayChannel } from "../types/catalog";

export const useCatalog = () => {
  const dispatch = useDispatch();
  const { notify } = useNotification();

  // ── Load both catalogs at once ────────────────────────────────────────────

  const getCatalogStore = async () => {
    dispatch(onCheckingCatalog());
    try {
      const [catRes, pmRes] = await Promise.all([
        billsApi.get("/categories"),
        billsApi.get("/paychannels"),
      ]);
      dispatch(
        onGetCatalogSuccess({
          categories: catRes.data.categories,
          payChannels: pmRes.data.payChannels,
        })
      );
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Error al cargar catálogo";
      dispatch(onCatalogFailure(msg));
    }
  };

  // ── Categories ────────────────────────────────────────────────────────────

  const createCategory = async (name: string, type: Category["type"]) => {
    try {
      await billsApi.post("/categories/new", { name, type });
      const { data } = await billsApi.get("/categories");
      dispatch(onSetCategories(data.categories));
      notify({ message: "Categoría creada", severity: "success" });
    } catch {
      notify({ message: "Error al crear la categoría", severity: "error" });
    }
  };

  const updateCategory = async (id: string, name: string) => {
    try {
      await billsApi.put(`/categories/${id}`, { name });
      const { data } = await billsApi.get("/categories");
      dispatch(onSetCategories(data.categories));
      notify({ message: "Categoría actualizada", severity: "success" });
    } catch {
      notify({ message: "Error al actualizar la categoría", severity: "error" });
    }
  };

  const toggleInvestment = async (id: string, current: boolean) => {
    try {
      await billsApi.put(`/categories/${id}`, { isInvestment: !current });
      const { data } = await billsApi.get("/categories");
      dispatch(onSetCategories(data.categories));
    } catch {
      notify({ message: "Error al actualizar la categoría", severity: "error" });
    }
  };

  const updateCategoryEmoji = async (id: string, emoji: string) => {
    try {
      await billsApi.put(`/categories/${id}`, { emoji });
      const { data } = await billsApi.get("/categories");
      dispatch(onSetCategories(data.categories));
    } catch {
      notify({ message: "Error al guardar el emoji", severity: "error" });
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await billsApi.delete(`/categories/${id}`);
      const { data } = await billsApi.get("/categories");
      dispatch(onSetCategories(data.categories));
      notify({ message: "Categoría eliminada", severity: "success" });
    } catch {
      notify({ message: "Error al eliminar la categoría", severity: "error" });
    }
  };

  // ── PayChannels ───────────────────────────────────────────────────────────

  const createPayChannel = async (name: string, type: PayChannel["type"]) => {
    try {
      await billsApi.post("/paychannels/new", { name, type });
      const { data } = await billsApi.get("/paychannels");
      dispatch(onSetPayChannels(data.payChannels));
      notify({ message: "Método de pago creado", severity: "success" });
    } catch {
      notify({ message: "Error al crear el método de pago", severity: "error" });
    }
  };

  // Toggle contado/credito on a pay channel
  // type: "contado"|"credito"|"ambos" — we flip the toggled dimension
  const togglePayChannelType = async (id: string, toggle: "contado" | "credito", current: PayChannel["type"]) => {
    let next: PayChannel["type"];
    const hasContado = current === "contado" || current === "ambos";
    const hasCredito = current === "credito" || current === "ambos";

    if (toggle === "contado") {
      if (hasContado && hasCredito) next = "credito";       // ambos → credito
      else if (hasContado && !hasCredito) next = "contado"; // can't remove last
      else next = "ambos";                                  // credito → ambos
    } else {
      if (hasContado && hasCredito) next = "contado";       // ambos → contado
      else if (hasCredito && !hasContado) next = "credito"; // can't remove last
      else next = "ambos";                                  // contado → ambos
    }

    if (next === current) return;
    try {
      await billsApi.put(`/paychannels/${id}`, { type: next });
      const { data } = await billsApi.get("/paychannels");
      dispatch(onSetPayChannels(data.payChannels));
    } catch {
      notify({ message: "Error al actualizar el método", severity: "error" });
    }
  };

  const updatePayChannel = async (id: string, name: string) => {
    try {
      await billsApi.put(`/paychannels/${id}`, { name });
      const { data } = await billsApi.get("/paychannels");
      dispatch(onSetPayChannels(data.payChannels));
      notify({ message: "Método actualizado", severity: "success" });
    } catch {
      notify({ message: "Error al actualizar el método", severity: "error" });
    }
  };

  const deletePayChannel = async (id: string) => {
    try {
      await billsApi.delete(`/paychannels/${id}`);
      const { data } = await billsApi.get("/paychannels");
      dispatch(onSetPayChannels(data.payChannels));
      notify({ message: "Método eliminado", severity: "success" });
    } catch {
      notify({ message: "Error al eliminar el método", severity: "error" });
    }
  };

  return {
    getCatalogStore,
    createCategory, updateCategory, deleteCategory, toggleInvestment, updateCategoryEmoji,
    createPayChannel, updatePayChannel, deletePayChannel, togglePayChannelType,
  };
};
