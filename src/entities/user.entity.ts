import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../auth/roles.enum';
import { Class } from './class.entity';
import { Advisor } from './advisor.entity';

@Entity('users')
export class User {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  user_id: number;

  @ApiProperty()
  @Column({ length: 100, nullable: false })
  username: string;

  @ApiProperty()
  @Column({ length: 255, nullable: false })
  password: string;

  @ApiProperty()
  @Column({ length: 100, nullable: false })
  email: string;

  @ApiProperty()
  @Column({ length: 20, nullable: false })
  student_code: string;

  @ApiProperty()
  @Column({ length: 100, nullable: true })
  class_name: string;

  @ApiProperty()
  @Column({ nullable: true })
  class_id: number | null;

  @ApiProperty()
  @Column({ nullable: true })
  advisor_id: number | null;

  @ApiProperty()
  @Column({ length: 15, nullable: false })
  phone_number: string;

  @ApiProperty({ enum: Role })
  @Column({
    type: 'enum',
    enum: Role,
    default: Role.STUDENT,
  })
  role: Role;

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Class, classEntity => classEntity.students)
  @JoinColumn({ name: 'class_id' })
  class: Class;
  
  @ManyToOne(() => Advisor)
  @JoinColumn({ name: 'advisor_id' })
  advisor: Advisor;
}
