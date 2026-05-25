import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { join, extname } from 'path';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private storage: Storage | null = null;
  private bucketName: string | null = null;

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.configService.get<string>('GCS_BUCKET_NAME') || null;
    if (this.bucketName) {
      try {
        // Initialize GCP storage. Cloud Run has default auth credentials automatically loaded,
        // so no keyfile is needed there. Locally, one can use ADC or fallback to local disk.
        this.storage = new Storage();
        this.logger.log(`Google Cloud Storage inițializat cu bucket-ul: ${this.bucketName}`);
      } catch (err) {
        this.logger.error(`Eroare la inițializarea Google Cloud Storage: ${(err as Error).message}`);
        this.storage = null;
      }
    } else {
      this.logger.log('GCS_BUCKET_NAME nu este setat. Se folosește salvarea locală pe disc.');
    }
  }

  async saveFile(file: Express.Multer.File, type: 'image' | 'video'): Promise<string> {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = `prod-${type}-${uniqueSuffix}${extname(file.originalname)}`;

    if (this.storage && this.bucketName) {
      return this.uploadToGcs(file.buffer, filename, file.mimetype);
    } else {
      return this.saveToLocalDisk(file.buffer, filename);
    }
  }

  private async uploadToGcs(buffer: Buffer, filename: string, mimetype: string): Promise<string> {
    try {
      const bucket = this.storage!.bucket(this.bucketName!);
      const blob = bucket.file(filename);

      // Upload file directly from memory buffer
      await blob.save(buffer, {
        contentType: mimetype,
        resumable: false,
        validation: false,
      });

      // GCS bucket objects by default might not be public. We should either set them public or use the standard GCS public link.
      // We return the public storage URL: https://storage.googleapis.com/<bucket_name>/<filename>
      const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${filename}`;
      this.logger.log(`Fișierul ${filename} a fost încărcat cu succes în GCS: ${publicUrl}`);
      return publicUrl;
    } catch (err) {
      this.logger.error(`Eroare la încărcarea fișierului în GCS: ${(err as Error).message}`);
      throw new BadRequestException(`Eroare la stocarea în cloud: ${(err as Error).message}`);
    }
  }

  private saveToLocalDisk(buffer: Buffer, filename: string): Promise<string> {
    try {
      const uploadPath = join(process.cwd(), 'public', 'products');
      if (!existsSync(uploadPath)) {
        mkdirSync(uploadPath, { recursive: true });
      }
      
      const filePath = join(uploadPath, filename);
      writeFileSync(filePath, buffer);
      
      const url = `/public/products/${filename}`;
      this.logger.log(`Fișierul ${filename} a fost salvat local: ${url}`);
      return Promise.resolve(url);
    } catch (err) {
      this.logger.error(`Eroare la salvarea locală a fișierului: ${(err as Error).message}`);
      throw new BadRequestException(`Eroare la salvarea pe disc: ${(err as Error).message}`);
    }
  }
}
