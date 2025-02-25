import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

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
  @Column({ length: 50, nullable: true })
  role: string;

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;
}
