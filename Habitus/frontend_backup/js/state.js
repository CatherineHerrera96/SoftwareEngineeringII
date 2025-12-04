// state.js
let authToken = null;
let currentUser = null;

export function setAuth(token, user) {
  authToken = token;
  currentUser = user;
  // Persist to localStorage
  localStorage.setItem('auth_token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearAuth() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
}

export function getToken() {
  // Try memory first, then localStorage
  if (authToken) return authToken;
  authToken = localStorage.getItem('auth_token');
  return authToken;
}

export function getCurrentUser() {
  // Try memory first, then localStorage
  if (currentUser) return currentUser;
  const stored = localStorage.getItem('user');
  if (stored) {
    try {
      currentUser = JSON.parse(stored);
      return currentUser;
    } catch (e) {
      return null;
    }
  }
  return null;
}
