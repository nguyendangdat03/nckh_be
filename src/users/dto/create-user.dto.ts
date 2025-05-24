import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsEmail,
  MinLength,
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { Role } from '../../auth/roles.enum';

export class CreateUserDto {
  @ApiProperty()
  @IsNotEmpty()
  username: string;

  @ApiProperty()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Mã sinh viên hoặc mã giảng viên' })
  @IsNotEmpty()
  @IsString()
  student_code: string;

  @ApiProperty({ description: 'Tên lớp (đối với sinh viên) hoặc khoa (đối với cố vấn)' })
  @IsNotEmpty()
  @IsString()
  class_name: string;

  @ApiProperty({ description: 'ID của lớp học', required: false })
  @IsOptional()
  @IsNumber()
  class_id?: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  phone_number: string;

  @ApiProperty({ enum: Role, default: Role.STUDENT, description: 'Vai trò người dùng (student/advisor)' })
  @IsEnum(Role)
  role?: Role = Role.STUDENT;
}
