import { useMemo } from "react";
import { useSelector } from "react-redux";
import { Category } from "../types/catalog";

/** Returns a map of category name → emoji for quick lookup across the app. */
export const useEmojiMap = (): Record<string, string> => {
  const { categories } = useSelector(
    (state: { catalog: { categories: Category[] } }) => state.catalog
  );
  return useMemo(() => {
    const m: Record<string, string> = {};
    categories.forEach((c) => { if (c.emoji) m[c.name] = c.emoji; });
    return m;
  }, [categories]);
};
