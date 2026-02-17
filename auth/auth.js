const ADMIN_PASS = "kontora";
const AUTH_KEY = "kontora.auth.ok";

const params = new URLSearchParams(window.location.search);
const next = params.get("next") || "/admin/";

const form = document.getElementById("authForm");
const pass = document.getElementById("pass");
const error = document.getElementById("error");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (pass.value !== ADMIN_PASS) {
    error.hidden = false;
    return;
  }
  sessionStorage.setItem(AUTH_KEY, "1");
  window.location.href = next;
});
