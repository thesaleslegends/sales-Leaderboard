import { supabase } from "../supabase.js";

document.addEventListener("DOMContentLoaded", () => {
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const loginBtn = document.getElementById("loginBtn");
  const errorEl = document.getElementById("error");

  console.log("✅ auth.js klaar, knop:", loginBtn);

  if (!loginBtn) {
    console.error("❌ loginBtn niet gevonden");
    return;
  }

  loginBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    errorEl.textContent = "";

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      errorEl.textContent = "Vul email en wachtwoord in";
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error(error);
      errorEl.textContent = "Inloggen mislukt";
      return;
    }

    console.log("✅ LOGIN GELUKT, GA NU DOORSTUREN");
    window.location.href = "backend.html";
  });
});