const LS_KEY = "kontora.catalog.override.v1";
const ADMIN_PASS = "kontora"; // поменяй

const $ = (id) => document.getElementById(id);

const emptyCatalog = () => ({
  currency: "₽",
  items: []
});

async function loadBaseCatalog() {
  try {
    const res = await fetch("catalog.json", { cache: "no-store" });
    return await res.json();
  } catch {
    return emptyCatalog();
  }
}

function loadWorkingCatalog(base) {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return structuredClone(base);
  try {
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.items)) return parsed;
  } catch {}
  return structuredClone(base);
}

function saveWorkingCatalog(cat) {
  localStorage.setItem(LS_KEY, JSON.stringify(cat, null, 2));
}

function rowTemplate(item) {
  const val = (x) => (x ?? "");
  const tags = Array.isArray(item.tags) ? item.tags.join(", ") : (item.tags || "");
  return `
    <tr data-id="${escapeAttr(item.id)}" style="border-bottom:1px solid rgba(244,243,238,.07);">
      <td style="padding:10px 14px; color:rgba(244,243,238,.85);">
        <input data-k="id" value="${escapeAttr(val(item.id))}" style="${inputStyle()}" />
      </td>
      <td style="padding:10px 14px;">
        <input data-k="title" value="${escapeAttr(val(item.title))}" style="${inputStyle()}" />
      </td>
      <td style="padding:10px 14px;">
        <input data-k="price" type="number" value="${escapeAttr(val(item.price))}" style="${inputStyle()}" />
      </td>
      <td style="padding:10px 14px;">
        <select data-k="category" style="${inputStyle(true)}">
          ${["gaming","work","creator","budget"].map(c => `<option value="${c}" ${item.category===c?"selected":""}>${c}</option>`).join("")}
        </select>
      </td>
      <td style="padding:10px 14px;">
        <input data-k="image" value="${escapeAttr(val(item.image))}" style="${inputStyle()}" />
      </td>
      <td style="padding:10px 14px;">
        <input data-k="tags" value="${escapeAttr(tags)}" style="${inputStyle()}" />
      </td>
      <td style="padding:10px 14px;">
        <input data-k="desc" value="${escapeAttr(val(item.desc))}" style="${inputStyle()}" />
      </td>
      <td style="padding:10px 14px;">
        <button data-action="del" class="mini" type="button" style="padding:8px 10px;">Удалить</button>
      </td>
    </tr>
  `;
}

function inputStyle(isSelect=false) {
  return [
    "width:100%",
    "padding:10px 12px",
    "border-radius:14px",
    "border:1px solid rgba(244,243,238,.12)",
    "background:rgba(0,0,0,.18)",
    "color:rgba(244,243,238,.92)",
    "outline:none",
    isSelect ? "appearance:auto" : ""
  ].join(";");
}

function escapeAttr(s="") {
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;")
    .replaceAll("\n"," ");
}

function readRowsToCatalog() {
  const rows = [...$("rows").querySelectorAll("tr")];
  const items = rows.map(tr => {
    const get = (k) => tr.querySelector(`[data-k="${k}"]`)?.value ?? "";
    const tagsRaw = get("tags").trim();
    const tags = tagsRaw
      ? tagsRaw.split(",").map(x => x.trim()).filter(Boolean)
      : [];
    return {
      id: get("id").trim(),
      title: get("title").trim(),
      price: Number(get("price")) || 0,
      category: get("category").trim(),
      image: get("image").trim(),
      tags,
      desc: get("desc").trim()
    };
  }).filter(x => x.id && x.title);
  return { currency: "₽", items };
}

function downloadJson(obj, filename="catalog.override.json") {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function bindPanel(cat) {
  const render = () => {
    $("rows").innerHTML = cat.items.map(rowTemplate).join("");
  };

  render();

  $("addBtn").addEventListener("click", () => {
    const id = "k" + Math.random().toString(16).slice(2, 6);
    cat.items.unshift({
      id,
      title: "Новый товар",
      price: 0,
      category: "gaming",
      image: "assets/pc-placeholder.png",
      desc: "Описание",
      tags: ["tag"]
    });
    render();
  });

  $("rows").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const tr = e.target.closest("tr");
    if (!tr) return;

    if (btn.dataset.action === "del") {
      const id = tr.getAttribute("data-id");
      cat.items = cat.items.filter(x => String(x.id) !== String(id));
      render();
    }
  });

  $("saveBtn").addEventListener("click", () => {
    const updated = readRowsToCatalog();
    saveWorkingCatalog(updated);
    alert("Сохранено. Открой сайт — каталог обновился (в этом браузере).");
  });

  $("exportBtn").addEventListener("click", () => {
    const updated = readRowsToCatalog();
    downloadJson(updated, "catalog.override.json");
  });

  $("importFile").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const parsed = JSON.parse(text);
      if (!parsed || !Array.isArray(parsed.items)) throw new Error("bad format");
      cat.items = parsed.items;
      cat.currency = parsed.currency || "₽";
      saveWorkingCatalog({ currency: cat.currency, items: cat.items });
      alert("Импортнул. Сохранилось локально.");
      render();
    } catch {
      alert("Не смог прочитать JSON. Проверь формат.");
    } finally {
      e.target.value = "";
    }
  });

  $("clearBtn").addEventListener("click", () => {
    if (!confirm("Точно очистить каталог?")) return;
    cat.items = [];
    render();
  });
}

function loginFlow(onOk) {
  const lock = $("lock");
  const panel = $("panel");

  $("loginBtn").addEventListener("click", () => {
    const pass = $("pass").value;
    if (pass !== ADMIN_PASS) {
      alert("Пароль мимо.");
      return;
    }
    lock.style.display = "none";
    panel.style.display = "";
    onOk();
  });

  $("pass").addEventListener("keydown", (e) => {
    if (e.key === "Enter") $("loginBtn").click();
  });
}

(async function init(){
  const base = await loadBaseCatalog();
  const cat = loadWorkingCatalog(base);

  loginFlow(() => bindPanel(cat));
})();