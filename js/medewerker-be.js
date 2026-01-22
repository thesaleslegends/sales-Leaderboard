import { supabase } from "../supabase.js";

const params = new URLSearchParams(window.location.search);
const medewerkerId = params.get("id");

const naamEl = document.getElementById("naam");
const actiefEl = document.getElementById("actief");
const dagloonEl = document.getElementById("dagloon");
const bonusEl = document.getElementById("bonus");
const opslaanBtn = document.getElementById("opslaan");

async function laadMedewerker() {
  const { data, error } = await supabase
    .from("medewerkers")
    .select("*")
    .eq("id", medewerkerId)
    .single();

  if (error) {
    console.error(error);
    return;
  }

  naamEl.textContent = data.naam;
  actiefEl.checked = data.actief;
  dagloonEl.value = data.basis_dagloon;
  bonusEl.value = data.bonus_per_netto;
}

opslaanBtn.onclick = async () => {
  const { error } = await supabase
    .from("medewerkers")
    .update({
      actief: actiefEl.checked,
      basis_dagloon: dagloonEl.value,
      bonus_per_netto: bonusEl.value
    })
    .eq("id", medewerkerId);

  if (error) {
    alert("Fout bij opslaan");
    console.error(error);
  } else {
    alert("Opgeslagen ✅");
  }
};

laadMedewerker();