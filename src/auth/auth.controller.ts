import { Controller, Post, Body, HttpCode, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginUserDto } from '../users/dto/login-user.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  @ApiResponse({ status: 201, description: 'Đăng ký thành công' })
  @ApiResponse({
    status: 409,
    description: 'Mã sinh viên hoặc email đã tồn tại',
  })
  register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Đăng nhập' })
  @ApiResponse({ status: 200, description: 'Đăng nhập thành công' })
  @ApiResponse({
    status: 401,
    description: 'Thông tin đăng nhập không chính xác',
  })
  login(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Đăng xuất' })
  @ApiResponse({ status: 200, description: 'Đăng xuất thành công' })
  @ApiResponse({
    status: 401,
    description: 'Token không hợp lệ',
  })
  logout(@Request() req) {
    const token = req.headers.authorization?.split(' ')[1];
    return this.authService.logout(token);
  }
}
