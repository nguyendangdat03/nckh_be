import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import { Message } from '../entities/message.entity';
import { ChatBox } from '../entities/chat-box.entity';
import { CreateChatBoxDto } from './dto/create-chat-box.dto';

@ApiTags('chat')
@Controller('chat')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('messages/:userId')
  @Roles(Role.ADMIN, Role.ADVISOR, Role.STUDENT)
  @ApiOperation({ summary: 'Lấy lịch sử chat với một người dùng' })
  @ApiResponse({ status: 200, description: 'Thành công', type: [Message] })
  async getMessages(
    @Request() req,
    @Param('userId') otherUserId: number,
  ): Promise<Message[]> {
    return this.chatService.getMessages(req.user.userId, otherUserId);
  }

  @Get('unread')
  @Roles(Role.ADMIN, Role.ADVISOR, Role.STUDENT)
  @ApiOperation({ summary: 'Lấy danh sách tin nhắn chưa đọc' })
  @ApiResponse({ status: 200, description: 'Thành công', type: [Message] })
  async getUnreadMessages(@Request() req): Promise<Message[]> {
    return this.chatService.getUnreadMessages(req.user.userId);
  }

  @Post('messages/:messageId/read')
  @Roles(Role.ADMIN, Role.ADVISOR, Role.STUDENT)
  @ApiOperation({ summary: 'Đánh dấu tin nhắn đã đọc' })
  @ApiResponse({ status: 200, description: 'Thành công', type: Message })
  async markMessageAsRead(
    @Request() req,
    @Param('messageId') messageId: number,
  ): Promise<Message> {
    return this.chatService.markMessageAsRead(messageId, req.user.userId);
  }

  @Post('messages')
  @Roles(Role.ADMIN, Role.ADVISOR, Role.STUDENT)
  @ApiOperation({ summary: 'Gửi tin nhắn mới' })
  @ApiResponse({ status: 201, description: 'Gửi tin nhắn thành công', type: Message })
  async sendMessage(
    @Request() req,
    @Body() body: { receiverId: number; content: string },
  ): Promise<Message> {
    return this.chatService.createMessage(req.user.userId, body.receiverId, body.content);
  }

  // ChatBox endpoints
  @Post('boxes')
  @Roles(Role.ADVISOR, Role.STUDENT)
  @ApiOperation({ summary: 'Tạo box chat mới với người dùng khác' })
  @ApiResponse({ status: 201, description: 'Tạo box chat thành công', type: ChatBox })
  async createChatBox(
    @Request() req,
    @Body() createChatBoxDto: CreateChatBoxDto,
  ): Promise<ChatBox> {
    // Tạo box chat với người dùng được chỉ định
    return this.chatService.createChatBox(createChatBoxDto, req.user.userId);
  }

  @Post('boxes/:id')
  @Roles(Role.ADVISOR, Role.STUDENT)
  @ApiOperation({ summary: 'Tạo box chat mới với người dùng có ID cụ thể' })
  @ApiResponse({ status: 201, description: 'Tạo box chat thành công', type: ChatBox })
  async createChatBoxWithId(
    @Request() req,
    @Param('id') userId: number,
  ): Promise<ChatBox> {
    // Tạo box chat với người dùng có ID từ URL
    const createChatBoxDto = { user_id: +userId };
    return this.chatService.createChatBox(createChatBoxDto, req.user.userId);
  }
  
  @Get('boxes')
  @Roles(Role.ADMIN, Role.ADVISOR, Role.STUDENT)
  @ApiOperation({ summary: 'Lấy danh sách box chat của người dùng hiện tại' })
  @ApiResponse({ status: 200, description: 'Thành công', type: [ChatBox] })
  async getChatBoxes(@Request() req): Promise<ChatBox[]> {
    return this.chatService.getChatBoxesByUserId(req.user.userId);
  }
  
  @Get('boxes/:id')
  @Roles(Role.ADMIN, Role.ADVISOR, Role.STUDENT)
  @ApiOperation({ summary: 'Lấy thông tin chi tiết của một box chat' })
  @ApiResponse({ status: 200, description: 'Thành công', type: ChatBox })
  async getChatBoxById(@Request() req, @Param('id') id: number): Promise<ChatBox> {
    const chatBox = await this.chatService.getChatBoxById(id);
    
    // Kiểm tra quyền: chỉ có thể xem box chat của chính mình
    if (req.user.role !== Role.ADMIN && 
        req.user.userId !== chatBox.student_id && 
        req.user.userId !== chatBox.advisor_id) {
      throw new ForbiddenException('Bạn không có quyền xem box chat này');
    }
    
    return chatBox;
  }
  
  @Get('boxes/:id/messages')
  @Roles(Role.ADMIN, Role.ADVISOR, Role.STUDENT)
  @ApiOperation({ summary: 'Lấy danh sách tin nhắn trong một box chat' })
  @ApiResponse({ status: 200, description: 'Thành công', type: [Message] })
  async getMessagesByChatBoxId(@Request() req, @Param('id') id: number): Promise<Message[]> {
    const chatBox = await this.chatService.getChatBoxById(id);
    
    // Kiểm tra quyền: chỉ có thể xem tin nhắn trong box chat của chính mình
    if (req.user.role !== Role.ADMIN && 
        req.user.userId !== chatBox.student_id && 
        req.user.userId !== chatBox.advisor_id) {
      throw new ForbiddenException('Bạn không có quyền xem tin nhắn trong box chat này');
    }
    
    return this.chatService.getMessagesByChatBoxId(id);
  }
  
  @Post('boxes/:id/messages')
  @Roles(Role.ADVISOR, Role.STUDENT)
  @ApiOperation({ summary: 'Gửi tin nhắn trong một box chat' })
  @ApiResponse({ status: 201, description: 'Gửi tin nhắn thành công', type: Message })
  async sendMessageToChatBox(
    @Request() req,
    @Param('id') id: number,
    @Body() body: { content: string },
  ): Promise<Message> {
    const chatBox = await this.chatService.getChatBoxById(id);
    
    // Kiểm tra quyền: chỉ có thể gửi tin nhắn trong box chat của chính mình
    if (req.user.userId !== chatBox.student_id && req.user.userId !== chatBox.advisor_id) {
      throw new ForbiddenException('Bạn không có quyền gửi tin nhắn trong box chat này');
    }
    
    return this.chatService.sendMessageToChatBox(id, req.user.userId, body.content);
  }
}
