/**
 * Service for initializing address data in the database
 */

/**
 * Array of addresses to be inserted into the database
 */
const addressesData = [
  ['Polska', 'Babica', '38-120', 'Kolonia', '10', null],
  ['Polska', 'Medyka', '37-730', 'Granica', '14', null],
  ['Polska', 'Blizne', '36-221', 'Ośrodek Zdrowia', '5', null],
  ['Polska', 'Miejsce Piastowe', '38-440', 'Dworcowa', '1', null],
  ['Polska', 'Boguchwała', '36-040', 'Grunwaldzka', '1', null],
  ['Polska', 'Mielec', '39-300', 'Jagiellończyka', '12', null],
  ['Polska', 'Brzozów', '36-200', 'Plac Grunwaldzki', '4', null],
  ['Polska', 'Niebylec', '38-114', 'Rynek', '3', null],
  ['Polska', 'Busko-Zdrój', '28-100', 'Waryńskiego', '29', null],
  ['Polska', 'Nisko', '37-400', 'Kolejowa', '3', null],
  ['Polska', 'Dąbrowa Tarnowska', '33-200', 'Berka Joselewicza', '7', null],
  ['Polska', 'Nowa Dęba', '39-460', 'Centrum', '3', null],
  ['Polska', 'Dębica', '39-200', 'Głowackiego', '22', null],
  ['Polska', 'Opatów', '27-500', 'Sienkiewicza', '1', null],
  ['Polska', 'Domaradz', '38-420', 'Dworcowa', '15', null],
  ['Polska', 'Ostrowiec Świętokrzyski', '27-400', 'Żabia', '8', null],
  ['Polska', 'Gliwice', '44-100', 'Składowa', '8a', null],
  ['Polska', 'Piotrków Trybunalski', '97-300', 'P.O.W.', '12', null],
  ['Polska', 'Grabownica', '36-250', 'Skrzyżowanie', '1', null],
  ['Polska', 'Polańczyk', '38-610', 'Zdrojowa', '12', null],
  ['Polska', 'Humniska', '38-230', 'Środkowa', '6', null],
  ['Polska', 'Połaniec', '28-230', 'Czarnieckiego', '1', null],
  ['Polska', 'Iłża', '27-300', 'Podzamcze', '33', null],
  ['Polska', 'Przemyśl', '37-700', 'Czarnieckiego', '4', null],
  ['Polska', 'Iwonicz-Zdrój', '38-440', 'Plac Oczki', '1', null],
  ['Polska', 'Radom', '26-600', 'Warszawska', '10', null],
  ['Polska', 'Janów Lubelski', '23-300', 'Sukiennicza', '40', null],
  ['Polska', 'Rymanów', '38-480', 'Rynek', '1', null],
  ['Polska', 'Jarosław', '37-500', 'Pruchnicka', '5', null],
  ['Polska', 'Rymanów-Zdrój', '38-480', 'Poczekalnia', '1', null],
  ['Polska', 'Jarosław', '37-500', 'Poniatowskiego', '10', null],
  ['Polska', 'Rzeszów', '35-001', 'Grottgera', '3', null],
  ['Polska', 'Jasionka', '36-002', 'Port Lotniczy', '1', null],
  ['Polska', 'Sanok', '38-500', 'Krakowska', '15', null],
  ['Polska', 'Katowice', '40-001', 'Sądowa', '5', null],
  ['Polska', 'Sokołów Małopolski', '36-050', 'Rynek', '2', null],
  ['Polska', 'Kielce', '25-001', 'Czarnowska', '12', null],
  ['Polska', 'Solina', '38-610', 'Osiedle', '4', null],
  ['Polska', 'Kolbuszowa', '36-100', 'Ks. Ruczki', '8', null],
  ['Polska', 'Stalowa Wola', '37-450', 'Okulickiego', '3', null],
  ['Polska', 'Kraków', '31-001', 'Airport', '1', null],
  ['Polska', 'Stara Wieś', '38-200', 'Kościelna', '7', null],
  ['Polska', 'Kraków', '31-001', 'Bosacka', '18', null],
  ['Polska', 'Staszów', '28-200', 'Rynek', '2', null],
  ['Polska', 'Kraśnik', '23-200', 'Mostowa', '5', null],
  ['Polska', 'Tarnobrzeg', '39-400', 'Mickiewicza', '10', null],
  ['Polska', 'Krosno', '38-400', 'Naftowa', '2', null],
  ['Polska', 'Warszawa', '00-001', 'Port Lotniczy', '1', null],
  ['Polska', 'Lesko', '38-600', 'Piłsudskiego', '50', null],
  ['Polska', 'Warszawa', '01-001', 'Zachodnia', '2', null],
  ['Polska', 'Lublin', '20-001', 'Dworcowa', '2', null],
  ['Polska', 'Wrocław', '50-001', 'Sucha', '1', null],
  ['Polska', 'Lutcza', '38-610', 'Skrzyżowanie', '3', null],
  ['Polska', 'Zagórz', '38-610', 'Osiedle', '1', null],
  ['Polska', 'Łoniów', '27-600', 'Rondo', '1', null],
  ['Polska', 'Żarnów', '26-400', 'Plac Piłsudskiego', '3', null],
  ['Polska', 'Łódź', '90-001', 'Plac Sałacińskiego', '1', null]
];

/**
 * Initializes addresses in the database if they don't exist
 * @param {Object} db - Database connection object
 * @returns {Promise<void>}
 */
async function initializeAddresses(db) {
  try {
    const [addressRows] = await db.query('SELECT COUNT(*) as count FROM address');
    
    if (addressRows[0].count === 0) {
      await db.query(
        'INSERT INTO address (country, city, postal_code, street, house_number, apartment) VALUES ?',
        [addressesData]
      );
      console.log('Addresses inserted into address table.');
    } else {
      console.log('Addresses table already populated, skipping initialization.');
    }
  } catch (error) {
    console.error('Error initializing addresses:', error);
    throw error;
  }
}

module.exports = {
  initializeAddresses,
  addressesData
};
