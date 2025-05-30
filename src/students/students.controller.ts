import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { UsersService } from '../users/users.service';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { FilterStudentsDto } from '../users/dto/filter-students.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';

@ApiTags('students')
@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StudentsController {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  @Roles(Role.ADMIN, Role.ADVISOR, Role.STUDENT)
  @ApiOperation({ summary: 'Lấy danh sách sinh viên' })
  @ApiResponse({ status: 200, description: 'Thành công', type: [User] })
  findAll(@Query() filterDto: FilterStudentsDto): Promise<User[]> {
    return this.studentsService.findAll(filterDto);
  }

  @Get('profile')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Lấy thông tin sinh viên hiện tại' })
  @ApiResponse({ status: 200, description: 'Thành công', type: User })
  getProfile(@Request() req): Promise<User> {
    return this.studentsService.findOne(req.user.userId);
  }

  @Get('check-by-code/:studentCode')
  @Roles(Role.ADMIN, Role.ADVISOR)
  @ApiOperation({ summary: 'Kiểm tra thông tin sinh viên bằng mã sinh viên' })
  @ApiParam({ name: 'studentCode', description: 'Mã sinh viên cần kiểm tra' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy sinh viên' })
  async checkByStudentCode(@Param('studentCode') studentCode: string) {
    const student = await this.studentsService.findByStudentCode(studentCode);
    
    if (!student) {
      throw new NotFoundException(`Không tìm thấy sinh viên với mã ${studentCode}`);
    }
    
    // Lấy thông tin lớp
    const classInfo = student.class_id ? await this.studentsService.getClassInfo(student.class_id) : null;
    
    // Lấy thông tin cố vấn học tập
    const advisor = classInfo?.advisor_id ? await this.studentsService.getAdvisorInfo(classInfo.advisor_id) : null;
    
    return {
      student: {
        user_id: student.user_id,
        student_code: student.student_code,
        name: student.username,
        email: student.email,
        class_name: student.class_name,
        class_id: student.class_id
      },
      class: classInfo ? {
        class_id: classInfo.class_id,
        class_name: classInfo.class_name,
        advisor_id: classInfo.advisor_id
      } : null,
      advisor: advisor ? {
        advisor_id: advisor.advisor_id,
        name: advisor.full_name,
        email: advisor.contact_email
      } : null
    };
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ADVISOR, Role.STUDENT)
  @ApiOperation({ summary: 'Lấy thông tin một sinh viên' })
  @ApiResponse({ status: 200, description: 'Thành công', type: User })
  findOne(@Param('id') id: number, @Request() req): Promise<User> {
    // Sinh viên chỉ có thể xem thông tin của chính mình
    if (req.user.role === Role.STUDENT && req.user.userId !== +id) {
      throw new ForbiddenException('Bạn không có quyền xem thông tin của sinh viên khác');
    }
    return this.studentsService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Tạo sinh viên mới' })
  @ApiResponse({ status: 201, description: 'Tạo thành công', type: User })
  create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.studentsService.create(createUserDto);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.STUDENT)
  @ApiOperation({ summary: 'Cập nhật thông tin sinh viên' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công', type: User })
  update(
    @Param('id') id: number,
    @Body() updateUserDto: Partial<CreateUserDto>,
    @Request() req,
  ): Promise<User> {
    // Sinh viên chỉ có thể cập nhật thông tin của chính mình
    if (req.user.role === Role.STUDENT && req.user.userId !== +id) {
      throw new ForbiddenException('Bạn không có quyền cập nhật thông tin của sinh viên khác');
    }
    
    // Sinh viên không được phép thay đổi role hoặc lớp học
    if (req.user.role === Role.STUDENT) {
      const { role, class_id, class_name, ...allowedUpdates } = updateUserDto;
      return this.studentsService.update(id, allowedUpdates);
    }
    
    return this.studentsService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Xóa sinh viên' })
  @ApiResponse({ status: 204, description: 'Xóa thành công' })
  remove(@Param('id') id: number): Promise<void> {
    return this.studentsService.remove(id);
  }

  @Get('class/:classId')
  @Roles(Role.ADMIN, Role.ADVISOR, Role.STUDENT)
  @ApiOperation({ summary: 'Lấy danh sách sinh viên theo lớp học' })
  @ApiResponse({ status: 200, description: 'Thành công', type: [User] })
  findByClass(@Param('classId') classId: number): Promise<User[]> {
    return this.studentsService.findByClassId(classId);
  }

  @Get('advisor/:advisorId')
  @Roles(Role.ADMIN, Role.ADVISOR, Role.STUDENT)
  @ApiOperation({ summary: 'Lấy danh sách sinh viên của cố vấn' })
  @ApiResponse({ status: 200, description: 'Thành công', type: [User] })
  findByAdvisor(@Param('advisorId') advisorId: number, @Request() req): Promise<User[]> {
    // Cố vấn chỉ có thể xem danh sách sinh viên của mình
    if (req.user.role === Role.ADVISOR && req.user.userId !== +advisorId) {
      throw new ForbiddenException('Bạn không có quyền xem danh sách sinh viên của cố vấn khác');
    }
    return this.studentsService.findByAdvisorId(advisorId);
  }
} 