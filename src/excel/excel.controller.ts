import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  UseInterceptors,
  UploadedFile,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ExcelService } from './excel.service';
import {
  ApiTags,
  ApiConsumes,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import { ExcelFile } from './interfaces/excel-file.interface';

@ApiTags('Excel')
@Controller('excel')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ExcelController {
  constructor(private readonly excelService: ExcelService) {}

  @Post('upload')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Upload file Excel với kỳ học' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'semester', 'year'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File Excel cần upload (.xlsx)',
        },
        semester: {
          type: 'integer',
          description: 'Kỳ học (1, 2, 3...)',
          example: 1,
        },
        year: {
          type: 'integer',
          description: 'Năm học',
          example: 2025,
        },
        description: {
          type: 'string',
          description: 'Mô tả về file/dữ liệu'
        },
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'File đã được upload và xử lý thành công',
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('semester', ParseIntPipe) semester: number,
    @Body('year', ParseIntPipe) year: number,
    @Body('description') description?: string,
  ) {
    const bucketName = 'excel-bucket';
    return await this.excelService.processExcelFile(
      file, 
      bucketName, 
      semester, 
      year, 
      description
    );
  }

  @Get()
  @Roles(Role.ADMIN, Role.ADVISOR, Role.STUDENT)
  @ApiOperation({ summary: 'Lấy danh sách tất cả file Excel' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách file Excel',
  })
  async listFiles(): Promise<ExcelFile[]> {
    const bucketName = 'excel-bucket';
    return await this.excelService.listFiles(bucketName);
  }

  @Get('semester/:semester/year/:year')
  @Roles(Role.ADMIN, Role.ADVISOR, Role.STUDENT)
  @ApiOperation({ summary: 'Lấy danh sách file Excel theo kỳ học và năm học' })
  @ApiParam({
    name: 'semester',
    description: 'Kỳ học (1, 2, 3...)',
    type: 'number',
  })
  @ApiParam({
    name: 'year',
    description: 'Năm học',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách file Excel theo kỳ học',
  })
  async listFilesBySemester(
    @Param('semester', ParseIntPipe) semester: number,
    @Param('year', ParseIntPipe) year: number,
  ): Promise<ExcelFile[]> {
    return await this.excelService.listFilesBySemester(semester, year);
  }

  @Get(':objectName')
  @Roles(Role.ADMIN, Role.ADVISOR, Role.STUDENT)
  @ApiOperation({ summary: 'Lấy dữ liệu từ file Excel' })
  @ApiParam({
    name: 'objectName',
    description: 'Tên file Excel trong MinIO',
  })
  @ApiResponse({
    status: 200,
    description: 'Dữ liệu từ file Excel',
  })
  async getFileData(@Param('objectName') objectName: string) {
    const bucketName = 'excel-bucket';
    return await this.excelService.getFileData(bucketName, objectName);
  }

  @Get(':objectName/sheet')
  @Roles(Role.ADMIN, Role.ADVISOR, Role.STUDENT)
  @ApiOperation({ summary: 'Lấy dữ liệu từ một sheet cụ thể' })
  @ApiParam({
    name: 'objectName',
    description: 'Tên file Excel trong MinIO',
  })
  @ApiQuery({
    name: 'sheetName',
    description: 'Tên sheet cần lấy dữ liệu',
    example: 'Sheet1',
  })
  async getSheetData(
    @Param('objectName') objectName: string,
    @Query('sheetName') sheetName: string,
  ) {
    const bucketName = 'excel-bucket';
    return await this.excelService.getSheetData(
      bucketName,
      objectName,
      sheetName,
    );
  }

  @Put(':objectName')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Cập nhật dữ liệu file Excel' })
  @ApiParam({
    name: 'objectName',
    description: 'Tên file Excel trong MinIO',
  })
  @ApiBody({
    schema: {
      type: 'array',
      items: {
        type: 'object',
      },
      description: 'Dữ liệu mới cần cập nhật',
    },
  })
  async updateFile(
    @Param('objectName') objectName: string,
    @Body() newData: any[],
  ) {
    const bucketName = 'excel-bucket';
    return await this.excelService.updateExcelFile(
      bucketName,
      objectName,
      newData,
    );
  }

  @Delete(':objectName')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Xóa file Excel' })
  @ApiParam({
    name: 'objectName',
    description: 'Tên file Excel trong MinIO',
  })
  @ApiResponse({
    status: 200,
    description: 'File đã được xóa thành công',
  })
  async deleteFile(@Param('objectName') objectName: string) {
    const bucketName = 'excel-bucket';
    return await this.excelService.deleteFile(bucketName, objectName);
  }
}
