import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsInt, IsOptional, IsString, Min, Max } from 'class-validator';

export class UploadExcelDto {
  @ApiProperty({ type: 'string', format: 'binary', description: 'File Excel cần upload (.xlsx)' })
  file: Express.Multer.File;

  @ApiProperty({ description: 'Kỳ học (1, 2, 3...)', example: 1 })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(3)
  semester: number;

  @ApiProperty({ description: 'Năm học', example: 2025 })
  @IsNotEmpty()
  @IsInt()
  @Min(2000)
  year: number;

  @ApiProperty({ description: 'Mô tả về file/dữ liệu', required: false })
  @IsOptional()
  @IsString()
  description?: string;
} 