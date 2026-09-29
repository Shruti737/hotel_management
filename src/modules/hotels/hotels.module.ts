import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { HotelsController } from './controllers/hotels.controller';
import { HotelImage } from './entities/hotel-image.entity';
import { Hotel } from './entities/hotel.entity';
import { HotelsRepository } from './repositories/hotels.repository';
import { HotelsService } from './services/hotels.service';

@Module({
  imports: [SequelizeModule.forFeature([Hotel, HotelImage])],
  controllers: [HotelsController],
  providers: [HotelsService, HotelsRepository],
})
export class HotelsModule {}
