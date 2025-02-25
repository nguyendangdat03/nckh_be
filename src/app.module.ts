import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AdvisorsModule } from './advisors/advisors.module';
import { User } from './entities/user.entity';
import { Advisor } from './entities/advisor.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3307,
      username: 'root',
      password: '',
      database: 'nckh',
      entities: [User, Advisor],
      synchronize: true,
    }),
    UsersModule,
    AdvisorsModule,
  ],
})
export class AppModule {}
