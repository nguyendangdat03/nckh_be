import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Message } from '../entities/message.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedClients: Map<number, Socket> = new Map();

  constructor(private readonly chatService: ChatService) {}

  async handleConnection(client: Socket) {
    const userId = this.getUserIdFromSocket(client);
    if (userId) {
      this.connectedClients.set(userId, client);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.getUserIdFromSocket(client);
    if (userId) {
      this.connectedClients.delete(userId);
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    client: Socket,
    payload: { receiverId: number; content: string },
  ) {
    const senderId = this.getUserIdFromSocket(client);
    if (!senderId) return;

    const message = await this.chatService.createMessage(
      senderId,
      payload.receiverId,
      payload.content,
    );

    // Gửi tin nhắn cho người nhận nếu họ đang online
    const receiverSocket = this.connectedClients.get(payload.receiverId);
    if (receiverSocket) {
      receiverSocket.emit('newMessage', message);
    }

    return message;
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(client: Socket, messageId: number) {
    const userId = this.getUserIdFromSocket(client);
    if (!userId) return;

    const message = await this.chatService.markMessageAsRead(messageId, userId);

    // Thông báo cho người gửi nếu họ đang online
    const senderSocket = this.connectedClients.get(message.sender.user_id);
    if (senderSocket) {
      senderSocket.emit('messageRead', { messageId, readBy: userId });
    }

    return message;
  }

  private getUserIdFromSocket(client: Socket): number | null {
    const token = client.handshake.auth.token;
    if (!token) return null;

    try {
      const decoded = this.chatService.verifyToken(token);
      return decoded.userId;
    } catch {
      return null;
    }
  }
}
