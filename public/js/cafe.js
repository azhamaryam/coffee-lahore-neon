const cafeId = new URLSearchParams(window.location.search).get('id');
let currentCafe = null;

function starPickerHtml(name, current) {
  let html = `<div class="star-picker" data-picker="${name}">`;
  for (let i = 1; i <= 5; i++) {
    html += `<button type="button" data-value="${i}" class="${i <= current ? 'active' : ''}">★</button>`;
  }
  html += `</div>`;
  return html;
}

function wirePicker(container, onPick) {
  const picker = container.querySelector('.star-picker');
  if (!picker) return;
  picker.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const value = Number(btn.dataset.value);
    [...picker.children].forEach((c, i) => c.classList.toggle('active', i < value));
    onPick(value);
  });
}

async function loadCafe() {
  if (!cafeId) {
    document.getElementById('cafeContent').innerHTML = `<div class="notice notice-error">No cafe was specified.</div>`;
    return;
  }
  try {
    const cafe = await apiFetch('/cafes/' + cafeId);
    currentCafe = cafe;
    document.title = cafe.name + ' — Coffee Lahore';
    renderCafe(cafe);
    renderBreakdown(cafe);
    renderDrinks(cafe.drinks);
    loadComments();
  } catch (e) {
    document.getElementById('cafeContent').innerHTML = `<div class="notice notice-error">${escapeHtml(e.message)}</div>`;
  }
}

function renderCafe(cafe) {
  const user = getUser();
  document.getElementById('cafeContent').innerHTML = `
    <div class="detail-hero">
      <div>
        <div class="card-area">${escapeHtml(cafe.area)}</div>
        <h1>${escapeHtml(cafe.name)}</h1>
        <p style="color:var(--cocoa-soft); max-width:60ch;">${escapeHtml(cafe.description || 'No description yet.')}</p>
        <div class="detail-media" style="margin-top:18px;">
          ${cafe.imageUrl ? `<img src="${escapeHtml(cafe.imageUrl)}" alt="${escapeHtml(cafe.name)}">` : `<span style="font-size:3rem;">☕</span>`}
        </div>
      </div>
      <div>
        <div class="rate-box">
          <div class="big-rating">${cafe.avgRating || '—'}</div>
          <div class="stars" style="color:var(--gold); font-size:1.2rem;">${starString(cafe.avgRating)}</div>
          <div class="rating-count" style="margin-bottom:16px;">${cafe.ratingCount} rating${cafe.ratingCount === 1 ? '' : 's'}</div>
          <div id="rateArea"></div>
          <div id="triedArea" style="margin-top:14px;"></div>
        </div>
      </div>
    </div>
  `;

  const rateArea = document.getElementById('rateArea');
  if (user) {
    rateArea.innerHTML = `
      <div class="field-hint" style="margin-bottom:10px; text-align:left;">Rate this cafe</div>
      ${CATEGORY_KEYS.map(k => `
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; text-align:left;">
          <span style="font-size:.82rem; font-weight:600;">${CATEGORY_LABELS[k]}</span>
          ${starPickerHtml('cat-' + k, 0)}
        </div>
      `).join('')}
      <div id="rateNotice"></div>
      <button class="btn btn-small btn-block" id="submitRatingBtn" style="margin-top:10px;">Submit Rating</button>
    `;

    const picks = {};
    CATEGORY_KEYS.forEach(k => {
      const picker = rateArea.querySelector(`[data-picker="cat-${k}"]`);
      picker.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const value = Number(btn.dataset.value);
        [...picker.children].forEach((c, i) => c.classList.toggle('active', i < value));
        picks[k] = value;
      });
    });

    document.getElementById('submitRatingBtn').addEventListener('click', async () => {
      const notice = document.getElementById('rateNotice');
      notice.innerHTML = '';
      const missing = CATEGORY_KEYS.filter(k => !picks[k]);
      if (missing.length) {
        notice.innerHTML = `<div class="notice notice-error">Please rate every category before submitting.</div>`;
        return;
      }
      try {
        await apiFetch(`/cafes/${cafe.id}/rate`, { method: 'POST', body: JSON.stringify(picks) });
        loadCafe();
      } catch (e) {
        notice.innerHTML = `<div class="notice notice-error">${escapeHtml(e.message)}</div>`;
      }
    });

    const triedArea = document.getElementById('triedArea');
    triedArea.innerHTML = `<button class="btn btn-gold btn-small btn-block" id="triedBtn">Mark as Tried</button>`;
    document.getElementById('triedBtn').addEventListener('click', async () => {
      try {
        await apiFetch(`/dashboard/tried/${cafe.id}`, { method: 'POST' });
        document.getElementById('triedBtn').textContent = '✓ Added to your dashboard';
        document.getElementById('triedBtn').disabled = true;
      } catch (e) { alert(e.message); }
    });
  } else {
    rateArea.innerHTML = `<div class="login-prompt"><a href="/login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}">Log in</a> to rate this cafe.</div>`;
  }
}

