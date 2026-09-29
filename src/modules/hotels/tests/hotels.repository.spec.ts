import { Op } from 'sequelize';
import type { Transaction } from 'sequelize';
import { HotelCreationAttributes } from '../entities/hotel.entity';
import { HotelsRepository } from '../repositories/hotels.repository';

describe('HotelsRepository', () => {
  let repository: HotelsRepository;
  let hotelModel: { create: jest.Mock; findByPk: jest.Mock; findAll: jest.Mock };
  let hotelImageModel: { bulkCreate: jest.Mock };
  const transaction = { id: 'transaction-1' } as unknown as Transaction;

  beforeEach(() => {
    hotelModel = { create: jest.fn(), findByPk: jest.fn(), findAll: jest.fn() };
    hotelImageModel = { bulkCreate: jest.fn() };
    repository = new HotelsRepository(hotelModel as never, hotelImageModel as never);
  });

  describe('createHotel', () => {
    it('creates the hotel with the given transaction', async () => {
      const hotelData: HotelCreationAttributes = {
        name: 'Grand Hotel Delhi',
        normalizedName: 'grand hotel delhi',
        description: null,
        address: 'MG Road',
        city: 'Delhi',
        countryCode: 'IN',
        latitude: 28.6139,
        longitude: 77.209,
        starRating: 5,
        isActive: true,
      };
      hotelModel.create.mockResolvedValue({ id: 1 });

      await repository.createHotel(hotelData, transaction);

      expect(hotelModel.create).toHaveBeenCalledWith(hotelData, { transaction });
    });
  });

  describe('createImages', () => {
    it('adds the hotelId and the transaction to every image', async () => {
      hotelImageModel.bulkCreate.mockResolvedValue([]);

      await repository.createImages(
        7,
        [
          { url: 'https://example.com/1.jpg', isPrimary: true, sortOrder: 0 },
          { url: 'https://example.com/2.jpg', isPrimary: false, sortOrder: 1 },
        ],
        transaction,
      );

      expect(hotelImageModel.bulkCreate).toHaveBeenCalledWith(
        [
          {
            hotelId: 7,
            url: 'https://example.com/1.jpg',
            isPrimary: true,
            sortOrder: 0,
          },
          {
            hotelId: 7,
            url: 'https://example.com/2.jpg',
            isPrimary: false,
            sortOrder: 1,
          },
        ],
        { transaction },
      );
    });

    it('does not query the database when there are no images', async () => {
      await expect(repository.createImages(7, [], transaction)).resolves.toEqual([]);

      expect(hotelImageModel.bulkCreate).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('loads the hotel together with its images', async () => {
      hotelModel.findByPk.mockResolvedValue(null);

      await repository.findById(3);

      expect(hotelModel.findByPk).toHaveBeenCalledWith(3, { include: [expect.anything()] });
    });
  });

  describe('searchActiveByPrefix', () => {
    it('queries only active hotels, matches the prefix and limits the result to 10', async () => {
      hotelModel.findAll.mockResolvedValue([]);

      await repository.searchActiveByPrefix('grand');

      expect(hotelModel.findAll).toHaveBeenCalledWith({
        where: {
          isActive: true,
          normalizedName: { [Op.like]: 'grand%' },
        },
        attributes: ['id', 'name', 'city'],
        order: [['name', 'ASC']],
        limit: 10,
      });
    });

    it('never selects images for autocomplete', async () => {
      hotelModel.findAll.mockResolvedValue([]);

      await repository.searchActiveByPrefix('gra');

      const options = hotelModel.findAll.mock.calls[0][0];
      expect(options.attributes).not.toContain('images');
      expect(options.include).toBeUndefined();
    });

    it('escapes LIKE wildcards typed by the user', async () => {
      hotelModel.findAll.mockResolvedValue([]);

      await repository.searchActiveByPrefix('50%_off\\');

      expect(hotelModel.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true, normalizedName: { [Op.like]: '50\\%\\_off\\\\%' } },
        }),
      );
    });
  });
});
