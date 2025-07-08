
document.addEventListener('DOMContentLoaded', function() {
    const lineCodeSelect = document.getElementById('line_code');
    const fromSelect = document.getElementById('departure_from');
    const toSelect = document.getElementById('departure_to');
    let stopsCache = {};

    function parseLineCodeAndDirection(value) {
        console.log('Parsing value:', value);
        const idx = value.lastIndexOf('_');
        const lineCode = value.substring(0, idx);
        const direction = value.substring(idx + 1);
        console.log('Parsed lineCode:', lineCode, 'direction:', direction);
        return [lineCode, direction];
    }

    async function fetchStops(lineCode, direction) {
        const res = await fetch(`api/lines/${lineCode}/${direction}/stops`);
        return await res.json();
    }

    function populateFromStops(stops) {
        console.log('populateFromStops called with:', stops);
        fromSelect.innerHTML = '';
        if (!stops || stops.length === 0) {
            console.log('No stops to populate');
            return;
        }
        stops.forEach(stop => {
            console.log('Adding stop:', stop);
            const opt = document.createElement('option');
            opt.value = stop.line_stop_id;
            opt.textContent = stop.stop_name;
            opt.dataset.sequence = stop.sequence;
            fromSelect.appendChild(opt);
        });
        console.log('Populated', stops.length, 'stops');
        fromSelect.dispatchEvent(new Event('change'));
    }

    function populateToStops(stops, fromSeq) {
        toSelect.innerHTML = '';
        stops.filter(stop => stop.sequence > fromSeq).forEach(stop => {
            const opt = document.createElement('option');
            opt.value = stop.line_stop_id;
            opt.textContent = stop.stop_name;
            toSelect.appendChild(opt);
        });
    }

    async function updateStops() {
        console.log('updateStops called, lineCodeSelect.value:', lineCodeSelect.value);
        const [lineCode, direction] = parseLineCodeAndDirection(lineCodeSelect.value);
        const cacheKey = `${lineCode}_${direction}`;
        console.log('Cache key:', cacheKey);
        if (!stopsCache[cacheKey]) {
            console.log('Cache miss, fetching stops...');
            const stops = await fetchStops(lineCode, direction);
            stopsCache[cacheKey] = stops;
        } else {
            console.log('Cache hit, using cached stops');
        }
        console.log('Populating from stops with:', stopsCache[cacheKey]);
        populateFromStops(stopsCache[cacheKey]);
    }

    lineCodeSelect.addEventListener('change', function() {
        console.log('Line selection changed to:', lineCodeSelect.value);
        updateStops();
    });

    fromSelect.addEventListener('change', function() {
        const [lineCode, direction] = parseLineCodeAndDirection(lineCodeSelect.value);
        const cacheKey = `${lineCode}_${direction}`;
        const stops = stopsCache[cacheKey] || [];
        const fromSeq = parseInt(fromSelect.selectedOptions[0].dataset.sequence);
        populateToStops(stops, fromSeq);
    });

    updateStops();
});
