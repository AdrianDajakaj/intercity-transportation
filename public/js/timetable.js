// Timetable tile selection logic
const tiles = document.querySelectorAll('.departure-tile');
const bookBtn = document.getElementById('book-btn');
let selectedTile = null;

// Ensure the book button is disabled by default on page load
if (bookBtn) bookBtn.disabled = true;

tiles.forEach(tile => {
  tile.addEventListener('click', function() {
    if (selectedTile) {
      selectedTile.classList.remove('selected');
    }
    if (selectedTile === this) {
      selectedTile = null;
      if (bookBtn) bookBtn.disabled = true;
      return;
    }
    selectedTile = this;
    this.classList.add('selected');
    if (bookBtn) bookBtn.disabled = false;
  });
});
