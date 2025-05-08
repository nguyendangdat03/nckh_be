import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../entities/message.entity';
import { User } from '../entities/user.entity';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async createMessage(
    senderId: number,
    receiverId: number,
    content: string,
  ): Promise<Message> {
    const sender = await this.userRepository.findOne({
      where: { user_id: senderId },
    });
    const receiver = await this.userRepository.findOne({
      where: { user_id: receiverId },
    });

    if (!sender || !receiver) {
      throw new Error('Sender or receiver not found');
    }

    const message = this.messageRepository.create({
      content,
      sender,
      receiver,
      is_read: false,
    });

    return this.messageRepository.save(message);
  }

  async getMessages(userId: number, otherUserId: number): Promise<Message[]> {
    return this.messageRepository.find({
      where: [
        { sender: { user_id: userId }, receiver: { user_id: otherUserId } },
        { sender: { user_id: otherUserId }, receiver: { user_id: userId } },
      ],
      relations: ['sender', 'receiver'],
      order: { created_at: 'ASC' },
    });
  }

  async markMessageAsRead(messageId: number, userId: number): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId, receiver: { user_id: userId } },
      relations: ['sender', 'receiver'],
    });

    if (!message) {
      throw new Error('Message not found');
    }

    message.is_read = true;
    return this.messageRepository.save(message);
  }

  async getUnreadMessages(userId: number): Promise<Message[]> {
    return this.messageRepository.find({
      where: { receiver: { user_id: userId }, is_read: false },
      relations: ['sender', 'receiver'],
      order: { created_at: 'DESC' },
    });
  }

  verifyToken(token: string): any {
    return this.jwtService.verify(token);
  }
}
