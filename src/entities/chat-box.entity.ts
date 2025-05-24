import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';
import { Message } from './message.entity';

@Entity('chat_boxes')
export class ChatBox {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column()
  student_id: number;

  @ApiProperty()
  @Column()
  advisor_id: number;

  @ApiProperty()
  @Column({ default: true })
  is_active: boolean;

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty()
  @ManyToOne(() => User)
  @JoinColumn({ name: 'student_id' })
  student: User;

  @ApiProperty()
  @ManyToOne(() => User)
  @JoinColumn({ name: 'advisor_id' })
  advisor: User;

  @OneToMany(() => Message, message => message.chat_box)
  messages: Message[];
} 