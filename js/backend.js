import { supabase } from "../supabase.js";

const ALLOWED_EMAILS = [
  "k.vandennieuwenhoff@outlook.com"
];

const { data: { user } } = await supabase.auth.getUser();

if (!user || !ALLOWED_EMAILS.includes(user.email)) {
  alert("Geen toegang");
  window.location.href = "login.html";
}

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