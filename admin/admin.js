import { getFirebaseStatus, loadCatalog, saveCatalog } from "../catalog-store.js";

const ADMIN_PASS = "kontora";
const $ = (id) => document.getElementById(id);

function escapeAttr(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
    .replaceAll("\n", " ");
}

function rowTemplate(item) {
  const tags = Array.isArray(item.tags) ? item.tags.join(", ") : "";
  const select = ["gaming", "work", "creator", "budget"]
    .map(c => `<option value="${c}" ${item.category === c ? "selected" : ""}>${c}</option>`).join("");
  return `<tr data-id="${escapeAttr(item.id)}">
    <td><input class="admin-cell" data-k="id" value="${escapeAttr(item.id)}"></td>
    <td><input class="admin-cell" data-k="title" value="${escapeAttr(item.title)}"></td>
    <td><input class="admin-cell" data-k="price" type="number" value="${escapeAttr(item.price)}"></td>
    <td><select class="admin-cell" data-k="category">${select}</select></td>
    <td><input class="admin-cell" data-k="image" value="${escapeAttr(item.image)}"></td>
    <td><input class="admin-cell" data-k="tags" value="${escapeAttr(tags)}"></td>
    <td><input class="admin-cell" data-k="desc" value="${escapeAttr(item.desc || "")}"></td>
    <td><button type="button" class="mini" data-action="del">Удалить</button></td>
  </tr>`;
}

function rowsToCatalog() {
  const items = [...$("rows").querySelectorAll("tr")].map((tr) => {
    const get = (k) => tr.querySelector(`[data-k="${k}"]`)?.value?.trim() || "";
    return {
      id: get("id"),
      title: get("title"),
      price: Number(get("price")) || 0,
      category: get("category") || "gaming",
      image: get("image"),
      tags: get("tags").split(",").map(t => t.trim()).filter(Boolean),
      desc: get("desc")
    };
  }).filter(item => item.id && item.title);

  return { currency: "₽", items };
}

function downloadJson(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "catalog.override.json";
  a.click();
}

function login(onSuccess) {
  $("loginBtn").addEventListener("click", () => {
    if ($("pass").value !== ADMIN_PASS) return alert("Неверный пароль");
    $("authGate").hidden = true;
    $("panel").hidden = false;
    onSuccess();
  });

  $("pass").addEventListener("keydown", (e) => {
    if (e.key === "Enter") $("loginBtn").click();
  });
}

(async function init() {
  $("syncState").textContent = `Firebase: ${getFirebaseStatus() ? "подключен" : "не настроен"}`;

  const catalog = await loadCatalog();

  login(() => {
    const render = () => {
      $("rows").innerHTML = catalog.items.map(rowTemplate).join("");
    };
    render();

    $("addBtn").addEventListener("click", () => {
      catalog.items.unshift({
        id: "k" + Math.random().toString(16).slice(2, 6),
        title: "Новый товар",
        price: 0,
        category: "gaming",
        image: "https://i.postimg.cc/DfqdMBVk/27367CFA-6E85-469F-A438-A1EDC62D7600.png",
        tags: ["new"],
        desc: "Описание"
      });
      render();
    });

    $("rows").addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action='del']");
      const tr = e.target.closest("tr");
      if (!btn || !tr) return;
      catalog.items = catalog.items.filter(item => String(item.id) !== tr.dataset.id);
      render();
    });

    $("saveBtn").addEventListener("click", async () => {
      const updated = rowsToCatalog();
      const cloudSaved = await saveCatalog(updated);
      alert(cloudSaved ? "Сохранено локально + в Firebase" : "Сохранено локально (Firebase не активен)");
    });

    $("exportBtn").addEventListener("click", () => downloadJson(rowsToCatalog()));

    $("importFile").addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const parsed = JSON.parse(await file.text());
        if (!Array.isArray(parsed.items)) throw new Error("bad format");
        catalog.items = parsed.items;
        render();
      } catch {
        alert("Файл не похож на catalog JSON");
      } finally {
        e.target.value = "";
      }
    });

    $("clearBtn").addEventListener("click", () => {
      if (!confirm("Удалить все товары?")) return;
      catalog.items = [];
      render();
    });
  });
})();
