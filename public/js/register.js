const form = document.getElementById('register-form');
const errorDiv = document.getElementById('register-error');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorDiv.classList.add('d-none');
  const passenger_name = form.passenger_name.value;
  const passenger_surname = form.passenger_surname.value;
  const email = form.email.value;
  const password = form.password.value;

  try {
    const basePath = window.BASE_PATH || '/';
    const res = await fetch(`${basePath}api/passengers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passenger_name, passenger_surname, email, password })
    });
    const data = await res.json();
    if (res.ok && data.passenger_id) {
      window.location.href = '/login';
    } else {
      errorDiv.textContent = data.error || 'Registration failed';
      errorDiv.classList.remove('d-none');
    }
  } catch (err) {
    errorDiv.textContent = 'Network error';
    errorDiv.classList.remove('d-none');
  }
});
