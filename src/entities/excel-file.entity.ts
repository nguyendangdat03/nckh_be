import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('excel_files')
export class ExcelFileEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column()
  file_name: string;

  @ApiProperty()
  @Column()
  original_name: string;

  @ApiProperty()
  @Column()
  bucket_name: string;

  @ApiProperty()
  @Column()
  file_size: number;

  @ApiProperty()
  @Column()
  semester: number;

  @ApiProperty()
  @Column()
  year: number;

  @ApiProperty()
  @Column({ nullable: true })
  description: string;

  @ApiProperty()
  @CreateDateColumn()
  uploaded_at: Date;
} 