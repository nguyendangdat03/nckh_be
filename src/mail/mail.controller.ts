import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { MailService } from './mail.service';
import { SendMailDto } from './dto/send-mail.dto';
import { SendHtmlMailDto } from './dto/send-html-mail.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Mail')
@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('send')
  @ApiOperation({ summary: 'Gửi email sử dụng template' })
  @ApiResponse({
    status: 200,
    description: 'Gửi email thành công',
    schema: {
      example: {
        success: true,
        message: 'Email đã được gửi thành công',
        data: {
          to: 'nguoinhan@example.com',
          subject: 'Chào mừng bạn đến với hệ thống',
          template: 'welcome'
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu không hợp lệ',
    schema: {
      example: {
        statusCode: 400,
        message: 'Email không hợp lệ',
        error: 'Bad Request'
      }
    }
  })
  @ApiResponse({
    status: 500,
    description: 'Lỗi server',
    schema: {
      example: {
        statusCode: 500,
        message: 'Không thể gửi email: Connection refused',
        error: 'Internal Server Error'
      }
    }
  })
  async sendMail(@Body() mailData: SendMailDto) {
    try {
      const result = await this.mailService.sendMail(
        mailData.to,
        mailData.subject,
        mailData.template,
        mailData.context,
      );
      
      if (!result.success) {
        throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
      }
      
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Có lỗi xảy ra khi gửi email',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('send-html')
  @ApiOperation({ summary: 'Gửi email với nội dung HTML trực tiếp' })
  @ApiResponse({
    status: 200,
    description: 'Gửi email thành công',
    schema: {
      example: {
        success: true,
        message: 'Email HTML đã được gửi thành công',
        data: {
          to: 'nguoinhan@example.com',
          subject: 'Thông báo quan trọng'
        }
      }
    }
  })
  async sendHtmlMail(@Body() mailData: SendHtmlMailDto) {
    try {
      const result = await this.mailService.sendHtmlMail(
        mailData.to,
        mailData.subject,
        mailData.html,
      );
      
      if (!result.success) {
        throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
      }
      
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Có lỗi xảy ra khi gửi email HTML',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
} 