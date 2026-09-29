'use strict';

/** Creates the `hotels` table and the index used by the autocomplete endpoint. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('hotels', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: { type: Sequelize.STRING(255), allowNull: false },
      normalizedName: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      address: { type: Sequelize.STRING(255), allowNull: false },
      city: { type: Sequelize.STRING(120), allowNull: false },
      countryCode: { type: Sequelize.STRING(2), allowNull: false },
      latitude: { type: Sequelize.DOUBLE, allowNull: false },
      longitude: { type: Sequelize.DOUBLE, allowNull: false },
      starRating: { type: Sequelize.SMALLINT, allowNull: false },
      isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    // Autocomplete queries always filter on isActive and then run a prefix
    // match on normalizedName. `text_pattern_ops` makes the btree index usable
    // for `LIKE 'prefix%'` even when the database collation is not "C".
    await queryInterface.addIndex(
      'hotels',
      [{ name: 'isActive' }, { name: 'normalizedName', operator: 'text_pattern_ops' }],
      { name: 'idx_hotels_autocomplete', using: 'btree' },
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('hotels');
  },
};