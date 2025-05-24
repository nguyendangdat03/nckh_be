import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Advisor } from './advisor.entity';
import { User } from './user.entity';

@Entity('classes')
export class Class {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  class_id: number;

  @ApiProperty()
  @Column({ length: 100 })
  class_name: string;

  @ApiProperty()
  @Column({ length: 100, nullable: true })
  description: string;

  @ApiProperty()
  @Column()
  advisor_id: number;

  @ManyToOne(() => Advisor, advisor => advisor.classes)
  @JoinColumn({ name: 'advisor_id' })
  advisor: Advisor;

  @OneToMany(() => User, user => user.class)
  students: User[];
} 