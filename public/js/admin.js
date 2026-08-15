function initAdmin() {
  const user = getUser();
  const gate = document.getElementById('adminGate');
  const body = document.getElementById('adminBody');

  if (!user) {
    gate.innerHTML = `<div class="login-prompt"><a href="/login.html?redirect=/admin.html">Log in</a> with an admin account to continue.</div>`;
    return;
  }
  if (!user.isAdmin) {
    gate.innerHTML = `<div class="notice notice-error">This page is available to admin accounts only.</div>`;
    return;
  }

  body.classList.remove('hidden');
  wireTabs();
  wireCafeForm();
  wireDrinkForm();
  loadCafesAdmin();
  loadDrinksAdmin();
  loadUsersAdmin();
}

function wireTabs() {
  const tabs = ['cafes', 'drinks', 'users'];
  document.querySelectorAll('.admin-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      tabs.forEach(t => {
        document.getElementById('tab-' + t).classList.toggle('hidden', btn.dataset.tab !== t);
      });
    });
  });
}

function wireCafeForm() {
  document.getElementById('cafeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const notice = document.getElementById('cafeFormNotice');
    notice.innerHTML = '';
    try {
      await apiFetch('/cafes', {
        method: 'POST',
        body: JSON.stringify({
          name: document.getElementById('cafeName').value,
          area: document.getElementById('cafeArea').value,
          description: document.getElementById('cafeDesc').value,
          imageUrl: document.getElementById('cafeImage').value
        })
      });
      document.getElementById('cafeForm').reset();
      notice.innerHTML = `<div class="notice notice-success">Cafe added successfully.</div>`;
      loadCafesAdmin();
      loadDrinkCafeOptions();
    } catch (err) {
      notice.innerHTML = `<div class="notice notice-error">${escapeHtml(err.message)}</div>`;
    }
  });
}

function wireDrinkForm() {
  document.getElementById('drinkForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const notice = document.getElementById('drinkFormNotice');
    notice.innerHTML = '';
    try {
      await apiFetch('/drinks', {
        method: 'POST',
        body: JSON.stringify({
          cafeId: document.getElementById('drinkCafe').value,
          name: document.getElementById('drinkName').value,
          description: document.getElementById('drinkDesc').value,
          price: document.getElementById('drinkPrice').value,
          imageUrl: document.getElementById('drinkImage').value
        })
      });
      document.getElementById('drinkForm').reset();
      notice.innerHTML = `<div class="notice notice-success">Drink added successfully.</div>`;
      loadDrinksAdmin();
    } catch (err) {
      notice.innerHTML = `<div class="notice notice-error">${escapeHtml(err.message)}</div>`;
    }
  });
}

async function loadCafesAdmin() {
  const el = document.getElementById('cafesAdminList');
  try {
    const cafes = await apiFetch('/cafes');
    el.innerHTML = cafes.length ? cafes.map(c => `
      <div class="admin-list-row">
        <div>
          <strong>${escapeHtml(c.name)}</strong>
          <div class="meta">${escapeHtml(c.area)} · ${c.avgRating || '—'}★ (${c.ratingCount}) · ${c.drinkCount} drink${c.drinkCount === 1 ? '' : 's'}</div>
        </div>
        <button class="btn btn-danger btn-small" data-del-cafe="${c.id}">Delete</button>
      </div>
    `).join('') : `<div class="empty-state">No cafes yet — add one above.</div>`;

    el.querySelectorAll('[data-del-cafe]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this cafe and all its drinks, ratings, and comments? This cannot be undone.')) return;
        try {
          await apiFetch('/cafes/' + btn.dataset.delCafe, { method: 'DELETE' });
          loadCafesAdmin();
          loadDrinksAdmin();
          loadDrinkCafeOptions();
        } catch (e) { alert(e.message); }
      });
    });

    loadDrinkCafeOptions(cafes);
  } catch (e) {
    el.innerHTML = `<div class="notice notice-error">${escapeHtml(e.message)}</div>`;
  }
}

async function loadDrinkCafeOptions(cafesArg) {
  const sel = document.getElementById('drinkCafe');
  const cafes = cafesArg || await apiFetch('/cafes');
  const current = sel.value;
  sel.innerHTML = cafes.map(c => `<option value="${c.id}">${escapeHtml(c.name)} (${escapeHtml(c.area)})</option>`).join('');
  if (current) sel.value = current;
}

async function loadDrinksAdmin() {
  const el = document.getElementById('drinksAdminList');
  try {
    const drinks = await apiFetch('/drinks/all');
    el.innerHTML = drinks.length ? drinks.map(d => `
      <div class="admin-list-row">
        <div>
          <strong>${escapeHtml(d.name)}</strong>
          <div class="meta">${escapeHtml(d.cafeName)} ${d.price ? '· ' + escapeHtml(d.price) : ''}</div>
        </div>
        <button class="btn btn-danger btn-small" data-del-drink="${d.id}">Delete</button>
      </div>
    `).join('') : `<div class="empty-state">No drinks yet — add one above.</div>`;

    el.querySelectorAll('[data-del-drink]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this drink?')) return;
        try {
          await apiFetch('/drinks/' + btn.dataset.delDrink, { method: 'DELETE' });
          loadDrinksAdmin();
          loadCafesAdmin();
        } catch (e) { alert(e.message); }
      });
    });
  } catch (e) {
    el.innerHTML = `<div class="notice notice-error">${escapeHtml(e.message)}</div>`;
  }
}

async function loadUsersAdmin() {
  const el = document.getElementById('usersAdminList');
  try {
    const users = await apiFetch('/users');
    el.innerHTML = users.length ? users.map(u => `
      <div class="admin-list-row">
        <div>
          <strong>${escapeHtml(u.name)}</strong>
          ${u.isAdmin ? '<span class="rating-pill" style="margin-left:6px; padding:2px 8px; font-size:.7rem;">Admin</span>' : ''}
          ${u.isCreator ? '<span class="rating-pill" style="margin-left:6px; padding:2px 8px; font-size:.7rem;">✦ Creator</span>' : ''}
          <div class="meta">${escapeHtml(u.email)} · joined ${timeAgo(u.createdAt)}</div>
        </div>
        ${u.isAdmin
          ? '<span class="meta">Admins don\'t need Creator status</span>'
          : `<button class="btn ${u.isCreator ? 'btn-outline' : 'btn-gold'} btn-small" data-toggle-creator="${u.id}" data-current="${u.isCreator}">${u.isCreator ? 'Remove Creator' : 'Make Creator'}</button>`}
      </div>
    `).join('') : `<div class="empty-state">No signed-up users yet.</div>`;

    el.querySelectorAll('[data-toggle-creator]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const current = btn.dataset.current === 'true';
        try {
          await apiFetch(`/users/${btn.dataset.toggleCreator}/creator`, {
            method: 'PATCH',
            body: JSON.stringify({ isCreator: !current })
          });
          loadUsersAdmin();
        } catch (e) { alert(e.message); }
      });
    });
  } catch (e) {
    el.innerHTML = `<div class="notice notice-error">${escapeHtml(e.message)}</div>`;
  }
}

document.addEventListener('DOMContentLoaded', initAdmin);
