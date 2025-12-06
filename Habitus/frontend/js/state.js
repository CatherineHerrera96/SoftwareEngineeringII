// state.js
let authToken = null;
let currentUser = null;

export function setAuth(token, user, remember = true) {
  authToken = token;
  currentUser = user;

  if (remember) {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    sessionStorage.setItem('auth_token', token);
    sessionStorage.setItem('user', JSON.stringify(user));
  }
}

export function clearAuth() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('auth_token');
  sessionStorage.removeItem('user');
}

export function getToken() {
  if (authToken) return authToken;
  return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
}

export function getCurrentUser() {
  if (currentUser) return currentUser;

  let stored = localStorage.getItem('user') || sessionStorage.getItem('user');
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
