import { supabase } from "../supabase.js";

/* =========================
   AUTH CHECK
========================= */
const { data } = await supabase.auth.getSession();

if (!data.session) {
  window.location.href = "./login.html";
}

/* =========================
   NAVIGATIE
========================= */
document.getElementById("medewerkers").onclick = () => {
  window.location.href = "./medewerkers.html";
};

document.getElementById("daginvoer").onclick = () => {
window.location.href = "shift-toevoegen.html";
};

document.getElementById("planning").onclick = () => {
  window.location.href = "./planning.html";
};

document.getElementById("leaderboard").onclick = () => {
  window.location.href = "./index.html";
};

/* =========================
   LOGOUT
========================= */
document.getElementById("logout").onclick = async () => {
  await supabase.auth.signOut();
  window.location.href = "./login.html";
};