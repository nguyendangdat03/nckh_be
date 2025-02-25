import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsEmail, IsNumber } from "class-validator";

export class CreateAdvisorDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  user_id: number;

  @ApiProperty()
  @IsNotEmpty()
  advisor_code: string;

  @ApiProperty()
  @IsNotEmpty()
  full_name: string;

  @ApiProperty()
  @IsNotEmpty()
  department: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  contact_email: string;
}
