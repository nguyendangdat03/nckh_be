import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ClassesService } from './classes.service';
import { Class } from '../entities/class.entity';
import { User } from '../entities/user.entity';
import { CreateClassDto } from './dto/create-class.dto';
import { AddStudentDto } from './dto/add-student.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';

@ApiTags('classes')
@Controller('classes')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Get()
  @Roles(Role.ADMIN, Role.ADVISOR)
  @ApiOperation({ summary: 'Lấy danh sách lớp học' })
  @ApiResponse({ status: 200, description: 'Thành công', type: [Class] })
  findAll(): Promise<Class[]> {
    return this.classesService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ADVISOR, Role.STUDENT)
  @ApiOperation({ summary: 'Lấy thông tin một lớp học' })
  @ApiResponse({ status: 200, description: 'Thành công', type: Class })
  findOne(@Param('id') id: number): Promise<Class> {
    return this.classesService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Tạo lớp học mới' })
  @ApiResponse({ status: 201, description: 'Tạo thành công', type: Class })
  create(@Body() createClassDto: CreateClassDto): Promise<Class> {
    return this.classesService.create(createClassDto);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Cập nhật thông tin lớp học' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thành công',
    type: Class,
  })
  update(
    @Param('id') id: number,
    @Body() updateClassDto: Partial<CreateClassDto>,
  ): Promise<Class> {
    return this.classesService.update(id, updateClassDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(204)
  @ApiOperation({ summary: 'Xóa lớp học' })
  @ApiResponse({ status: 204, description: 'Xóa thành công' })
  remove(@Param('id') id: number): Promise<void> {
    return this.classesService.remove(id);
  }

  @Get(':id/students')
  @Roles(Role.ADMIN, Role.ADVISOR)
  @ApiOperation({ summary: 'Lấy danh sách sinh viên của lớp học' })
  @ApiResponse({ status: 200, description: 'Thành công', type: [User] })
  getStudents(@Param('id') id: number): Promise<User[]> {
    return this.classesService.getStudentsByClassId(id);
  }

  @Post(':id/students')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Thêm sinh viên vào lớp học' })
  @ApiResponse({ status: 200, description: 'Thành công', type: User })
  addStudent(
    @Param('id') classId: number,
    @Body() addStudentDto: AddStudentDto,
  ): Promise<User> {
    return this.classesService.addStudentToClass(classId, addStudentDto.userId);
  }

  @Delete(':classId/students/:userId')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Xóa sinh viên khỏi lớp học' })
  @ApiResponse({ status: 200, description: 'Thành công', type: User })
  removeStudent(
    @Param('classId') classId: number,
    @Param('userId') userId: number,
  ): Promise<User> {
    return this.classesService.removeStudentFromClass(classId, userId);
  }
} 