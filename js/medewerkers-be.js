import { supabase } from "../supabase.js";

const container = document.getElementById("medewerkersLijst");

async function laadMedewerkers() {
  const { data, error } = await supabase
    .from("medewerkers")
    .select("id, naam, actief")
    .order("naam");

  if (error) {
    console.error("Fout bij laden medewerkers", error);
    return;
  }

  container.innerHTML = "";

  data.forEach(m => {
    const row = document.createElement("div");
    row.className = "row" + (m.actief ? "" : " inactief");

    row.innerHTML = `
      <span>${m.naam}</span>
      <span>${m.actief ? "Actief" : "Inactief"}</span>
    `;

  row.onclick = () => {
  window.location.href = `medewerker.html?id=${m.id}`;
};

    container.appendChild(row);
  });
}

laadMedewerkers();