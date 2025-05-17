import { IsEmail, IsNotEmpty, IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMailDto {
  @ApiProperty({
    example: 'nguoinhan@example.com',
    description: 'Email của người nhận',
  })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email người nhận không được để trống' })
  to: string;

  @ApiProperty({
    example: 'Chào mừng bạn đến với hệ thống',
    description: 'Tiêu đề của email',
  })
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề email không được để trống' })
  subject: string;

  @ApiProperty({
    example: 'welcome',
    description: 'Tên template email (ví dụ: welcome, notification, etc.)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Template không được để trống' })
  template: string;

  @ApiProperty({
    example: {
      name: 'Nguyễn Văn A',
      email: 'nguoinhan@example.com',
      username: 'nguyenvana'
    },
    description: 'Dữ liệu để điền vào template email',
    required: false
  })
  @IsObject()
  @IsOptional()
  context?: Record<string, any>;
} 