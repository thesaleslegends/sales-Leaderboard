// js/medewerkers.js
import { supabase } from "../supabase.js";

/* =========================
   MEDEWERKERS OPHALEN
   (alleen feiten, geen geld)
========================= */
export async function haalMedewerkersOp() {
  const { data, error } = await supabase
    .from("medewerkers")
    .select("id, naam")
    .eq("actief", true);

  if (error) {
    console.error("❌ Fout bij laden medewerkers:", error);
    return [];
  }

  console.log("✅ Medewerkers geladen:", data);
  return data;
}
/* =========================
   WERKCONTROLE
========================= */
export async function heeftMedewerkerGewerkt(medewerkerId, datum) {
  const correcteDatum = new Date(datum).toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("shifts")
    .select("id")
    .eq("medewerker_id", medewerkerId)
    .eq("datum", correcteDatum)
    .limit(1);

  if (error) {
    console.error("❌ Fout bij werk-check:", error);
    return false;
  }

  return data.length > 0;
}
/* =========================
   AANTAL GEWERKTE DAGEN
========================= */
export async function telGewerkteDagen(medewerkerId, startDatum, eindDatum) {
  const { data, error } = await supabase
    .from("shifts")
    .select("id")
    .eq("medewerker_id", medewerkerId)
    .eq("status", "gewerkt")
    .gte("datum", startDatum)
    .lte("datum", eindDatum);

  if (error) {
    console.error("❌ Fout bij tellen gewerkte dagen:", error);
    return 0;
  }

  return data.length;
}
/* =========================
   LOONPERIODE BEREKENEN
   (26e t/m 25e)
========================= */
export function bepaalLoonPeriode(datum) {
  const [jaar, maand, dag] = datum.split("-").map(Number);

  let startJaar, startMaand;
  let eindJaar, eindMaand;

  if (dag >= 26) {
    startJaar = jaar;
    startMaand = maand;
    eindJaar = maand === 12 ? jaar + 1 : jaar;
    eindMaand = maand === 12 ? 1 : maand + 1;
  } else {
    startJaar = maand === 1 ? jaar - 1 : jaar;
    startMaand = maand === 1 ? 12 : maand - 1;
    eindJaar = jaar;
    eindMaand = maand;
  }

  return {
    start: `${startJaar}-${String(startMaand).padStart(2, "0")}-26`,
    einde: `${eindJaar}-${String(eindMaand).padStart(2, "0")}-25`,
  };
}
/* =========================
   TEST (tijdelijk)
========================= */

const periode = bepaalLoonPeriode("2026-01-21");
console.log("Loonperiode:", periode);