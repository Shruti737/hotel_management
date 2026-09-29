import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { AutocompleteHotelDto } from '../dto/autocomplete-hotel.dto';
import { CreateHotelDto } from '../dto/create-hotel.dto';
import {
  HotelAutocompleteResponse,
  HotelsService,
  HotelDetailsResponse,
} from '../services/hotels.service';

@Controller('hotels')
export class HotelsController {
  constructor(private readonly hotelsService: HotelsService) {}

  @Post()
  create(@Body() createHotelDto: CreateHotelDto): Promise<HotelDetailsResponse> {
    return this.hotelsService.createHotel(createHotelDto);
  }

  // Declared before ':id' so that /hotels/autocomplete is not matched by the id route.
  @Get('autocomplete')
  autocomplete(@Query() query: AutocompleteHotelDto): Promise<HotelAutocompleteResponse[]> {
    return this.hotelsService.autocomplete(query.q);
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number): Promise<HotelDetailsResponse> {
    return this.hotelsService.findHotelById(id);
  }
}
