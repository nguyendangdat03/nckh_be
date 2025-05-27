import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Class } from '../entities/class.entity';
import { User } from '../entities/user.entity';
import { CreateClassDto } from './dto/create-class.dto';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(Class)
    private classesRepository: Repository<Class>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll(): Promise<Class[]> {
    return await this.classesRepository.find({
      relations: ['advisor', 'students'],
    });
  }

  async findOne(id: number): Promise<Class> {
    const classEntity = await this.classesRepository.findOne({
      where: { class_id: id },
      relations: ['advisor', 'students'],
    });
    if (!classEntity) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }
    return classEntity;
  }

  async create(createClassDto: CreateClassDto): Promise<Class> {
    const classEntity = this.classesRepository.create(createClassDto);
    return await this.classesRepository.save(classEntity);
  }

  async update(
    id: number,
    updateClassDto: Partial<CreateClassDto>,
  ): Promise<Class> {
    const classEntity = await this.findOne(id);
    Object.assign(classEntity, updateClassDto);
    return await this.classesRepository.save(classEntity);
  }

  async remove(id: number): Promise<void> {
    const classEntity = await this.findOne(id);
    await this.classesRepository.remove(classEntity);
  }
  
  async findByAdvisorId(advisorId: number): Promise<Class[]> {
    return await this.classesRepository.find({
      where: { advisor_id: advisorId },
      relations: ['students'],
    });
  }
  
  async getStudentsByClassId(classId: number): Promise<any[]> {
    const classEntity = await this.findOne(classId);
    return classEntity.students;
  }

  async addStudentToClass(classId: number, userId: number, advisorId: number): Promise<User> {
    const classEntity = await this.findOne(classId);
    if (!classEntity) {
      throw new NotFoundException(`Class with ID ${classId} not found`);
    }

    const user = await this.usersRepository.findOne({
      where: { user_id: userId }
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Cập nhật lớp học cho user
    user.class_id = classId;
    user.class_name = classEntity.class_name;
    user.advisor_id = advisorId;
    
    return await this.usersRepository.save(user);
  }

  async removeStudentFromClass(classId: number, userId: number): Promise<User> {
    const classEntity = await this.findOne(classId);
    if (!classEntity) {
      throw new NotFoundException(`Class with ID ${classId} not found`);
    }

    const user = await this.usersRepository.findOne({
      where: { user_id: userId, class_id: classId }
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found in class ${classId}`);
    }

    // Xóa lớp học khỏi user
    user.class_id = null;
    user.class_name = '';
    user.advisor_id = null;
    
    return await this.usersRepository.save(user);
  }
} 