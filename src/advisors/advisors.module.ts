import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdvisorsService } from './advisors.service';
import { AdvisorsController } from './advisors.controller';
import { Advisor } from '../entities/advisor.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Advisor]), UsersModule],
  providers: [AdvisorsService],
  controllers: [AdvisorsController],
  exports: [AdvisorsService],
})
export class AdvisorsModule {}
