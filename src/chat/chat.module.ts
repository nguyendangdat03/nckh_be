import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { Message } from '../entities/message.entity';
import { User } from '../entities/user.entity';
import { ChatBox } from '../entities/chat-box.entity';
import { jwtConstants } from '../auth/constants';
import { UsersModule } from '../users/users.module';
import { AdvisorsModule } from '../advisors/advisors.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, User, ChatBox]),
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '24h' },
    }),
    UsersModule,
    AdvisorsModule,
  ],
  providers: [ChatGateway, ChatService],
  controllers: [ChatController],
  exports: [ChatService],
})
export class ChatModule {}
