import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsEmail, IsNumber, IsOptional } from "class-validator";

export class CreateAdvisorDto {
  @ApiProperty()
  @IsNumber()
  @IsOptional()
  user_id?: number;

  @ApiProperty({ description: 'Mã giảng viên/cố vấn' })
  @IsNotEmpty()
  advisor_code: string;

  @ApiProperty({ description: 'Họ và tên đầy đủ của cố vấn' })
  @IsNotEmpty()
  full_name: string;

  @ApiProperty({ description: 'Khoa/Phòng ban' })
  @IsNotEmpty()
  department: string;

  @ApiProperty({ description: 'Email liên hệ' })
  @IsEmail()
  @IsNotEmpty()
  contact_email: string;

  @ApiProperty({ description: 'Số điện thoại liên hệ', required: false })
  @IsOptional()
  phone?: string;
}
