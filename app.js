const LS_KEY = "kontora.catalog.override.v1";

const fmtPrice = (n, currency="₽") => {
  try {
    return new Intl.NumberFormat("ru-RU").format(n) + " " + currency;
  } catch {
    return `${n} ${currency}`;
  }
};

async function loadCatalog() {
  const res = await fetch("catalog.json", { cache: "no-store" });
  const base = await res.json();

  // локальные правки из админки (если есть)
  const overrideRaw = localStorage.getItem(LS_KEY);
  if (overrideRaw) {
    try {
      const override = JSON.parse(overrideRaw);
      if (override && Array.isArray(override.items)) return override;
    } catch {}
  }
  return base;
}

function cardTemplate(item, currency) {
  const tags = (item.tags || []).slice(0, 4).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("");
  return `
    <article class="card" data-category="${escapeAttr(item.category || "all")}" data-id="${escapeAttr(item.id)}">
      <div class="card__media">
        <img class="card__img" src="${escapeAttr(item.image)}" alt="${escapeAttr(item.title)}" loading="lazy" />
      </div>
      <div class="card__body">
        <div class="card__top">
          <h3 class="card__name">${escapeHtml(item.title)}</h3>
          <div class="card__price">${fmtPrice(item.price, currency)}</div>
        </div>
        <p class="card__desc">${escapeHtml(item.desc || "")}</p>
        <div class="card__tags">${tags}</div>
        <div class="card__cta">
          <button class="card__btn card__btn--accent" type="button" data-action="buy">Хочу →</button>
          <button class="card__btn" type="button" data-action="details">Спеки</button>
        </div>
      </div>
    </article>
  `;
}

function escapeHtml(s="") {
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
function escapeAttr(s="") { return escapeHtml(s).replaceAll("\n"," "); }

function bindFilters() {
  const chips = document.querySelectorAll(".chip");
  const grid = document.getElementById("catalogGrid");

  const setActive = (btn) => {
    chips.forEach(c => c.classList.toggle("is-active", c === btn));
  };

  chips.forEach(btn => {
    btn.addEventListener("click", () => {
      const f = btn.dataset.filter || "all";
      setActive(btn);
      [...grid.children].forEach(card => {
        const cat = card.getAttribute("data-category") || "all";
        const show = f === "all" || cat === f;
        card.style.display = show ? "" : "none";
      });
    });
  });
}

function bindCardActions(catalog) {
  const grid = document.getElementById("catalogGrid");
  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const card = e.target.closest(".card");
    if (!card) return;

    const id = card.getAttribute("data-id");
    const item = catalog.items.find(x => String(x.id) === String(id));
    if (!item) return;

    const action = btn.dataset.action;

    if (action === "details") {
      const tags = (item.tags || []).join(" • ");
      alert(`${item.title}\n\n${item.desc || ""}\n\n${tags}`);
    }

    if (action === "buy") {
      // пока без формы — просто якорь на контакты
      location.hash = "#contacts";
    }
  });
}

function heroParallax() {
  const img = document.getElementById("heroProduct");
  if (!img) return;

  let mx = 0, my = 0, tx = 0, ty = 0;

  const onMove = (e) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = (e.clientY / window.innerHeight) * 2 - 1;
    mx = x; my = y;
  };
  window.addEventListener("pointermove", onMove, { passive: true });

  const tick = () => {
    tx += (mx - tx) * 0.06;
    ty += (my - ty) * 0.06;
    img.style.transform = `translate3d(${tx * 12}px, ${ty * 10}px, 0) rotateX(${(-ty) * 4}deg) rotateY(${tx * 6}deg)`;
    requestAnimationFrame(tick);
  };
  tick();
}

function resetOverride() {
  const btn = document.getElementById("resetCatalog");
  if (!btn) return;
  btn.addEventListener("click", () => {
    localStorage.removeItem(LS_KEY);
    location.reload();
  });
}

(async function init() {
  document.getElementById("year").textContent = new Date().getFullYear();

  const catalog = await loadCatalog();
  const grid = document.getElementById("catalogGrid");
  grid.innerHTML = catalog.items.map(i => cardTemplate(i, catalog.currency || "₽")).join("");

  bindFilters();
  bindCardActions(catalog);
  heroParallax();
  resetOverride();
})();