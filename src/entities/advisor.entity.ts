import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';

@Entity('advisors')
export class Advisor {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  advisor_id: number;

  @ApiProperty()
  @Column()
  user_id: number;

  @ApiProperty()
  @Column({ length: 100 })
  advisor_code: string;

  @ApiProperty()
  @Column({ length: 100 })
  full_name: string;

  @ApiProperty()
  @Column({ length: 100 })
  department: string;

  @ApiProperty()
  @Column({ length: 100 })
  contact_email: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
