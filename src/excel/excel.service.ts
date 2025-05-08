import { Injectable } from '@nestjs/common';
import { MinioService } from '../minio/minio.service';
import * as XLSX from 'xlsx';
import { ExcelFile } from './interfaces/excel-file.interface';

@Injectable()
export class ExcelService {
  constructor(private readonly minioService: MinioService) {}

  async getAllExcelFiles(bucketName: string) {
    try {
      const files = await this.minioService.listFiles(bucketName);

      // Lọc chỉ lấy các file có định dạng Excel (.xlsx hoặc .xls)
      const excelFiles = files.filter(
        (file) => file.name.endsWith('.xlsx') || file.name.endsWith('.xls'),
      );

      // Định dạng lại thông tin về file để dễ đọc hơn
      return excelFiles.map((file) => ({
        name: file.name,
        size: this.formatFileSize(file.size),
        uploadDate: file.lastModified,
        url: `/excel/${file.name}`, // URL để truy cập file
      }));
    } catch (error) {
      throw new Error(`Error getting Excel files: ${error.message}`);
    }
  }

  // Helper function để định dạng kích thước file
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async processExcelFile(file: Express.Multer.File, bucketName: string) {
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const fileName = `${Date.now()}-${file.originalname}`;
    await this.minioService.uploadFile(bucketName, fileName, file.buffer);

    return {
      fileName,
      data,
    };
  }

  async getExcelData(bucketName: string, objectName: string) {
    try {
      // Download file from MinIO
      const fileBuffer = await this.minioService.getFile(
        bucketName,
        objectName,
      );

      // Convert Excel to JSON
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      return {
        fileName: objectName,
        data: jsonData,
        sheets: workbook.SheetNames,
        totalRows: jsonData.length,
      };
    } catch (error) {
      throw new Error(`Error getting Excel data: ${error.message}`);
    }
  }

  async getSheetData(
    bucketName: string,
    objectName: string,
    sheetName: string,
  ) {
    try {
      // Download file from MinIO
      const fileBuffer = await this.minioService.getFile(
        bucketName,
        objectName,
      );

      // Convert Excel to JSON for specific sheet
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

      if (!workbook.SheetNames.includes(sheetName)) {
        throw new Error(`Sheet "${sheetName}" not found in Excel file`);
      }

      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      return {
        fileName: objectName,
        sheetName: sheetName,
        data: jsonData,
        totalRows: jsonData.length,
      };
    } catch (error) {
      throw new Error(`Error getting sheet data: ${error.message}`);
    }
  }

  async updateExcelFile(
    bucketName: string,
    objectName: string,
    newData: any[],
  ) {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(newData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    await this.minioService.uploadFile(bucketName, objectName, buffer);
    return { message: 'File đã được cập nhật thành công' };
  }

  async deleteFile(bucketName: string, objectName: string) {
    await this.minioService.deleteFile(bucketName, objectName);
    return { message: 'File đã được xóa thành công' };
  }

  async listFiles(bucketName: string): Promise<ExcelFile[]> {
    const files = await this.minioService.listFiles(bucketName);
    return files.map((file) => ({
      name: file.name,
      size: file.size,
      lastModified: file.lastModified,
    }));
  }

  async getFileData(bucketName: string, objectName: string) {
    const fileBuffer = await this.minioService.getFile(bucketName, objectName);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet);
  }
}
