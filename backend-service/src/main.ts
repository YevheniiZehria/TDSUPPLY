import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Activare CORS pentru frontend (Next.js)
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Activare validare globală pentru DTO-uri (class-validator)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // elimină câmpurile necunoscute
      forbidNonWhitelisted: true,
      transform: true, // conversie automată a tipurilor
    }),
  );

  // Configurare Swagger / OpenAPI
  const config = new DocumentBuilder()
    .setTitle('Distrident Medical API')
    .setDescription('API pentru platforma B2B de distribuție produse dentare')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`🚀 Backend pornit pe http://localhost:${port}`);
  console.log(`📚 Swagger disponibil la http://localhost:${port}/api/docs`);
}
void bootstrap();
