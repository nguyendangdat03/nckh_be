import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';
import { ChatBox } from './chat-box.entity';

@Entity('messages')
export class Message {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column({ length: 1000, nullable: false })
  content: string;

  @ApiProperty()
  @Column({ default: false })
  is_read: boolean;

  @ApiProperty()
  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @ApiProperty()
  @ManyToOne(() => User)
  @JoinColumn({ name: 'receiver_id' })
  receiver: User;

  @ApiProperty()
  @Column({ nullable: true })
  chat_box_id: number;

  @ApiProperty()
  @ManyToOne(() => ChatBox, chatBox => chatBox.messages)
  @JoinColumn({ name: 'chat_box_id' })
  chat_box: ChatBox;

  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;
}
