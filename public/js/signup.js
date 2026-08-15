document.addEventListener('DOMContentLoaded', () => {
  if (getUser()) window.location.href = '/dashboard.html';

  const form = document.getElementById('signupForm');
  const notice = document.getElementById('formNotice');
  const submitBtn = document.getElementById('submitBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    notice.innerHTML = '';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account…';

    try {
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const data = await apiFetch('/auth/signup', { method: 'POST', body: JSON.stringify({ name, email, password }) });
      setSession(data.token, data.user);

      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      window.location.href = redirect || '/dashboard.html';
    } catch (err) {
      notice.innerHTML = `<div class="notice notice-error">${escapeHtml(err.message)}</div>`;
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Account';
    }
  });
});
