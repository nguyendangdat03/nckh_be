import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendMail(to: string, subject: string, template: string, context: any) {
    try {
      this.logger.log(`Đang gửi email đến ${to} với template ${template}`);
      
      // Kiểm tra xem có phải đang gửi HTML trực tiếp không
      if (context && context.content && typeof context.content === 'string' && context.content.trim().startsWith('<!DOCTYPE html')) {
        this.logger.log('Phát hiện nội dung HTML trực tiếp, sử dụng template custom_html');
        
        // Đảm bảo thư mục templates tồn tại
        const templateDir = path.join(__dirname, 'templates');
        if (!fs.existsSync(templateDir)) {
          fs.mkdirSync(templateDir, { recursive: true });
        }
        
        // Đảm bảo file custom_html.hbs tồn tại
        const customHtmlPath = path.join(templateDir, 'custom_html.hbs');
        if (!fs.existsSync(customHtmlPath)) {
          fs.writeFileSync(customHtmlPath, '{{{content}}}');
          this.logger.log(`Đã tạo template custom_html.hbs tại ${customHtmlPath}`);
        }
        
        template = 'custom_html';
      }
      
      // Kiểm tra đường dẫn template
      const templatePath = path.join(__dirname, 'templates', `${template}.hbs`);
      const templateExists = fs.existsSync(templatePath);
      this.logger.log(`Template ${template} tồn tại: ${templateExists}, đường dẫn: ${templatePath}`);
      
      if (!templateExists) {
        throw new Error(`Template ${template} không tồn tại tại đường dẫn ${templatePath}`);
      }
      
      const result = await this.mailerService.sendMail({
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
      this.logger.error(error.stack);
      return { 
        success: false, 
        message: `Không thể gửi email: ${error.message}`,
        error: error.message,
        stack: error.stack
      };
    }
  }
  
  async sendHtmlMail(to: string, subject: string, htmlContent: string) {
    try {
      this.logger.log(`Đang gửi HTML email đến ${to}`);
      
      const result = await this.mailerService.sendMail({
        to,
        subject,
        html: htmlContent,
      });

      this.logger.log(`Email HTML đã được gửi thành công đến ${to}`);
      return { 
        success: true, 
        message: 'Email HTML đã được gửi thành công',
        data: {
          to,
          subject
        }
      };
    } catch (error) {
      this.logger.error(`Lỗi khi gửi email HTML đến ${to}: ${error.message}`);
      this.logger.error(error.stack);
      return { 
        success: false, 
        message: `Không thể gửi email HTML: ${error.message}`,
        error: error.message,
        stack: error.stack
      };
    }
  }
} 