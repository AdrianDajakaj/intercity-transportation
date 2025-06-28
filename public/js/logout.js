document.addEventListener('DOMContentLoaded', function() {
  const logoutLink = document.getElementById('logout-link');
  if (logoutLink) {
    logoutLink.addEventListener('click', async function(e) {
      e.preventDefault();
      await fetch('/api/passengers/logout', { method: 'POST' });
      window.location.reload();
    });
  }
});
