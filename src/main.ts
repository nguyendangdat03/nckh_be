import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Áp dụng validation
  app.useGlobalPipes(new ValidationPipe());

  // Cấu hình CORS
  app.enableCors({
    origin: 'http://localhost:5173', // Địa chỉ của frontend
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Cấu hình Swagger
  const config = new DocumentBuilder()
    .setTitle('NCKH API')
    .setDescription('API hệ thống quản lý nghiên cứu khoa học')
    .setVersion('1.0')
    .addTag('auth', 'API xác thực người dùng')
    .addTag('users', 'API quản lý người dùng')
    .addTag('advisors', 'API quản lý giảng viên hướng dẫn')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
