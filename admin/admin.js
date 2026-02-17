import { getFirebaseStatus, loadCatalog, saveCatalog } from "../catalog-store.js";

const ADMIN_PASS = "kontora";
const $ = (id) => document.getElementById(id);
let catalog;
let activeId = null;

function uid() {
  return "id-" + Math.random().toString(16).slice(2, 7);
}

function itemButton(item) {
  return `<button class="item-btn ${item.id === activeId ? "active" : ""}" data-id="${item.id}">${item.title}</button>`;
}

function renderList() {
  $("itemList").innerHTML = catalog.items.map(itemButton).join("");
}

function getItem() {
  return catalog.items.find((i) => i.id === activeId);
}

function renderEditor() {
  const item = getItem();
  if (!item) return;
  $("editor").innerHTML = `
    <div class="row">
      <input data-k="title" value="${item.title || ""}" placeholder="Название" />
      <input data-k="price" type="number" value="${item.price || 0}" placeholder="Цена" />
    </div>
    <div class="row">
      <select data-k="category">
        <option value="ready-pc" ${item.category === "ready-pc" ? "selected" : ""}>Готовые ПК</option>
        <option value="components" ${item.category === "components" ? "selected" : ""}>Комплектующие / периферия</option>
      </select>
      <input data-k="accent" type="color" value="${item.accent || "#ffffff"}" />
    </div>
    <input data-k="image" value="${item.image || ""}" placeholder="URL изображения" />
    <textarea data-k="desc" rows="3" placeholder="Описание">${item.desc || ""}</textarea>
    <input data-k="tags" value="${(item.tags || []).join(", ")}" placeholder="Теги через запятую" />
    <div>
      <b>Спеки</b>
      <div id="specRows">${(item.specs || []).map((s, i) => `<div class="spec-row"><input data-spec-label="${i}" value="${s.label || ""}" placeholder="Параметр" /><input data-spec-value="${i}" value="${s.value || ""}" placeholder="Значение" /><button type="button" data-del-spec="${i}">✕</button></div>`).join("")}</div>
      <button id="addSpec" class="mini" type="button">+ Добавить спеку</button>
    </div>
    <button id="deleteItem" class="mini" type="button">Удалить товар</button>
  `;
}

function syncFromEditor() {
  const item = getItem();
  if (!item) return;
  const get = (k) => $("editor").querySelector(`[data-k='${k}']`)?.value || "";
  item.title = get("title").trim();
  item.price = Number(get("price")) || 0;
  item.category = get("category");
  item.accent = get("accent");
  item.image = get("image").trim();
  item.desc = get("desc").trim();
  item.tags = get("tags").split(",").map((x) => x.trim()).filter(Boolean);
  item.specs = [...$("editor").querySelectorAll(".spec-row")].map((row) => ({
    label: row.querySelector("[data-spec-label]")?.value?.trim() || "",
    value: row.querySelector("[data-spec-value]")?.value?.trim() || ""
  })).filter((s) => s.label || s.value);
}

function bindEditorEvents() {
  $("editor").addEventListener("input", () => {
    syncFromEditor();
    renderList();
  });

  $("editor").addEventListener("click", (e) => {
    const delSpec = e.target.closest("button[data-del-spec]");
    if (delSpec) {
      const idx = Number(delSpec.dataset.delSpec);
      getItem().specs.splice(idx, 1);
      renderEditor();
      return;
    }
    if (e.target.id === "addSpec") {
      getItem().specs = getItem().specs || [];
      getItem().specs.push({ label: "", value: "" });
      renderEditor();
      return;
    }
    if (e.target.id === "deleteItem") {
      catalog.items = catalog.items.filter((i) => i.id !== activeId);
      activeId = catalog.items[0]?.id || null;
      renderList();
      renderEditor();
    }
  });
}

function downloadJson(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "catalog.override.json";
  a.click();
}

function unlockPanel() {
  $("authGate").hidden = true;
  $("panel").hidden = false;
  activeId = catalog.items[0]?.id || null;
  renderList();
  renderEditor();
  bindEditorEvents();

  $("itemList").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-id]");
    if (!btn) return;
    syncFromEditor();
    activeId = btn.dataset.id;
    renderList();
    renderEditor();
  });

  $("addBtn").addEventListener("click", () => {
    const item = { id: uid(), title: "Новый товар", price: 0, category: "ready-pc", image: "", desc: "", tags: [], accent: "#ffffff", specs: [] };
    catalog.items.unshift(item);
    activeId = item.id;
    renderList();
    renderEditor();
  });

  $("saveBtn").addEventListener("click", async () => {
    syncFromEditor();
    const cloud = await saveCatalog(catalog);
    alert(cloud ? "Сохранено локально и в Firebase" : "Сохранено локально");
  });

  $("exportBtn").addEventListener("click", () => {
    syncFromEditor();
    downloadJson(catalog);
  });

  $("importFile").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!Array.isArray(parsed.items)) throw new Error();
      catalog = parsed;
      activeId = catalog.items[0]?.id || null;
      renderList();
      renderEditor();
    } catch {
      alert("Некорректный JSON");
    }
    e.target.value = "";
  });
}

(async function init() {
  $("syncState").textContent = `Firebase: ${getFirebaseStatus() ? "подключен" : "не настроен"}`;
  catalog = await loadCatalog();
  $("loginBtn").addEventListener("click", () => {
    if ($("pass").value !== ADMIN_PASS) return alert("Неверный пароль");
    unlockPanel();
  });
})();
