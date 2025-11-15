import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // CORS
  const DEFAULT_ORIGINS = [
    'http://localhost:5173',
    'https://autoon.scarlat.dev.br',
    'https://autoon-api.scarlat.dev.br',
  ];
  const corsOriginEnv = process.env.CORS_ORIGIN;
  const corsOrigins = corsOriginEnv
    ? corsOriginEnv
        .split(',')
        .map(origin => origin.trim())
        .filter(Boolean)
        .concat(DEFAULT_ORIGINS)
        .filter((origin, index, self) => self.indexOf(origin) === index)
    : DEFAULT_ORIGINS;
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('AutoOn EAD API')
    .setDescription('API da plataforma EAD para autoescola')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Autenticação')
    .addTag('courses', 'Cursos')
    .addTag('modules', 'Módulos')
    .addTag('lessons', 'Aulas')
    .addTag('videos', 'Vídeos')
    .addTag('enrollments', 'Matrículas')
    .addTag('progress', 'Progresso')
    .addTag('quizzes', 'Quizzes')
    .addTag('certificates', 'Certificados')
    .addTag('reports', 'Relatórios')
    .addTag('admin', 'Administração')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 API rodando em http://localhost:${port}`);
  console.log(`📚 Documentação disponível em http://localhost:${port}/api-docs`);
}

bootstrap();
