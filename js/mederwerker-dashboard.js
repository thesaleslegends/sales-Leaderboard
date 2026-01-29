import { supabase } from "./supabase.js";

/* =========================
   HELPERS
========================= */
function startVanWeek(d) {
  const date = new Date(d);
  const day = date.getDay() || 7; // zondag = 7
  date.setDate(date.getDate() - day + 1);
  date.setHours(0, 0, 0, 0);
  return date;
}

function eindeVanWeek(start) {
  const date = new Date(start);
  date.setDate(start.getDate() + 6);
  date.setHours(23, 59, 59, 999);
  return date;
}

function inHuidigeWeek(datum, vandaag) {
  const start = startVanWeek(vandaag);
  const eind = eindeVanWeek(start);
  const d = new Date(datum);
  return d >= start && d <= eind;
}

function inLoonperiode(datum, vandaag) {
  const d = new Date(datum);
  let start, eind;

  if (vandaag.getDate() >= 26) {
    start = new Date(vandaag.getFullYear(), vandaag.getMonth(), 26);
    eind = new Date(vandaag.getFullYear(), vandaag.getMonth() + 1, 25);
  } else {
    start = new Date(vandaag.getFullYear(), vandaag.getMonth() - 1, 26);
    eind = new Date(vandaag.getFullYear(), vandaag.getMonth(), 25);
  }

  start.setHours(0, 0, 0, 0);
  eind.setHours(23, 59, 59, 999);

  return d >= start && d <= eind;
}

function formatDag(datum) {
  return new Date(datum).toLocaleDateString("nl-NL", { weekday: "long" });
}

function formatDatum(datum) {
  return new Date(datum).toLocaleDateString("nl-NL", {
    day: "2-digit",
    month: "2-digit"
  });
}

/* =========================
   INIT DASHBOARD
========================= */
async function initDashboard() {
  /* 1️⃣ Auth user */
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("❌ Geen ingelogde gebruiker");
    return;
  }
  

  /* 2️⃣ DOM */
  const naamEl = document.getElementById("medewerkerNaam");
  const weekEl = document.getElementById("weekVerdiensten");
  const maandEl = document.getElementById("maandVerdiensten");
  const planningEl = document.getElementById("planningLijst");

  if (!naamEl || !weekEl || !maandEl || !planningEl) {
    console.error("❌ DOM-elementen ontbreken");
    return;
  }

  /* 3️⃣ Medewerker */
  const { data: medewerker, error: medewerkerError } = await supabase
    .from("medewerkers")
    .select("id, naam, basis_dagloon, bonus_per_netto")
    .eq("auth_user_id", user.id)
    .single();

  if (medewerkerError || !medewerker) {
    console.error("❌ Geen medewerker gevonden");
    return;
  }

  naamEl.textContent = medewerker.naam;

  const vandaag = new Date();

  /* =========================
     SHIFTS
  ========================= */
  const { data: shifts, error: shiftsError } = await supabase
  .from("shifts")
  .select("datum, type")
  .eq("medewerker_id", medewerker.id)
  .order("datum", { ascending: true });

if (shiftsError) {
  console.error("❌ Fout bij shifts", shiftsError);
  return;
}

// 👇 tijd-helpers
const vandaagDatum = vandaag.toISOString().slice(0, 10);
const huidigeTijdUren = vandaag.getHours() + vandaag.getMinutes() / 60;
const START_UUR_WERKDAG = 10; // ⏰ pas aan indien nodig

let weekBasis = 0;
let loonBasis = 0;
const gewerkteDatums = new Set();

shifts.forEach(shift => {
  // ❌ niet ingepland → negeren
  if (!shift.type || shift.type === "") return;

  const shiftDatum = shift.datum;

  // ❌ toekomst → niet meetellen
  if (shiftDatum > vandaagDatum) return;

  // ❌ vandaag maar werkdag nog niet begonnen
  if (shiftDatum === vandaagDatum && huidigeTijdUren < START_UUR_WERKDAG) {
    return;
  }

  // ✅ vanaf hier telt loon mee
  gewerkteDatums.add(shiftDatum);

  let dagloon = 0;
  if (shift.type === "full") dagloon = medewerker.basis_dagloon;
  if (shift.type === "half") dagloon = medewerker.basis_dagloon / 2;

  if (inHuidigeWeek(shiftDatum, vandaag)) weekBasis += dagloon;
  if (inLoonperiode(shiftDatum, vandaag)) loonBasis += dagloon;
});

  /* =========================
     BONUS (dagen → regels)
  ========================= */
  const { data: dagen, error: dagenError } = await supabase
    .from("dagen")
    .select("datum, regels");

  if (dagenError) {
    console.error("❌ Fout bij dagen", dagenError);
    return;
  }

  let weekBonus = 0;
  let loonBonus = 0;

  dagen.forEach(dag => {
    if (!gewerkteDatums.has(dag.datum)) return;

    const nettoAantal = Array.isArray(dag.regels)
      ? dag.regels.filter(
          r =>
            r.medewerkerId === medewerker.id &&
            r.status?.trim().toLowerCase() === "netto"
        ).length
      : 0;

    const bonus = nettoAantal * medewerker.bonus_per_netto;

    if (inHuidigeWeek(dag.datum, vandaag)) weekBonus += bonus;
    if (inLoonperiode(dag.datum, vandaag)) loonBonus += bonus;
  });

  /* =========================
     TOTALEN
  ========================= */
  weekEl.textContent = `€${weekBasis + weekBonus}`;
  maandEl.textContent = `€${loonBasis + loonBonus}`;

  /* =========================
     PLANNING (toekomst)
  ========================= */
  planningEl.innerHTML = "";

  const vandaagStart = new Date();
vandaagStart.setHours(0, 0, 0, 0);

const toekomstigeShifts = shifts.filter(s =>
  // ❌ niet ingepland → niet tonen
  s.type &&
  s.type !== "" &&

  // ❌ alleen vandaag of toekomst
  new Date(s.datum) >= vandaagStart
);

  if (toekomstigeShifts.length === 0) {
    planningEl.innerHTML = "<p>Geen ingeplande diensten</p>";
    return;
  }

  toekomstigeShifts.forEach(shift => {
    const div = document.createElement("div");
    div.className = "planning-item";

    div.innerHTML = `
      <strong>${formatDag(shift.datum)}</strong>
      <span>${formatDatum(shift.datum)}</span>
      <span>${shift.type === "full" ? "Hele shift" : "Halve shift"}</span>
    `;

    planningEl.appendChild(div);
  });
const leaderboardBtn = document.getElementById("leaderboardBtn");

if (leaderboardBtn) {
leaderboardBtn.addEventListener("click", () => {
  window.location.href = "index.html?via=dashboard";
});
}
  /* =========================
     DEBUG
  ========================= */
  console.log("Week basis:", weekBasis);
  console.log("Week bonus:", weekBonus);
  console.log("Loon basis:", loonBasis);
  console.log("Loon bonus:", loonBonus);
}

initDashboard();