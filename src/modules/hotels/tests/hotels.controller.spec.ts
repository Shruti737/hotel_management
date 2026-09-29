import {
  ConflictException,
  INestApplication,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { HotelsController } from '../controllers/hotels.controller';
import { HotelsService } from '../services/hotels.service';

const validHotelPayload = (): Record<string, any> => ({
  name: 'The Grand Hotel',
  description: 'Luxury hotel in Delhi',
  address: 'MG Road',
  city: 'Delhi',
  countryCode: 'IN',
  latitude: 28.6139,
  longitude: 77.209,
  starRating: 5,
  images: [
    { url: 'https://example.com/hotel-1.jpg', isPrimary: true },
    { url: 'https://example.com/hotel-2.jpg', isPrimary: false },
  ],
});

describe('HotelsController', () => {
  let app: INestApplication;
  const hotelsService = {
    createHotel: jest.fn(),
    autocomplete: jest.fn(),
    findHotelById: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HotelsController],
      providers: [{ provide: HotelsService, useValue: hotelsService }],
    }).compile();

    app = moduleRef.createNestApplication();
    // Same global pipe configuration as src/main.ts
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /hotels', () => {
    it('returns 201 and the created hotel', async () => {
      hotelsService.createHotel.mockResolvedValue({ id: 1, name: 'The Grand Hotel' });

      const response = await request(app.getHttpServer())
        .post('/hotels')
        .send(validHotelPayload())
        .expect(201);

      expect(response.body).toEqual({ id: 1, name: 'The Grand Hotel' });
      expect(hotelsService.createHotel).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'The Grand Hotel', city: 'Delhi', starRating: 5 }),
      );
    });

    it('returns 201 without images (images are optional)', async () => {
      hotelsService.createHotel.mockResolvedValue({ id: 2, images: [] });
      const { images, ...payloadWithoutImages } = validHotelPayload();

      await request(app.getHttpServer()).post('/hotels').send(payloadWithoutImages).expect(201);

      expect(images).toBeDefined();
      const [createHotelDto] = hotelsService.createHotel.mock.calls[0];
      expect(createHotelDto.images).toBeUndefined();
    });

    it('transforms numeric strings into numbers', async () => {
      hotelsService.createHotel.mockResolvedValue({ id: 3 });

      await request(app.getHttpServer())
        .post('/hotels')
        .send({ ...validHotelPayload(), latitude: '28.6139', longitude: '77.209', starRating: '5' })
        .expect(201);

      expect(hotelsService.createHotel).toHaveBeenCalledWith(
        expect.objectContaining({ latitude: 28.6139, longitude: 77.209, starRating: 5 }),
      );
    });

    it.each(['name', 'address', 'city', 'countryCode', 'latitude', 'longitude', 'starRating'])(
      'returns 400 when the required field %s is missing',
      async (field) => {
        const payload = validHotelPayload();
        delete payload[field];

        await request(app.getHttpServer()).post('/hotels').send(payload).expect(400);

        expect(hotelsService.createHotel).not.toHaveBeenCalled();
      },
    );

    it.each(['IND', 'XX', '1N'])('returns 400 for the invalid countryCode %s', async (code) => {
      await request(app.getHttpServer())
        .post('/hotels')
        .send({ ...validHotelPayload(), countryCode: code })
        .expect(400);

      expect(hotelsService.createHotel).not.toHaveBeenCalled();
    });

    it.each([91, -91])('returns 400 for the out of range latitude %s', async (latitude) => {
      await request(app.getHttpServer())
        .post('/hotels')
        .send({ ...validHotelPayload(), latitude })
        .expect(400);
    });

    it.each([181, -181])('returns 400 for the out of range longitude %s', async (longitude) => {
      await request(app.getHttpServer())
        .post('/hotels')
        .send({ ...validHotelPayload(), longitude })
        .expect(400);
    });

    it.each([0, 6, 4.5])('returns 400 for the invalid starRating %s', async (starRating) => {
      await request(app.getHttpServer())
        .post('/hotels')
        .send({ ...validHotelPayload(), starRating })
        .expect(400);
    });

    it('returns 400 for an invalid image url', async () => {
      await request(app.getHttpServer())
        .post('/hotels')
        .send({ ...validHotelPayload(), images: [{ url: 'not-a-url' }] })
        .expect(400);

      expect(hotelsService.createHotel).not.toHaveBeenCalled();
    });

    it('returns 400 for a negative image sortOrder', async () => {
      await request(app.getHttpServer())
        .post('/hotels')
        .send({
          ...validHotelPayload(),
          images: [{ url: 'https://example.com/1.jpg', sortOrder: -1 }],
        })
        .expect(400);
    });

    it('returns 400 for properties that are not part of the request contract', async () => {
      await request(app.getHttpServer())
        .post('/hotels')
        .send({ ...validHotelPayload(), isActive: false })
        .expect(400);

      expect(hotelsService.createHotel).not.toHaveBeenCalled();
    });

    it('returns 409 when the service detects duplicate image urls', async () => {
      hotelsService.createHotel.mockRejectedValue(
        new ConflictException('Duplicate image url for this hotel: https://example.com/1.jpg'),
      );

      await request(app.getHttpServer()).post('/hotels').send(validHotelPayload()).expect(409);
    });
  });

  describe('GET /hotels/autocomplete', () => {
    it('returns 200 with the autocomplete results', async () => {
      hotelsService.autocomplete.mockResolvedValue([{ id: 1, name: 'Grand Hotel', city: 'Delhi' }]);

      const response = await request(app.getHttpServer())
        .get('/hotels/autocomplete')
        .query({ q: 'gra' })
        .expect(200);

      expect(response.body).toEqual([{ id: 1, name: 'Grand Hotel', city: 'Delhi' }]);
      expect(hotelsService.autocomplete).toHaveBeenCalledWith('gra');
    });

    it('is handled by the autocomplete action and never by GET /hotels/:id', async () => {
      hotelsService.autocomplete.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/hotels/autocomplete')
        .query({ q: 'gra' })
        .expect(200);

      expect(hotelsService.autocomplete).toHaveBeenCalledTimes(1);
      expect(hotelsService.findHotelById).not.toHaveBeenCalled();
    });

    it.each(['g', '', ' g '])(
      'returns 400 when the query is shorter than 2 characters (%s)',
      async (q) => {
        await request(app.getHttpServer()).get('/hotels/autocomplete').query({ q }).expect(400);

        expect(hotelsService.autocomplete).not.toHaveBeenCalled();
      },
    );

    it('returns 400 when the query is missing', async () => {
      await request(app.getHttpServer()).get('/hotels/autocomplete').expect(400);

      expect(hotelsService.autocomplete).not.toHaveBeenCalled();
    });

    it('returns 400 for query parameters that are not part of the contract', async () => {
      await request(app.getHttpServer())
        .get('/hotels/autocomplete')
        .query({ q: 'gra', limit: 100 })
        .expect(400);
    });
  });

  describe('GET /hotels/:id', () => {
    it('returns 200 with the hotel details', async () => {
      hotelsService.findHotelById.mockResolvedValue({
        id: 5,
        name: 'Grand View Resort',
        images: [{ id: 1, url: 'https://example.com/1.jpg', isPrimary: true, sortOrder: 0 }],
      });

      const response = await request(app.getHttpServer()).get('/hotels/5').expect(200);

      expect(response.body.id).toBe(5);
      expect(hotelsService.findHotelById).toHaveBeenCalledWith(5);
    });

    it('returns 400 when the id is not a number', async () => {
      await request(app.getHttpServer()).get('/hotels/abc').expect(400);

      expect(hotelsService.findHotelById).not.toHaveBeenCalled();
    });

    it('returns 404 when the hotel does not exist', async () => {
      hotelsService.findHotelById.mockRejectedValue(
        new NotFoundException('Hotel with id 9999 was not found'),
      );

      await request(app.getHttpServer()).get('/hotels/9999').expect(404);
    });
  });
});
