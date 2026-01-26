import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { StorageService } from './storage.service';
import { UploadController } from './upload.controller';

@Global()
@Module({
  imports: [
    ConfigModule,
    // Configurar Multer para guardar archivos en memoria (para pasar a S3)
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB máximo (el service valida por carpeta)
      },
    }),
  ],
  controllers: [UploadController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
