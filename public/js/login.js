const form = document.getElementById('login-form');
const errorDiv = document.getElementById('login-error');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorDiv.classList.add('d-none');
  const email = form.email.value;
  const password = form.password.value;

  try {
    const basePath = window.BASE_PATH || '/';
    const res = await fetch(`${basePath}api/passengers/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      window.location.href = '/';
    } else {
      errorDiv.textContent = data.error || 'Login failed';
      errorDiv.classList.remove('d-none');
    }
  } catch (err) {
    errorDiv.textContent = 'Network error';
    errorDiv.classList.remove('d-none');
  }
});
