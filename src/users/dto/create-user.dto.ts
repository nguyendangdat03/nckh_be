import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsEmail, MinLength } from "class-validator";

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

  @ApiProperty()
  role?: string;
}
