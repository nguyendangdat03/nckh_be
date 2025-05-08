import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginUserDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  student_code: string;

  @ApiProperty()
  @IsNotEmpty()
  password: string;
}
