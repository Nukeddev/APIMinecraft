/* ============================================================
   MINECRAFT EXPLORER — app.js
   API Base: https://blocksitems.com/api/v1
   Icons:    /items/{full_id}/icon  |  /blocks/{full_id}/icon
   ============================================================ */

const BASE  = "https://blocksitems.com/api/v1";
const LIMIT = 48;

const state = {
  activeTab: "items",
  view: "grid",
  tabs: {
    items:   { data: [], page: 1, total: 0, pages: 0, loading: false, fetched: false },
    blocks:  { data: [], page: 1, total: 0, pages: 0, loading: false, fetched: false },
    recipes: { data: [], page: 1, total: 0, pages: 0, loading: false, fetched: false },
  }
};

/* ============================================================
   ICON URL HELPERS
   ============================================================ */
function itemIconUrl(full_id, size) {
  return BASE + "/items/" + encodeURIComponent(full_id) + "/icon" + (size ? "?size=" + size : "");
}
function blockIconUrl(full_id, size) {
  return BASE + "/blocks/" + encodeURIComponent(full_id) + "/icon" + (size ? "?size=" + size : "");
}
function iconUrl(tab, full_id, size) {
  return tab === "blocks" ? blockIconUrl(full_id, size) : itemIconUrl(full_id, size);
}

/* ============================================================
   TAB SWITCHING
   ============================================================ */
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    state.activeTab = btn.dataset.tab;
    document.getElementById("panel-" + state.activeTab).classList.add("active");

    document.getElementById("filters-items").style.display   = state.activeTab === "items"   ? "" : "none";
    document.getElementById("filters-blocks").style.display  = state.activeTab === "blocks"  ? "" : "none";
    document.getElementById("filters-recipes").style.display = state.activeTab === "recipes" ? "" : "none";

    if (!state.tabs[state.activeTab].fetched) fetchPage(state.activeTab, 1);
    updateStats();
  });
});

/* ============================================================
   SEARCH / FILTER LISTENERS — ITEMS
   ============================================================ */
let itemsTimer;
["items-search","items-namespace","items-mod_id","items-tag"].forEach(id => {
  document.getElementById(id).addEventListener("input", () => {
    clearTimeout(itemsTimer);
    itemsTimer = setTimeout(() => fetchPage("items", 1), 450);
  });
});
document.getElementById("items-rarity").addEventListener("change", () => fetchPage("items", 1));

/* ============================================================
   SEARCH / FILTER LISTENERS — BLOCKS
   ============================================================ */
let blocksTimer;
["blocks-search","blocks-namespace","blocks-mod_id","blocks-tag",
 "blocks-hardness_min","blocks-hardness_max","blocks-light_min","blocks-light_max"].forEach(id => {
  document.getElementById(id).addEventListener("input", () => {
    clearTimeout(blocksTimer);
    blocksTimer = setTimeout(() => fetchPage("blocks", 1), 450);
  });
});
document.getElementById("blocks-waterloggable").addEventListener("change", () => fetchPage("blocks", 1));

/* ============================================================
   RECIPES APPLY
   ============================================================ */
function applyRecipeFilters() { fetchPage("recipes", 1); }

/* ============================================================
   VIEW TOGGLE — ITEMS
   ============================================================ */
document.getElementById("btnGrid").addEventListener("click", () => {
  state.view = "grid";
  document.getElementById("btnGrid").classList.add("active");
  document.getElementById("btnList").classList.remove("active");
  renderCardGrid("items");
});
document.getElementById("btnList").addEventListener("click", () => {
  state.view = "list";
  document.getElementById("btnList").classList.add("active");
  document.getElementById("btnGrid").classList.remove("active");
  renderCardGrid("items");
});

/* VIEW TOGGLE — BLOCKS */
document.getElementById("btnGridB").addEventListener("click", () => {
  state.view = "grid";
  document.getElementById("btnGridB").classList.add("active");
  document.getElementById("btnListB").classList.remove("active");
  renderCardGrid("blocks");
});
document.getElementById("btnListB").addEventListener("click", () => {
  state.view = "list";
  document.getElementById("btnListB").classList.add("active");
  document.getElementById("btnGridB").classList.remove("active");
  renderCardGrid("blocks");
});

/* ============================================================
   FETCH
   ============================================================ */
