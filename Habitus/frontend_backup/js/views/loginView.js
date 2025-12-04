import { login, register } from "../api/authApi.js";
import { navigateTo } from "../router.js";
import { setAuth } from "../state.js";
import { showError, showSuccess } from "../components/notifications.js";

const USE_FAKE_LOGIN = false;

export function initLoginView() {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");

  // LOGIN
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      console.log("Login form submitted"); // DEBUG

      const email = document.getElementById("login-email").value;
      const password = document.getElementById("login-password").value;

      if (USE_FAKE_LOGIN) {
        setAuth("fake-token", { id: 1, email });
        navigateTo("profile");
        return;
      }

      try {
        console.log(`Attempting login for ${email}`); // DEBUG
        await login(email, password);
        console.log("Login success!"); // DEBUG
        showSuccess("Login successful! Welcome back.");
        navigateTo("profile");
      } catch (err) {
        showError(err.message || "Login failed");
        console.error(err);
      }
    });
  }

  // REGISTER
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("register-email").value;
      const password = document.getElementById("register-password").value;
      const confirm = document.getElementById("register-password-confirm").value;
      const terms = document.getElementById("register-terms").checked;

      if (password !== confirm) {
        showError("Passwords do not match");
        return;
      }
      if (!terms) {
        showError("You must accept the terms");
        return;
      }

      try {
        await register(email, password);
        showSuccess("Account created successfully! Please sign in.");
        navigateTo("login");
      } catch (err) {
        showError(err.message || "Registration failed");
        console.error(err);
      }
    });
  }
}

export function renderLogin() {
  // Logic to run when entering login view (e.g. clear inputs)
  console.log("Rendering login view");
}
