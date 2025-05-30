import { Module } from '@nestjs/common';
import { ExcelController } from './excel.controller';
import { ExcelService } from './excel.service';
import { MinioModule } from '../minio/minio.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExcelFileEntity } from '../entities/excel-file.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [MinioModule, TypeOrmModule.forFeature([ExcelFileEntity]), UsersModule],
  controllers: [ExcelController],
  providers: [ExcelService],
  exports: [ExcelService]
})
export class ExcelModule {}
