function cafeCardHtml(cafe, rank, categoryLabel) {
  return `
    <a class="card" href="/cafe.html?id=${cafe.id}">
      <div class="card-media">
        ${rank ? `<span class="rank">${rank}</span>` : ''}
        ${cafe.imageUrl
          ? `<img src="${escapeHtml(cafe.imageUrl)}" alt="${escapeHtml(cafe.name)}">`
          : `<span style="font-size:2.4rem;">☕</span>`}
      </div>
      <div class="card-body">
        <div class="card-area">${escapeHtml(cafe.area)}</div>
        <h3>${escapeHtml(cafe.name)}</h3>
        <p class="card-desc">${escapeHtml(cafe.description || 'No description yet.')}</p>
        <div class="card-foot">
          <span class="rating-pill"><span class="stars">${starString(cafe.avgRating)}</span> ${cafe.avgRating || '—'}${categoryLabel ? ` <span style="font-weight:500; opacity:.8;">· ${escapeHtml(categoryLabel)}</span>` : ''}</span>
          <span class="rating-count">${cafe.ratingCount} rating${cafe.ratingCount === 1 ? '' : 's'}</span>
        </div>
      </div>
    </a>
  `;
}

function drinkCardHtml(drink, rank) {
  return `
    <a class="card" href="/cafe.html?id=${drink.cafeId}">
      <div class="card-media">
        <span class="rank">${rank}</span>
        ${drink.imageUrl
          ? `<img src="${escapeHtml(drink.imageUrl)}" alt="${escapeHtml(drink.name)}">`
          : `<span style="font-size:2.4rem;">🥤</span>`}
      </div>
      <div class="card-body">
        <div class="card-area">${escapeHtml(drink.cafeName)}</div>
        <h3>${escapeHtml(drink.name)}</h3>
        <p class="card-desc">${escapeHtml(drink.description || '')}</p>
        <div class="card-foot">
          <span class="rating-pill"><span class="stars">${starString(drink.avgRating)}</span> ${drink.avgRating}</span>
          <span class="rating-count">${drink.ratingCount} rating${drink.ratingCount === 1 ? '' : 's'}</span>
        </div>
      </div>
    </a>
  `;
}

async function loadTopCafes() {
  const el = document.getElementById('topCafesGrid');
  const category = document.getElementById('topCafeCategory').value;
  const params = new URLSearchParams({ limit: 10 });
  if (category) params.set('category', category);
  const categoryLabel = category ? CATEGORY_LABELS[category] : '';
  try {
    const cafes = await apiFetch('/cafes/top?' + params.toString());
    el.innerHTML = cafes.length
      ? cafes.map((c, i) => cafeCardHtml(c, i + 1, categoryLabel)).join('')
      : `<div class="empty-state">${category ? `No cafes have been rated on ${escapeHtml(CATEGORY_LABELS[category])} yet.` : 'No rated cafes yet — be the first to rate one!'}</div>`;
  } catch (e) {
    el.innerHTML = `<div class="notice notice-error">${escapeHtml(e.message)}</div>`;
  }
}

async function loadTopDrinks() {
  const el = document.getElementById('topDrinksGrid');
  try {
    const drinks = await apiFetch('/drinks/top-month?limit=10');
    el.innerHTML = drinks.length
      ? drinks.map((d, i) => drinkCardHtml(d, i + 1)).join('')
      : `<div class="empty-state">No drinks rated this month yet — check back soon!</div>`;
  } catch (e) {
    el.innerHTML = `<div class="notice notice-error">${escapeHtml(e.message)}</div>`;
  }
}

async function loadAllCafes() {
  const el = document.getElementById('allCafesGrid');
  const area = document.getElementById('areaFilter').value;
  const q = document.getElementById('searchInput').value.trim();
  const params = new URLSearchParams();
  if (area) params.set('area', area);
  if (q) params.set('q', q);
  try {
    const cafes = await apiFetch('/cafes?' + params.toString());
    el.innerHTML = cafes.length
      ? cafes.map(c => cafeCardHtml(c)).join('')
      : `<div class="empty-state">No cafes match your search.</div>`;
  } catch (e) {
    el.innerHTML = `<div class="notice notice-error">${escapeHtml(e.message)}</div>`;
  }
}

async function loadAreas() {
  try {
    const areas = await apiFetch('/cafes/areas');
    const sel = document.getElementById('areaFilter');
    areas.forEach(a => {
      const opt = document.createElement('option');
      opt.value = a; opt.textContent = a;
      sel.appendChild(opt);
    });
  } catch (e) { /* non-critical */ }
}

document.addEventListener('DOMContentLoaded', () => {
  loadTopCafes();
  loadTopDrinks();
  loadAreas().then(loadAllCafes);
  document.getElementById('searchBtn').addEventListener('click', loadAllCafes);
  document.getElementById('areaFilter').addEventListener('change', loadAllCafes);
  document.getElementById('topCafeCategory').addEventListener('change', loadTopCafes);
  document.getElementById('searchInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loadAllCafes();
  });
});
