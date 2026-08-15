async function loadDashboard() {
  const user = requireLoginOrRedirect();
  if (!user) return;

  document.getElementById('welcomeMsg').innerHTML = `Welcome back, ${escapeHtml(user.name.split(' ')[0])}${user.isCreator ? ' <span class="rating-pill" style="font-size:.9rem; vertical-align:middle;">✦ Creator</span>' : ''}`;

  try {
    const data = await apiFetch('/dashboard');

    document.getElementById('statRow').innerHTML = `
      <div class="stat-card"><div class="num">${data.triedCafes.length}</div><div class="label">Cafes Tried</div></div>
      <div class="stat-card"><div class="num">${data.myCommentsCount}</div><div class="label">Reviews Written</div></div>
    `;

    const list = document.getElementById('triedList');
    list.innerHTML = data.triedCafes.length
      ? data.triedCafes.map(c => `
        <div class="tried-row">
          <div class="thumb">${c.imageUrl ? `<img src="${escapeHtml(c.imageUrl)}" style="width:100%;height:100%;object-fit:cover;border-radius:12px;">` : '☕'}</div>
          <div class="info">
            <h4><a href="/cafe.html?id=${c.id}">${escapeHtml(c.name)}</a></h4>
            <p>${escapeHtml(c.area)} · Tried ${timeAgo(c.triedAt)}${c.myRating ? ` · You rated it ${c.myRating}★` : ''}</p>
          </div>
          <button class="btn btn-outline btn-small" data-unmark="${c.id}">Remove</button>
        </div>
      `).join('')
      : `<div class="empty-state">You haven't marked any cafes as tried yet. Visit a cafe page and tap "Mark as Tried" to start your list.</div>`;

    list.querySelectorAll('[data-unmark]').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          await apiFetch(`/dashboard/tried/${btn.dataset.unmark}`, { method: 'DELETE' });
          loadDashboard();
        } catch (e) { alert(e.message); }
      });
    });
  } catch (e) {
    document.getElementById('triedList').innerHTML = `<div class="notice notice-error">${escapeHtml(e.message)}</div>`;
  }
}

document.addEventListener('DOMContentLoaded', loadDashboard);
