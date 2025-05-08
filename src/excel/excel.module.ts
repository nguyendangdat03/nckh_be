import { Module } from '@nestjs/common';
import { ExcelService } from './excel.service';
import { ExcelController } from './excel.controller';
import { MinioModule } from '../minio/minio.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [MinioModule, UsersModule],
  controllers: [ExcelController],
  providers: [ExcelService],
  exports: [ExcelService],
})
export class ExcelModule {}
