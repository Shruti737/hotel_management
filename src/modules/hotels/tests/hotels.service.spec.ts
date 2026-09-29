import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { UniqueConstraintError } from 'sequelize';
import type { Sequelize } from 'sequelize';
import { CreateHotelDto } from '../dto/create-hotel.dto';
import { Hotel } from '../entities/hotel.entity';
import { HotelImage } from '../entities/hotel-image.entity';
import { HotelsRepository } from '../repositories/hotels.repository';
import { HotelsService } from '../services/hotels.service';

function buildHotel(overrides: Partial<Hotel> = {}): Hotel {
  return {
    id: 1,
    name: 'The Grand Hotel',
    normalizedName: 'the grand hotel',
    description: 'Luxury hotel in Delhi',
    address: 'MG Road',
    city: 'Delhi',
    countryCode: 'IN',
    latitude: 28.6139,
    longitude: 77.209,
    starRating: 5,
    isActive: true,
    images: [],
    ...overrides,
  } as Hotel;
}

function buildImage(overrides: Partial<HotelImage> = {}): HotelImage {
  return {
    id: 1,
    hotelId: 1,
    url: 'https://example.com/hotel-1.jpg',
    isPrimary: true,
    sortOrder: 0,
    ...overrides,
  } as HotelImage;
}

function buildCreateHotelDto(overrides: Partial<CreateHotelDto> = {}): CreateHotelDto {
  return {
    name: 'The Grand Hotel',
    description: 'Luxury hotel in Delhi',
    address: 'MG Road',
    city: 'Delhi',
    countryCode: 'IN',
    latitude: 28.6139,
    longitude: 77.209,
    starRating: 5,
    images: [
      { url: 'https://example.com/hotel-1.jpg' },
      { url: 'https://example.com/hotel-2.jpg' },
    ],
    ...overrides,
  };
}

