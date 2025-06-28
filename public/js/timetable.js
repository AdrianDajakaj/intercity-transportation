// Timetable tile selection logic
document.addEventListener('DOMContentLoaded', function() {
  // Parse departures from script tag FIRST
  const script = document.getElementById('departures-data');
  if (script) {
    try {
      console.log('Raw script content:', script.textContent);
      window.departures = JSON.parse(script.textContent);
      console.log('Parsed departures from script:', window.departures);
    } catch (e) {
      console.error('Error parsing departures JSON:', e);
      console.error('Script content that failed to parse:', script.textContent);
      window.departures = [];
    }
  } else {
    console.log('No departures-data script found');
    window.departures = [];
  }

  const tiles = document.querySelectorAll('.departure-tile');
  const bookBtn = document.getElementById('book-btn');
  let selectedTile = null;

  // Ensure the book button is disabled by default on page load
  if (bookBtn) bookBtn.disabled = true;

  let selectedTileIdx = null;

  // Add click listeners to tiles
  tiles.forEach((tile, idx) => {
    tile.addEventListener('click', function() {
      if (selectedTile) {
        selectedTile.classList.remove('selected');
      }
      if (selectedTile === this) {
        selectedTile = null;
        selectedTileIdx = null;
        if (bookBtn) bookBtn.disabled = true;
        return;
      }
      selectedTile = this;
      selectedTileIdx = idx;
      this.classList.add('selected');
      if (bookBtn) bookBtn.disabled = false;
    });
  });

  // Booking logic
  if (bookBtn) {
    bookBtn.addEventListener('click', async function() {
      if (selectedTileIdx === null) return;
      const tile = tiles[selectedTileIdx];
      const dep = window.departures && window.departures[selectedTileIdx];
      if (!dep) return alert('Nie można pobrać danych połączenia.');
      // Get selected discount from UI (if present)
      let selectedDiscountId = null;
      const discountSelect = document.getElementById('discount-select');
      if (discountSelect) {
        selectedDiscountId = discountSelect.value || null;
        if (selectedDiscountId === '' || selectedDiscountId === 'null' || selectedDiscountId === '0') selectedDiscountId = null;
      } else if (typeof dep.discount_id !== 'undefined') {
        // fallback: use discount_id from departures only if set by user, not pre-discounted
        selectedDiscountId = dep.discount_id || null;
      }
      // Prepare booking payload
      const payload = {
        trip_id: dep.trip_id,
        start_line_stop_id: dep.start_line_stop_id,
        end_line_stop_id: dep.end_line_stop_id,
        discount_id: selectedDiscountId,
        // seat_number and deck will be assigned by backend if not provided
      };
      // Debug: log payload
      console.log('Booking payload:', payload);
      // POST to /api/bookings
      try {
        const res = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
          alert('Rezerwacja udana!');
          window.location.reload();
        } else {
          alert('Błąd rezerwacji: ' + (data.error || 'Nieznany błąd.'));
        }
      } catch (e) {
        alert('Błąd połączenia z serwerem.');
      }
    });
  }
});
