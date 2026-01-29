import { supabase } from "./supabase.js";

document.addEventListener("DOMContentLoaded", () => {
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const loginBtn = document.getElementById("loginBtn");
  const errorEl = document.getElementById("loginError");

  if (!emailInput || !passwordInput || !loginBtn || !errorEl) {
    console.error("❌ Login DOM-elementen ontbreken");
    return;
  }

  loginBtn.addEventListener("click", async () => {
    errorEl.textContent = "";

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      errorEl.textContent = "Vul email en wachtwoord in";
      return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = "Bezig...";

    // ✅ ÉÉN login call (niet twee)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      errorEl.textContent = "Ongeldige inloggegevens";
      loginBtn.disabled = false;
      loginBtn.textContent = "LOG IN";
      return;
    }

    // ⏳ Wacht kort zodat Supabase session bestaat
    await new Promise(r => setTimeout(r, 300));

    // ✅ Door naar dashboard
    window.location.href = "/dashboard.html";
  });
});