function getFilters(tab) {
  const p = new URLSearchParams({ page: state.tabs[tab].page, limit: LIMIT });

  if (tab === "items") {
    const s  = val("items-search");
    const ns = val("items-namespace");
    const m  = val("items-mod_id");
    const r  = val("items-rarity");
    const t  = val("items-tag");
    if (s)  p.set("search", s);
    if (ns) p.set("namespace", ns);
    if (m)  p.set("mod_id", m);
    if (r)  p.set("rarity", r);
    if (t)  p.set("tag", t);
  }

  if (tab === "blocks") {
    const s   = val("blocks-search");
    const ns  = val("blocks-namespace");
    const m   = val("blocks-mod_id");
    const t   = val("blocks-tag");
    const wl  = val("blocks-waterloggable");
    const hmi = val("blocks-hardness_min");
    const hmx = val("blocks-hardness_max");
    const lmi = val("blocks-light_min");
    const lmx = val("blocks-light_max");
    if (s)   p.set("search", s);
    if (ns)  p.set("namespace", ns);
    if (m)   p.set("mod_id", m);
    if (t)   p.set("tag", t);
    if (wl)  p.set("is_waterloggable", wl);
    if (hmi) p.set("hardness_min", hmi);
    if (hmx) p.set("hardness_max", hmx);
    if (lmi) p.set("light_min", lmi);
    if (lmx) p.set("light_max", lmx);
  }

  if (tab === "recipes") {
    const ii = val("recipes-item_id");
    const ig = val("recipes-ingredient_id");
    const rt = val("recipes-recipe_type");
    const ns = val("recipes-namespace");
    if (ii) p.set("item_id", ii);
    if (ig) p.set("ingredient_id", ig);
    if (rt) p.set("recipe_type", rt);
    if (ns) p.set("namespace", ns);
  }

  return p;
}

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

async function fetchPage(tab, page) {
  const s = state.tabs[tab];
  if (s.loading) return;
  s.loading = true;
  s.page    = page;
  s.fetched = true;

  showLoading(tab);

  try {
    const params = getFilters(tab);
    const res = await fetch(BASE + "/" + tab + "?" + params.toString());
    if (!res.ok) throw new Error("HTTP " + res.status);
    const json = await res.json();

    s.data  = json.data  || [];
    s.page  = json.page  || page;
    s.total = json.total || 0;
    s.pages = json.pages || 1;

    hideLoading(tab);
    renderTab(tab);
    updateStats();
  } catch (err) {
    showError(tab, err.message);
  } finally {
    s.loading = false;
  }
}

/* ============================================================
   RENDER
   ============================================================ */
function renderTab(tab) {
  if (tab === "recipes") renderRecipes();
  else renderCardGrid(tab);
}

/* --- Cards --- */
function renderCardGrid(tab) {
  const s    = state.tabs[tab];
  const grid = document.getElementById(tab + "Grid");
  const pag  = document.getElementById(tab + "Pagination");

  if (!s.data.length) {
    grid.innerHTML = '<div class="empty-state">No se encontraron resultados.</div>';
    pag.innerHTML  = "";
    return;
  }

  grid.className = "card-grid" + (state.view === "list" ? " list-view" : "");

  grid.innerHTML = s.data.map(item => {
    const name    = item.display_name || item.full_id || item.id || "Unknown";
    const fullId  = item.full_id || item.id || "";
    const rarity  = item.rarity || "";
    const stack   = item.max_stack_size;
    const color   = item.dominant_color || "";

    const imgSrc  = fullId ? iconUrl(tab, fullId, 64) : "";

    const imgHtml = imgSrc
      ? '<img src="' + imgSrc + '" alt="' + esc(name) + '" loading="lazy" '
        + 'onerror="this.parentElement.style.background=\'' + color + '\';this.style.display=\'none\'">'
      : '<span class="card-img-placeholder">📦</span>';

    const bgStyle = color && !imgSrc ? 'style="background:' + color + '"' : '';

    const badges = [];
    if (rarity === "uncommon") badges.push('<span class="badge badge-uncommon">uncommon</span>');
    else if (rarity === "rare") badges.push('<span class="badge badge-rare">rare</span>');
    else if (rarity === "epic") badges.push('<span class="badge badge-epic">epic</span>');
    if (stack) badges.push('<span class="badge badge-gold">×' + stack + '</span>');
    if (item.is_waterloggable) badges.push('<span class="badge badge-diamond">water</span>');

    const safeKey = esc(fullId || name);

    return '<div class="mc-card" onclick="openModal(\'' + tab + '\',\'' + safeKey + '\')">'
      + '<div class="card-img-wrap" ' + bgStyle + '>' + imgHtml + '</div>'
      + '<div class="card-info">'
      + '<div class="card-name">' + esc(name) + '</div>'
      + '<div class="card-id">' + esc(fullId) + '</div>'
      + '<div class="card-badges">' + badges.join("") + '</div>'
      + '</div></div>';
  }).join("");

  renderPagination(tab, pag);
}

