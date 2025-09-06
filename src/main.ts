import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  // Configuration CORS avec variables d'environnement
  const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001'
  ];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      validationError: { target: false },
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
}

bootstrap()
  .then(() => {
    const port = process.env.PORT || 3000;
    const host = process.env.HOST || 'localhost';
    console.log(`🚀 Application is running on: http://${host}:${port}`);
  })
  .catch((err) => {
    console.error('Error during application bootstrap:', err);
  });