function renderBreakdown(cafe) {
  const filtersEl = document.getElementById('breakdownFilters');
  const displayEl = document.getElementById('breakdownDisplay');
  const options = [{ key: '', label: 'Overall' }, ...CATEGORY_KEYS.map(k => ({ key: k, label: CATEGORY_LABELS[k] }))];
  let active = '';

  function paint() {
    filtersEl.innerHTML = options.map(o =>
      `<button type="button" class="admin-tab ${o.key === active ? 'active' : ''}" data-cat="${o.key}">${o.label}</button>`
    ).join('');

    filtersEl.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => { active = btn.dataset.cat; paint(); });
    });

    const rows = active
      ? [{ label: CATEGORY_LABELS[active], value: cafe.categories[active] }]
      : [{ label: 'Overall', value: cafe.avgRating }, ...CATEGORY_KEYS.map(k => ({ label: CATEGORY_LABELS[k], value: cafe.categories[k] }))];

    displayEl.innerHTML = cafe.ratingCount
      ? rows.map(r => `
          <div class="tried-row" style="justify-content:flex-start; gap:20px;">
            <div style="min-width:140px; font-weight:700;">${escapeHtml(r.label)}</div>
            <span class="rating-pill"><span class="stars">${starString(r.value)}</span> ${r.value || '—'}</span>
            <span class="rating-count">${cafe.ratingCount} rating${cafe.ratingCount === 1 ? '' : 's'}</span>
          </div>
        `).join('')
      : `<div class="empty-state">No ratings yet — be the first to rate this cafe above.</div>`;
  }

  paint();
}

function renderDrinks(drinks) {
  const el = document.getElementById('drinksList');
  const user = getUser();
  if (!drinks.length) {
    el.innerHTML = `<div class="empty-state">No drinks have been added for this cafe yet.</div>`;
    return;
  }
  el.innerHTML = drinks.map(d => `
    <div class="drink-row">
      <div class="drink-info">
        <h4>${escapeHtml(d.name)}</h4>
        <p>${escapeHtml(d.description || '')}</p>
        <span class="rating-pill" style="margin-top:6px;"><span class="stars">${starString(d.avgRating)}</span> ${d.avgRating || '—'}</span>
        <span class="rating-count"> ${d.ratingCount} rating${d.ratingCount === 1 ? '' : 's'}</span>
      </div>
      <div style="text-align:right;">
        <div class="drink-price">${escapeHtml(d.price || '')}</div>
        <div class="drink-rate-slot" data-drink="${d.id}" style="margin-top:8px;"></div>
      </div>
    </div>
  `).join('');

  drinks.forEach(d => {
    const slot = el.querySelector(`.drink-rate-slot[data-drink="${d.id}"]`);
    if (user) {
      slot.innerHTML = starPickerHtml('drink-' + d.id, 0);
      wirePicker(slot, async (value) => {
        try {
          await apiFetch(`/drinks/${d.id}/rate`, { method: 'POST', body: JSON.stringify({ rating: value }) });
          loadCafe();
        } catch (e) { alert(e.message); }
      });
    } else {
      slot.innerHTML = `<a href="/login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}" style="font-size:.8rem; color:var(--clay); font-weight:600;">Log in to rate</a>`;
    }
  });
}

