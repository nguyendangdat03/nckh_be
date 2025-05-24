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
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdvisorsService } from './advisors.service';
import { Advisor } from '../entities/advisor.entity';
import { Class } from '../entities/class.entity';
import { User } from '../entities/user.entity';
import { CreateAdvisorDto } from './dto/create-advisor.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';

@ApiTags('advisors')
@Controller('advisors')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdvisorsController {
  constructor(private readonly advisorsService: AdvisorsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.ADVISOR, Role.STUDENT)
  @ApiOperation({ summary: 'Lấy danh sách cố vấn' })
  @ApiResponse({ status: 200, description: 'Thành công', type: [User] })
  findAll(): Promise<User[]> {
    return this.advisorsService.findAllAdvisorUsers();
  }

  @Get('profile')
  @Roles(Role.ADVISOR)
  @ApiOperation({ summary: 'Lấy thông tin cố vấn hiện tại' })
  @ApiResponse({ status: 200, description: 'Thành công', type: Advisor })
  getProfile(@Request() req): Promise<Advisor> {
    return this.advisorsService.findByUserId(req.user.userId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ADVISOR, Role.STUDENT)
  @ApiOperation({ summary: 'Lấy thông tin một cố vấn' })
  @ApiResponse({ status: 200, description: 'Thành công', type: Advisor })
  findOne(@Param('id') id: number): Promise<Advisor> {
    return this.advisorsService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Tạo cố vấn mới' })
  @ApiResponse({ status: 201, description: 'Tạo thành công', type: Advisor })
  create(@Body() createAdvisorDto: CreateAdvisorDto): Promise<Advisor> {
    return this.advisorsService.create(createAdvisorDto);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.ADVISOR)
  @ApiOperation({ summary: 'Cập nhật thông tin cố vấn' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thành công',
    type: Advisor,
  })
  update(
    @Param('id') id: number,
    @Body() updateAdvisorDto: Partial<CreateAdvisorDto>,
    @Request() req,
  ): Promise<Advisor> {
    // Nếu là ADVISOR, chỉ cho phép cập nhật thông tin của chính mình
    if (req.user.role === Role.ADVISOR) {
      return this.advisorsService.findByUserId(req.user.sub)
        .then(advisor => {
          if (advisor.advisor_id !== +id) {
            throw new UnauthorizedException('Không có quyền cập nhật thông tin cố vấn khác');
          }
          return this.advisorsService.update(id, updateAdvisorDto);
        });
    }
    
    // Nếu là ADMIN, cho phép cập nhật bất kỳ
    return this.advisorsService.update(id, updateAdvisorDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(204)
  @ApiOperation({ summary: 'Xóa cố vấn' })
  @ApiResponse({ status: 204, description: 'Xóa thành công' })
  remove(@Param('id') id: number): Promise<void> {
    return this.advisorsService.remove(id);
  }

  @Get(':id/classes')
  @Roles(Role.ADMIN, Role.ADVISOR, Role.STUDENT)
  @ApiOperation({ summary: 'Lấy danh sách lớp học của cố vấn' })
  @ApiResponse({ status: 200, description: 'Thành công', type: [Class] })
  getClasses(@Param('id') id: number, @Request() req): Promise<Class[]> {
    // Nếu là ADVISOR, chỉ cho phép xem lớp của chính mình
    if (req.user.role === Role.ADVISOR) {
      return this.advisorsService.findByUserId(req.user.userId)
        .then(advisor => {
          if (advisor.advisor_id !== +id) {
            throw new UnauthorizedException('Không có quyền xem lớp học của cố vấn khác');
          }
          return this.advisorsService.getClassesByAdvisorId(id);
        });
    }
    
    // Nếu là ADMIN hoặc STUDENT, cho phép xem bất kỳ
    return this.advisorsService.getClassesByAdvisorId(id);
  }

  @Get(':id/students')
  @Roles(Role.ADMIN, Role.ADVISOR, Role.STUDENT)
  @ApiOperation({ summary: 'Lấy danh sách sinh viên của cố vấn' })
  @ApiResponse({ status: 200, description: 'Thành công', type: [User] })
  getStudents(@Param('id') id: number, @Request() req): Promise<User[]> {
    // Nếu là ADVISOR, chỉ cho phép xem sinh viên của chính mình
    if (req.user.role === Role.ADVISOR) {
      return this.advisorsService.findByUserId(req.user.userId)
        .then(advisor => {
          if (advisor.advisor_id !== +id) {
            throw new UnauthorizedException('Không có quyền xem sinh viên của cố vấn khác');
          }
          return this.advisorsService.getStudentsByAdvisorId(id);
        });
    }
    
    // Nếu là ADMIN hoặc STUDENT, cho phép xem bất kỳ
    return this.advisorsService.getStudentsByAdvisorId(id);
  }

  @Put('profile')
  @Roles(Role.ADVISOR)
  @ApiOperation({ summary: 'Cập nhật thông tin cố vấn hiện tại' })
  @ApiResponse({ status: 200, description: 'Thành công', type: Advisor })
  updateProfile(
    @Request() req, 
    @Body() updateAdvisorDto: Partial<CreateAdvisorDto>
  ): Promise<Advisor> {
    return this.advisorsService.findByUserId(req.user.userId)
      .then(advisor => {
        return this.advisorsService.update(advisor.advisor_id, updateAdvisorDto);
      });
  }
}
