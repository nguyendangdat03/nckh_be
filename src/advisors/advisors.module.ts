import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdvisorsService } from './advisors.service';
import { AdvisorsController } from './advisors.controller';
import { Advisor } from '../entities/advisor.entity';
import { Class } from '../entities/class.entity';
import { User } from '../entities/user.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Advisor, Class, User]),
    forwardRef(() => UsersModule)
  ],
  providers: [AdvisorsService],
  controllers: [AdvisorsController],
  exports: [AdvisorsService],
})
export class AdvisorsModule {}
