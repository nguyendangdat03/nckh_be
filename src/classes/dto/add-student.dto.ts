import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class AddStudentDto {
  @ApiProperty({ description: 'ID của sinh viên' })
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @ApiProperty({ description: 'ID của cố vấn học tập' })
  @IsNotEmpty()
  @IsNumber()
  advisorId: number;
} 