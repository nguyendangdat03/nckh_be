import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendMail(to: string, subject: string, template: string, context: any) {
    try {
      this.logger.log(`Đang gửi email đến ${to} với template ${template}`);
      
      await this.mailerService.sendMail({
        to,
        subject,
        template,
        context,
      });

      this.logger.log(`Email đã được gửi thành công đến ${to}`);
      return { 
        success: true, 
        message: 'Email đã được gửi thành công',
        data: {
          to,
          subject,
          template
        }
      };
    } catch (error) {
      this.logger.error(`Lỗi khi gửi email đến ${to}: ${error.message}`);
      return { 
        success: false, 
        message: `Không thể gửi email: ${error.message}`,
        error: error.message
      };
    }
  }
} 