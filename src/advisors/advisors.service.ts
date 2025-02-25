import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Advisor } from '../entities/advisor.entity';
import { CreateAdvisorDto } from './dto/create-advisor.dto';

@Injectable()
export class AdvisorsService {
  constructor(
    @InjectRepository(Advisor)
    private advisorsRepository: Repository<Advisor>,
  ) {}

  async findAll(): Promise<Advisor[]> {
    return await this.advisorsRepository.find({
      relations: ['user'],
    });
  }

  async findOne(id: number): Promise<Advisor> {
    const advisor = await this.advisorsRepository.findOne({
      where: { advisor_id: id },
      relations: ['user'],
    });
    if (!advisor) {
      throw new NotFoundException(`Advisor with ID ${id} not found`);
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
    Object.assign(advisor, updateAdvisorDto);
    return await this.advisorsRepository.save(advisor);
  }

  async remove(id: number): Promise<void> {
    const advisor = await this.findOne(id);
    await this.advisorsRepository.remove(advisor);
  }
}
