import { supabase } from "../supabase.js";

const container = document.getElementById("medewerkersContainer");
const datumInput = document.getElementById("planningDatum");
const opslaanBtn = document.getElementById("opslaanPlanning");

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
  datumInput.valueAsDate = new Date();
  laadMedewerkers();

  datumInput.addEventListener("change", () => {
  laadPlanningVoorDatum(datumInput.value);
});
});

/* =========================
   MEDEWERKERS LADEN
========================= */
async function laadMedewerkers() {
  const { data, error } = await supabase
    .from("medewerkers")
    .select("id, naam")
    .eq("actief", true)
    .order("naam");

  if (error) {
    console.error("❌ Fout bij laden medewerkers:", error);
    return;
  }

  renderMedewerkers(data);
}

/* =========================
   RENDER MEDEWERKERS
========================= */
function renderMedewerkers(medewerkers) {
  container.innerHTML = "";

  medewerkers.forEach(medewerker => {
    const row = document.createElement("div");
    row.className = "row";

    row.innerHTML = `
      <strong>${medewerker.naam}</strong>

      <label>
  <input type="radio" name="shift_${medewerker.id}" value="">
  Niet ingepland
</label>

<label>
  <input type="radio" name="shift_${medewerker.id}" value="full">
  Hele dag
</label>

<label>
  <input type="radio" name="shift_${medewerker.id}" value="half">
  Halve dag
</label>
    `;

    container.appendChild(row);
  });
}

/* =========================
   OPSLAAN PLANNING
========================= */
opslaanBtn.addEventListener("click", async () => {
  const datum = datumInput.value;
  if (!datum) {
    alert("Kies een datum");
    return;
  }

  const rows = document.querySelectorAll(".row");

  for (const row of rows) {
    const medewerkerNaam = row.querySelector("strong").innerText;
    const radios = row.querySelectorAll("input[type='radio']");
    const gekozen = [...radios].find(r => r.checked);

    if (!gekozen) continue; // niets gepland

    const medewerkerId = gekozen.name.replace("shift_", "");
    const type = gekozen.value; // full / half

    await slaPlanningOp(medewerkerId, datum, type);
  }

  alert("✅ Planning opgeslagen");
});

/* =========================
   UPSERT NAAR SUPABASE
========================= */
async function slaPlanningOp(medewerkerId, datum, type) {
  const { error } = await supabase
    .from("shifts")
    .upsert(
      {
        medewerker_id: medewerkerId,
        datum: datum,
        type: type
      },
      {
        onConflict: "medewerker_id,datum"
      }
    );

  if (error) {
    console.error("❌ Fout bij opslaan planning:", error);
  }
}
async function laadPlanningVoorDatum(datum) {
  if (!datum) return;

  console.log("📅 Planning laden voor", datum);

  const { data, error } = await supabase
    .from("shifts")
    .select("medewerker_id, type")
    .eq("datum", datum);

  if (error) {
    console.error("❌ Fout bij laden planning:", error);
    return;
  }

  // Eerst alles uitzetten
  document
    .querySelectorAll("input[type='radio']")
    .forEach(r => (r.checked = false));

  // Daarna bestaande planning toepassen
  data.forEach(shift => {
    const radio = document.querySelector(
      `input[name="shift_${shift.medewerker_id}"][value="${shift.type}"]`
    );

    if (radio) radio.checked = true;
  });

  console.log("✅ Planning toegepast:", data);
}