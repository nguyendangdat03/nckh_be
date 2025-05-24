import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { User } from '../entities/user.entity';
import { Class } from '../entities/class.entity';
import { Advisor } from '../entities/advisor.entity';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { FilterStudentsDto } from '../users/dto/filter-students.dto';
import { Role } from '../auth/roles.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Class)
    private classRepository: Repository<Class>,
    @InjectRepository(Advisor)
    private advisorRepository: Repository<Advisor>,
  ) {}

  async findAll(filterDto: FilterStudentsDto): Promise<User[]> {
    const query = this.usersRepository.createQueryBuilder('user')
      .where('user.role = :role', { role: Role.STUDENT });

    if (filterDto.username) {
      query.andWhere('user.username LIKE :username', { username: `%${filterDto.username}%` });
    }

    if (filterDto.student_code) {
      query.andWhere('user.student_code LIKE :student_code', { student_code: `%${filterDto.student_code}%` });
    }

    if (filterDto.class_id) {
      query.andWhere('user.class_id = :class_id', { class_id: filterDto.class_id });
    }

    if (filterDto.class_name) {
      query.andWhere('user.class_name LIKE :class_name', { class_name: `%${filterDto.class_name}%` });
    }

    return await query.getMany();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { user_id: id, role: Role.STUDENT },
      relations: ['class'],
    });
    
    if (!user) {
      throw new NotFoundException(`Không tìm thấy sinh viên với ID ${id}`);
    }
    
    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Đảm bảo role là STUDENT
    createUserDto.role = Role.STUDENT;
    
    // Kiểm tra mã sinh viên đã tồn tại chưa
    const existingStudent = await this.usersRepository.findOne({
      where: { student_code: createUserDto.student_code },
    });
    
    if (existingStudent) {
      throw new BadRequestException('Mã sinh viên đã tồn tại');
    }
    
    // Kiểm tra email đã tồn tại chưa
    const existingEmail = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });
    
    if (existingEmail) {
      throw new BadRequestException('Email đã tồn tại');
    }
    
    // Kiểm tra lớp học có tồn tại không
    if (createUserDto.class_id) {
      const classEntity = await this.classRepository.findOne({
        where: { class_id: createUserDto.class_id },
      });
      
      if (!classEntity) {
        throw new BadRequestException('Lớp học không tồn tại');
      }
    }
    
    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);
    
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });
    
    return await this.usersRepository.save(user);
  }

  async update(
    id: number,
    updateUserDto: Partial<CreateUserDto>,
  ): Promise<User> {
    const user = await this.findOne(id);
    
    // Nếu cập nhật mật khẩu, mã hóa mật khẩu mới
    if (updateUserDto.password) {
      const salt = await bcrypt.genSalt();
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, salt);
    }
    
    // Kiểm tra mã sinh viên không trùng với sinh viên khác
    if (updateUserDto.student_code && updateUserDto.student_code !== user.student_code) {
      const existingStudent = await this.usersRepository.findOne({
        where: { student_code: updateUserDto.student_code },
      });
      
      if (existingStudent) {
        throw new BadRequestException('Mã sinh viên đã tồn tại');
      }
    }
    
    // Kiểm tra email không trùng với sinh viên khác
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingEmail = await this.usersRepository.findOne({
        where: { email: updateUserDto.email },
      });
      
      if (existingEmail) {
        throw new BadRequestException('Email đã tồn tại');
      }
    }
    
    // Cập nhật thông tin
    Object.assign(user, updateUserDto);
    
    return await this.usersRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  async findByClassId(classId: number): Promise<User[]> {
    const classEntity = await this.classRepository.findOne({
      where: { class_id: classId },
    });
    
    if (!classEntity) {
      throw new NotFoundException(`Không tìm thấy lớp học với ID ${classId}`);
    }
    
    return this.usersRepository.find({
      where: { 
        class_id: classId,
        role: Role.STUDENT
      },
      relations: ['class'],
    });
  }

  async findByAdvisorId(advisorId: number): Promise<User[]> {
    const advisor = await this.advisorRepository.findOne({
      where: { user_id: advisorId },
      relations: ['classes'],
    });
    
    if (!advisor) {
      throw new NotFoundException(`Không tìm thấy cố vấn với ID ${advisorId}`);
    }
    
    // Lấy danh sách ID của các lớp mà cố vấn này quản lý
    const classIds = advisor.classes.map(c => c.class_id);
    
    if (classIds.length === 0) {
      return [];
    }
    
    // Sử dụngIn operator để tìm học sinh thuộc các lớp của cố vấn
    return this.usersRepository.find({
      where: {
        class_id: In(classIds),
        role: Role.STUDENT
      },
      relations: ['class'],
    });
  }
} 