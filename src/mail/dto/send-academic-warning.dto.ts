import { IsNotEmpty, IsString, IsArray, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class StudentWarning {
  @ApiProperty({
    example: 'B21DCCN123',
    description: 'Mã sinh viên',
  })
  @IsString()
  @IsNotEmpty()
  student_code: string;

  @ApiProperty({
    example: 'Nguyễn Văn A',
    description: 'Tên sinh viên',
  })
  @IsString()
  @IsOptional()
  student_name?: string;

  @ApiProperty({
    example: 'D21CQCN01-N',
    description: 'Tên lớp',
  })
  @IsString()
  @IsOptional()
  class_name?: string;

  @ApiProperty({
    example: 2.0,
    description: 'Điểm trung bình',
  })
  @IsNumber()
  @IsOptional()
  gpa?: number;

  @ApiProperty({
    example: 'Điểm trung bình dưới 2.0',
    description: 'Lý do cảnh báo học tập',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class SendAcademicWarningDto {
  @ApiProperty({
    type: [StudentWarning],
    description: 'Danh sách sinh viên cần gửi cảnh báo học tập',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentWarning)
  @IsNotEmpty()
  students: StudentWarning[];

  @ApiProperty({
    example: 1,
    description: 'Học kỳ',
  })
  @IsNumber()
  @IsNotEmpty()
  semester: number;

  @ApiProperty({
    example: 2023,
    description: 'Năm học',
  })
  @IsNumber()
  @IsNotEmpty()
  year: number;

  @ApiProperty({
    example: 'excel_file.xlsx',
    description: 'Tên file Excel được tải lên',
  })
  @IsString()
  @IsOptional()
  excelFileName?: string;

  @ApiProperty({
    example: 'academic_warning',
    description: 'Tên template email cho sinh viên',
    default: 'academic_warning'
  })
  @IsString()
  @IsOptional()
  studentTemplate?: string;

  @ApiProperty({
    example: 'advisor_warning',
    description: 'Tên template email cho giảng viên',
    default: 'advisor_warning'
  })
  @IsString()
  @IsOptional()
  advisorTemplate?: string;
} 