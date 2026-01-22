import { supabase } from "../supabase.js";

/* =========================
   BASIS SETUP
========================= */
const params = new URLSearchParams(window.location.search);
const medewerkerId = params.get("id");

const gewerktBody = document.getElementById("gewerktBody");
const totaalBasisEl = document.getElementById("totaalBasis");
const totaalAfsprakenEl = document.getElementById("totaalAfspraken");
const totaalBonusEl = document.getElementById("totaalBonus");
const loonPeriodeSelect = document.getElementById("loonPeriodeSelect");

/* =========================
   LOONPERIODE (26 → 25)
========================= */
function bepaalLoonPeriode(type = "huidig") {
  const vandaag = new Date();
  let referentie = new Date(vandaag);

  if (type === "vorig") {
    referentie.setMonth(referentie.getMonth() - 1);
  }

  const jaar = referentie.getFullYear();
  const maand = referentie.getMonth() + 1;
  const dag = referentie.getDate();

  let startJaar, startMaand, eindJaar, eindMaand;

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
    einde: `${eindJaar}-${String(eindMaand).padStart(2, "0")}-25`
  };
}

/* =========================
   LAAD GEWERKTE DAGEN
========================= */
async function laadGewerkteDagen() {
  /* 1️⃣ Medewerker ophalen */
  const { data: medewerker, error: medewerkerError } = await supabase
    .from("medewerkers")
    .select("basis_dagloon, bonus_per_netto")
    .eq("id", medewerkerId)
    .single();

  if (medewerkerError) {
    console.error("❌ Fout bij laden medewerker:", medewerkerError);
    return;
  }

  const basisDagloon = Number(medewerker.basis_dagloon) || 0;
  const bonusPerAfspraak = Number(medewerker.bonus_per_netto) || 0;

  /* 2️⃣ Loonperiode bepalen */
  const periodeType = loonPeriodeSelect?.value || "huidig";
  const periode = bepaalLoonPeriode(periodeType);

  /* 3️⃣ Shifts ophalen */
  const { data: shifts, error: shiftsError } = await supabase
    .from("shifts")
    .select("datum, type")
    .eq("medewerker_id", medewerkerId)
    .gte("datum", periode.start)
    .lte("datum", periode.einde)
    .order("datum", { ascending: true });

  if (shiftsError) {
    console.error("❌ Fout bij laden shifts:", shiftsError);
    return;
  }

  gewerktBody.innerHTML = "";

  let totaalBasis = 0;
  let totaalAfspraken = 0;
  let totaalBonus = 0;

  /* 4️⃣ Per dag verwerken */
  for (const shift of shifts) {
    /* Basisloon */
    let basisBedrag = 0;
    if (shift.type === "full") basisBedrag = basisDagloon;
    if (shift.type === "half") basisBedrag = basisDagloon / 2;

    totaalBasis += basisBedrag;

    /* Afspraken ophalen */
    const { data: dagData, error: dagError } = await supabase
      .from("dagen")
      .select("regels")
      .eq("datum", shift.datum)
      .single();

    let aantalNettoAfspraken = 0;

    if (!dagError && Array.isArray(dagData?.regels)) {
      const nettoAfspraken = dagData.regels.filter(r => {
  if (!r.medewerkerId || !r.status) return false;

  const isZelfdeMedewerker =
    String(r.medewerkerId).trim() === String(medewerkerId).trim();

  const isNetto =
    String(r.status).toLowerCase().includes("netto");

  return isZelfdeMedewerker && isNetto;
});

      aantalNettoAfspraken = nettoAfspraken.length;
    }

    totaalAfspraken += aantalNettoAfspraken;

    /* Bonus */
    const bonusBedragDag = aantalNettoAfspraken * bonusPerAfspraak;
    totaalBonus += bonusBedragDag;

    /* Rij renderen */
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${shift.datum}</td>
      <td>€${basisBedrag.toFixed(2)}</td>
      <td>${aantalNettoAfspraken} (€${bonusBedragDag.toFixed(2)})</td>
    `;
    gewerktBody.appendChild(tr);
  }

  /* 5️⃣ Totalen tonen */
  totaalBasisEl.textContent = `€${totaalBasis.toFixed(2)}`;
  totaalAfsprakenEl.textContent = `${totaalAfspraken} (€${totaalBonus.toFixed(2)})`;
  totaalBonusEl.textContent = `€${totaalBonus.toFixed(2)}`;
}

/* =========================
   EVENTS
========================= */
if (loonPeriodeSelect) {
  loonPeriodeSelect.addEventListener("change", () => {
    laadGewerkteDagen();
  });
}

/* =========================
   START
========================= */
laadGewerkteDagen();