import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AdvisorsModule } from './advisors/advisors.module';
import { ClassesModule } from './classes/classes.module';
import { User } from './entities/user.entity';
import { Advisor } from './entities/advisor.entity';
import { Class } from './entities/class.entity';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ExcelModule } from './excel/excel.module';
import { MinioModule } from './minio/minio.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { MailModule } from './mail/mail.module';
import { ConfigModule } from '@nestjs/config';
import { StudentsModule } from './students/students.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3307,
      username: 'root',
      password: '',
      database: 'nckh',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    UsersModule,
    AdvisorsModule,
    ClassesModule,
    ExcelModule,
    MinioModule,
    AuthModule,
    ChatModule,
    MailModule,
    StudentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
