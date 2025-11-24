// router.js
import { getCurrentUser } from "./state.js";

const views = document.querySelectorAll("[data-view]");
const header = document.getElementById("app-header");

export function showView(name) {
  // mostrar solo la vista pedida
  views.forEach((v) => {
    v.style.display = v.getAttribute("data-view") === name ? "block" : "none";
  });

  // header solo cuando hay usuario y NO estamos en login/register
  if (getCurrentUser() && name !== "login" && name !== "register") {
    header.style.display = "flex";
  } else {
    header.style.display = "none";
  }
}

