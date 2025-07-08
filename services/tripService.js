
const tripTemplate = [
  [1, 1, 1],
  [1, 2, 2],
  [1, 3, 3],
  [1, 4, 4],
  [2, 1, 1],
  [2, 2, 2],
  [2, 3, 3],
  [2, 4, 4],
  [3, 1, 5],
  [3, 2, 6],
  [3, 3, 7],
  [3, 4, 8],
  [4, 1, 5],
  [4, 2, 6],
  [4, 3, 7],
  [4, 4, 8],
];

/**
 * Generate trips from start date to end date using the trip template
 * @param {Date} startDate - Start date for trip generation
 * @param {Date} endDate - End date for trip generation
 * @returns {Array} Array of trip data [line_id, trip_date, run_number, bus_id]
 */
function generateTrips(startDate, endDate) {
  const trips = [];
  const currentDate = new Date(startDate);
  
  // eslint-disable-next-line no-unmodified-loop-condition
  while (currentDate <= endDate) {
    const dateString = currentDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    // Add all trips for this date using the template
    tripTemplate.forEach(([lineId, runNumber, busId]) => {
      trips.push([lineId, dateString, runNumber, busId]);
    });
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return trips;
}

// Generate trips from today (July 8, 2025) to end of September 2025
const startDate = new Date('2025-07-08');
const endDate = new Date('2025-09-30');
const trips = generateTrips(startDate, endDate);

/**
 * Initialize trips in the database
 * @param {Object} db - Database connection object
 */
async function initializeTrips(db) {
  const [tripRows] = await db.query('SELECT COUNT(*) as count FROM trip');
  if (tripRows[0].count === 0) {
    await db.query(
      'INSERT INTO trip (line_id, trip_date, run_number, bus_id) VALUES ?',
      [trips]
    );
    console.log(`Trips inserted into trip table. Generated ${trips.length} trips from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}.`);
  }
}

module.exports = {
  initializeTrips,
  generateTrips
};
