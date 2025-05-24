import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendHtmlMailDto {
  @ApiProperty({
    example: 'nguoinhan@example.com',
    description: 'Email của người nhận',
  })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email người nhận không được để trống' })
  to: string;

  @ApiProperty({
    example: 'Thông báo quan trọng',
    description: 'Tiêu đề của email',
  })
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề email không được để trống' })
  subject: string;

  @ApiProperty({
    example: '<!DOCTYPE html><html><head><title>Email</title></head><body><h1>Xin chào!</h1></body></html>',
    description: 'Nội dung HTML của email',
  })
  @IsString()
  @IsNotEmpty({ message: 'Nội dung HTML không được để trống' })
  html: string;
} 