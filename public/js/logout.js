document.addEventListener('DOMContentLoaded', function() {
  console.log('Logout script loaded');
  const logoutLink = document.getElementById('logout-link');
  console.log('Logout link found:', logoutLink);
  if (logoutLink) {
    logoutLink.addEventListener('click', async function(e) {
      e.preventDefault();
      console.log('Logout clicked');
      try {
        const response = await fetch(`api/passengers/logout`, { method: 'POST' });
        if (response.ok) {
		const basePath = window.location.pathname.split('/').slice(0, 2).join('/') + '/';
          window.location.href = basePath;
        } else {
          console.error('Logout failed:', response.status);
        }
      } catch (error) {
        console.error('Logout error:', error);
      }
    });
  }
});
