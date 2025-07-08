/**
 * Service for initializing bus data in the database
 */

/**
 * Array of buses to be inserted into the database
 * Format: [registration_number, brand, model, production_year, seats_upper, seats_lower]
 */
const busesData = [
  ['RZ12345', 'Irizar', 'i6s Efficiency', 2024, 71, null],
  ['RZ22345', 'Irizar', 'i6s Efficiency', 2024, 71, null],
  ['RZ32345', 'Irizar', 'i6s Efficiency', 2024, 71, null],
  ['RZ42345', 'Irizar', 'i6s Efficiency', 2023, 71, null],
  ['RZ52345', 'Irizar', 'i6s Efficiency', 2023, 71, null],
  ['RZ62345', 'Irizar', 'i6s', 2021, 71, null],
  ['RZ72345', 'Irizar', 'i6s', 2021, 71, null],
  ['RZ82345', 'Irizar', 'i6s', 2021, 71, null],
  ['RZ92345', 'Irizar', 'i6s', 2021, 71, null],
  ['RZ67890', 'VDL', 'Futura FDD2', 2021, 75, 21],
  ['RZ67891', 'VDL', 'Futura FDD2', 2021, 75, 21],
  ['RZ67892', 'VDL', 'Futura FDD2', 2021, 75, 21],
  ['RZ67893', 'VDL', 'Futura FDD2', 2021, 75, 21],
  ['RZ67894', 'VDL', 'Futura FDD2', 2021, 75, 21],
  ['KR34567', 'MAN', "Lion's Coach", 2022, 61, null],
  ['KR34568', 'MAN', "Lion's Coach", 2022, 61, null],
  ['RZ67895', 'VDL', 'Futura FHD2', 2020, 53, null],
  ['RZ67896', 'VDL', 'Futura FHD2', 2020, 53, null],
  ['RZ00001', 'Mercedes-Benz', 'Sprinter 519', 2025, 24, null],
  ['RZ00002', 'Mercedes-Benz', 'Sprinter 519', 2025, 24, null],
  ['RZ00003', 'Mercedes-Benz', 'Sprinter 519', 2025, 24, null]
];

/**
 * Initializes buses in the database if they don't exist
 * @param {Object} db - Database connection object
 * @returns {Promise<void>}
 */
async function initializeBuses(db) {
  try {
    const [busRows] = await db.query('SELECT COUNT(*) as count FROM bus');
    
    if (busRows[0].count === 0) {
      await db.query(
        'INSERT INTO bus (registration_number, brand, model, production_year, seats_upper, seats_lower) VALUES ?',
        [busesData]
      );
      console.log('Buses inserted into bus table.');
    } else {
      console.log('Buses table already populated, skipping initialization.');
    }
  } catch (error) {
    console.error('Error initializing buses:', error);
    throw error;
  }
}

module.exports = {
  initializeBuses,
  busesData
};
