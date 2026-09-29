import {
  AutoIncrement,
  Column,
  DataType,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { HotelImage } from './hotel-image.entity';

export type HotelCreationAttributes = {
  name: string;
  normalizedName: string;
  description?: string | null;
  address: string;
  city: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  starRating: number;
  isActive?: boolean;
};

@Table({ tableName: 'hotels',
   indexes: [
    {
      name: 'idx_hotels_normalized_name',
      fields: ['normalizedName'],
    },
  ],
 })
export class Hotel extends Model<Hotel, HotelCreationAttributes> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare name: string;

  /** Lower-cased, single-spaced copy of `name`, used for prefix autocomplete. */
  @Column({ type: DataType.STRING(255), allowNull: false })
  declare normalizedName: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare description: string | null;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare address: string;

  @Column({ type: DataType.STRING(120), allowNull: false })
  declare city: string;

  @Column({ type: DataType.STRING(2), allowNull: false })
  declare countryCode: string;

  @Column({ type: DataType.DOUBLE, allowNull: false })
  declare latitude: number;

  @Column({ type: DataType.DOUBLE, allowNull: false })
  declare longitude: number;

  @Column({ type: DataType.SMALLINT, allowNull: false })
  declare starRating: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  declare isActive: boolean;

  @HasMany(() => HotelImage)
  declare images: HotelImage[];
}
