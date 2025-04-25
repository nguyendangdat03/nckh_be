import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Minio from 'minio';

interface FileItem {
  name: string;
  size: number;
  lastModified: Date;
}

@Injectable()
export class MinioService implements OnModuleInit {
  private minioClient: Minio.Client;
  private defaultBucket = 'excel-bucket';

  constructor() {
    this.minioClient = new Minio.Client({
      endPoint: '127.0.0.1',
      port: 9000,
      useSSL: false,
      accessKey: 'minioadmin',
      secretKey: 'minioadmin',
    });
  }

  async onModuleInit() {
    await this.ensureBucketExists(this.defaultBucket);
  }

  private async ensureBucketExists(bucketName: string) {
    try {
      const exists = await this.minioClient.bucketExists(bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(bucketName);
        console.log(`Bucket '${bucketName}' created successfully`);
      }
    } catch (error) {
      console.error(`Error ensuring bucket exists: ${error.message}`);
      throw error;
    }
  }

  async listAllFiles(bucketName: string, prefix = ''): Promise<FileItem[]> {
    try {
      await this.ensureBucketExists(bucketName);

      const fileList: FileItem[] = [];
      const objectsStream = this.minioClient.listObjects(
        bucketName,
        prefix,
        true,
      );

      return new Promise<FileItem[]>((resolve, reject) => {
        objectsStream.on('data', (obj) => {
          if (obj.name && obj.size !== undefined && obj.lastModified) {
            fileList.push({
              name: obj.name,
              size: obj.size,
              lastModified: obj.lastModified,
            });
          }
        });

        objectsStream.on('end', () => {
          resolve(fileList);
        });

        objectsStream.on('error', reject);
      });
    } catch (error) {
      throw new Error(`Error listing files: ${error.message}`);
    }
  }

  async uploadFile(
    bucketName: string,
    objectName: string,
    file: Buffer,
  ): Promise<string> {
    await this.ensureBucketExists(bucketName);

    const metaData = {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };

    await this.minioClient.putObject(
      bucketName,
      objectName,
      file,
      file.length,
      metaData,
    );
    return objectName;
  }

  async downloadFile(bucketName: string, objectName: string): Promise<Buffer> {
    try {
      await this.ensureBucketExists(bucketName);

      const dataStream = await this.minioClient.getObject(
        bucketName,
        objectName,
      );
      const chunks: Buffer[] = [];

      return new Promise((resolve, reject) => {
        dataStream.on('data', (chunk) => chunks.push(chunk));
        dataStream.on('end', () => resolve(Buffer.concat(chunks)));
        dataStream.on('error', reject);
      });
    } catch (error) {
      throw new Error(`Error downloading file: ${error.message}`);
    }
  }

  async deleteFile(bucketName: string, objectName: string): Promise<void> {
    await this.ensureBucketExists(bucketName);
    await this.minioClient.removeObject(bucketName, objectName);
  }
}
