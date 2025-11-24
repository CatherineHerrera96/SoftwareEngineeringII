// api/authApi.js
//
// ==========================================================
// MÓDULO: AUTENTICACIÓN (FRONTEND + CONTRATO CON BACKEND JAVA)
// ==========================================================
//
// RESPONSABILIDADES (FRONTEND):
// - Definir CÓMO el frontend espera hablar con el servicio de
//   autenticación en Java (endpoints, JSON de envío y respuesta).
// - Proveer funciones simples:
//
//       login(email, password)
//       register(email, password)
//
//   que pueden ser usadas desde las vistas (por ejemplo, loginView.js).
//
// - Gestionar el guardado de la sesión en el estado global mediante
//   setAuth(token, userObject).
//
// RELACIÓN CON LOGIN FAKE:
// - Mientras USE_FAKE_LOGIN = true en loginView.js, la función login()
//   de este módulo NO se usa en la práctica (se salta).
// - Cuando se ponga USE_FAKE_LOGIN = false, loginView.js comenzará
//   a llamar a esta función login(...) de verdad.
//
// RELACIÓN CON BACKEND JAVA:
// - Se espera que exista un servicio de autenticación en Java que
//   exponga endpoints como:
//
//       POST /api/auth/login
//       POST /api/auth/register
//
// - La URL base se configura con JAVA_BASE_URL más abajo.
// - El backend debería devolver, al menos, un JSON con:
//       { token, user_id, email }
//
//   para que el frontend pueda guardar el token y los datos básicos
//   del usuario.
//
// IMPORTANTE PARA BACKEND:
// - Este archivo es un CONTRATO. Si el backend respeta los nombres
//   de campos (token, user_id, email) y la estructura básica,
//   no será necesario modificar las vistas de login.
// - Si el backend decide usar otros campos (por ejemplo "accessToken"
//   en lugar de "token"), se podría adaptar aquí sin tocar las vistas.
//

import { setAuth } from "../state.js";

// URL base del backend de autenticación en Java.
//
// BACKEND: ajustar este valor según el puerto/host real.
// Ejemplos posibles:
//   - "http://localhost:8080/api/auth"
//   - "https://mi-servidor.com/api/auth"
const JAVA_BASE_URL = "http://localhost:8080/api/auth";

/**
 * Inicia sesión contra el backend de autenticación.
 *
 * BACKEND TODO:
 * - Implementar endpoint:
 *      POST /api/auth/login
 *
 * - Cuerpo enviado (JSON):
 *      { "email": string, "password": string }
 *
 * - Respuesta esperada (JSON):
 *      {
 *        "token":   "jwt-o-token-de-sesion",
 *        "user_id": 123,
 *        "email":   "usuario@ejemplo.com"
 *      }
 *
 * FRONTEND:
 * - Si la respuesta es exitosa, llama a setAuth(token, { id, email }).
 * - Si la respuesta NO es ok (401, 400, etc.), lanza un error genérico.
 */
export async function login(email, password) {
  const res = await fetch(`${JAVA_BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    // Aquí se podría hacer un manejo más específico (por código de estado),
    // pero para el proyecto basta con lanzar un error genérico.
    throw new Error("Login failed");
  }

  const data = await res.json();

  // Se asume que el backend devuelve al menos:
  // { token, user_id, email }
  if (!data.token || !data.user_id || !data.email) {
    console.warn(
      "[WARN] Respuesta de login no tiene el formato esperado:",
      data
    );
  }

  // Guardamos la sesión en el estado global.
  setAuth(data.token, { id: data.user_id, email: data.email });

  return data;
}

/**
 * Registra un nuevo usuario contra el backend de autenticación.
 *
 * BACKEND TODO:
 * - Implementar endpoint:
 *      POST /api/auth/register
 *
 * - Cuerpo enviado (JSON):
 *      { "email": string, "password": string }
 *
 * - Respuesta esperada:
 *   - Puede ser:
 *       201 Created (sin cuerpo)
 *     o
 *       200 OK con algún JSON de confirmación.
 *
 * FRONTEND:
 * - No guarda sesión automáticamente; solo avisa de que el registro
 *   fue exitoso y la vista de login puede solicitar al usuario que
 *   inicie sesión con sus credenciales.
 */
export async function register(email, password) {
  const res = await fetch(`${JAVA_BASE_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error("Register failed");
  }

  // Si el backend devuelve algo útil (por ejemplo un mensaje),
  // lo retornamos. Si no, data podría ser {} o null.
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    // Si no hay cuerpo JSON, no pasa nada; el registro igual fue ok.
    data = null;
  }

  return data;
}
