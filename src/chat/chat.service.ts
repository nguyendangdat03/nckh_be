import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../entities/message.entity';
import { User } from '../entities/user.entity';
import { ChatBox } from '../entities/chat-box.entity';
import { JwtService } from '@nestjs/jwt';
import { CreateChatBoxDto } from './dto/create-chat-box.dto';
import { Role } from '../auth/roles.enum';
import { AdvisorsService } from '../advisors/advisors.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ChatBox)
    private chatBoxRepository: Repository<ChatBox>,
    private jwtService: JwtService,
    private advisorsService: AdvisorsService,
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

  // ChatBox methods
  async createChatBox(createChatBoxDto: CreateChatBoxDto, currentUserId: number): Promise<ChatBox> {
    const otherUserId = createChatBoxDto.user_id;
    const currentUserId2 = currentUserId;
    
    // Kiểm tra xem người dùng có tồn tại không
    const currentUser = await this.userRepository.findOne({
      where: { user_id: currentUserId2 },
    });
    
    if (!currentUser) {
      throw new NotFoundException('Không tìm thấy người dùng hiện tại');
    }
    
    const otherUser = await this.userRepository.findOne({
      where: { user_id: otherUserId },
    });
    
    if (!otherUser) {
      throw new NotFoundException('Không tìm thấy người dùng được chỉ định');
    }
    
    // Không cho phép tạo chat với chính mình
    if (currentUserId2 === otherUserId) {
      throw new ForbiddenException('Không thể tạo box chat với chính mình');
    }
    
    // Xác định student_id và advisor_id (để giữ tương thích với DB)
    // Ở đây chúng ta sắp xếp các ID để đảm bảo nhất quán
    const [student_id, advisor_id] = [currentUserId2, otherUserId].sort((a, b) => a - b);
    
    // Kiểm tra xem đã tồn tại box chat giữa hai người dùng chưa
    const existingChatBox = await this.chatBoxRepository.findOne({
      where: [
        { student_id, advisor_id },
        { student_id: advisor_id, advisor_id: student_id }
      ]
    });
    
    if (existingChatBox) {
      return existingChatBox;
    }
    
    // Tạo box chat mới
    const chatBox = this.chatBoxRepository.create({
      student_id,
      advisor_id,
    });
    
    return this.chatBoxRepository.save(chatBox);
  }
  
  async getChatBoxById(chatBoxId: number): Promise<ChatBox> {
    const chatBox = await this.chatBoxRepository.findOne({
      where: { id: chatBoxId },
      relations: ['student', 'advisor', 'messages', 'messages.sender'],
    });
    
    if (!chatBox) {
      throw new NotFoundException('Không tìm thấy box chat');
    }
    
    return chatBox;
  }
  
  async getChatBoxesByUserId(userId: number): Promise<ChatBox[]> {
    const user = await this.userRepository.findOne({
      where: { user_id: userId },
    });
    
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    
    if (user.role === Role.STUDENT) {
      return this.chatBoxRepository.find({
        where: { student_id: userId },
        relations: ['advisor'],
      });
    } else if (user.role === Role.ADVISOR) {
      return this.chatBoxRepository.find({
        where: { advisor_id: userId },
        relations: ['student'],
      });
    } else {
      return this.chatBoxRepository.find({
        relations: ['student', 'advisor'],
      });
    }
  }
  
  async sendMessageToChatBox(chatBoxId: number, senderId: number, content: string): Promise<Message> {
    const chatBox = await this.getChatBoxById(chatBoxId);
    
    // Kiểm tra xem người gửi có phải là một trong hai người trong box chat không
    if (senderId !== chatBox.student_id && senderId !== chatBox.advisor_id) {
      throw new ForbiddenException('Bạn không có quyền gửi tin nhắn trong box chat này');
    }
    
    const sender = await this.userRepository.findOne({
      where: { user_id: senderId },
    });
    
    // Xác định người nhận là người còn lại trong box chat
    const receiverId = senderId === chatBox.student_id ? chatBox.advisor_id : chatBox.student_id;
    const receiver = await this.userRepository.findOne({
      where: { user_id: receiverId },
    });
    
    if (!sender || !receiver) {
      throw new NotFoundException('Không tìm thấy người gửi hoặc người nhận');
    }
    
    const message = this.messageRepository.create({
      content,
      sender,
      receiver,
      chat_box: chatBox,
      is_read: false,
    });
    
    return await this.messageRepository.save(message);
  }
  
  async getMessagesByChatBoxId(chatBoxId: number): Promise<Message[]> {
    const chatBox = await this.getChatBoxById(chatBoxId);
    
    return this.messageRepository.find({
      where: { chat_box: { id: chatBoxId } },
      relations: ['sender', 'receiver'],
      order: { created_at: 'ASC' },
    });
  }
}
