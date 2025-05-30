import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import * as fs from 'fs';
import * as path from 'path';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Advisor } from '../entities/advisor.entity';
import { Class } from '../entities/class.entity';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailerService: MailerService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Advisor)
    private readonly advisorRepository: Repository<Advisor>,
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
  ) {}

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

  async sendAcademicWarningEmails(studentCodes: string[], semester: number, year: number, studentTemplate = 'academic_warning', advisorTemplate = 'advisor_warning') {
    this.logger.log(`Đang gửi email cảnh báo học tập cho ${studentCodes.length} sinh viên`);
    
    const results: {
      success: boolean;
      studentEmails: Array<{
        student_code: string;
        email: string;
        result: any;
      }>;
      advisorEmails: Array<{
        advisor_name: string;
        email: string;
        class_name: string;
        student_count: number;
        result: any;
      }>;
      errors: string[];
    } = {
      success: true,
      studentEmails: [],
      advisorEmails: [],
      errors: []
    };

    // Danh sách các sinh viên đã được gửi email theo lớp
    const classSummary = new Map<string, { advisor: Advisor, students: any[] }>();
    
    // Lấy thông tin chi tiết của sinh viên
    for (const studentCode of studentCodes) {
      try {
        // Tìm thông tin sinh viên
        const student = await this.userRepository.findOne({
          where: { student_code: studentCode },
          relations: ['class', 'advisor']
        });

        if (!student) {
          this.logger.warn(`Không tìm thấy sinh viên với mã ${studentCode}`);
          results.errors.push(`Không tìm thấy sinh viên với mã ${studentCode}`);
          continue;
        }

        // Tìm thông tin lớp và cố vấn học tập
        if (!student.class_id) {
          this.logger.warn(`Sinh viên ${studentCode} không thuộc lớp nào`);
          results.errors.push(`Sinh viên ${studentCode} không thuộc lớp nào`);
          continue;
        }

        const classInfo = await this.classRepository.findOne({
          where: { class_id: student.class_id },
          relations: ['advisor']
        });

        if (!classInfo) {
          this.logger.warn(`Không tìm thấy thông tin lớp cho sinh viên ${studentCode}`);
          results.errors.push(`Không tìm thấy thông tin lớp cho sinh viên ${studentCode}`);
          continue;
        }

        const advisor = await this.advisorRepository.findOne({
          where: { advisor_id: classInfo.advisor_id }
        });

        if (!advisor) {
          this.logger.warn(`Không tìm thấy cố vấn học tập cho lớp ${classInfo.class_name}`);
          results.errors.push(`Không tìm thấy cố vấn học tập cho lớp ${classInfo.class_name}`);
          continue;
        }

        // Kiểm tra xem sinh viên có thuộc về lớp của giảng viên không
        if (student.class_id !== classInfo.class_id) {
          this.logger.warn(`Sinh viên ${studentCode} không thuộc lớp ${classInfo.class_name}`);
          results.errors.push(`Sinh viên ${studentCode} không thuộc lớp ${classInfo.class_name}`);
          continue;
        }

        // Gửi email cho sinh viên
        const studentEmailResult = await this.sendMail(
          student.email,
          `CẢNH BÁO HỌC TẬP - Kỳ ${semester}/${year}`,
          studentTemplate,
          {
            student_name: student.username,
            student_code: student.student_code,
            class_name: classInfo.class_name,
            semester: semester,
            year: year,
            gpa: 'Chưa cập nhật', // Cần cập nhật từ dữ liệu Excel
            reason: 'Điểm trung bình học kỳ dưới ngưỡng quy định', // Cần cập nhật từ dữ liệu Excel
            advisor_name: advisor.full_name,
            advisor_email: advisor.contact_email,
            current_year: new Date().getFullYear()
          }
        );

        results.studentEmails.push({
          student_code: student.student_code,
          email: student.email,
          result: studentEmailResult
        });

        // Thêm sinh viên vào danh sách theo lớp
        if (!classSummary.has(classInfo.class_name)) {
          classSummary.set(classInfo.class_name, {
            advisor: advisor,
            students: []
          });
        }

        const classData = classSummary.get(classInfo.class_name);
        if (classData) {
          classData.students.push({
            student_code: student.student_code,
            student_name: student.username,
            gpa: 'Chưa cập nhật', // Cần cập nhật từ dữ liệu Excel
            reason: 'Điểm trung bình học kỳ dưới ngưỡng quy định' // Cần cập nhật từ dữ liệu Excel
          });
        }

      } catch (error) {
        this.logger.error(`Lỗi khi xử lý sinh viên ${studentCode}: ${error.message}`);
        results.errors.push(`Lỗi khi xử lý sinh viên ${studentCode}: ${error.message}`);
        results.success = false;
      }
    }

    // Gửi email cho giảng viên cố vấn học tập của từng lớp
    for (const [className, data] of classSummary.entries()) {
      try {
        const { advisor, students } = data;
        
        const advisorUser = await this.userRepository.findOne({
          where: { user_id: advisor.user_id }
        });

        if (!advisorUser) {
          this.logger.warn(`Không tìm thấy thông tin người dùng cho cố vấn ${advisor.full_name}`);
          results.errors.push(`Không tìm thấy thông tin người dùng cho cố vấn ${advisor.full_name}`);
          continue;
        }

        const advisorEmailResult = await this.sendMail(
          advisor.contact_email || advisorUser.email,
          `THÔNG BÁO SINH VIÊN BỊ CẢNH BÁO HỌC TẬP - Lớp ${className} - Kỳ ${semester}/${year}`,
          advisorTemplate,
          {
            advisor_name: advisor.full_name,
            class_name: className,
            warning_count: students.length,
            semester: semester,
            year: year,
            students: students,
            current_year: new Date().getFullYear()
          }
        );

        results.advisorEmails.push({
          advisor_name: advisor.full_name,
          email: advisor.contact_email || advisorUser.email,
          class_name: className,
          student_count: students.length,
          result: advisorEmailResult
        });
      } catch (error) {
        this.logger.error(`Lỗi khi gửi email cho cố vấn lớp ${className}: ${error.message}`);
        results.errors.push(`Lỗi khi gửi email cho cố vấn lớp ${className}: ${error.message}`);
        results.success = false;
      }
    }

    return results;
  }
} 