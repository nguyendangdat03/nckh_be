import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class AddStudentDto {
  @ApiProperty({ description: 'ID của sinh viên' })
  @IsNotEmpty()
  @IsNumber()
  userId: number;
} 