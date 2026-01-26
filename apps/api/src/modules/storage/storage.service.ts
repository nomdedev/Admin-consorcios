import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

export interface UploadOptions {
  /** Buffer o stream del archivo */
  content: Buffer | Uint8Array;
  /** Nombre original del archivo */
  filename: string;
  /** MIME type del archivo */
  contentType: string;
  /** Carpeta dentro del bucket (ej: 'documentos', 'gastos', 'avatars') */
  folder?: string;
  /** Metadatos adicionales */
  metadata?: Record<string, string>;
  /** ID del consorcio (para organización) */
  consorcioId?: string;
  /** Si es true, el archivo será público */
  isPublic?: boolean;
}

export interface UploadResult {
  /** URL pública del archivo (si es público) */
  url: string;
  /** Key del archivo en el bucket */
  key: string;
  /** Nombre del archivo con extensión */
  filename: string;
  /** Tamaño en bytes */
  size: number;
  /** MIME type */
  contentType: string;
}

export interface SignedUrlOptions {
  /** Tiempo de expiración en segundos (default: 3600 = 1 hora) */
  expiresIn?: number;
}

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client | null = null;
  private supabaseClient: SupabaseClient | null = null;
  private readonly bucket: string;
  private readonly publicUrl: string;
  private readonly isEnabled: boolean;
  private readonly region: string;
  private readonly storageProvider: 's3' | 'supabase';

  // Tipos de archivo permitidos por categoría
  private readonly allowedTypes: Record<string, string[]> = {
    documentos: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
    gastos: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
    avatars: ['image/jpeg', 'image/png', 'image/webp'],
    trabajos: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
    tickets: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
    expensas: ['application/pdf'],
  };

  // Tamaños máximos por categoría (en bytes)
  private readonly maxSizes: Record<string, number> = {
    documentos: 50 * 1024 * 1024, // 50MB
    gastos: 10 * 1024 * 1024, // 10MB
    avatars: 2 * 1024 * 1024, // 2MB
    trabajos: 20 * 1024 * 1024, // 20MB
    tickets: 10 * 1024 * 1024, // 10MB
    expensas: 5 * 1024 * 1024, // 5MB
  };

  constructor(private readonly configService: ConfigService) {
    // Detectar proveedor de storage
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseServiceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    const s3AccessKeyId = this.configService.get<string>('S3_ACCESS_KEY_ID');
    const s3SecretAccessKey = this.configService.get<string>('S3_SECRET_ACCESS_KEY');

    // Prioridad: Supabase si está configurado, sino S3
    if (supabaseUrl && supabaseServiceRoleKey) {
      this.storageProvider = 'supabase';
      this.bucket = this.configService.get<string>('SUPABASE_BUCKET', 'vecinosimple-uploads');
      this.supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      this.publicUrl = `${supabaseUrl}/storage/v1/object/public/${this.bucket}`;
      this.isEnabled = true;
      this.region = 'auto'; // No aplica para Supabase
    } else if (s3AccessKeyId && s3SecretAccessKey) {
      this.storageProvider = 's3';
      const endpoint = this.configService.get<string>('S3_ENDPOINT');
      this.bucket = this.configService.get<string>('S3_BUCKET', 'vecinosimple');
      this.region = this.configService.get<string>('S3_REGION', 'auto');
      this.publicUrl = this.configService.get<string>('S3_PUBLIC_URL', '');
      this.isEnabled = true;

      this.s3Client = new S3Client({
        region: this.region,
        endpoint: endpoint || undefined,
        credentials: {
          accessKeyId: s3AccessKeyId,
          secretAccessKey: s3SecretAccessKey,
        },
        // Para Cloudflare R2
        forcePathStyle: !!endpoint,
      });
    } else {
      this.storageProvider = 's3'; // default
      this.bucket = 'vecinosimple';
      this.region = 'auto';
      this.publicUrl = '';
      this.isEnabled = false;
      this.logger.warn('No storage provider configured (neither Supabase nor S3)');
    }
  }

  onModuleInit() {
    if (this.isEnabled) {
      this.logger.log(`✅ Storage service initialized (${this.storageProvider.toUpperCase()} - bucket: ${this.bucket})`);
    } else {
      this.logger.warn('⚠️ Storage service disabled (no credentials configured)');
    }
  }

  /**
   * Sube un archivo al storage
   */
  async upload(options: UploadOptions): Promise<UploadResult> {
    const {
      content,
      filename,
      contentType,
      folder = 'uploads',
      metadata = {},
      consorcioId,
      isPublic = false,
    } = options;

    // Validar tipo de archivo
    const allowedForFolder = this.allowedTypes[folder];
    if (allowedForFolder && !allowedForFolder.includes(contentType)) {
      throw new Error(
        `Tipo de archivo no permitido. Tipos permitidos para ${folder}: ${allowedForFolder.join(', ')}`,
      );
    }

    // Validar tamaño
    const maxSize = this.maxSizes[folder] || 10 * 1024 * 1024;
    if (content.length > maxSize) {
      throw new Error(
        `Archivo demasiado grande. Máximo permitido: ${this.formatFileSize(maxSize)}`,
      );
    }

    // Generar key único
    const extension = this.getExtension(filename);
    const uniqueId = randomUUID();
    const sanitizedFilename = this.sanitizeFilename(filename);
    
    // Estructura: folder/[consorcioId]/año/mes/uuid-filename.ext
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    const keyParts = [folder];
    if (consorcioId) keyParts.push(consorcioId);
    keyParts.push(String(year), month, `${uniqueId}-${sanitizedFilename}`);
    
    const key = keyParts.join('/');

    // Si el storage no está habilitado, retornar URL mock
    if (!this.isEnabled) {
      this.logger.debug(`[DEV MODE] Would upload file: ${key}`);
      return {
        url: `https://mock-storage.vecinosimple.local/${key}`,
        key,
        filename: sanitizedFilename,
        size: content.length,
        contentType,
      };
    }

    try {
      if (this.storageProvider === 'supabase' && this.supabaseClient) {
        // Upload con Supabase Storage
        const { data, error } = await this.supabaseClient.storage
          .from(this.bucket)
          .upload(key, content, {
            contentType,
            upsert: false,
          });

        if (error) {
          throw new Error(`Supabase upload failed: ${error.message}`);
        }

        const url = isPublic
          ? `${this.publicUrl}/${key}`
          : await this.getSignedUrl(key);

        this.logger.log(`File uploaded to Supabase: ${key} (${this.formatFileSize(content.length)})`);

        return {
          url,
          key,
          filename: sanitizedFilename,
          size: content.length,
          contentType,
        };
      } else if (this.storageProvider === 's3' && this.s3Client) {
        // Upload con S3
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: content,
            ContentType: contentType,
            Metadata: {
              ...metadata,
              originalFilename: filename,
              uploadedAt: new Date().toISOString(),
            },
            // ACL solo si es público
            ...(isPublic && { ACL: 'public-read' }),
          }),
        );

        const url = isPublic && this.publicUrl
          ? `${this.publicUrl}/${key}`
          : await this.getSignedUrl(key);

        this.logger.log(`File uploaded to S3: ${key} (${this.formatFileSize(content.length)})`);

        return {
          url,
          key,
          filename: sanitizedFilename,
          size: content.length,
          contentType,
        };
      } else {
        throw new Error('No storage client available');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to upload file: ${errorMessage}`, error);
      throw new Error(`Error al subir archivo: ${errorMessage}`);
    }
  }

  /**
   * Obtiene una URL firmada para acceder a un archivo privado
   */
  async getSignedUrl(key: string, options?: SignedUrlOptions): Promise<string> {
    if (!this.isEnabled) {
      return `https://mock-storage.vecinosimple.local/${key}`;
    }

    try {
      if (this.storageProvider === 'supabase' && this.supabaseClient) {
        const { data, error } = await this.supabaseClient.storage
          .from(this.bucket)
          .createSignedUrl(key, options?.expiresIn || 3600);

        if (error) {
          throw new Error(`Supabase signed URL error: ${error.message}`);
        }

        return data.signedUrl;
      } else if (this.storageProvider === 's3' && this.s3Client) {
        const command = new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        });

        return await getSignedUrl(this.s3Client, command, {
          expiresIn: options?.expiresIn || 3600, // 1 hora por defecto
        });
      } else {
        throw new Error('No storage client available for signed URLs');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Error al generar URL firmada: ${errorMessage}`);
    }
  }

  /**
   * Elimina un archivo del storage
   */
  async delete(key: string): Promise<boolean> {
    if (!this.isEnabled) {
      this.logger.debug(`[DEV MODE] Would delete file: ${key}`);
      return true;
    }

    try {
      if (this.storageProvider === 'supabase' && this.supabaseClient) {
        const { error } = await this.supabaseClient.storage
          .from(this.bucket)
          .remove([key]);

        if (error) {
          throw new Error(`Supabase delete error: ${error.message}`);
        }

        this.logger.log(`File deleted from Supabase: ${key}`);
        return true;
      } else if (this.storageProvider === 's3' && this.s3Client) {
        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: key,
          }),
        );

        this.logger.log(`File deleted from S3: ${key}`);
        return true;
      } else {
        throw new Error('No storage client available for deletion');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to delete file: ${errorMessage}`, error);
      return false;
    }
  }

  /**
   * Verifica si un archivo existe
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isEnabled) {
      return false;
    }

    try {
      if (this.storageProvider === 'supabase' && this.supabaseClient) {
        const { data, error } = await this.supabaseClient.storage
          .from(this.bucket)
          .list(key.split('/').slice(0, -1).join('/'), {
            limit: 1,
            search: key.split('/').pop(),
          });

        if (error) {
          return false;
        }

        return (data && data.length > 0 && data[0]?.name === key.split('/').pop()) || false;
      } else if (this.storageProvider === 's3' && this.s3Client) {
        await this.s3Client.send(
          new HeadObjectCommand({
            Bucket: this.bucket,
            Key: key,
          }),
        );
        return true;
      } else {
        return false;
      }
    } catch {
      return false;
    }
  }

  /**
   * Lista archivos en una carpeta
   */
  async listFiles(prefix: string, maxKeys = 100): Promise<Array<{ key: string; size: number; lastModified?: Date }>> {
    if (!this.isEnabled) {
      return [];
    }

    try {
      if (this.storageProvider === 'supabase' && this.supabaseClient) {
        const { data, error } = await this.supabaseClient.storage
          .from(this.bucket)
          .list(prefix, {
            limit: maxKeys,
            sortBy: { column: 'name', order: 'asc' },
          });

        if (error) {
          throw new Error(`Supabase list error: ${error.message}`);
        }

        return (data || []).map((item) => ({
          key: prefix ? `${prefix}/${item.name}` : item.name,
          size: item.metadata?.size || 0,
          lastModified: item.created_at ? new Date(item.created_at) : undefined,
        }));
      } else if (this.storageProvider === 's3' && this.s3Client) {
        const response = await this.s3Client.send(
          new ListObjectsV2Command({
            Bucket: this.bucket,
            Prefix: prefix,
            MaxKeys: maxKeys,
          }),
        );

        return (response.Contents || []).map((item: { Key?: string; Size?: number; LastModified?: Date }) => ({
          key: item.Key || '',
          size: item.Size || 0,
          lastModified: item.LastModified,
        }));
      } else {
        return [];
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to list files: ${errorMessage}`, error);
      return [];
    }
  }

  /**
   * Descarga un archivo como Buffer
   */
  async download(key: string): Promise<Buffer | null> {
    if (!this.isEnabled || !this.s3Client) {
      return null;
    }

    try {
      const response = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );

      if (!response.Body) {
        return null;
      }

      // Convertir stream a buffer
      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to download file: ${errorMessage}`, error);
      return null;
    }
  }

  /**
   * Verifica si el servicio está habilitado
   */
  isServiceEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Obtiene la URL pública base
   */
  getPublicBaseUrl(): string {
    return this.publicUrl;
  }

  // === Helpers privados ===

  private sanitizeFilename(filename: string): string {
    return filename
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^a-z0-9.-]/g, '-') // Reemplazar caracteres especiales
      .replace(/-+/g, '-') // Evitar guiones múltiples
      .replace(/^-|-$/g, ''); // Remover guiones al inicio/fin
  }

  private getExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
