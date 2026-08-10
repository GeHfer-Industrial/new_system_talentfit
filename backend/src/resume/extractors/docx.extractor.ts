import { Injectable, Logger } from '@nestjs/common';
import * as mammoth from 'mammoth';

@Injectable()
export class DocxExtractor {
  private readonly logger = new Logger(DocxExtractor.name);

  async extract(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      this.logger.error('Erro ao extrair DOCX', error);
      return '';
    }
  }
}
