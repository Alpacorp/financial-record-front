import { useDispatch } from "react-redux";
import billsApi from "../apis/billsApi";
import {
  onCheckingCatalog,
  onGetCatalogSuccess,
  onSetCategories,
  onSetPayChannels,
  onSetTags,
  onCatalogFailure,
} from "../store/catalog/catalogSlice";
import { useNotification } from "../context/NotificationContext";
import { Category, PayChannel } from "../types/catalog";

/** Mensaje del backend si lo hay (ej: nombre de marca duplicado). */
const apiMessage = (error: unknown, fallback: string): string => {
  const msg = (error as { response?: { data?: { msg?: string } } })?.response?.data?.msg;
  return msg ?? fallback;
};

export const useCatalog = () => {
  const dispatch = useDispatch();
  const { notify } = useNotification();

  // ── Load both catalogs at once ────────────────────────────────────────────

  const getCatalogStore = async () => {
    dispatch(onCheckingCatalog());
    try {
      const [catRes, pmRes, tagRes] = await Promise.all([
        billsApi.get("/categories"),
        billsApi.get("/paychannels"),
        // Tolerante a un backend aún sin /tags: sin esto un 404 tumbaría
        // también las categorías y los métodos de pago
        billsApi.get("/tags").catch(() => ({ data: { tags: [] } })),
      ]);
      dispatch(
        onGetCatalogSuccess({
          categories: catRes.data.categories,
          payChannels: pmRes.data.payChannels,
          tags: tagRes.data.tags,
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

  // Marca/desmarca un canal como tarjeta de crédito. Determina si sus compras
  // salen de la caja al comprar o al pagar la tarjeta (ver CardPayment).
  const toggleCreditCard = async (id: string, current: boolean) => {
    try {
      await billsApi.put(`/paychannels/${id}`, { isCreditCard: !current });
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

  // ── Tags (marcas) ─────────────────────────────────────────────────────────

  const refreshTags = async () => {
    const { data } = await billsApi.get("/tags");
    dispatch(onSetTags(data.tags));
  };

  const createTag = async (name: string): Promise<boolean> => {
    try {
      await billsApi.post("/tags/new", { name });
      await refreshTags();
      notify({ message: "Marca creada", severity: "success" });
      return true;
    } catch (error: unknown) {
      notify({ message: apiMessage(error, "Error al crear la marca"), severity: "error" });
      return false;
    }
  };

  // Renombrar arrastra la marca en todos los gastos que la usaban (lo hace el backend)
  const updateTag = async (id: string, name: string): Promise<boolean> => {
    try {
      const { data } = await billsApi.put(`/tags/${id}`, { name });
      await refreshTags();
      notify({
        message: data.billsUpdated > 0
          ? `Marca actualizada en ${data.billsUpdated} gasto${data.billsUpdated !== 1 ? "s" : ""}`
          : "Marca actualizada",
        severity: "success",
      });
      return true;
    } catch (error: unknown) {
      notify({ message: apiMessage(error, "Error al actualizar la marca"), severity: "error" });
      return false;
    }
  };

  const updateTagEmoji = async (id: string, emoji: string) => {
    try {
      await billsApi.put(`/tags/${id}`, { emoji });
      await refreshTags();
    } catch {
      notify({ message: "Error al guardar el emoji", severity: "error" });
    }
  };

  const updateTagDescription = async (id: string, description: string) => {
    try {
      await billsApi.put(`/tags/${id}`, { description });
      await refreshTags();
      notify({ message: "Descripción guardada", severity: "success" });
    } catch {
      notify({ message: "Error al guardar la descripción", severity: "error" });
    }
  };

  const deleteTag = async (id: string) => {
    try {
      const { data } = await billsApi.delete(`/tags/${id}`);
      await refreshTags();
      notify({
        message: data.billsUpdated > 0
          ? `Marca eliminada de ${data.billsUpdated} gasto${data.billsUpdated !== 1 ? "s" : ""}`
          : "Marca eliminada",
        severity: "success",
      });
    } catch {
      notify({ message: "Error al eliminar la marca", severity: "error" });
    }
  };

  return {
    getCatalogStore,
    createTag, updateTag, updateTagEmoji, updateTagDescription, deleteTag,
    createCategory, updateCategory, deleteCategory, toggleInvestment, updateCategoryEmoji,
    createPayChannel, updatePayChannel, deletePayChannel, togglePayChannelType, toggleCreditCard,
  };
};
