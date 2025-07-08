/**
 * Service for initializing bus stop data in the database
 */

/**
 * Array of bus stops to be inserted into the database
 * Format: [stop_name, address_id, is_hub]
 */
const busStopsData = [
  ['BABICA - Kolonia', 1, false],
  ['MEDYKA Granica 14', 2, false],
  ['BLIZNE – Ośrodek Zdrowia', 3, false],
  ['MIEJSCE PIASTOWE - przystanek autobusowy (za rondem w stronę Krosna)', 4, false],
  ['BOGUCHWAŁA – ODR Grunwald 01', 5, false],
  ['MIELEC – Dw. Aut. PKS ul. Jagiellończyka', 6, false],
  ['BRZOZÓW – Dworzec PKS Plac Grunwaldzki 01', 7, false],
  ['NIEBYLEC – HUB', 8, true],
  ['BUSKO ZDRÓJ – MDA (Miejski Dw. Aut.) ul. Waryńskiego 29', 9, false],
  ['NISKO - ul. Kolejowa/Dworcowa 03/01 NOWOŚĆ!!!', 10, false],
  ['DĄBROWA TARNOWSKA - ul. Berka Joselewicza', 11, false],
  ['NOWA DĘBA - Centrum, przystanek dworcowy 03', 12, false],
  ['DĘBICA - Głowackiego Poczta 01', 13, false],
  ['OPATÓW – Dworzec Autobusowy, ul. Sienkiewicza', 14, false],
  ['DOMARADZ - przystanek autobusowy', 15, false],
  ['OSTROWIEC Św. – Dworzec PKS, ul. Żabia', 16, false],
  ['GLIWICE - Centrum Przesiadkowe ul. Składowa 8a stan. nr 23', 17, false],
  ['PIOTRKÓW TRYB. – Dw. Aut. ul. P.O.W. 12', 18, false],
  ['GRABOWNICA - skrzyżowanie', 19, false],
  ['POLAŃCZYK – ul. Zdrojowa, skrzyżowanie', 20, false],
  ['HUMNISKA - środek', 21, false],
  ['POŁANIEC – D.A. (Gal. Połaniecka) ul. Czarnieckiego 1', 22, false],
  ['IŁŻA D.A ul. Podzamcze 33', 23, false],
  ['PRZEMYŚL – Dw. Aut. PKS ul. Czarnieckiego 4', 24, false],
  ['IWONICZ ZDRÓJ – Plac Oczki 01', 25, false],
  ['RADOM – Warszawska/Rondo, Słowackiego/Idalińska', 26, false],
  ['JANÓW LUBELSKI - Dworzec Autobusowy ul. Sukiennicza 40 NOWOŚĆ!!!', 27, false],
  ['RYMANÓW - Rynek', 28, false],
  ['JAROSŁAW – D.A. ul. Pruchnicka - do 30.11.2024 r.', 29, false],
  ['RYMANÓW ZDRÓJ – Góra, Poczekalnia PKS', 30, false],
  ['JAROSŁAW Centrum Przesiadkowe ul. Poniatowskiego - Dworzec PKP - od 1.12.2024 r. NOWOŚĆ!!!', 31, false],
  ['RZESZÓW – Dw. Aut. PKS ul. Grottgera', 32, false],
  ['JASIONKA - Port Lotniczy Rzeszów - Jasionka NOWOŚĆ!!!', 33, false],
  ['SANOK – ul. Krakowska (Dąbrówka), ul. Dmowskiego/Staszica (ALFA), ul. Lipińskiego (Dworzec Autobusowy), ul. Rymanowska', 34, false],
  ['KATOWICE – Dw. Autobusowy ul. Sądowa 5', 35, false],
  ['SOKOŁÓW MŁP. - Rynek 02 NOWOŚĆ!!!', 36, false],
  ['KIELCE Dworzec Autobusowy ul. Czarnowska 12', 37, false],
  ['SOLINA - osiedle', 38, false],
  ['KOLBUSZOWA - Dw. Aut. PKS ul. Ks. Ruczki', 39, false],
  ['STALOWA WOLA - Dworzec Autobusowy ul. Okulickiego 3 NOWOŚĆ!!!', 40, false],
  ['KRAKÓW AIRPORT – przystanek autobusowy', 41, false],
  ['STARA WIEŚ - Kościół', 42, false],
  ['KRAKÓW MDA – Dw. Aut. ul. Bosacka 18', 43, false],
  ['STASZÓW – Rynek 01/02', 44, false],
  ['KRAŚNIK - Przystanek Kraśnik 05, ul. Mostowa NOWOŚĆ!!!', 45, false],
  ['TARNOBRZEG – Dworzec Autobusowy, ul. Mickiewicza', 46, false],
  ['KROSNO – Dw. Aut. PKS ul. Naftowa stan. nr 2', 47, false],
  ['WARSZAWA Port Lotniczy – Terminal Autokarowy', 48, false],
  ['LESKO – D.A. ul. Piłsudskiego 50', 49, false],
  ['WARSZAWA Zachodnia – Dworzec Zachodni PKS', 50, false],
  ['LUBLIN - Dworzec Lublin ul. Dworcowa 2', 51, false],
  ['WROCŁAW – Dw. Aut. ul. Sucha 1 (Galeria WROCLAVIA)', 52, false],
  ['LUTCZA - skrzyżowanie', 53, false],
  ['ZAGÓRZ – osiedle', 54, false],
  ['ŁONIÓW – Rondo', 55, false],
  ['ŻARNÓW – Plac Piłsudskiego/Rynek', 56, false],
  ['ŁÓDŹ FABRYCZNA – Plac Sałacińskiego 1', 57, false]
];

/**
 * Initializes bus stops in the database if they don't exist
 * @param {Object} db - Database connection object
 * @returns {Promise<void>}
 */
async function initializeBusStops(db) {
  try {
    const [busStopRows] = await db.query('SELECT COUNT(*) as count FROM bus_stop');
    
    if (busStopRows[0].count === 0) {
      await db.query(
        'INSERT INTO bus_stop (stop_name, address_id, is_hub) VALUES ?',
        [busStopsData]
      );
      console.log('Bus stops inserted into bus_stop table.');
    } else {
      console.log('Bus stops table already populated, skipping initialization.');
    }
  } catch (error) {
    console.error('Error initializing bus stops:', error);
    throw error;
  }
}

module.exports = {
  initializeBusStops,
  busStopsData
};