/* --- Recipes --- */
function renderRecipes() {
  const s    = state.tabs.recipes;
  const grid = document.getElementById("recipesGrid");
  const pag  = document.getElementById("recipesPagination");

  if (!s.data.length) {
    grid.innerHTML = '<div class="empty-state">No se encontraron recetas.</div>';
    pag.innerHTML  = "";
    return;
  }

  grid.innerHTML = s.data.map(recipe => {
    const result     = recipe.result || {};
    const outputName = result.display_name || result.full_id || "Resultado";
    const outputId   = result.full_id || "";
    const count      = result.count || recipe.count || 1;
    const ingredients = recipe.ingredients || [];
    const recipeType  = recipe.recipe_type || recipe.type || "";

    const outImgSrc = outputId ? itemIconUrl(outputId, 40) : "";
    const outImgHtml = outImgSrc
      ? '<img class="recipe-img" src="' + outImgSrc + '" alt="' + esc(outputName) + '" loading="lazy">'
      : '<div class="recipe-img" style="display:flex;align-items:center;justify-content:center;font-size:22px;">📦</div>';

    let slotHtml = "";
    for (let i = 0; i < 9; i++) {
      const ing   = ingredients[i];
      const ingId = ing ? (ing.full_id || ing.id || "") : "";
      const iSrc  = ingId ? itemIconUrl(ingId, 32) : "";
      slotHtml += '<div class="recipe-slot">'
        + (iSrc ? '<img src="' + iSrc + '" loading="lazy" onerror="this.style.display=\'none\'">' : "")
        + '</div>';
    }

    return '<div class="recipe-card">'
      + '<div class="recipe-title">' + esc(outputName) + '</div>'
      + (recipeType ? '<div style="font-size:12px;color:var(--text3);margin-bottom:8px;font-family:monospace">' + esc(recipeType) + '</div>' : '')
      + '<div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap;">'
      + '<div class="recipe-grid-display">' + slotHtml + '</div>'
      + '<div style="display:flex;flex-direction:column;align-items:center;gap:6px;">'
      + '<span style="font-size:18px;color:var(--text3)">→</span>'
      + outImgHtml
      + '<div class="recipe-count">× ' + count + '</div>'
      + '</div></div></div>';
  }).join("");

  renderPagination("recipes", pag);
}

/* ============================================================
   PAGINATION
   ============================================================ */
function renderPagination(tab, container) {
  const s = state.tabs[tab];
  if (s.pages <= 1) { container.innerHTML = ""; return; }
  const p = s.page, total = s.pages;

  let html = '<button class="pg-btn" onclick="goPage(\'' + tab + '\',' + (p-1) + ')" ' + (p===1?"disabled":"") + '>‹ Anterior</button>';
  pageRange(p, total).forEach(n => {
    if (n === "...") html += '<span class="pg-info">…</span>';
    else html += '<button class="pg-btn ' + (n===p?"pg-active":"") + '" onclick="goPage(\'' + tab + '\',' + n + ')">' + n + '</button>';
  });
  html += '<button class="pg-btn" onclick="goPage(\'' + tab + '\',' + (p+1) + ')" ' + (p===total?"disabled":"") + '>Siguiente ›</button>';
  html += '<span class="pg-info">' + p + ' / ' + total + ' · ' + s.total.toLocaleString() + '</span>';
  container.innerHTML = html;
}

function pageRange(current, total) {
  if (total <= 7) return Array.from({length: total}, (_,i) => i+1);
  const pages = [1];
  if (current > 3) pages.push("...");
  for (let i = Math.max(2, current-1); i <= Math.min(total-1, current+1); i++) pages.push(i);
  if (current < total-2) pages.push("...");
  pages.push(total);
  return pages;
}

function goPage(tab, page) {
  const s = state.tabs[tab];
  if (page < 1 || page > s.pages) return;
  fetchPage(tab, page);
  window.scrollTo({top: 0, behavior: "smooth"});
}

/* ============================================================
   STATS
   ============================================================ */
function updateStats() {
  const s = state.tabs[state.activeTab];
  document.getElementById("statTotal").textContent   = s.total.toLocaleString();
  document.getElementById("statShowing").textContent = s.data.length.toLocaleString();
  document.getElementById("statPages").textContent   = s.pages.toLocaleString();
  document.getElementById("statPage").textContent    = s.page;
}

/* ============================================================
   MODAL
   ============================================================ */
