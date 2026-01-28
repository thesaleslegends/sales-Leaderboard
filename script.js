//Script js.

import { supabase } from "./supabase.js";
console.log("opslaanBtn:", document.getElementById("opslaanDag"));
console.log("script gestart");
import { haalMedewerkersOp } from "./js/medewerkers.js";


export const MEDEWERKERS = {
  emp_001: { naam: "Damian" },
  emp_002: { naam: "Tim" },
  emp_003: { naam: "Jade" },
  emp_004: { naam: "Ricardo" },
  emp_005: { naam: "San" },
  emp_006: { naam: "Joya" },
  emp_007: { naam: "Kees" },
  emp_008: { naam: "md" },
  emp_009: { naam: "Md" },
  emp_010: { naam: "md" },
  emp_011: { naam: "md" }
};


// =========================
// PERIODE STATE
// =========================
let actievePeriode = localStorage.getItem("periode") || "week";

const periodToggle = document.getElementById("periodToggle");
const periodMenu = document.getElementById("periodMenu");

if (periodToggle && periodMenu) {
  periodToggle.addEventListener("click", () => {
    periodMenu.classList.toggle("open");
  });

  periodMenu.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      actievePeriode = btn.dataset.period;
      localStorage.setItem("periode", actievePeriode);
      location.reload();
    });
  });
}

const subtitle = document.getElementById("leaderboardSubtitle");

if (subtitle) {
  const labels = {
    week: "WEEK LEADERBOARD",
    month: "MONTH LEADERBOARD",
    year: "YEAR LEADERBOARD"
  };

  subtitle.textContent = labels[actievePeriode] || "WEEK LEADERBOARD";
}

  /* =========================
     DOM REFS
  ========================= */
  const datumInput = document.getElementById("dagDatum");
  const regelsContainer = document.getElementById("regels");
  const addRowBtn = document.getElementById("addRow");
  const opslaanBtn = document.getElementById("opslaanDag")
  const tbody = document.getElementById("leaderboardBody");
  document.addEventListener("DOMContentLoaded", async () => {
  await haalMedewerkersOp();
});


  /* =========================
     DATA LADEN (LEADERBOARD)
  ========================= */
 async function laadAlleDagen() {
  const alleDagen = [];
  const nu = new Date();
  let start, eind;

  // === PERIODE BEREKENEN (DIT IS GOED BIJ JOU) ===
  if (actievePeriode === "week") {
    const vandaag = new Date();
    vandaag.setHours(0, 0, 0, 0);

    let dag = vandaag.getDay(); // 0 = zondag
    if (dag === 0) {
      vandaag.setDate(vandaag.getDate() + 1);
      dag = 1;
    }

    start = new Date(vandaag);
    start.setDate(vandaag.getDate() - (dag - 1));
    start.setHours(0, 0, 0, 0);

    eind = new Date(start);
    eind.setDate(start.getDate() + 5);
    eind.setHours(23, 59, 59, 999);
  }

  if (actievePeriode === "month") {
    start = new Date(nu.getFullYear(), nu.getMonth(), 1);
    eind = new Date(nu.getFullYear(), nu.getMonth() + 1, 0, 23, 59, 59);
  }

  if (actievePeriode === "year") {
    start = new Date(nu.getFullYear(), 0, 1);
    eind = new Date(nu.getFullYear(), 11, 31, 23, 59, 59);
  }

  // === SUPABASE DATA LADEN ===
  const { data, error } = await supabase
    .from("dagen")
    .select("datum, regels")
    .gte("datum", start.toISOString().slice(0, 10))
    .lte("datum", eind.toISOString().slice(0, 10));

  if (error) {
    console.error("Fout bij laden leaderboard:", error);
    return [];
  }

  data.forEach(dag => {
    alleDagen.push({
      datum: dag.datum,
      regels: dag.regels || []
    });
  });

  return alleDagen;
}

  




  /* =========================
     STATS BOUWEN
  ========================= */
