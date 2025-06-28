document.addEventListener('DOMContentLoaded', function() {
  console.log('Logout script loaded');
  const logoutLink = document.getElementById('logout-link');
  console.log('Logout link found:', logoutLink);
  if (logoutLink) {
    logoutLink.addEventListener('click', async function(e) {
      e.preventDefault();
      console.log('Logout clicked');
      try {
        const basePath = window.BASE_PATH || '/';
        console.log('Base path:', basePath);
        const response = await fetch(`${basePath}api/passengers/logout`, { method: 'POST' });
        console.log('Logout response:', response);
        if (response.ok) {
          console.log('Logout successful, reloading...');
          window.location.reload();
        } else {
          console.error('Logout failed:', response.status);
        }
      } catch (error) {
        console.error('Logout error:', error);
      }
    });
  }
});