function openModal(tab, fullId) {
  const s    = state.tabs[tab];
  const item = s.data.find(i => (i.full_id === fullId) || (i.id === fullId));
  if (!item) return;

  const name   = item.display_name || item.full_id || "Unknown";
  const fid    = item.full_id || item.id || "";
  const color  = item.dominant_color || "";
  const imgSrc = fid ? iconUrl(tab, fid, 128) : "";

  const imgHtml = imgSrc
    ? '<img src="' + imgSrc + '" alt="' + esc(name) + '" onerror="this.style.opacity=\'.15\'">'
    : '<span style="font-size:42px">📦</span>';

  const bgStyle = color ? 'style="background:' + color + '"' : '';

  const rows = [];
  if (fid)                              rows.push(["ID completo", fid]);
  if (item.namespace)                   rows.push(["Namespace", item.namespace]);
  if (item.mod_id)                      rows.push(["Mod", item.mod_id]);
  if (item.rarity)                      rows.push(["Rareza", item.rarity]);
  if (item.max_stack_size !== undefined) rows.push(["Stack size", "× " + item.max_stack_size]);
  if (item.max_damage !== undefined)    rows.push(["Durabilidad", item.max_damage]);
  if (item.is_damageable !== undefined) rows.push(["Damageable", item.is_damageable ? "✓ Sí" : "✗ No"]);
  if (item.enchantment_value !== undefined) rows.push(["Encantabilidad", item.enchantment_value]);
  if (item.is_fireproof !== undefined)  rows.push(["Ignífugo", item.is_fireproof ? "✓ Sí" : "✗ No"]);
  if (item.is_complex !== undefined)    rows.push(["Complejo", item.is_complex ? "✓ Sí" : "✗ No"]);
  if (item.is_waterloggable !== undefined) rows.push(["Waterloggable", item.is_waterloggable ? "✓ Sí" : "✗ No"]);
  if (item.hardness !== undefined)      rows.push(["Dureza", item.hardness]);
  if (item.blast_resistance !== undefined) rows.push(["Blast resist.", item.blast_resistance]);
  if (item.light_emission !== undefined) rows.push(["Luz emitida", item.light_emission]);
  if (item.dominant_color)              rows.push(["Color dominante", item.dominant_color]);
  if (item.translation_key)             rows.push(["Translation key", item.translation_key]);
  if (item.created_at)                  rows.push(["Creado", item.created_at.slice(0, 10)]);

  const tableRows = rows.map(([k,v]) =>
    "<tr><td>" + k + "</td><td>" + esc(String(v)) + "</td></tr>"
  ).join("");

  document.getElementById("modalContent").innerHTML =
    '<div class="modal-header-img">'
    + '<div class="modal-img-box" ' + bgStyle + '>' + imgHtml + '</div>'
    + '<div><div class="modal-title">' + esc(name) + '</div>'
    + '<div class="modal-ns">' + esc(fid) + '</div></div>'
    + '</div>'
    + (tableRows ? '<table class="prop-table">' + tableRows + '</table>' : "");

  document.getElementById("modalOverlay").classList.add("open");
}

document.getElementById("modalClose").addEventListener("click", closeModal);
document.getElementById("modalOverlay").addEventListener("click", e => {
  if (e.target === document.getElementById("modalOverlay")) closeModal();
});
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
function closeModal() { document.getElementById("modalOverlay").classList.remove("open"); }

/* ============================================================
   LOADING / ERROR
   ============================================================ */
function showLoading(tab) {
  const el = document.getElementById("loading" + cap(tab));
  if (el) el.style.display = "flex";
  const g = document.getElementById(tab === "recipes" ? "recipesGrid" : tab + "Grid");
  if (g) g.innerHTML = "";
  const pg = document.getElementById(tab === "recipes" ? "recipesPagination" : tab + "Pagination");
  if (pg) pg.innerHTML = "";
}
function hideLoading(tab) {
  const el = document.getElementById("loading" + cap(tab));
  if (el) el.style.display = "none";
}
function showError(tab, msg) {
  hideLoading(tab);
  const g = document.getElementById(tab === "recipes" ? "recipesGrid" : tab + "Grid");
  if (g) g.innerHTML = '<div class="empty-state">⚠ Error: ' + esc(msg) + '</div>';
}

/* ============================================================
   UTILS
   ============================================================ */
function cap(str) { return str.charAt(0).toUpperCase() + str.slice(1); }
function esc(str) {
  return String(str)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}

/* ============================================================
   INIT
   ============================================================ */
fetchPage("items", 1);
