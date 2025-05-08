import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client } from 'minio';

interface FileItem {
  name: string;
  size: number;
  lastModified: Date;
}

@Injectable()
export class MinioService implements OnModuleInit {
  private minioClient: Client;
  private defaultBucket = 'excel-bucket';

  constructor() {
    this.minioClient = new Client({
      endPoint: 'localhost',
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

  async listFiles(bucketName: string, prefix = ''): Promise<FileItem[]> {
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

  async uploadFile(bucketName: string, objectName: string, fileBuffer: Buffer) {
    await this.minioClient.putObject(bucketName, objectName, fileBuffer);
  }

  async getFile(bucketName: string, objectName: string) {
    const stream = await this.minioClient.getObject(bucketName, objectName);
    const chunks: Buffer[] = [];

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }

  async deleteFile(bucketName: string, objectName: string) {
    await this.minioClient.removeObject(bucketName, objectName);
  }
}