describe('HotelsService', () => {
  let service: HotelsService;
  let repository: {
    createHotel: jest.Mock;
    createImages: jest.Mock;
    findById: jest.Mock;
    searchActiveByPrefix: jest.Mock;
  };
  let transaction: { commit: jest.Mock; rollback: jest.Mock };
  let sequelize: { transaction: jest.Mock };

  beforeEach(() => {
    repository = {
      createHotel: jest.fn(),
      createImages: jest.fn(),
      findById: jest.fn(),
      searchActiveByPrefix: jest.fn(),
    };
    transaction = { commit: jest.fn(), rollback: jest.fn() };
    sequelize = { transaction: jest.fn().mockResolvedValue(transaction) };

    service = new HotelsService(
      repository as unknown as HotelsRepository,
      sequelize as unknown as Sequelize,
    );
  });

  describe('createHotel', () => {
    it('creates the hotel and its images inside one transaction and commits', async () => {
      const hotel = buildHotel({ id: 42 });
      const images = [
        buildImage({
          id: 100,
          url: 'https://example.com/hotel-1.jpg',
          isPrimary: true,
          sortOrder: 0,
        }),
        buildImage({
          id: 101,
          url: 'https://example.com/hotel-2.jpg',
          isPrimary: false,
          sortOrder: 1,
        }),
      ];
      repository.createHotel.mockResolvedValue(hotel);
      repository.createImages.mockResolvedValue(images);

      const result = await service.createHotel(buildCreateHotelDto());

      expect(sequelize.transaction).toHaveBeenCalledTimes(1);
      expect(repository.createHotel).toHaveBeenCalledTimes(1);
      expect(repository.createImages).toHaveBeenCalledWith(42, expect.any(Array), transaction);
      expect(transaction.commit).toHaveBeenCalledTimes(1);
      expect(transaction.rollback).not.toHaveBeenCalled();
      expect(result.id).toBe(42);
      expect(result.images).toEqual([
        { id: 100, url: 'https://example.com/hotel-1.jpg', isPrimary: true, sortOrder: 0 },
        { id: 101, url: 'https://example.com/hotel-2.jpg', isPrimary: false, sortOrder: 1 },
      ]);
    });

    it('stores normalized values and activates the hotel by default', async () => {
      repository.createHotel.mockResolvedValue(buildHotel());
      repository.createImages.mockResolvedValue([]);

      await service.createHotel(
        buildCreateHotelDto({
          name: 'The   GRAND Hotel',
          countryCode: 'in',
          description: undefined,
        }),
      );

      expect(repository.createHotel).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'The   GRAND Hotel',
          normalizedName: 'the grand hotel',
          countryCode: 'IN',
          description: null,
          isActive: true,
        }),
        transaction,
      );
    });

    it('commits without creating images when the request has none', async () => {
      repository.createHotel.mockResolvedValue(buildHotel());
      repository.createImages.mockResolvedValue([]);

      const result = await service.createHotel(buildCreateHotelDto({ images: undefined }));

      expect(repository.createImages).toHaveBeenCalledWith(1, [], transaction);
      expect(transaction.commit).toHaveBeenCalledTimes(1);
      expect(result.images).toEqual([]);
    });

    it('rolls back the whole transaction when image creation fails', async () => {
      repository.createHotel.mockResolvedValue(buildHotel({ id: 42 }));
      repository.createImages.mockRejectedValue(new Error('insert failed'));

      await expect(service.createHotel(buildCreateHotelDto())).rejects.toThrow('insert failed');

      expect(transaction.rollback).toHaveBeenCalledTimes(1);
      expect(transaction.commit).not.toHaveBeenCalled();
    });

    it('maps a database unique constraint error to 409 Conflict', async () => {
      repository.createHotel.mockResolvedValue(buildHotel({ id: 42 }));
      repository.createImages.mockRejectedValue(new UniqueConstraintError({}));

      await expect(service.createHotel(buildCreateHotelDto())).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(transaction.rollback).toHaveBeenCalledTimes(1);
    });

    it('makes the first image primary when none of the images is marked primary', async () => {
      repository.createHotel.mockResolvedValue(buildHotel({ id: 42 }));
      repository.createImages.mockResolvedValue([]);

      await service.createHotel(
        buildCreateHotelDto({
          images: [
            { url: 'https://example.com/first.jpg' },
            { url: 'https://example.com/second.jpg', isPrimary: false },
          ],
        }),
      );

      const [, createdImages] = repository.createImages.mock.calls[0];
      expect(createdImages).toEqual([
        { url: 'https://example.com/first.jpg', isPrimary: true, sortOrder: 0 },
        { url: 'https://example.com/second.jpg', isPrimary: false, sortOrder: 1 },
      ]);
    });

    it('keeps an explicitly provided sortOrder', async () => {
      repository.createHotel.mockResolvedValue(buildHotel({ id: 42 }));
      repository.createImages.mockResolvedValue([]);

      await service.createHotel(
        buildCreateHotelDto({
          images: [
            { url: 'https://example.com/b.jpg', sortOrder: 5 },
            { url: 'https://example.com/a.jpg', sortOrder: 2, isPrimary: true },
          ],
        }),
      );

      const [, createdImages] = repository.createImages.mock.calls[0];
      expect(createdImages).toEqual([
        { url: 'https://example.com/b.jpg', isPrimary: false, sortOrder: 5 },
        { url: 'https://example.com/a.jpg', isPrimary: true, sortOrder: 2 },
      ]);
    });

    it('rejects a request with more than one primary image without touching the database', async () => {
      const dto = buildCreateHotelDto({
        images: [
          { url: 'https://example.com/a.jpg', isPrimary: true },
          { url: 'https://example.com/b.jpg', isPrimary: true },
        ],
      });

      await expect(service.createHotel(dto)).rejects.toBeInstanceOf(BadRequestException);
      expect(sequelize.transaction).not.toHaveBeenCalled();
      expect(repository.createHotel).not.toHaveBeenCalled();
    });

    it('rejects duplicate image urls for the same hotel with 409 Conflict', async () => {
      const dto = buildCreateHotelDto({
        images: [{ url: 'https://example.com/same.jpg' }, { url: 'https://example.com/same.jpg' }],
      });

      await expect(service.createHotel(dto)).rejects.toBeInstanceOf(ConflictException);
      expect(sequelize.transaction).not.toHaveBeenCalled();
      expect(repository.createHotel).not.toHaveBeenCalled();
    });
  });

  describe('autocomplete', () => {
    it('searches active hotels by normalized prefix', async () => {
      repository.searchActiveByPrefix.mockResolvedValue([
        buildHotel({ id: 1, name: 'Grand Hotel', city: 'Delhi' }),
      ]);

      const result = await service.autocomplete('  GRAND Hotel  ');

      expect(repository.searchActiveByPrefix).toHaveBeenCalledWith('grand hotel');
      expect(result).toEqual([{ id: 1, name: 'Grand Hotel', city: 'Delhi' }]);
    });

    it('returns only the autocomplete fields and never images', async () => {
      repository.searchActiveByPrefix.mockResolvedValue([
        buildHotel({ id: 3, name: 'Grand View Resort', city: 'Goa', images: [buildImage()] }),
      ]);

      const [item] = await service.autocomplete('gra');

      expect(Object.keys(item).sort()).toEqual(['city', 'id', 'name']);
      expect(item).not.toHaveProperty('images');
      expect(item).not.toHaveProperty('normalizedName');
    });

    it('returns an empty array when no active hotel matches', async () => {
      repository.searchActiveByPrefix.mockResolvedValue([]);

      await expect(service.autocomplete('zzz')).resolves.toEqual([]);
    });
  });

  describe('findHotelById', () => {
    it('returns hotel details with images ordered by sortOrder', async () => {
      repository.findById.mockResolvedValue(
        buildHotel({
          images: [
            buildImage({
              id: 3,
              url: 'https://example.com/third.jpg',
              isPrimary: false,
              sortOrder: 10,
            }),
            buildImage({
              id: 1,
              url: 'https://example.com/first.jpg',
              isPrimary: true,
              sortOrder: 0,
            }),
            buildImage({
              id: 2,
              url: 'https://example.com/second.jpg',
              isPrimary: false,
              sortOrder: 5,
            }),
          ],
        }),
      );

      const result = await service.findHotelById(1);

      expect(repository.findById).toHaveBeenCalledWith(1);
      expect(result.images.map((image) => image.sortOrder)).toEqual([0, 5, 10]);
      expect(result.images[0]).toEqual({
        id: 1,
        url: 'https://example.com/first.jpg',
        isPrimary: true,
        sortOrder: 0,
      });
    });

    it('returns exactly the documented hotel fields', async () => {
      repository.findById.mockResolvedValue(buildHotel());

      const result = await service.findHotelById(1);

      expect(Object.keys(result).sort()).toEqual(
        [
          'address',
          'city',
          'countryCode',
          'description',
          'id',
          'images',
          'isActive',
          'latitude',
          'longitude',
          'name',
          'starRating',
        ].sort(),
      );
    });

    it('returns an empty image list for a hotel without images', async () => {
      repository.findById.mockResolvedValue(buildHotel({ images: [] }));

      const result = await service.findHotelById(1);

      expect(result.images).toEqual([]);
    });

    it('throws 404 Not Found when the hotel does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findHotelById(9999)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
