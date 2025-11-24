// state.js
let authToken = null;
let currentUser = null;

export function setAuth(token, user) {
  authToken = token;
  currentUser = user;
}

export function clearAuth() {
  authToken = null;
  currentUser = null;
}

export function getToken() {
  return authToken;
}

export function getCurrentUser() {
  return currentUser;
}
