import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 3333;
  const isProduction = configService.get<string>('NODE_ENV') === 'production';

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new TransformInterceptor());

  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    ...(configService.get<string>('FRONTEND_URL') ?? '').split(',').map((u) => u.trim()).filter(Boolean),
  ];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  if (!isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('TalentFit API')
      .setDescription('Plataforma de triagem automática de currículos')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
    console.log(`Swagger docs at http://localhost:${port}/api/docs`);
  }

  await app.listen(port);
  console.log(`TalentFit API running on port ${port} [${isProduction ? 'production' : 'development'}]`);
}

bootstrap();
