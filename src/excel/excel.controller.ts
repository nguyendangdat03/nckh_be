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
  @ApiOperation({ summary: 'Upload file Excel' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File Excel cần upload (.xlsx)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'File đã được upload và xử lý thành công',
    schema: {
      type: 'object',
      properties: {
        fileName: {
          type: 'string',
          example: '1647824937123-example.xlsx',
        },
        data: {
          type: 'array',
          items: {
            type: 'object',
          },
          description: 'Dữ liệu được trích xuất từ file Excel',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const bucketName = 'excel-bucket';
    return await this.excelService.processExcelFile(file, bucketName);
  }

  @Get()
  @Roles(Role.ADMIN, Role.ADVISOR, Role.STUDENT)
  @ApiOperation({ summary: 'Lấy danh sách file Excel' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách file Excel',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            example: 'example.xlsx',
          },
          size: {
            type: 'number',
            example: 1024,
          },
          lastModified: {
            type: 'string',
            example: '2024-03-20T10:00:00Z',
          },
        },
      },
    },
  })
  async listFiles(): Promise<ExcelFile[]> {
    const bucketName = 'excel-bucket';
    return await this.excelService.listFiles(bucketName);
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
    schema: {
      type: 'object',
      properties: {
        fileName: {
          type: 'string',
          example: 'example.xlsx',
        },
        data: {
          type: 'array',
          items: {
            type: 'object',
          },
          description: 'Dữ liệu được trích xuất từ sheet đầu tiên',
        },
        sheets: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'Danh sách tên các sheet trong file',
          example: ['Sheet1', 'Sheet2', 'Sheet3'],
        },
        currentSheet: {
          type: 'string',
          description: 'Tên sheet hiện tại đang hiển thị dữ liệu',
          example: 'Sheet1',
        },
        totalRows: {
          type: 'number',
          description: 'Tổng số dòng dữ liệu',
          example: 100,
        },
      },
    },
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