function renderCommentForm() {
  const el = document.getElementById('commentFormArea');
  const user = getUser();
  if (!user) {
    el.innerHTML = `<div class="login-prompt"><a href="/login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}">Log in or sign up</a> to share your experience.</div>`;
    return;
  }
  el.innerHTML = `
    <div class="form-card wide" style="max-width:none;">
      <label for="commentText">Share your experience (max 200 words)</label>
      <textarea id="commentText" placeholder="What did you order? How was the vibe and service?"></textarea>
      <div class="word-counter" id="wordCounter">0 / 200 words</div>
      <div id="commentNotice"></div>
      <button class="btn" id="postCommentBtn" style="margin-top:10px;">Post Review</button>
    </div>
  `;
  const textarea = document.getElementById('commentText');
  const counter = document.getElementById('wordCounter');

  function wc(str) { return str.trim().split(/\s+/).filter(Boolean).length; }

  textarea.addEventListener('input', () => {
    const n = wc(textarea.value);
    counter.textContent = `${n} / 200 words`;
    counter.classList.toggle('over', n > 200);
  });

  document.getElementById('postCommentBtn').addEventListener('click', async () => {
    const notice = document.getElementById('commentNotice');
    notice.innerHTML = '';
    const text = textarea.value.trim();
    if (!text) { notice.innerHTML = `<div class="notice notice-error">Please write something first.</div>`; return; }
    if (wc(text) > 200) { notice.innerHTML = `<div class="notice notice-error">Comments cannot be more than 200 words.</div>`; return; }
    try {
      await apiFetch(`/cafes/${cafeId}/comments`, { method: 'POST', body: JSON.stringify({ text }) });
      textarea.value = '';
      counter.textContent = '0 / 200 words';
      loadComments();
    } catch (e) {
      notice.innerHTML = `<div class="notice notice-error">${escapeHtml(e.message)}</div>`;
    }
  });
}

function commentHtml(c) {
  return `
    <div class="comment">
      <div class="comment-head">
        <div class="comment-avatar" style="${c.isCreator ? 'background:var(--clay); color:var(--cream);' : ''}">${escapeHtml(initials(c.userName))}</div>
        <div>
          <div class="comment-name">${escapeHtml(c.userName)}${c.isCreator ? ' <span class="rating-pill" style="margin-left:6px; padding:2px 8px; font-size:.7rem;">✦ Creator</span>' : ''}</div>
          <div class="comment-time">${timeAgo(c.createdAt)}</div>
        </div>
      </div>
      <div class="comment-text">${escapeHtml(c.text)}</div>
    </div>
  `;
}

async function loadComments() {
  const creatorEl = document.getElementById('creatorReviewsList');
  const communityEl = document.getElementById('commentsList');
  try {
    const comments = await apiFetch(`/cafes/${cafeId}/comments`);
    const creatorComments = comments.filter(c => c.isCreator);
    const communityComments = comments.filter(c => !c.isCreator);

    creatorEl.innerHTML = creatorComments.length
      ? creatorComments.map(commentHtml).join('')
      : `<div class="empty-state">No creator reviews for this cafe yet.</div>`;

    communityEl.innerHTML = communityComments.length
      ? communityComments.map(commentHtml).join('')
      : `<div class="empty-state">No community reviews yet — be the first to share your experience.</div>`;
  } catch (e) {
    communityEl.innerHTML = `<div class="notice notice-error">${escapeHtml(e.message)}</div>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadCafe();
  renderCommentForm();
});