function bouwStatsPerNaam(alleDagenData) {
  const stats = {};

  alleDagenData.forEach(dag => {
    const datum = dag.datum;

    dag.regels.forEach(regel => {
      const id = regel.medewerkerId;
      if (!id) return;

      if (!stats[id]) {
        stats[id] = {
          id,
          naam: MEDEWERKERS[id]?.naam || "Onbekend",
          werkdagen: {}, // 👈 per datum
          bruto: 0,
          netto: 0
        };
      }

      // ✅ werkdag maar 1× per datum
      if (!stats[id].werkdagen[datum]) {
        stats[id].werkdagen[datum] = regel.shiftWeight || 1;
      }

      // ✅ afspraken tellen los
      const status = (regel.status || "").toLowerCase();

      if (status.includes("bruto")) {
        stats[id].bruto++;
      }

      if (status.includes("netto")) {
        stats[id].netto++;
        stats[id].bruto++; // 👈 DIT IS DE ESSEN
      }
    });
  });

  return Object.values(stats).map(p => {
    const werkdagen = Object.values(p.werkdagen)
      .reduce((a, b) => a + b, 0);

    return {
      id: p.id,
      naam: p.naam,
      werkdagen,
      bruto: p.bruto,
      netto: p.netto,
      brutoGem: werkdagen ? p.bruto / werkdagen : 0,
      nettoGem: werkdagen ? p.netto / werkdagen : 0
    };
  });
}

  /* =========================
     LEADERBOARD RENDEREN
  ========================= */
