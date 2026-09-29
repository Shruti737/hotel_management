import { ConfigService } from '@nestjs/config';
import type { SequelizeModuleOptions } from '@nestjs/sequelize';
import { Hotel } from '../modules/hotels/entities/hotel.entity';
import { HotelImage } from '../modules/hotels/entities/hotel-image.entity';

/**
 * Builds the Sequelize connection options from environment configuration.
 *
 * `synchronize` is intentionally disabled: the database schema is created and
 * updated only through migrations (database/migrations).
 */
export function buildSequelizeOptions(configService: ConfigService): SequelizeModuleOptions {
  const ssl = configService.get<boolean>('database.ssl') === true;

  return {
    dialect: 'postgres',
    host: configService.get<string>('database.host'),
    port: configService.get<number>('database.port'),
    database: configService.get<string>('database.name'),
    username: configService.get<string>('database.user'),
    password: configService.get<string>('database.password'),
    models: [Hotel, HotelImage],
    autoLoadModels: false,
    synchronize: false,
    logging: false,
    dialectOptions: ssl ? { ssl: { require: true, rejectUnauthorized: false } } : undefined,
  };
}
