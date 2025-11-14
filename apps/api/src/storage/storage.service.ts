import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Minio from 'minio';
import {
  BlobServiceClient,
  BlobSASPermissions,
  ContainerClient,
  SASProtocol,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  CorsRule,
} from '@azure/storage-blob';
import { randomUUID } from 'crypto';
import { calculatePartSize, calculatePartsCount } from '@autoon/utils';

type StorageProvider = 's3' | 'azure';

@Injectable()
export class StorageService implements OnModuleInit {
  readonly provider: StorageProvider;

  private readonly bucket: string;
  private readonly uploadUrlTtlSeconds: number;
  private s3Client?: Minio.Client;
  private azureContainer?: ContainerClient;
  private blobServiceClient?: BlobServiceClient;
  private azureCredential?: StorageSharedKeyCredential;

  constructor() {
    this.provider = process.env.STORAGE_PROVIDER?.toUpperCase() === 'AZURE' ? 'azure' : 's3';
    this.uploadUrlTtlSeconds = parseInt(process.env.AZURE_UPLOAD_URL_TTL_SECONDS || '3600', 10);

    if (this.provider === 'azure') {
      const accountName = process.env.AZURE_STORAGE_ACCOUNT;
      const accountKey = process.env.AZURE_STORAGE_KEY;

      if (!accountName || !accountKey) {
        throw new Error('Azure Storage credentials are not configured');
      }

      const endpointSuffix = process.env.AZURE_STORAGE_ENDPOINT_SUFFIX || 'core.windows.net';
      const endpoint =
        process.env.AZURE_STORAGE_ENDPOINT || `https://${accountName}.blob.${endpointSuffix}`;

      this.azureCredential = new StorageSharedKeyCredential(accountName, accountKey);
      this.blobServiceClient = new BlobServiceClient(endpoint, this.azureCredential);
      this.azureContainer = this.blobServiceClient.getContainerClient(
        process.env.AZURE_STORAGE_CONTAINER || 'autoon-videos',
      );
      this.bucket = this.azureContainer.containerName;
    } else {
      const endpoint = process.env.S3_ENDPOINT?.replace(/^https?:\/\//, '') || 'localhost:9000';
      this.s3Client = new Minio.Client({
        endPoint: endpoint.split(':')[0],
        port: parseInt(endpoint.split(':')[1] || '9000'),
        useSSL: process.env.S3_USE_SSL === 'true',
        accessKey: process.env.S3_ACCESS_KEY || 'minioadmin',
        secretKey: process.env.S3_SECRET_KEY || 'minioadmin',
        region: process.env.S3_REGION || 'us-east-1',
      });

      this.bucket = process.env.S3_BUCKET || 'autoon-videos';
    }
  }

  async onModuleInit() {
    if (this.provider === 'azure') {
      if (this.azureContainer && !(await this.azureContainer.exists())) {
        await this.azureContainer.create();
      }
      if (process.env.AZURE_AUTO_CONFIGURE_CORS !== 'false') {
        await this.ensureAzureCorsRules();
      }
    } else if (this.s3Client) {
      const exists = await this.s3Client.bucketExists(this.bucket);
      if (!exists) {
        await this.s3Client.makeBucket(this.bucket, process.env.S3_REGION || 'us-east-1');
      }
    }
  }

  /**
   * Inicia um upload multipart (S3) ou prepara SAS (Azure)
   */
  async initiateMultipartUpload(key: string, contentType: string): Promise<string> {
    if (this.provider === 'azure') {
      // No Azure nǜo existe uploadId, usamos um UUID apenas para controle interno
      return randomUUID();
    }

    return this.s3Client!.initiateNewMultipartUpload(this.bucket, key, {
      'Content-Type': contentType,
    });
  }

  /**
   * Gera URLs presignadas para upload de partes
   */
  async generatePresignedUploadUrls(
    key: string,
    _uploadId: string,
    partsCount: number,
  ): Promise<{ partNumber: number; uploadUrl: string; blockId?: string }[]> {
    if (this.provider === 'azure') {
      return this.generateAzureBlockUrls(key, partsCount);
    }

    const urls: { partNumber: number; uploadUrl: string; blockId?: string }[] = [];
    for (let i = 1; i <= partsCount; i++) {
      const url = await this.s3Client!.presignedPutObject(this.bucket, key, 3600);
      urls.push({ partNumber: i, uploadUrl: url });
    }

    return urls;
  }

  /**
   * Completa um upload multipart
   */
  async completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: { partNumber: number; etag?: string; blockId?: string }[],
  ): Promise<void> {
    if (this.provider === 'azure') {
      await this.commitAzureBlocks(key, parts);
      return;
    }

    const sortedParts = parts.sort((a, b) => a.partNumber - b.partNumber);
    await this.s3Client!.completeMultipartUpload(
      this.bucket,
      key,
      uploadId,
      sortedParts.map((p) => {
        if (!p.etag) {
          throw new Error('Missing ETag for S3 multipart upload');
        }
        return { part: p.partNumber, etag: p.etag };
      }),
    );
  }

