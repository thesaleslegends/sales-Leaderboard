// storage.js
import { supabase } from "./supabase.js";

// DAG OPSLAAN
export async function saveDag(datum, regels) {
  const { error } = await supabase
    .from("dagen")
    .upsert({
      datum,
      regels
    });

  if (error) {
    console.error("Supabase save error:", error);
    throw error;
  }
}

// DAGEN LADEN
export async function loadDagen(start, end) {
  const { data, error } = await supabase
    .from("dagen")
    .select("*")
    .gte("datum", start)
    .lte("datum", end);

  if (error) {
    console.error("Supabase load error:", error);
    return [];
  }

  return data;
}