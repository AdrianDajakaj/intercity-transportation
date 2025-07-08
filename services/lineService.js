/**
 * Service for initializing line data in the database
 */

/**
 * Array of lines to be inserted into the database
 * Format: [line_code, direction, line_name]
 */
const linesData = [
  ['N3', 'out', 'Polańczyk - WROCŁAW'],
  ['N3', 'back', 'WROCŁAW - Polańczyk'],
  ['N1', 'out', 'Polańczyk - WARSZAWA'],
  ['N1', 'back', 'WARSZAWA - Polańczyk']
];

/**
 * Initializes lines in the database if they don't exist
 * @param {Object} db - Database connection object
 * @returns {Promise<void>}
 */
async function initializeLines(db) {
  try {
    const [lineRows] = await db.query('SELECT COUNT(*) as count FROM line');
    
    if (lineRows[0].count === 0) {
      await db.query(
        'INSERT INTO line (line_code, direction, line_name) VALUES ?',
        [linesData]
      );
      console.log('Lines inserted into line table.');
    } else {
      console.log('Lines table already populated, skipping initialization.');
    }
  } catch (error) {
    console.error('Error initializing lines:', error);
    throw error;
  }
}

module.exports = {
  initializeLines,
  linesData
};
