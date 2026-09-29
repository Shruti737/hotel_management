import {
  AutoIncrement,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Hotel } from './hotel.entity';

export type HotelImageCreationAttributes = {
  hotelId: number;
  url: string;
  isPrimary?: boolean;
  sortOrder?: number;
};

@Table({ tableName: 'hotel_images' })
export class HotelImage extends Model<HotelImage, HotelImageCreationAttributes> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => Hotel)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare hotelId: number;

  @BelongsTo(() => Hotel)
  declare hotel: Hotel;

  @Column({ type: DataType.STRING(2048), allowNull: false })
  declare url: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare isPrimary: boolean;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
  declare sortOrder: number;
}
