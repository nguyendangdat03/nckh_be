import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateChatBoxDto {
  @ApiProperty({ description: 'ID của người dùng muốn tạo box chat' })
  @IsNumber()
  @IsNotEmpty()
  user_id: number;
} 