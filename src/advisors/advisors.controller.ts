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
import { AdvisorsService } from './advisors.service';
import { Advisor } from '../entities/advisor.entity';
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
  @ApiResponse({ status: 200, description: 'Thành công', type: [Advisor] })
  findAll(): Promise<Advisor[]> {
    return this.advisorsService.findAll();
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
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Cập nhật thông tin cố vấn' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thành công',
    type: Advisor,
  })
  update(
    @Param('id') id: number,
    @Body() updateAdvisorDto: Partial<CreateAdvisorDto>,
  ): Promise<Advisor> {
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
}
