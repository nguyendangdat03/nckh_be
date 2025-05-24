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
import { Role } from './roles.enum';
import { AdvisorsService } from '../advisors/advisors.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private advisorsService: AdvisorsService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    // Kiểm tra trùng mã sinh viên/giảng viên
    const existingUsers = await this.usersService.findAll();
    const studentCodeExists = existingUsers.some(
      (user) => user.student_code === createUserDto.student_code,
    );
    if (studentCodeExists) {
      throw new ConflictException('Mã sinh viên/giảng viên đã tồn tại trong hệ thống');
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

    // Nếu là cố vấn, tạo thêm bản ghi trong bảng advisors
    if (newUser.role === Role.ADVISOR) {
      await this.advisorsService.create({
        user_id: newUser.user_id,
        advisor_code: newUser.student_code,
        full_name: newUser.username,
        department: newUser.class_name,
        contact_email: newUser.email,
      });
    }

    // Loại bỏ password trước khi trả về
    const { password, ...result } = newUser;
    return result;
  }

  async login(loginUserDto: LoginUserDto) {
    // Tìm user bằng mã sinh viên/giảng viên
    const users = await this.usersService.findAll();
    const user = users.find(
      (u) => u.student_code === loginUserDto.student_code,
    );

    if (!user) {
      throw new UnauthorizedException('Mã sinh viên/giảng viên không tồn tại');
    }

    // Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(
      loginUserDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Mật khẩu không chính xác');
    }

    // Tạo jwt token với đầy đủ thông tin
    const payload = { 
      sub: user.user_id, 
      username: user.username,
      userId: user.user_id,
      role: user.role
    };

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

  async logout(token: string) {
    try {
      // Xác thực token
      const decoded = this.jwtService.verify(token);
      
      // Trả về thông báo đăng xuất thành công
      return {
        success: true,
        message: 'Đăng xuất thành công'
      };
    } catch (error) {
      throw new UnauthorizedException('Token không hợp lệ');
    }
  }
}
