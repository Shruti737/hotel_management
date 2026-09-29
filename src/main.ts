import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Sequelize } from 'sequelize-typescript';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  try {
    await app.get(Sequelize).authenticate();
    // eslint-disable-next-line no-console
    console.log('Database connection established successfully');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Database connection failed:', error);
    await app.close();
    process.exitCode = 1;
    return;
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = app.get(ConfigService).get<number>('port') ?? 3000;
  await app.listen(port);

  // eslint-disable-next-line no-console
  console.log(`GlobInn Hotel API is running on port ${port}`);
}

void bootstrap();
