'use strict';

/**
 * Local development seed data.
 *
 * Covered scenarios:
 * - 12 hotels starting with "grand" (autocomplete prefix search + the 10 result limit)
 * - mixed lower/upper case name ("GRAND PALACE Hotel", "IBIS Styles Hyderabad")
 * - active and inactive hotels (inactive hotels must never be returned by autocomplete)
 * - hotels without images, with one image and with several images
 * - different sortOrder values, including primary images that are not first
 */
const now = new Date();
const UNSPLASH = 'https://images.unsplash.com/';

const hotels = [
  {
    id: 1,
    name: 'Grand Hotel Delhi',
    description: 'Luxury hotel in the heart of Delhi',
    address: 'MG Road, Connaught Place',
    city: 'Delhi',
    countryCode: 'IN',
    latitude: 28.6139,
    longitude: 77.209,
    starRating: 5,
    isActive: true,
  },
  {
    id: 2,
    name: 'GRAND PALACE Hotel',
    description: 'Heritage palace stay in Jaipur',
    address: 'Amer Road',
    city: 'Jaipur',
    countryCode: 'IN',
    latitude: 26.9124,
    longitude: 75.7873,
    starRating: 4,
    isActive: true,
  },
  {
    id: 3,
    name: 'Grand View Resort',
    description: 'Beach side resort in Goa',
    address: 'Calangute Beach Road',
    city: 'Goa',
    countryCode: 'IN',
    latitude: 15.2993,
    longitude: 74.124,
    starRating: 5,
    isActive: true,
  },
  {
    id: 4,
    name: 'Grand Oasis Suites',
    description: 'Serviced suites in Mumbai',
    address: 'Bandra Kurla Complex',
    city: 'Mumbai',
    countryCode: 'IN',
    latitude: 19.076,
    longitude: 72.8777,
    starRating: 4,
    isActive: true,
  },
  {
    id: 5,
    name: 'Grand Residency Inn',
    description: 'Business hotel near the airport',
    address: 'Aerocity',
    city: 'Delhi',
    countryCode: 'IN',
    latitude: 28.5562,
    longitude: 77.0878,
    starRating: 3,
    isActive: true,
  },
  {
    id: 6,
    name: 'Grand Lotus Hotel',
    description: 'Boutique hotel in Bengaluru',
    address: 'MG Road',
    city: 'Bengaluru',
    countryCode: 'IN',
    latitude: 12.9716,
    longitude: 77.5946,
    starRating: 4,
    isActive: true,
  },
  {
    id: 7,
    name: 'Grand Palm Beach Resort',
    description: 'Five star resort in South Goa',
    address: 'Cavelossim Beach',
    city: 'Goa',
    countryCode: 'IN',
    latitude: 15.4909,
    longitude: 73.8278,
    starRating: 5,
    isActive: true,
  },
  {
    id: 8,
    name: 'Grand Sapphire Hotel',
    description: 'Modern hotel in Pune',
    address: 'Koregaon Park',
    city: 'Pune',
    countryCode: 'IN',
    latitude: 18.5204,
    longitude: 73.8567,
    starRating: 3,
    isActive: true,
  },
  {
    id: 9,
    name: 'Grand Heritage Haveli',
    description: 'Lake facing heritage stay',
    address: 'Lake Pichola Road',
    city: 'Udaipur',
    countryCode: 'IN',
    latitude: 24.5854,
    longitude: 73.7125,
    starRating: 4,
    isActive: true,
  },
  {
    id: 10,
    name: 'Grand Central Stay',
    description: 'Central located budget friendly hotel',
    address: 'Anna Salai',
    city: 'Chennai',
    countryCode: 'IN',
    latitude: 13.0827,
    longitude: 80.2707,
    starRating: 3,
    isActive: true,
  },
  {
    id: 11,
    name: 'Grand Orchid Hotel',
    description: 'Inactive hotel used to test autocomplete filtering',
    address: 'Banjara Hills',
    city: 'Hyderabad',
    countryCode: 'IN',
    latitude: 17.385,
    longitude: 78.4867,
    starRating: 4,
    isActive: false,
  },
  {
    id: 12,
    name: 'Grand Metro Hotel',
    description: 'Business hotel next to the metro station',
    address: 'Park Street',
    city: 'Kolkata',
    countryCode: 'IN',
    latitude: 22.5726,
    longitude: 88.3639,
    starRating: 3,
    isActive: true,
  },
  {
    id: 13,
    name: 'IBIS Styles Hyderabad',
    description: 'Upper case name used to test case-insensitive search',
    address: 'HITEC City',
    city: 'Hyderabad',
    countryCode: 'IN',
    latitude: 17.4239,
    longitude: 78.4738,
    starRating: 4,
    isActive: true,
  },
  {
    id: 14,
    name: 'Radisson Blu Plaza Delhi',
    description: 'Airport hotel with convention centre',
    address: 'National Highway 8',
    city: 'Delhi',
    countryCode: 'IN',
    latitude: 28.5562,
    longitude: 77.1,
    starRating: 5,
    isActive: true,
  },
  {
    id: 15,
    name: 'Emerald Inn',
    description: 'Hotel without images',
    address: 'T Nagar',
    city: 'Chennai',
    countryCode: 'IN',
    latitude: 13.05,
    longitude: 80.25,
    starRating: 2,
    isActive: true,
  },
  {
    id: 16,
    name: 'Treebo Cozy Nest',
    description: 'Inactive hotel without images',
    address: 'Kalyani Nagar',
    city: 'Pune',
    countryCode: 'IN',
    latitude: 18.53,
    longitude: 73.86,
    starRating: 3,
    isActive: false,
  },
].map((hotel) => ({
  ...hotel,
  normalizedName: hotel.name.trim().replace(/\s+/g, ' ').toLowerCase(),
  createdAt: now,
  updatedAt: now,
}));const images = [];
let imageId = 0;