console.log("tbody =", tbody);
async function renderLeaderboard() {
  console.log("🚀 renderLeaderboard gestart");
  // 1️⃣ data ophalen
  const alleDagen = await laadAlleDagen();

  // 2️⃣ stats bouwen
  const leaderboardData = bouwStatsPerNaam(alleDagen);

  // 3️⃣ sorteren
  leaderboardData.sort((a, b) => {
    if (b.nettoGem !== a.nettoGem) {
      return b.nettoGem - a.nettoGem;
    }
    if (a.brutoGem !== b.brutoGem) {
      return a.brutoGem - b.brutoGem;
    }
    return a.naam.localeCompare(b.naam);
  });

  // 4️⃣ tabel leegmaken
  tbody.innerHTML = "";

  // 5️⃣ top performer
  if (leaderboardData.length > 0) {
    const top = leaderboardData[0];
    document.getElementById("top-naam").textContent = top.naam;
    document.getElementById("top-bruto-gem").textContent = top.brutoGem.toFixed(2);
    document.getElementById("top-netto-gem").textContent = top.nettoGem.toFixed(2);
  }

  // 6️⃣ team stats
  let totaalBruto = 0;
  let totaalNetto = 0;
  let totaalWerkdagen = 0;

  leaderboardData.forEach(p => {
    totaalBruto += p.bruto;
    totaalNetto += p.netto;
    totaalWerkdagen += p.werkdagen;
  });

  document.getElementById("totaal-bruto").textContent = totaalBruto;
  document.getElementById("totaal-netto").textContent = totaalNetto;
  document.getElementById("team-gem").textContent =
    totaalWerkdagen ? (totaalNetto / totaalWerkdagen).toFixed(2) : "0.00";

  // 7️⃣ tabel vullen
  leaderboardData.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.naam}</td>
      <td>${item.werkdagen}</td>
      <td>${item.bruto}</td>
      <td>${item.brutoGem.toFixed(2)}</td>
      <td>${item.netto}</td>
      <td>${item.nettoGem.toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });
}

  /* =========================
     REGEL MAKEN
  ========================= */
  function maakRegel(data = {}) {
    const row = document.createElement("div");
    row.className = "row";

   row.innerHTML = `
  <select class="medewerker">
    <option value="">Selecteer medewerker</option>
    <option value="emp_001">Damian</option>
    <option value="emp_002">Tim</option>
    <option value="emp_003">Jade</option>
    <option value="emp_004">Ricardo</option>
    <option value="emp_005">San</option>
    <option value="emp_006">Lina</option>
  </select>

  <label style="font-size:12px; margin: 0 6px;">
    <input type="checkbox" class="halveShift">
    ½
  </label>

  <input class="klant" placeholder="Klant" value="${data.klant || ""}">

  <button class="statusBtn" type="button">
    ${data.status || "Netto"}
  </button>

  <input class="opmerking" placeholder="Opmerking" value="${data.opmerking || ""}">
`;
    const medewerkerSelect = row.querySelector(".medewerker");
if (data.medewerkerId) {
  medewerkerSelect.value = data.medewerkerId;
}

// ✅ STAP 2 — HIER PLAKKEN
const halveShiftCheckbox = row.querySelector(".halveShift");
if (data.shiftWeight === 0.5) {
  halveShiftCheckbox.checked = true;
}

    const statusBtn = row.querySelector(".statusBtn");
    const statussen = ["Netto", "Bruto", "Voicemail"];
    let index = statussen.indexOf(statusBtn.textContent);
    if (index < 0) index = 0;

    statusBtn.addEventListener("click", () => {
      index = (index + 1) % statussen.length;
      statusBtn.textContent = statussen[index];
    });

    regelsContainer.appendChild(row);
  }

  /* =========================
     DAG LADEN
  ========================= */
 async function laadDag(datum) {
  regelsContainer.innerHTML = "";

  const { data, error } = await supabase
    .from("dagen")
    .select("regels")
    .eq("datum", datum)
    .single();

  if (error) {
    console.error("Fout bij laden dag:", error);
  }

  const regels = data?.regels || [];

  if (regels.length === 0) {
    maakRegel();
  } else {
    regels.forEach(item => maakRegel(item));
  }
} 
 

  /* =========================
     OPSLAAN
  ========================= */
  async function opslaanDag() {
    console.log("🟡 opslaanDag() is aangeroepen");
  const datum = datumInput.value;
  if (!datum) return;

  const data = [];

  document.querySelectorAll(".row").forEach(row => {
    const medewerkerId = row.querySelector(".medewerker")?.value;
    if (!medewerkerId) return;

    const halveShift = row.querySelector(".halveShift")?.checked;
    const shiftWeight = halveShift ? 0.5 : 1;

    data.push({
      medewerkerId,
      klant: row.querySelector(".klant")?.value || "",
      status: row.querySelector(".statusBtn")?.textContent || "Netto",
      opmerking: row.querySelector(".opmerking")?.value || "",
      shiftWeight
    });
  });
const { error } = await supabase
  .from("dagen")
  .upsert(
    {
      datum: datum,
      regels: data
    },
    { onConflict: "datum" }
  );

if (error) {
  console.error("❌ Opslaan mislukt:", error);
  alert("Opslaan mislukt (zie console)");
  return;
}

console.log("✅ Dag opgeslagen in Supabase");
alert("Dag succesvol opgeslagen");
location.reload();
}
  /* =========================
     EVENTS
  ========================= */
  if (addRowBtn) addRowBtn.addEventListener("click", () => maakRegel());
  if (opslaanBtn) opslaanBtn.addEventListener("click", opslaanDag);

  if (datumInput) {
    datumInput.addEventListener("input", () => {
      if (datumInput.value) laadDag(datumInput.value);
    });

    const vandaag = new Date().toISOString().split("T")[0];
    datumInput.value = vandaag;
    laadDag(vandaag);
  }
document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ script gestart");

  if (tbody) {
    renderLeaderboard();
  }
});

async function testSupabaseConnection() {
  const { data, error } = await supabase
    .from("dagen") // ⬅️ PAS DIT AAN NAAR JE ECHTE TABELNAAM
    .select("*")
    .limit(1);

  if (error) {
    console.error("❌ Supabase error:", error);
  } else {
    console.log("✅ Supabase data ontvangen:", data);
  }
}


testSupabaseConnection();