  /**
   * Gera URL assinada para leitura (streaming)
   */
  async generatePresignedUrl(key: string, expiresIn: number = 300): Promise<string> {
    if (this.provider === 'azure') {
      return this.generateAzureSasUrl(key, 'r', expiresIn);
    }

    return this.s3Client!.presignedGetObject(this.bucket, key, expiresIn);
  }

  /**
   * Alias para generatePresignedUrl (compatibilidade)
   */
  async getSignedUrl(key: string, expiresIn: number = 300): Promise<string> {
    return this.generatePresignedUrl(key, expiresIn);
  }

  /**
   * Faz upload direto (para arquivos pequenos)
   */
  async uploadFile(key: string, buffer: Buffer, contentType: string): Promise<void> {
    if (this.provider === 'azure') {
      const blockBlobClient = this.azureContainer!.getBlockBlobClient(key);
      await blockBlobClient.uploadData(buffer, {
        blobHTTPHeaders: { blobContentType: contentType },
      });
      return;
    }

    await this.s3Client!.putObject(this.bucket, key, buffer, buffer.length, {
      'Content-Type': contentType,
    });
  }

  /**
   * Alias para uploadFile (compatibilidade)
   */
  async uploadBuffer(key: string, buffer: Buffer, contentType: string): Promise<void> {
    return this.uploadFile(key, buffer, contentType);
  }

