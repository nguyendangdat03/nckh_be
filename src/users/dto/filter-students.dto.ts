import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';

export class FilterStudentsDto {
  @ApiProperty({ required: false, description: 'Tìm kiếm theo tên sinh viên' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ required: false, description: 'Tìm kiếm theo mã sinh viên' })
  @IsOptional()
  @IsString()
  student_code?: string;

  @ApiProperty({ required: false, description: 'Lọc theo lớp học' })
  @IsOptional()
  @IsNumber()
  class_id?: number;

  @ApiProperty({ required: false, description: 'Lọc theo tên lớp học' })
  @IsOptional()
  @IsString()
  class_name?: string;
} 