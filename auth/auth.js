const ADMIN_PASS = "kontora";
const AUTH_KEY = "kontora.auth.ok";

const params = new URLSearchParams(window.location.search);
const next = params.get("next") || "../admin/";

const form = document.getElementById("authForm");
const pass = document.getElementById("pass");
const error = document.getElementById("error");
const authState = document.getElementById("authState");
const goAdmin = document.getElementById("goAdmin");
const logoutBtn = document.getElementById("logoutBtn");

function syncState() {
  const isAuthed = sessionStorage.getItem(AUTH_KEY) === "1";
  authState.textContent = `Профиль: ${isAuthed ? "выполнен" : "не выполнен"}`;
  goAdmin.href = isAuthed ? next : `../auth/?next=${encodeURIComponent(next)}`;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (pass.value !== ADMIN_PASS) {
    error.hidden = false;
    return;
  }
  error.hidden = true;
  sessionStorage.setItem(AUTH_KEY, "1");
  syncState();
  window.location.href = next;
});

logoutBtn.addEventListener("click", () => {
  sessionStorage.removeItem(AUTH_KEY);
  syncState();
});

syncState();
