import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginUserDto } from '../users/dto/login-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    // Kiểm tra trùng mã sinh viên
    const existingUsers = await this.usersService.findAll();
    const studentCodeExists = existingUsers.some(
      (user) => user.student_code === createUserDto.student_code,
    );
    if (studentCodeExists) {
      throw new ConflictException('Mã sinh viên đã tồn tại trong hệ thống');
    }

    // Kiểm tra trùng email
    const emailExists = existingUsers.some(
      (user) => user.email === createUserDto.email,
    );
    if (emailExists) {
      throw new ConflictException('Email đã được sử dụng');
    }

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    // Tạo user mới với mật khẩu đã mã hóa
    const newUser = await this.usersService.create({
      ...createUserDto,
      password: hashedPassword,
    });

    // Loại bỏ password trước khi trả về
    const { password, ...result } = newUser;
    return result;
  }

  async login(loginUserDto: LoginUserDto) {
    // Tìm user bằng mã sinh viên
    const users = await this.usersService.findAll();
    const user = users.find(
      (u) => u.student_code === loginUserDto.student_code,
    );

    if (!user) {
      throw new UnauthorizedException('Mã sinh viên không tồn tại');
    }

    // Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(
      loginUserDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Mật khẩu không chính xác');
    }

    // Tạo jwt token
    const payload = { sub: user.user_id, username: user.username };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        student_code: user.student_code,
        class_name: user.class_name,
        phone_number: user.phone_number,
        role: user.role,
      },
    };
  }
}
