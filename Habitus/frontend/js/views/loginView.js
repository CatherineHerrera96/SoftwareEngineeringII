// views/loginView.js
//
// ==========================================================
// VISTA: LOGIN Y REGISTRO
// ==========================================================
//
// RESPONSABILIDADES (FRONTEND):
// - Manejar el formulario de inicio de sesión (login).
// - Manejar el formulario de registro (create account).
// - Cambiar entre las vistas "login" y "register" dentro del mismo index.html.
// - Cuando el login es exitoso:
//     * Guardar la sesión en el estado global (setAuth).
//     * Mostrar la vista de Habit Catalog.
//     * Marcar la opción "Habit Catalog" como activa en el menú.
//
// RELACIÓN CON BACKEND (JAVA):
// - Este módulo NO llama directamente al backend.
// - Usa las funciones definidas en `authApi.js`:
//
//     - login(email, password)
//     - register(email, password)
//
// - Cuando el backend Java esté listo, `authApi.js` deberá:
//     * Hacer fetch a los endpoints reales (por ejemplo /api/auth/login).
//     * Devolver un objeto con { token, user_id, email }.
//
// MODO LOGIN FAKE (IMPORTANTE):
// - Mientras el backend de autenticación NO esté listo, usamos un modo
//   "falso" para poder navegar por el frontend.
//
//   Esto se controla con la constante:
//
//       const USE_FAKE_LOGIN = true;
//
// - En este modo:
//     * NO se llama a login() de authApi.
//     * Se crea una sesión ficticia con setAuth("fake-token", { ... }).
//     * Se navega directamente a Habit Catalog.
//
// - CUANDO EL BACKEND ESTÉ LISTO:
//     * Cambiar a:
//           const USE_FAKE_LOGIN = false;
//     * O bien eliminar el bloque del modo fake
//       y dejar solo la rama que llama a login().
//
// De esta forma, tu frontend ya queda preparado para integrarse con Java
// sin tener que reescribir esta vista.
//

import { login, register } from "../api/authApi.js";
import { showView } from "../router.js";
import { setAuth } from "../state.js";
import { showHabitsView } from "./habitsView.js";

// ==========================================================
// CONFIG: MODO FAKE O MODO REAL
// ==========================================================
//
// true  -> se salta el backend y crea una sesión simulada.
// false -> usa la función login(...) de authApi.js (backend real).
//
const USE_FAKE_LOGIN = true;

/**
 * Marca "Habit Catalog" como opción activa en el menú superior.
 * Esto es puramente visual (frontend) y no depende del backend.
 */
function setActiveHabitsTab() {
  const buttons = document.querySelectorAll(".nav-link");
  const habitsBtn = document.querySelector('.nav-link[data-nav="habits"]');
  if (!habitsBtn) return;

  buttons.forEach((b) => b.classList.remove("active"));
  habitsBtn.classList.add("active");
}

/**
 * Inicializa los listeners para:
 * - Formulario de login.
 * - Formulario de registro.
 * - Botones que alternan entre login y registro.
 */
export function initLoginView() {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const goToRegisterBtn = document.getElementById("go-to-register");
  const goToLoginBtn = document.getElementById("go-to-login");

  // --------------------------------------------------------
  // LOGIN
  // --------------------------------------------------------
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("login-email").value;
      const password = document.getElementById("login-password").value;

      // ===============================================
      // MODO FAKE (DESARROLLO / DEMO SIN BACKEND)
      // ===============================================
      if (USE_FAKE_LOGIN) {
        // Simulamos una sesión válida sin llamar al backend.
        // Esto permite navegar por el frontend y mostrar
        // Habit Catalog, Daily Checklist y Dashboard.
        setAuth("fake-token", { id: 1, email });

        // Marcamos Habit Catalog como pestaña activa
        setActiveHabitsTab();

        // Cambiamos a la vista de hábitos iniciales
        showView("habits");
        showHabitsView();
        return;
      }

      // ===============================================
      // MODO REAL (CON BACKEND JAVA)
      // ===============================================
      try {
        // Llamada a la API real de autenticación.
        // authApi.login deberá hacer fetch al endpoint, por ejemplo:
        // POST /api/auth/login  con  { email, password }
        await login(email, password);

        // Si el login fue exitoso, asumimos que authApi
        // ya llamó internamente a setAuth(...) con el token y el usuario.

        setActiveHabitsTab();
        showView("habits");
        showHabitsView();
      } catch (err) {
        alert("Error logging in");
        console.error(err);
      }
    });
  }

  // --------------------------------------------------------
  // REGISTRO
  // --------------------------------------------------------
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("register-email").value;
      const password = document.getElementById("register-password").value;
      const confirm = document.getElementById("register-password-confirm").value;
      const terms = document.getElementById("register-terms").checked;

      if (password !== confirm) {
        alert("Passwords do not match");
        return;
      }
      if (!terms) {
        alert("You must accept the terms.");
        return;
      }

      try {
        // Llamada a la API de registro (backend Java).
        // authApi.register deberá hacer fetch a, por ejemplo:
        // POST /api/auth/register  con { email, password }
        await register(email, password);

        alert("Account created, please sign in");
        showView("login");
      } catch (err) {
        alert("Error registering");
        console.error(err);
      }
    });
  }

  // --------------------------------------------------------
  // BOTONES QUE CAMBIAN ENTRE LOGIN Y REGISTER
  // --------------------------------------------------------
  if (goToRegisterBtn) {
    goToRegisterBtn.addEventListener("click", () => showView("register"));
  }
  if (goToLoginBtn) {
    goToLoginBtn.addEventListener("click", () => showView("login"));
  }
}
