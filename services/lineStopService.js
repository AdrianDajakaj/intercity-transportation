/**
 * Service for initializing line stop data in the database
 */

/**
 * Line stops data for line 1 (N3 out: Polańczyk - WROCŁAW)
 * Format: [line_id, stop_id, sequence]
 */
const lineStops1 = [
  [1, 20, 1],   // POLAŃCZYK
  [1, 34, 2],   // SANOK
  [1, 7, 3],    // BRZOZÓW
  [1, 15, 4],   // DOMARADZ
  [1, 4, 5],    // MIEJSCE PIASTOWE
  [1, 47, 6],   // KROSNO
  [1, 53, 7],   // LUTCZA
  [1, 8, 8],    // NIEBYLEC (HUB)
  [1, 5, 9],    // BOGUCHWAŁA
  [1, 32, 10],  // RZESZÓW
  [1, 43, 11],  // KRAKÓW MDA
  [1, 41, 12],  // KRAKÓW AIRPORT
  [1, 35, 13],  // KATOWICE
  [1, 17, 14],  // GLIWICE
  [1, 52, 15]   // WROCŁAW
];

/**
 * Line stops data for line 2 (N3 back: WROCŁAW - Polańczyk)
 * Format: [line_id, stop_id, sequence]
 */
const lineStops2 = [
  [2, 52, 1],   // WROCŁAW
  [2, 17, 2],   // GLIWICE
  [2, 35, 3],   // KATOWICE
  [2, 41, 4],   // KRAKÓW AIRPORT
  [2, 43, 5],   // KRAKÓW MDA
  [2, 32, 6],   // RZESZÓW
  [2, 5, 7],    // BOGUCHWAŁA
  [2, 8, 8],    // NIEBYLEC (HUB)
  [2, 53, 9],   // LUTCZA
  [2, 47, 10],  // KROSNO
  [2, 4, 11],   // MIEJSCE PIASTOWE
  [2, 15, 12],  // DOMARADZ
  [2, 7, 13],   // BRZOZÓW
  [2, 34, 14],  // SANOK
  [2, 20, 15]   // POLAŃCZYK
];

/**
 * Line stops data for line 3 (N1 out: Polańczyk - WARSZAWA)
 * Format: [line_id, stop_id, sequence]
 */
const lineStops3 = [
  [3, 8, 1],   // NIEBYLEC (HUB)
  [3, 5, 2],   // BOGUCHWAŁA
  [3, 32, 3],  // RZESZÓW
  [3, 39, 4],  // KOLBUSZOWA
  [3, 12, 5],  // NOWA DĘBA
  [3, 55, 6],  // ŁONIÓW
  [3, 14, 7],  // OPATÓW
  [3, 16, 8],  // OSTROWIEC Św.
  [3, 23, 9],  // IŁŻA D.A.
  [3, 26, 10], // RADOM (Słowackiego/Warszawska)
  [3, 48, 11], // WARSZAWA Port Lotniczy
  [3, 50, 12]  // WARSZAWA Zachodnia
];

/**
 * Line stops data for line 4 (N1 back: WARSZAWA - Polańczyk)
 * Format: [line_id, stop_id, sequence]
 */
const lineStops4 = [
  [4, 50, 1],   // WARSZAWA Zachodnia
  [4, 48, 2],   // WARSZAWA Port Lotniczy
  [4, 26, 3],   // RADOM (Słowackiego/Warszawska)
  [4, 23, 4],   // IŁŻA D.A.
  [4, 16, 5],   // OSTROWIEC Św.
  [4, 14, 6],   // OPATÓW
  [4, 55, 7],   // ŁONIÓW
  [4, 12, 8],   // NOWA DĘBA
  [4, 39, 9],   // KOLBUSZOWA
  [4, 32, 10],  // RZESZÓW
  [4, 5, 11],   // BOGUCHWAŁA
  [4, 8, 12]    // NIEBYLEC (HUB)
];

/**
 * All line stops data combined
 */
const allLineStopsData = [
  ...lineStops1,
  ...lineStops2,
  ...lineStops3,
  ...lineStops4
];

/**
 * Initializes line stops in the database if they don't exist
 * @param {Object} db - Database connection object
 * @returns {Promise<void>}
 */
async function initializeLineStops(db) {
  try {
    const [lineStopRows] = await db.query('SELECT COUNT(*) as count FROM line_stop');
    
    if (lineStopRows[0].count === 0) {
      // Insert line stops for each line separately for better organization
      await db.query(
        'INSERT INTO line_stop (line_id, stop_id, sequence) VALUES ?',
        [lineStops1]
      );
      await db.query(
        'INSERT INTO line_stop (line_id, stop_id, sequence) VALUES ?',
        [lineStops2]
      );
      await db.query(
        'INSERT INTO line_stop (line_id, stop_id, sequence) VALUES ?',
        [lineStops3]
      );
      await db.query(
        'INSERT INTO line_stop (line_id, stop_id, sequence) VALUES ?',
        [lineStops4]
      );
      console.log('Line stops inserted into line_stop table.');
    } else {
      console.log('Line stops table already populated, skipping initialization.');
    }
  } catch (error) {
    console.error('Error initializing line stops:', error);
    throw error;
  }
}

module.exports = {
  initializeLineStops,
  lineStops1,
  lineStops2,
  lineStops3,
  lineStops4,
  allLineStopsData
};
