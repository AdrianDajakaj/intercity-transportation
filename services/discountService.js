// Discount data and initialization service

const discounts = [
  ['STUDENT', 'Zniżka dla uczniów / studentów', 25.00],
];

/**
 * Initialize discounts in the database
 * @param {Object} db - Database connection object
 */
async function initializeDiscounts(db) {
  const [discountRows] = await db.query('SELECT COUNT(*) as count FROM discount');
  if (discountRows[0].count === 0) {
    await db.query(
      'INSERT INTO discount (discount_code, discount_description, percent_off) VALUES ?',
      [discounts]
    );
    console.log('Discounts inserted into discount table.');
  }
}

module.exports = {
  initializeDiscounts
};
