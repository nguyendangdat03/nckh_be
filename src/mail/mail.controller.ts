import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { MailService } from './mail.service';
import { SendMailDto } from './dto/send-mail.dto';
import { SendHtmlMailDto } from './dto/send-html-mail.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ExcelService } from '../excel/excel.service';
import { SendAcademicWarningDto } from './dto/send-academic-warning.dto';

@ApiTags('Mail')
@Controller('mail')
export class MailController {
  constructor(
    private readonly mailService: MailService,
    private readonly excelService: ExcelService,
  ) {}

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

  @Post('academic-warning')
  @ApiOperation({ summary: 'Phân tích file Excel và gửi cảnh báo học tập' })
  @ApiResponse({
    status: 200,
    description: 'Gửi cảnh báo học tập thành công',
    schema: {
      example: {
        success: true,
        message: 'Đã gửi cảnh báo học tập thành công',
        data: {
          total_students: 5,
          warning_count: 2,
          student_emails: 2,
          advisor_emails: 1
        }
      }
    }
  })
  async sendAcademicWarnings(@Body() warningData: SendAcademicWarningDto) {
    try {
      // Nếu có danh sách sinh viên trực tiếp
      if (warningData.students && warningData.students.length > 0) {
        const studentCodes = warningData.students.map(student => student.student_code);
        
        const result = await this.mailService.sendAcademicWarningEmails(
          studentCodes,
          warningData.semester,
          warningData.year,
          warningData.studentTemplate || 'academic_warning',
          warningData.advisorTemplate || 'advisor_warning'
        );
        
        return {
          success: result.success,
          message: result.success 
            ? 'Đã gửi cảnh báo học tập thành công' 
            : 'Có lỗi xảy ra khi gửi cảnh báo học tập',
          data: {
            total_students: studentCodes.length,
            warning_count: studentCodes.length,
            student_emails: result.studentEmails.length,
            advisor_emails: result.advisorEmails.length
          },
          errors: result.errors
        };
      }
      
      // Nếu có tên file Excel
      if (warningData.excelFileName) {
        const bucketName = 'excel'; // Bucket mặc định cho file Excel
        
        // Phân tích file Excel để tìm sinh viên bị cảnh báo
        const analysis = await this.excelService.analyzeAcademicWarnings(
          bucketName,
          warningData.excelFileName
        );
        
        if (analysis.warningCount === 0) {
          return {
            success: true,
            message: 'Không tìm thấy sinh viên nào bị cảnh báo học tập',
            data: {
              total_students: analysis.totalStudents,
              warning_count: 0,
              student_emails: 0,
              advisor_emails: 0
            }
          };
        }
        
        // Gửi email cảnh báo
        const result = await this.mailService.sendAcademicWarningEmails(
          analysis.studentCodes,
          warningData.semester,
          warningData.year,
          warningData.studentTemplate || 'academic_warning',
          warningData.advisorTemplate || 'advisor_warning'
        );
        
        return {
          success: result.success,
          message: result.success 
            ? `Đã gửi cảnh báo học tập thành công cho ${result.studentEmails.length} sinh viên` 
            : 'Có lỗi xảy ra khi gửi cảnh báo học tập',
          data: {
            total_students: analysis.totalStudents,
            warning_count: analysis.warningCount,
            student_emails: result.studentEmails.length,
            advisor_emails: result.advisorEmails.length,
            warnings: analysis.warnings
          },
          errors: result.errors
        };
      }
      
      throw new HttpException(
        'Vui lòng cung cấp danh sách sinh viên hoặc tên file Excel',
        HttpStatus.BAD_REQUEST
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Có lỗi xảy ra khi gửi cảnh báo học tập',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
} 