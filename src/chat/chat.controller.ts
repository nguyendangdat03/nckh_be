import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
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
}
