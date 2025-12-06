import { login, register, forgotPassword } from "../api/authApi.js";
import { navigateTo } from "../router.js";
import { setAuth } from "../state.js";
import { showNotification } from "../ui.js";

export function initLoginView() {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const forgotPasswordForm = document.getElementById("forgot-password-form");
  const goToRegisterBtn = document.getElementById("go-to-register");
  const goToLoginBtn = document.getElementById("go-to-login");
  const forgotPasswordBtn = document.getElementById("forgot-password-btn");
  const backToLoginBtn = document.getElementById("back-to-login");

  // Navigation between login and register
  if (goToRegisterBtn) {
    goToRegisterBtn.addEventListener("click", () => {
      navigateTo("register");
    });
  }
  if (goToLoginBtn) {
    goToLoginBtn.addEventListener("click", () => {
      navigateTo("login");
    });
  }

  // Navigation to forgot password
  if (forgotPasswordBtn) {
    forgotPasswordBtn.addEventListener("click", () => {
      navigateTo("forgot-password");
    });
  }
  if (backToLoginBtn) {
    backToLoginBtn.addEventListener("click", () => {
      navigateTo("login");
    });
  }

  // LOGIN
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = document.getElementById('login-submit-btn');
      if (btn) {
        btn.innerHTML = '<span class="loading-spinner"></span>';
        btn.disabled = true;
      }

      const email = document.getElementById("login-email").value;
      const password = document.getElementById("login-password").value;
      const rememberMe = document.getElementById("login-remember").checked;

      try {
        await login(email, password, rememberMe);
        showNotification("Login successful! Welcome back.");
        navigateTo("home");
      } catch (err) {
        showNotification(err.message || "Login failed", "error");
        console.error(err);
      } finally {
        if (btn) {
          btn.innerHTML = 'Sign In';
          btn.disabled = false;
        }
      }
    });
  }

  // REGISTER
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = document.getElementById('register-submit-btn');
      if (btn) {
        btn.innerHTML = '<span class="loading-spinner"></span>';
        btn.disabled = true;
      }

      const email = document.getElementById("register-email").value;
      const password = document.getElementById("register-password").value;
      const confirm = document.getElementById("register-password-confirm").value;
      const terms = document.getElementById("register-terms").checked;

      if (password !== confirm) {
        showNotification("Passwords do not match", "error");
        if (btn) {
          btn.innerHTML = 'Create Account';
          btn.disabled = false;
        }
        return;
      }
      if (!terms) {
        showNotification("You must accept the terms", "error");
        if (btn) {
          btn.innerHTML = 'Create Account';
          btn.disabled = false;
        }
        return;
      }

      try {
        await register(email, password);
        showNotification("Account created successfully! Please sign in.");
        navigateTo("login");
      } catch (err) {
        showNotification(err.message || "Registration failed", "error");
        console.error(err);
      } finally {
        if (btn) {
          btn.innerHTML = 'Create Account';
          btn.disabled = false;
        }
      }
    });
  }

  // FORGOT PASSWORD
  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = document.getElementById('forgot-submit-btn');
      if (btn) {
        btn.innerHTML = '<span class="loading-spinner"></span>';
        btn.disabled = true;
      }

      const email = document.getElementById("forgot-email").value;

      try {
        await forgotPassword(email);
        showNotification("If an account exists for this email, a reset link has been sent.");
        navigateTo("login");
      } catch (err) {
        showNotification(err.message || "Failed to send reset link", "error");
        console.error(err);
      } finally {
        if (btn) {
          btn.innerHTML = 'Send Reset Link';
          btn.disabled = false;
        }
      }
    });
  }
}

export function renderLogin() {
  // Logic to run when entering login view (e.g. clear inputs)
  console.log("Rendering login view");
}
