const API_BASE = '/api';

// Cafe rating categories, shared across the homepage, cafe pages, and admin panel.
const CATEGORY_LABELS = { ambiance: 'Ambiance', service: 'Service', food: 'Food', drinks: 'Drinks & Taste' };
const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS);

function getToken() { return localStorage.getItem('cl_token'); }
function getUser() {
  const u = localStorage.getItem('cl_user');
  return u ? JSON.parse(u) : null;
}
function setSession(token, user) {
  localStorage.setItem('cl_token', token);
  localStorage.setItem('cl_user', JSON.stringify(user));
}
function clearSession() {
  localStorage.removeItem('cl_token');
  localStorage.removeItem('cl_user');
}

async function apiFetch(path, options = {}) {
  const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(API_BASE + path, Object.assign({}, options, { headers }));
  let data = {};
  try { data = await res.json(); } catch (e) { /* no body */ }
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function starString(rating) {
  const full = Math.round(rating || 0);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  const days = Math.floor(hrs / 24);
  if (days < 30) return days + 'd ago';
  return new Date(dateStr).toLocaleDateString();
}

function initials(name) {
  return (name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

function renderNav() {
  const nav = document.getElementById('nav-auth');
  if (!nav) return;
  const user = getUser();
  if (user) {
    nav.innerHTML = `
      <a href="/dashboard.html">My Dashboard</a>
      ${user.isAdmin ? '<a href="/admin.html">Admin</a>' : ''}
      <span class="nav-username">Hi, ${escapeHtml(user.name.split(' ')[0])}${user.isCreator ? ' <span class="rating-pill" style="padding:2px 8px; font-size:.68rem; vertical-align:middle;">✦ Creator</span>' : ''}</span>
      <button id="logoutBtn" class="btn btn-outline btn-small">Log out</button>
    `;
    document.getElementById('logoutBtn').addEventListener('click', () => {
      clearSession();
      window.location.href = '/index.html';
    });
  } else {
    nav.innerHTML = `
      <a href="/login.html">Log in</a>
      <a href="/signup.html" class="btn btn-small">Sign up</a>
    `;
  }
}

// Redirects to login if not signed in, preserving where the user was headed.
function requireLoginOrRedirect() {
  const user = getUser();
  if (!user) {
    window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
    return null;
  }
  return user;
}

document.addEventListener('DOMContentLoaded', renderNav);
