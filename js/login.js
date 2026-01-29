import { supabase } from "../supabase.js";

document.addEventListener("DOMContentLoaded", () => {
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const loginBtn = document.getElementById("loginBtn");
  const errorEl = document.getElementById("loginError");

  if (!emailInput || !passwordInput || !loginBtn) {
    console.error("❌ Login DOM-elementen ontbreken");
    return;
  }

  loginBtn.addEventListener("click", async () => {
    errorEl.textContent = "";

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      showError("Vul email en wachtwoord in");
      return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = "Bezig...";

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      showError("Ongeldige inloggegevens");
      loginBtn.disabled = false;
      loginBtn.textContent = "LOG IN";
      return;
    }

// ✅ Succes → dashboard
window.location.href = "/sales-leaderboard/dashboard.html";
  });

  function showError(message) {
    errorEl.textContent = message;
  }
});