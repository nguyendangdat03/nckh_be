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
} from '@nestjs/swagger';

@ApiTags('Excel')
@Controller('excel')
export class ExcelController {
  constructor(private readonly excelService: ExcelService) {}

  @Get('files')
  @ApiOperation({ summary: 'Lấy danh sách tất cả file Excel' })
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
            example: '1647824937123-example.xlsx',
          },
          size: {
            type: 'string',
            example: '24.5 KB',
          },
          uploadDate: {
            type: 'string',
            format: 'date-time',
          },
          url: {
            type: 'string',
            example: '/excel/1647824937123-example.xlsx',
          },
        },
      },
    },
  })
  async getAllFiles() {
    const bucketName = 'excel-bucket';
    return await this.excelService.getAllExcelFiles(bucketName);
  }

  @Post('upload')
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

  @Get(':objectName')
  @ApiOperation({ summary: 'Lấy dữ liệu từ file Excel' })
  @ApiParam({
    name: 'objectName',
    description: 'Tên file Excel trong MinIO',
    example: '1647824937123-example.xlsx',
  })
  @ApiResponse({
    status: 200,
    description: 'Dữ liệu từ file Excel',
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
        },
        sheets: {
          type: 'array',
          items: {
            type: 'string',
          },
          example: ['Sheet1', 'Sheet2'],
        },
        totalRows: {
          type: 'number',
          example: 100,
        },
      },
    },
  })
  async getExcelData(@Param('objectName') objectName: string) {
    const bucketName = 'excel-bucket';
    return await this.excelService.getExcelData(bucketName, objectName);
  }

  @Get(':objectName/sheet')
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
  @ApiOperation({ summary: 'Xóa file Excel' })
  @ApiParam({
    name: 'objectName',
    description: 'Tên file Excel trong MinIO',
  })
  async deleteFile(@Param('objectName') objectName: string) {
    const bucketName = 'excel-bucket';
    return await this.excelService.deleteExcelFile(bucketName, objectName);
  }
}
