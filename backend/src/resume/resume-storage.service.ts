import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const RESUME_BUCKET = 'resumes';

@Injectable()
export class ResumeStorageService {
  private readonly logger = new Logger(ResumeStorageService.name);
  private readonly supabase: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get<string>('SUPABASE_URL') ?? '',
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
  }

  async upload(filename: string, buffer: Buffer, mimeType: string): Promise<void> {
    const { error } = await this.supabase.storage.from(RESUME_BUCKET).upload(filename, buffer, {
      contentType: mimeType,
      upsert: false,
    });
    if (error) {
      this.logger.error(`Erro ao enviar ${filename} para o storage: ${error.message}`);
      throw error;
    }
  }

  async download(filename: string): Promise<Buffer> {
    const { data, error } = await this.supabase.storage.from(RESUME_BUCKET).download(filename);
    if (error || !data) {
      throw error ?? new Error(`Arquivo ${filename} não encontrado no storage`);
    }
    return Buffer.from(await data.arrayBuffer());
  }

  async remove(filename: string): Promise<void> {
    const { error } = await this.supabase.storage.from(RESUME_BUCKET).remove([filename]);
    if (error) {
      this.logger.error(`Erro ao remover ${filename} do storage: ${error.message}`);
    }
  }
}
