module.exports = {
  async up(queryInterface) {
    await queryInterface.addIndex('hotels', ['normalizedName'], {
      name: 'idx_hotels_normalized_name',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      'hotels',
      'idx_hotels_normalized_name',
    );
  },
};