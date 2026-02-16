import { loadCatalog, clearLocalOverride } from "./catalog-store.js";

const fmtPrice = (n, currency = "₽") => new Intl.NumberFormat("ru-RU").format(n) + " " + currency;

const escapeHtml = (s = "") => String(s)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const escapeAttr = (s = "") => escapeHtml(s).replaceAll("\n", " ");

function cardTemplate(item, currency) {
  const tags = (item.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("");
  return `<article class="card" data-category="${escapeAttr(item.category || "all")}" data-id="${escapeAttr(item.id)}">
    <div class="card__media"><img class="card__img" src="${escapeAttr(item.image)}" alt="${escapeAttr(item.title)}" loading="lazy" /></div>
    <div class="card__body">
      <div class="card__top"><h3 class="card__name">${escapeHtml(item.title)}</h3><div class="card__price">${fmtPrice(item.price, currency)}</div></div>
      <p class="card__desc">${escapeHtml(item.desc || "")}</p>
      <div class="card__tags">${tags}</div>
      <div class="card__cta"><button class="card__btn card__btn--accent" data-action="buy" type="button">Хочу →</button><button class="card__btn" data-action="details" type="button">Спеки</button></div>
    </div>
  </article>`;
}

function bindFilters(catalog) {
  const wrap = document.getElementById("filters");
  const categories = ["all", ...new Set(catalog.items.map(i => i.category || "other"))];
  wrap.innerHTML = categories.map((c, i) => `<button class="chip ${i === 0 ? "is-active" : ""}" data-filter="${escapeAttr(c)}" type="button">${c === "all" ? "Все" : escapeHtml(c)}</button>`).join("");

  const chips = wrap.querySelectorAll(".chip");
  chips.forEach(btn => btn.addEventListener("click", () => {
    chips.forEach(c => c.classList.toggle("is-active", c === btn));
    const filter = btn.dataset.filter;
    document.querySelectorAll("#catalogGrid .card").forEach(card => {
      const show = filter === "all" || card.dataset.category === filter;
      card.style.display = show ? "" : "none";
    });
  }));
}

function bindCardActions(catalog) {
  document.getElementById("catalogGrid").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    const card = e.target.closest(".card");
    if (!btn || !card) return;
    const item = catalog.items.find(x => String(x.id) === card.dataset.id);
    if (!item) return;
    if (btn.dataset.action === "details") alert(`${item.title}\n\n${item.desc || ""}\n\n${(item.tags || []).join(" • ")}`);
    if (btn.dataset.action === "buy") location.hash = "#contacts";
  });
}

function heroParallax() {
  const img = document.getElementById("heroProduct");
  if (!img || window.matchMedia("(max-width: 900px)").matches) return;
  let mx = 0, my = 0, tx = 0, ty = 0;
  window.addEventListener("pointermove", (e) => {
    mx = (e.clientX / window.innerWidth) * 2 - 1;
    my = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });
  const tick = () => {
    tx += (mx - tx) * 0.06;
    ty += (my - ty) * 0.06;
    img.style.transform = `translate3d(${tx * 12}px, ${ty * 10}px, 0) rotateX(${(-ty) * 4}deg) rotateY(${tx * 6}deg)`;
    requestAnimationFrame(tick);
  };
  tick();
}

(async function init() {
  document.getElementById("year").textContent = new Date().getFullYear();
  const catalog = await loadCatalog();
  document.getElementById("catalogGrid").innerHTML = catalog.items.map(i => cardTemplate(i, catalog.currency || "₽")).join("");
  bindFilters(catalog);
  bindCardActions(catalog);
  heroParallax();

  document.getElementById("resetCatalog").addEventListener("click", () => {
    clearLocalOverride();
    location.reload();
  });
})();
