document.addEventListener('DOMContentLoaded', function() {
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

  if (bookBtn) bookBtn.disabled = true;

  let selectedTileIdx = null;

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

  if (bookBtn) {
    bookBtn.addEventListener('click', async function() {
      if (selectedTileIdx === null) return;
      const tile = tiles[selectedTileIdx];
      const dep = window.departures && window.departures[selectedTileIdx];
      if (!dep) return alert('Nie można pobrać danych połączenia.');
      let selectedDiscountId = null;
      const discountSelect = document.getElementById('discount-select');
      if (discountSelect) {
        selectedDiscountId = discountSelect.value || null;
        if (selectedDiscountId === '' || selectedDiscountId === 'null' || selectedDiscountId === '0') selectedDiscountId = null;
      } else if (typeof dep.discount_id !== 'undefined') {
        selectedDiscountId = dep.discount_id || null;
      }
      const payload = {
        trip_id: dep.trip_id,
        start_line_stop_id: dep.start_line_stop_id,
        end_line_stop_id: dep.end_line_stop_id,
        discount_id: selectedDiscountId,
      };
      console.log('Booking payload:', payload);
      try {
        const basePath = window.BASE_PATH || '/';
        const res = await fetch(`api/bookings`, {
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
