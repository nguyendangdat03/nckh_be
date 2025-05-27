import { Injectable, NotFoundException } from '@nestjs/common';
import { MinioService } from '../minio/minio.service';
import * as XLSX from 'xlsx';
import { ExcelFile } from './interfaces/excel-file.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExcelFileEntity } from '../entities/excel-file.entity';

@Injectable()
export class ExcelService {
  constructor(
    private readonly minioService: MinioService,
    @InjectRepository(ExcelFileEntity)
    private readonly excelFileRepository: Repository<ExcelFileEntity>,
  ) {}

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

  async processExcelFile(
    file: Express.Multer.File, 
    bucketName: string, 
    semester: number,
    year: number,
    description?: string
  ) {
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const fileName = `${Date.now()}-${semester}-${year}-${file.originalname}`;
    await this.minioService.uploadFile(bucketName, fileName, file.buffer);

    // Lưu thông tin file và kỳ học vào cơ sở dữ liệu
    const excelFile = this.excelFileRepository.create({
      file_name: fileName,
      original_name: file.originalname,
      bucket_name: bucketName,
      file_size: file.size,
      semester: semester,
      year: year,
      description: description,
    });

    await this.excelFileRepository.save(excelFile);

    return {
      fileName,
      originalName: file.originalname,
      semester,
      year,
      description,
      data,
    };
  }

  async getExcelData(bucketName: string, objectName: string) {
    try {
      // Kiểm tra xem file có tồn tại trong cơ sở dữ liệu không
      const fileInfo = await this.excelFileRepository.findOne({
        where: { file_name: objectName }
      });

      if (!fileInfo) {
        throw new NotFoundException(`File không tồn tại trong cơ sở dữ liệu`);
      }
      
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
        originalName: fileInfo.original_name,
        semester: fileInfo.semester,
        year: fileInfo.year,
        description: fileInfo.description,
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
      // Kiểm tra xem file có tồn tại trong cơ sở dữ liệu không
      const fileInfo = await this.excelFileRepository.findOne({
        where: { file_name: objectName }
      });

      if (!fileInfo) {
        throw new NotFoundException(`File không tồn tại trong cơ sở dữ liệu`);
      }
      
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
        originalName: fileInfo.original_name,
        semester: fileInfo.semester,
        year: fileInfo.year,
        description: fileInfo.description,
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
    // Kiểm tra xem file có tồn tại trong cơ sở dữ liệu không
    const fileInfo = await this.excelFileRepository.findOne({
      where: { file_name: objectName }
    });

    if (!fileInfo) {
      throw new NotFoundException(`File không tồn tại trong cơ sở dữ liệu`);
    }

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(newData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    await this.minioService.uploadFile(bucketName, objectName, buffer);
    return { message: 'File đã được cập nhật thành công' };
  }

  async deleteFile(bucketName: string, objectName: string) {
    // Xóa thông tin file trong cơ sở dữ liệu
    const fileInfo = await this.excelFileRepository.findOne({
      where: { file_name: objectName }
    });
    
    if (fileInfo) {
      await this.excelFileRepository.remove(fileInfo);
    }
    
    // Xóa file khỏi MinIO
    await this.minioService.deleteFile(bucketName, objectName);
    return { message: 'File đã được xóa thành công' };
  }

  async listFiles(bucketName: string): Promise<ExcelFile[]> {
    // Truy vấn dữ liệu từ database thay vì trực tiếp từ MinIO
    const fileEntities = await this.excelFileRepository.find();
    
    return fileEntities.map(entity => ({
      name: entity.file_name,
      original_name: entity.original_name,
      size: entity.file_size,
      lastModified: entity.uploaded_at,
      semester: entity.semester,
      year: entity.year,
      description: entity.description
    }));
  }

  async listFilesBySemester(semester: number, year: number): Promise<ExcelFile[]> {
    const fileEntities = await this.excelFileRepository.find({
      where: {
        semester: semester,
        year: year
      }
    });
    
    return fileEntities.map(entity => ({
      name: entity.file_name,
      original_name: entity.original_name,
      size: entity.file_size,
      lastModified: entity.uploaded_at,
      semester: entity.semester,
      year: entity.year,
      description: entity.description
    }));
  }

  async getFileData(bucketName: string, objectName: string) {
    // Kiểm tra xem file có tồn tại trong cơ sở dữ liệu không
    const fileInfo = await this.excelFileRepository.findOne({
      where: { file_name: objectName }
    });

    if (!fileInfo) {
      throw new NotFoundException(`File không tồn tại trong cơ sở dữ liệu`);
    }
    
    const fileBuffer = await this.minioService.getFile(bucketName, objectName);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetNames = workbook.SheetNames;
    const sheetName = sheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    return {
      fileName: objectName,
      originalName: fileInfo.original_name,
      semester: fileInfo.semester,
      year: fileInfo.year,
      description: fileInfo.description,
      data: jsonData,
      sheets: sheetNames,
      currentSheet: sheetName,
      totalRows: jsonData.length,
    };
  }
}
