import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Advisor } from '../entities/advisor.entity';
import { Class } from '../entities/class.entity';
import { User } from '../entities/user.entity';
import { CreateAdvisorDto } from './dto/create-advisor.dto';
import { UsersService } from '../users/users.service';
import { Role } from '../auth/roles.enum';

@Injectable()
export class AdvisorsService {
  constructor(
    @InjectRepository(Advisor)
    private advisorsRepository: Repository<Advisor>,
    @InjectRepository(Class)
    private classesRepository: Repository<Class>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
  ) {}

  async findAll(): Promise<Advisor[]> {
    return await this.advisorsRepository.find({
      relations: ['user', 'classes'],
    });
  }

  async findAllAdvisorUsers(): Promise<User[]> {
    return await this.usersRepository.find({
      where: { role: Role.ADVISOR },
      relations: ['class'],
    });
  }

  async findOne(id: number): Promise<Advisor> {
    const advisor = await this.advisorsRepository.findOne({
      where: { advisor_id: id },
      relations: ['user', 'classes'],
    });
    if (!advisor) {
      throw new NotFoundException(`Advisor with ID ${id} not found`);
    }
    return advisor;
  }

  async findByUserId(userId: number): Promise<Advisor> {
    const advisor = await this.advisorsRepository.findOne({
      where: { user_id: userId },
      relations: ['user', 'classes'],
    });
    if (!advisor) {
      throw new NotFoundException(`Advisor with user ID ${userId} not found`);
    }
    return advisor;
  }

  async create(createAdvisorDto: CreateAdvisorDto): Promise<Advisor> {
    const advisor = this.advisorsRepository.create(createAdvisorDto);
    return await this.advisorsRepository.save(advisor);
  }

  async update(
    id: number,
    updateAdvisorDto: Partial<CreateAdvisorDto>,
  ): Promise<Advisor> {
    const advisor = await this.findOne(id);
    
    // Loại bỏ user_id khỏi các trường cần cập nhật
    const { user_id, ...updateData } = updateAdvisorDto;
    
    // Cập nhật thông tin advisor
    Object.assign(advisor, updateData);
    
    return await this.advisorsRepository.save(advisor);
  }

  async remove(id: number): Promise<void> {
    const advisor = await this.findOne(id);
    await this.advisorsRepository.remove(advisor);
  }

  async getClassesByAdvisorId(advisorId: number): Promise<Class[]> {
    const advisor = await this.findOne(advisorId);
    return advisor.classes;
  }

  async getStudentsByAdvisorId(advisorId: number): Promise<User[]> {
    const classes = await this.getClassesByAdvisorId(advisorId);
    let students: User[] = [];
    
    for (const classEntity of classes) {
      const classWithStudents = await this.classesRepository.findOne({
        where: { class_id: classEntity.class_id },
        relations: ['students'],
      });
      
      if (classWithStudents?.students) {
        students = [...students, ...classWithStudents.students];
      }
    }
    
    return students;
  }

  async updateFromUser(userId: number, userData: any): Promise<Advisor> {
    // Tìm advisor dựa trên user_id
    const advisor = await this.findByUserId(userId);
    
    // Cập nhật thông tin liên quan
    if (userData.username) {
      advisor.full_name = userData.username;
    }
    
    if (userData.email) {
      advisor.contact_email = userData.email;
    }
    
    if (userData.student_code) {
      advisor.advisor_code = userData.student_code;
    }
    
    if (userData.class_name) {
      advisor.department = userData.class_name;
    }
    
    return await this.advisorsRepository.save(advisor);
  }
}
