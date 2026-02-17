import { loadCatalog, clearLocalOverride } from "./catalog-store.js";

const AUTH_KEY = "kontora.auth.ok";
const fmtPrice = (n, currency = "₽") => new Intl.NumberFormat("ru-RU").format(n) + " " + currency;
const esc = (s = "") => String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");

const reviews = [
  { name: "Тимофей", date: "13 февраля", text: "Сделка состоялась. Корпус отличный, всё как на фото.", avatar: "https://api.dicebear.com/9.x/initials/svg?seed=Т" },
  { name: "Игорь", date: "2 марта", text: "Сборка тихая, температуры хорошие, кабель-менеджмент топ.", avatar: "https://api.dicebear.com/9.x/initials/svg?seed=И" },
  { name: "Артур", date: "11 марта", text: "Забрал готовый ПК и через 10 минут уже играл. Рекомендую.", avatar: "https://api.dicebear.com/9.x/initials/svg?seed=А" }
];

function syncAuthUi() {
  const isAuthed = sessionStorage.getItem(AUTH_KEY) === "1";
  const status = document.getElementById("authStatus");
  const action = document.getElementById("authAction");
  const adminLink = document.getElementById("adminLink");

  status.textContent = `Профиль: ${isAuthed ? "выполнен" : "не выполнен"}`;
  action.textContent = isAuthed ? "Выйти" : "Войти";
  action.href = isAuthed ? "#" : "auth/";

  action.onclick = (e) => {
    if (!isAuthed) return;
    e.preventDefault();
    sessionStorage.removeItem(AUTH_KEY);
    syncAuthUi();
  };

  adminLink.onclick = (e) => {
    if (sessionStorage.getItem(AUTH_KEY) === "1") return;
    e.preventDefault();
    window.location.href = `auth/?next=${encodeURIComponent("admin/")}`;
  };
}

function cardTemplate(item, currency) {
  return `<article class="card" data-id="${esc(item.id)}" data-category="${esc(item.category)}" style="--accent:${esc(item.accent || "#ffffff")}">
    <img src="${esc(item.image)}" alt="${esc(item.title)}" class="card__img" loading="lazy" />
    <div class="card__body">
      <div class="card__top"><h3>${esc(item.title)}</h3><strong>${fmtPrice(item.price, currency)}</strong></div>
      <p>${esc(item.desc || "")}</p>
      <div class="tags">${(item.tags || []).map((t) => `<span>${esc(t)}</span>`).join("")}</div>
      <div class="card__actions">
        <button data-action="details" type="button">Спеки</button>
        <a href="#contacts">Связаться</a>
      </div>
    </div>
  </article>`;
}

function renderFilters() {
  const categories = ["all", "ready-pc", "components"];
  const names = { all: "Все", "ready-pc": "Готовые ПК", components: "Комплектующие / периферия" };
  const wrap = document.getElementById("filters");
  wrap.innerHTML = categories.map((c, i) => `<button class="chip ${i === 0 ? "is-active" : ""}" data-filter="${c}">${names[c]}</button>`).join("");
  wrap.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const filter = btn.dataset.filter;
    wrap.querySelectorAll("button").forEach((b) => b.classList.toggle("is-active", b === btn));
    document.querySelectorAll("#catalogGrid .card").forEach((card) => {
      card.hidden = filter !== "all" && card.dataset.category !== filter;
    });
  });
}

function renderReviews() {
  const track = document.getElementById("reviewsTrack");
  const slides = [...reviews, ...reviews];
  track.innerHTML = slides.map((r) => `<article class="review">
    <img src="${r.avatar}" alt="${esc(r.name)}" />
    <div><h4>${esc(r.name)}</h4><small>${esc(r.date)} · Покупатель</small><p>${esc(r.text)}</p></div>
  </article>`).join("");
}

function openDetails(item) {
  const modal = document.getElementById("detailsModal");
  const specs = (item.specs || []).slice(0, 6);
  document.documentElement.style.setProperty("--dynamic-accent", item.accent || "#ffffff");
  document.getElementById("modalContent").innerHTML = `
    <div class="modal__hero">
      <img src="${esc(item.image)}" alt="${esc(item.title)}" />
      <div>
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.desc || "")}</p>
        <label>Акцент карточки
          <input id="accentPicker" type="color" value="${esc(item.accent || "#ffffff")}" />
        </label>
      </div>
    </div>
    <div class="spec-orbit">
      ${specs.map((s) => `<div class="spec-pill"><span>${esc(s.label || "Спека")}</span><b>${esc(s.value || "-")}</b></div>`).join("")}
    </div>`;
  document.getElementById("accentPicker")?.addEventListener("input", (e) => {
    document.documentElement.style.setProperty("--dynamic-accent", e.target.value);
  });
  modal.showModal();
}

function bindCards(catalog) {
  document.getElementById("catalogGrid").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action='details']");
    if (!btn) return;
    const card = e.target.closest(".card");
    const item = catalog.items.find((i) => String(i.id) === card?.dataset.id);
    if (item) openDetails(item);
  });
}

function setupHeroScroll() {
  const hero = document.getElementById("hero");
  const heroPc = document.getElementById("heroPc");
  if (!hero || !heroPc) return;

  let ticking = false;
  const update = () => {
    const rect = hero.getBoundingClientRect();
    const distance = Math.max(hero.offsetHeight - window.innerHeight, 1);
    const progress = Math.min(Math.max(-rect.top / distance, 0), 1);

    const y = progress * 110;
    const scale = 1 - progress * 0.06;
    const fade = 1 - progress * 0.35;

    heroPc.style.transform = `translate3d(0, ${y}px, 0) scale(${scale})`;
    heroPc.style.opacity = String(fade);
    ticking = false;
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  update();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
}

(async function init() {
  syncAuthUi();
  document.getElementById("year").textContent = new Date().getFullYear();
  const catalog = await loadCatalog();
  document.getElementById("catalogGrid").innerHTML = catalog.items.map((item) => cardTemplate(item, catalog.currency)).join("");
  renderFilters();
  bindCards(catalog);
  renderReviews();
  setupHeroScroll();

  document.getElementById("resetCatalog").addEventListener("click", () => {
    clearLocalOverride();
    location.reload();
  });
  document.getElementById("closeModal").addEventListener("click", () => document.getElementById("detailsModal").close());
})();
