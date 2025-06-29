const form = document.getElementById('login-form');
const errorDiv = document.getElementById('login-error');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorDiv.classList.add('d-none');
  const email = form.email.value;
  const password = form.password.value;

  try {
    const basePath = window.BASE_PATH || '/';
    const apiUrl = `${basePath}api/passengers/login`;
    console.log('Attempting login to:', apiUrl);
    
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    console.log('Response received:', res.status, res.statusText);
    
    if (!res.ok) {
      console.log('Response not OK, status:', res.status);
    }
    
    const data = await res.json();
    console.log('Response data:', data);
    
    if (res.ok && data.success) {
      window.location.href = '/';
    } else {
      errorDiv.textContent = data.error || 'Login failed';
      errorDiv.classList.remove('d-none');
    }
  } catch (err) {
    console.error('Login error:', err);
    console.error('Error type:', err.name);
    console.error('Error message:', err.message);
    errorDiv.textContent = 'Network error: ' + (err.message || 'Connection failed');
    errorDiv.classList.remove('d-none');
  }
});
