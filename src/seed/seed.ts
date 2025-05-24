import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Class } from '../entities/class.entity';
import { Advisor } from '../entities/advisor.entity';
import { ChatBox } from '../entities/chat-box.entity';
import { Message } from '../entities/message.entity';
import { Role } from '../auth/roles.enum';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const connection = app.get('CONNECTION');

  // Repositories
  const userRepository = getRepository(User);
  const classRepository = getRepository(Class);
  const advisorRepository = getRepository(Advisor);
  const chatBoxRepository = getRepository(ChatBox);
  const messageRepository = getRepository(Message);

  // Xóa dữ liệu cũ
  await messageRepository.delete({});
  await chatBoxRepository.delete({});
  await advisorRepository.delete({});
  await classRepository.delete({});
  await userRepository.delete({});

  // Mã hóa mật khẩu
  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash('password123', salt);

  // Tạo admin
  const admin = userRepository.create({
    username: 'admin',
    password: hashedPassword,
    email: 'admin@example.com',
    student_code: 'ADMIN001',
    class_name: 'Admin',
    phone_number: '0123456789',
    role: Role.ADMIN,
  });
  await userRepository.save(admin);
  console.log('Admin created');

  // Tạo giảng viên
  const advisor1 = userRepository.create({
    username: 'advisor1',
    password: hashedPassword,
    email: 'advisor1@example.com',
    student_code: 'GV001',
    class_name: 'Khoa CNTT',
    phone_number: '0123456790',
    role: Role.ADVISOR,
  });
  await userRepository.save(advisor1);

  const advisor2 = userRepository.create({
    username: 'advisor2',
    password: hashedPassword,
    email: 'advisor2@example.com',
    student_code: 'GV002',
    class_name: 'Khoa Toán',
    phone_number: '0123456791',
    role: Role.ADVISOR,
  });
  await userRepository.save(advisor2);
  console.log('Advisors created');

  // Tạo thông tin cố vấn
  const advisorEntity1 = advisorRepository.create({
    user_id: advisor1.user_id,
    advisor_code: advisor1.student_code,
    full_name: advisor1.username,
    department: advisor1.class_name,
    contact_email: advisor1.email,
  });
  await advisorRepository.save(advisorEntity1);

  const advisorEntity2 = advisorRepository.create({
    user_id: advisor2.user_id,
    advisor_code: advisor2.student_code,
    full_name: advisor2.username,
    department: advisor2.class_name,
    contact_email: advisor2.email,
  });
  await advisorRepository.save(advisorEntity2);
  console.log('Advisor entities created');

  // Tạo lớp học
  const class1 = classRepository.create({
    class_name: 'CNTT1',
    description: 'Lớp Công nghệ thông tin 1',
    advisor_id: advisorEntity1.advisor_id,
  });
  await classRepository.save(class1);

  const class2 = classRepository.create({
    class_name: 'CNTT2',
    description: 'Lớp Công nghệ thông tin 2',
    advisor_id: advisorEntity1.advisor_id,
  });
  await classRepository.save(class2);

  const class3 = classRepository.create({
    class_name: 'TOAN1',
    description: 'Lớp Toán 1',
    advisor_id: advisorEntity2.advisor_id,
  });
  await classRepository.save(class3);
  console.log('Classes created');

  // Tạo sinh viên
  const student1 = userRepository.create({
    username: 'student1',
    password: hashedPassword,
    email: 'student1@example.com',
    student_code: 'SV001',
    class_name: 'CNTT1',
    class_id: class1.class_id,
    phone_number: '0123456792',
    role: Role.STUDENT,
  });
  await userRepository.save(student1);

  const student2 = userRepository.create({
    username: 'student2',
    password: hashedPassword,
    email: 'student2@example.com',
    student_code: 'SV002',
    class_name: 'CNTT1',
    class_id: class1.class_id,
    phone_number: '0123456793',
    role: Role.STUDENT,
  });
  await userRepository.save(student2);

  const student3 = userRepository.create({
    username: 'student3',
    password: hashedPassword,
    email: 'student3@example.com',
    student_code: 'SV003',
    class_name: 'CNTT2',
    class_id: class2.class_id,
    phone_number: '0123456794',
    role: Role.STUDENT,
  });
  await userRepository.save(student3);

  const student4 = userRepository.create({
    username: 'student4',
    password: hashedPassword,
    email: 'student4@example.com',
    student_code: 'SV004',
    class_name: 'TOAN1',
    class_id: class3.class_id,
    phone_number: '0123456795',
    role: Role.STUDENT,
  });
  await userRepository.save(student4);
  console.log('Students created');

  // Tạo box chat
  const chatBox1 = chatBoxRepository.create({
    student_id: student1.user_id,
    advisor_id: advisor1.user_id,
  });
  await chatBoxRepository.save(chatBox1);

  const chatBox2 = chatBoxRepository.create({
    student_id: student2.user_id,
    advisor_id: advisor1.user_id,
  });
  await chatBoxRepository.save(chatBox2);

  const chatBox3 = chatBoxRepository.create({
    student_id: student4.user_id,
    advisor_id: advisor2.user_id,
  });
  await chatBoxRepository.save(chatBox3);
  console.log('Chat boxes created');

  // Tạo tin nhắn
  const message1 = messageRepository.create({
    content: 'Xin chào thầy, em có vấn đề cần tư vấn',
    sender: student1,
    receiver: advisor1,
    chat_box: chatBox1,
    is_read: true,
  });
  await messageRepository.save(message1);

  const message2 = messageRepository.create({
    content: 'Chào em, thầy có thể giúp gì cho em?',
    sender: advisor1,
    receiver: student1,
    chat_box: chatBox1,
    is_read: true,
  });
  await messageRepository.save(message2);

  const message3 = messageRepository.create({
    content: 'Em muốn hỏi về đề tài nghiên cứu khoa học',
    sender: student1,
    receiver: advisor1,
    chat_box: chatBox1,
    is_read: false,
  });
  await messageRepository.save(message3);

  const message4 = messageRepository.create({
    content: 'Thầy ơi, em cần gặp thầy để trao đổi về đồ án',
    sender: student2,
    receiver: advisor1,
    chat_box: chatBox2,
    is_read: false,
  });
  await messageRepository.save(message4);

  const message5 = messageRepository.create({
    content: 'Chào em, thầy đang bận họp, chiều mai em ghé văn phòng nhé',
    sender: advisor1,
    receiver: student2,
    chat_box: chatBox2,
    is_read: true,
  });
  await messageRepository.save(message5);

  const message6 = messageRepository.create({
    content: 'Thầy ơi, em muốn xin ý kiến về bài tập lớn',
    sender: student4,
    receiver: advisor2,
    chat_box: chatBox3,
    is_read: false,
  });
  await messageRepository.save(message6);
  console.log('Messages created');

  console.log('Seeding completed');
  await app.close();
}

bootstrap(); 