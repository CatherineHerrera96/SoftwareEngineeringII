// state.js
let authToken = null;
let currentUser = null;

export function setAuth(token, user, remember = true) {
  console.log('[setAuth] Called with remember=', remember);
  console.log('[setAuth] Stack trace:', new Error().stack);
  authToken = token;
  currentUser = user;

  if (remember) {
    console.log('[setAuth] Saving to localStorage');
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    console.log('[setAuth] Saving to sessionStorage');
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

export function updateUser(userData) {
  currentUser = userData;

  // Update in both storages (one will have it, one won't, but we update both)
  const userStr = JSON.stringify(userData);

  if (localStorage.getItem('user')) {
    localStorage.setItem('user', userStr);
  }

  if (sessionStorage.getItem('user')) {
    sessionStorage.setItem('user', userStr);
  }
}