/** Registers the images of a hotel: [unsplash photo id, isPrimary, sortOrder]. */
function addImages(hotelId, entries) {
  entries.forEach(([photoId, isPrimary, sortOrder]) => {
    imageId += 1;
    images.push({
      id: imageId,
      hotelId,
      url: `${UNSPLASH}${photoId}`,
      isPrimary,
      sortOrder,
      createdAt: now,
      updatedAt: now,
    });
  });
}

addImages(1, [
  ['photo-1566073771259-6a8506099945', false, 0],
  ['photo-1551882547-ff40c63fe5fa', true, 1],
  ['photo-1571003123894-1f0594d2b5d9', false, 2],
]);
addImages(2, [['photo-1520250497591-112f2f40a3f4', true, 0]]);
addImages(3, [
  ['photo-1582719508461-905c673771fd', false, 0],
  ['photo-1590490360182-c33d57733427', true, 1],
]);
addImages(5, [
  ['photo-1611892440504-42a792e24d32', true, 0],
  ['photo-1445019980597-93fa8acb246c', false, 1],
]);
addImages(6, [['photo-1564501049412-61c2a3083791', true, 0]]);
addImages(7, [
  ['photo-1542314831-068cd1dbfeeb', true, 0],
  ['photo-1578683010236-d716f9a3f461', false, 5],
  ['photo-1584132967334-10e028bd69f7', false, 10],
]);
addImages(8, [
  ['photo-1596394516093-501ba68a0ba6', false, 0],
  ['photo-1560448204-e02f11c3d0e2', true, 1],
]);
addImages(9, [['photo-1568495248636-6432b97bd949', true, 0]]);
addImages(10, [
  ['photo-1522708323590-d24dbb6b0267', true, 0],
  ['photo-1502672260266-1c1ef2d93688', false, 1],
]);
addImages(11, [
  ['photo-1600585154340-be6161a56a0c', true, 0],
  ['photo-1600607687939-ce8a6c25118c', false, 1],
]);
addImages(12, [
  ['photo-1600566753086-00f18fb6b3ea', false, 0],
  ['photo-1493809842364-78817add7ffb', false, 1],
  ['photo-1512917774080-9991f1c4c750', true, 2],
]);
addImages(13, [
  ['photo-1580587771525-78b9dba3b914', true, 0],
  ['photo-1570129477492-45c003edd2be', false, 1],
]);
addImages(14, [
  ['photo-1575517111478-7f6afd0973db', true, 0],
  ['photo-1591088398332-8a7791972843', false, 1],
  ['photo-1533105079780-92b9be482077', false, 2],
]);
addImages(16, [['photo-1560347876-aeef00ee58a1', true, 0]]);

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('hotels', hotels);
    await queryInterface.bulkInsert('hotel_images', images);

    // Seeded rows use explicit ids, so the sequences are moved forward to keep
    // inserts coming from the API working.
    await queryInterface.sequelize.query(
      "SELECT setval(pg_get_serial_sequence('hotels', 'id'), (SELECT MAX(id) FROM hotels))",
    );
    await queryInterface.sequelize.query(
      "SELECT setval(pg_get_serial_sequence('hotel_images', 'id'), (SELECT MAX(id) FROM hotel_images))",
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      'TRUNCATE TABLE hotel_images, hotels RESTART IDENTITY CASCADE',
    );
  },
};
