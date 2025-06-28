
document.addEventListener('DOMContentLoaded', function() {
    const lineCodeSelect = document.getElementById('line_code');
    const fromSelect = document.getElementById('departure_from');
    const toSelect = document.getElementById('departure_to');
    let stopsCache = {};

    function parseLineCodeAndDirection(value) {
        const idx = value.lastIndexOf('_');
        return [value.substring(0, idx), value.substring(idx + 1)];
    }

    async function fetchStops(lineCode, direction) {
        const basePath = window.BASE_PATH || '/';
        const res = await fetch(`${basePath}api/lines/${lineCode}/${direction}/stops`);
        return await res.json();
    }

    function populateFromStops(stops) {
        fromSelect.innerHTML = '';
        stops.forEach(stop => {
            const opt = document.createElement('option');
            opt.value = stop.line_stop_id;
            opt.textContent = stop.stop_name;
            opt.dataset.sequence = stop.sequence;
            fromSelect.appendChild(opt);
        });
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
        const [lineCode, direction] = parseLineCodeAndDirection(lineCodeSelect.value);
        const cacheKey = `${lineCode}_${direction}`;
        if (!stopsCache[cacheKey]) {
            const stops = await fetchStops(lineCode, direction);
            stopsCache[cacheKey] = stops;
        }
        populateFromStops(stopsCache[cacheKey]);
    }

    lineCodeSelect.addEventListener('change', updateStops);

    fromSelect.addEventListener('change', function() {
        const [lineCode, direction] = parseLineCodeAndDirection(lineCodeSelect.value);
        const cacheKey = `${lineCode}_${direction}`;
        const stops = stopsCache[cacheKey] || [];
        const fromSeq = parseInt(fromSelect.selectedOptions[0].dataset.sequence);
        populateToStops(stops, fromSeq);
    });

    updateStops();
});
