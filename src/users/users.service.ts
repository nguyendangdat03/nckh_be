import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { Role } from '../auth/roles.enum';
import { AdvisorsService } from '../advisors/advisors.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @Inject(forwardRef(() => AdvisorsService))
    private advisorsService: AdvisorsService,
  ) {}

  async findAll(): Promise<User[]> {
    return await this.usersRepository.find();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { user_id: id },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create(createUserDto);
    return await this.usersRepository.save(user);
  }

  async update(
    id: number,
    updateUserDto: Partial<CreateUserDto>,
  ): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    const savedUser = await this.usersRepository.save(user);
    
    // Nếu user là cố vấn, cập nhật thông tin trong bảng advisors
    if (savedUser.role === Role.ADVISOR) {
      try {
        await this.advisorsService.updateFromUser(savedUser.user_id, savedUser);
      } catch (error) {
        console.log('Không tìm thấy thông tin cố vấn tương ứng', error);
      }
    }
    
    return savedUser;
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }
}