  /**
   * Download de arquivo
   */
  async downloadFile(key: string): Promise<Buffer> {
    if (this.provider === 'azure') {
      const blobClient = this.azureContainer!.getBlobClient(key);
      const response = await blobClient.download();
      const stream = response.readableStreamBody;
      if (!stream) {
        throw new Error('Azure blob stream not available');
      }

      const chunks: Buffer[] = [];
      return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
      });
    }

    const stream = await this.s3Client!.getObject(this.bucket, key);
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  /**
   * Deleta arquivo
   */
  async deleteFile(key: string): Promise<void> {
    if (this.provider === 'azure') {
      await this.azureContainer!.getBlobClient(key).deleteIfExists();
      return;
    }

    await this.s3Client!.removeObject(this.bucket, key);
  }

  /**
   * Deleta mǧltiplos arquivos
   */
  async deleteFiles(keys: string[]): Promise<void> {
    if (this.provider === 'azure') {
      await Promise.all(keys.map((key) => this.deleteFile(key)));
      return;
    }

    await this.s3Client!.removeObjects(this.bucket, keys);
  }

  /**
   * Calcula estratǸgia de upload multipart
   */
  calculateUploadStrategy(fileSizeBytes: number) {
    const partSize = calculatePartSize(fileSizeBytes);
    const partsCount = calculatePartsCount(fileSizeBytes, partSize);

    return { partSize, partsCount };
  }

  private generateAzureSasUrl(key: string, permissions: string, expiresInSeconds: number) {
    if (!this.azureContainer || !this.azureCredential) {
      throw new Error('Azure Storage nǜo configurado corretamente');
    }

    const blockBlobClient = this.azureContainer.getBlockBlobClient(key);
    const expiresOn = new Date(Date.now() + expiresInSeconds * 1000);
    const sas = generateBlobSASQueryParameters(
      {
        containerName: blockBlobClient.containerName,
        blobName: key,
        permissions: BlobSASPermissions.parse(permissions),
        expiresOn,
        protocol: SASProtocol.Https,
      },
      this.azureCredential,
    ).toString();

    return `${blockBlobClient.url}?${sas}`;
  }

  private async generateAzureBlockUrls(
    key: string,
    partsCount: number,
  ): Promise<{ partNumber: number; uploadUrl: string; blockId?: string }[]> {
    const baseUrl = this.generateAzureSasUrl(key, 'racw', this.uploadUrlTtlSeconds);
    const uploads: { partNumber: number; uploadUrl: string; blockId?: string }[] = [];

    for (let i = 1; i <= partsCount; i++) {
      const partNumber = i;
      const blockId = Buffer.from(partNumber.toString().padStart(6, '0')).toString('base64');
      const uploadUrl = `${baseUrl}&comp=block&blockid=${encodeURIComponent(blockId)}`;
      uploads.push({ partNumber, blockId, uploadUrl });
    }

    return uploads;
  }

  private async commitAzureBlocks(
    key: string,
    parts: { partNumber: number; blockId?: string; etag?: string }[],
  ): Promise<void> {
    if (!this.azureContainer) {
      throw new Error('Azure Storage nǜo configurado corretamente');
    }

    const blockBlobClient = this.azureContainer.getBlockBlobClient(key);
    const sortedParts = parts.sort((a, b) => a.partNumber - b.partNumber);
    const blockIds = sortedParts.map((part) => {
      const blockId = part.blockId || part.etag;
      if (!blockId) {
        throw new Error('BlockId ausente para concluir upload no Azure');
      }
      return blockId;
    });

    await blockBlobClient.commitBlockList(blockIds);
  }

  private async ensureAzureCorsRules(): Promise<void> {
    if (!this.blobServiceClient) return;

    const allowedOrigins =
      process.env.AZURE_CORS_ALLOWED_ORIGINS || process.env.AZURE_ALLOWED_ORIGINS || '*';
    const allowedMethods =
      process.env.AZURE_CORS_ALLOWED_METHODS || 'GET,HEAD,PUT,POST,DELETE,OPTIONS,PATCH';
    const allowedHeaders = process.env.AZURE_CORS_ALLOWED_HEADERS || '*';
    const exposedHeaders = process.env.AZURE_CORS_EXPOSED_HEADERS || '*';
    const maxAgeInSeconds = parseInt(process.env.AZURE_CORS_MAX_AGE || '3600', 10);

    const corsRule: CorsRule = {
      allowedOrigins: allowedOrigins
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
        .join(',') || '*',
      allowedMethods: allowedMethods
        .split(',')
        .map((method) => method.trim().toUpperCase())
        .filter(Boolean)
        .join(','),
      allowedHeaders:
        allowedHeaders
          .split(',')
          .map((header) => header.trim())
          .filter(Boolean)
          .join(',') || '*',
      exposedHeaders:
        exposedHeaders
          .split(',')
          .map((header) => header.trim())
          .filter(Boolean)
          .join(',') || '*',
      maxAgeInSeconds: Number.isFinite(maxAgeInSeconds) ? maxAgeInSeconds : 3600,
    };

    try {
      await this.blobServiceClient.setProperties({
        cors: [corsRule],
      });
    } catch (error) {
      console.error('Failed to configure Azure Blob CORS rules:', error);
    }
  }
}
