'use strict';

/**
 * Creates the `hotel_images` table.
 * A composite unique constraint on (hotelId, url) prevents duplicate image
 * urls for the same hotel at the database level.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('hotel_images', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      hotelId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'hotels', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      url: { type: Sequelize.STRING(2048), allowNull: false },
      isPrimary: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      sortOrder: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('hotel_images', ['hotelId', 'url'], {
      name: 'uq_hotel_images_hotel_url',
      unique: true,
    });

    await queryInterface.addIndex('hotel_images', ['hotelId'], {
      name: 'idx_hotel_images_hotel_id',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('hotel_images');
  },
};