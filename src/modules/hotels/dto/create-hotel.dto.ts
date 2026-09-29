import { Type } from 'class-transformer';
import {
  IsArray,
  IsISO31661Alpha2,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateHotelImageDto } from './create-hotel-image.dto';

export class CreateHotelDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  address: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  city: string;

  @IsISO31661Alpha2({ message: 'countryCode must be a valid ISO 3166-1 alpha-2 country code' })
  countryCode: string;

  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(-90, { message: 'latitude must be greater than or equal to -90' })
  @Max(90, { message: 'latitude must be less than or equal to 90' })
  latitude: number;

  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(-180, { message: 'longitude must be greater than or equal to -180' })
  @Max(180, { message: 'longitude must be less than or equal to 180' })
  longitude: number;

  @Type(() => Number)
  @IsInt({ message: 'starRating must be an integer' })
  @Min(1, { message: 'starRating must be at least 1' })
  @Max(5, { message: 'starRating must be at most 5' })
  starRating: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateHotelImageDto)
  images?: CreateHotelImageDto[];
}
