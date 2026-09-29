import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsUrl, MaxLength, Min } from 'class-validator';

export class CreateHotelImageDto {
  @IsUrl(
    { require_protocol: true, protocols: ['http', 'https'] },
    { message: 'url must be a valid HTTP or HTTPS URL' },
  )
  @MaxLength(2048)
  url: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'sortOrder must be an integer' })
  @Min(0)
  sortOrder?: number;
}
