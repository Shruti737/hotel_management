import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { UniqueConstraintError } from 'sequelize';
import type { Sequelize } from 'sequelize';
import { CreateHotelDto } from '../dto/create-hotel.dto';
import { CreateHotelImageDto } from '../dto/create-hotel-image.dto';
import { Hotel, HotelCreationAttributes } from '../entities/hotel.entity';
import { HotelImage } from '../entities/hotel-image.entity';
import { HotelsRepository, NewHotelImageData } from '../repositories/hotels.repository';

export type HotelImageResponse = {
  id: number;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
};

export type HotelDetailsResponse = {
  id: number;
  name: string;
  description: string | null;
  address: string;
  city: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  starRating: number;
  isActive: boolean;
  images: HotelImageResponse[];
};

export type HotelAutocompleteResponse = {
  id: number;
  name: string;
  city: string;
};

@Injectable()
export class HotelsService {
  constructor(
    private readonly hotelsRepository: HotelsRepository,
    @InjectConnection() private readonly sequelize: Sequelize,
  ) {}

  /**
   * Creates a hotel together with its images inside a single transaction.
   * If anything fails, the whole transaction is rolled back so no partially
   * created hotel is left behind.
   */
  async createHotel(dto: CreateHotelDto): Promise<HotelDetailsResponse> {
    const images = this.prepareImages(dto.images ?? []);
    const transaction = await this.sequelize.transaction();

    let hotel: Hotel;
    let createdImages: HotelImage[];

    try {
      hotel = await this.hotelsRepository.createHotel(this.toHotelData(dto), transaction);
      createdImages = await this.hotelsRepository.createImages(hotel.id, images, transaction);
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw this.toHttpException(error);
    }

    return this.toHotelDetails(hotel, createdImages);
  }

  /** Case-insensitive prefix search over active hotels. */
  async autocomplete(query: string): Promise<HotelAutocompleteResponse[]> {
    const hotels = await this.hotelsRepository.searchActiveByPrefix(this.normalizeName(query));

    return hotels.map((hotel) => ({
      id: hotel.id,
      name: hotel.name,
      city: hotel.city,
    }));
  }

  async findHotelById(id: number): Promise<HotelDetailsResponse> {
    const hotel = await this.hotelsRepository.findById(id);

    if (!hotel) {
      throw new NotFoundException(`Hotel with id ${id} was not found`);
    }

    return this.toHotelDetails(hotel, hotel.images ?? []);
  }

  /**
   * Applies the image business rules:
   * - duplicate urls are rejected
   * - only one image may be primary
   * - if no image is marked primary, the first image becomes the primary one
   * - sortOrder falls back to the position of the image in the request
   */
  private prepareImages(images: CreateHotelImageDto[]): NewHotelImageData[] {
    if (images.length === 0) {
      return [];
    }

    const duplicateUrl = images
      .map((image) => image.url)
      .find((url, index, urls) => urls.indexOf(url) !== index);

    if (duplicateUrl) {
      throw new ConflictException(`Duplicate image url for this hotel: ${duplicateUrl}`);
    }

    const primaryImages = images.filter((image) => image.isPrimary === true);

    if (primaryImages.length > 1) {
      throw new BadRequestException('Only one image can be marked as primary');
    }

    const hasPrimaryImage = primaryImages.length === 1;

    return images.map((image, index) => ({
      url: image.url,
      isPrimary: hasPrimaryImage ? image.isPrimary === true : index === 0,
      sortOrder: image.sortOrder ?? index,
    }));
  }

  private toHotelData(dto: CreateHotelDto): HotelCreationAttributes {
    return {
      name: dto.name.trim(),
      normalizedName: this.normalizeName(dto.name),
      description: dto.description?.trim() || null,
      address: dto.address.trim(),
      city: dto.city.trim(),
      countryCode: dto.countryCode.toUpperCase(),
      latitude: dto.latitude,
      longitude: dto.longitude,
      starRating: dto.starRating,
      isActive: true,
    };
  }

  private toHotelDetails(hotel: Hotel, images: HotelImage[]): HotelDetailsResponse {
    return {
      id: hotel.id,
      name: hotel.name,
      description: hotel.description ?? null,
      address: hotel.address,
      city: hotel.city,
      countryCode: hotel.countryCode,
      latitude: hotel.latitude,
      longitude: hotel.longitude,
      starRating: hotel.starRating,
      isActive: hotel.isActive,
      images: [...images]
        .sort((first, second) => first.sortOrder - second.sortOrder)
        .map((image) => ({
          id: image.id,
          url: image.url,
          isPrimary: image.isPrimary,
          sortOrder: image.sortOrder,
        })),
    };
  }

  private normalizeName(value: string): string {
    return value.trim().replace(/\s+/g, ' ').toLowerCase();
  }

  /** Translates database level failures into API level errors. */
  private toHttpException(error: unknown): Error {
    if (error instanceof UniqueConstraintError) {
      return new ConflictException('Duplicate image url for this hotel');
    }

    return error instanceof Error ? error : new Error('Hotel could not be created');
  }
}
