import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import type { Transaction } from 'sequelize';
import { Hotel, HotelCreationAttributes } from '../entities/hotel.entity';
import { HotelImage, HotelImageCreationAttributes } from '../entities/hotel-image.entity';

/** Image data supplied when a hotel is created; `hotelId` is added by the repository. */
export type NewHotelImageData = Omit<HotelImageCreationAttributes, 'hotelId'>;

/** Autocomplete never returns more than 10 hotels. */
const AUTOCOMPLETE_LIMIT = 10;

/** Quotes LIKE wildcards so a user typing `%` or `_` is treated as plain text. */
function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

@Injectable()
export class HotelsRepository {
  constructor(
    @InjectModel(Hotel) private readonly hotelModel: typeof Hotel,
    @InjectModel(HotelImage) private readonly hotelImageModel: typeof HotelImage,
  ) {}

  async createHotel(data: HotelCreationAttributes, transaction: Transaction): Promise<Hotel> {
    return this.hotelModel.create(data, { transaction });
  }

  async createImages(
    hotelId: number,
    images: NewHotelImageData[],
    transaction: Transaction,
  ): Promise<HotelImage[]> {
    if (images.length === 0) {
      return [];
    }

    return this.hotelImageModel.bulkCreate(
      images.map((image) => ({ ...image, hotelId })),
      { transaction },
    );
  }

  async findById(id: number): Promise<Hotel | null> {
    return this.hotelModel.findByPk(id, { include: [HotelImage] });
  }

  /** Prefix search (`grand%`) over active hotels, using the normalizedName index. */
  async searchActiveByPrefix(normalizedNamePrefix: string): Promise<Hotel[]> {
    return this.hotelModel.findAll({
      where: {
        isActive: true,
        normalizedName: { [Op.like]: `${escapeLikePattern(normalizedNamePrefix)}%` },
      },
      attributes: ['id', 'name', 'city'],
      order: [['name', 'ASC']],
      limit: AUTOCOMPLETE_LIMIT,
    });
  }
}
