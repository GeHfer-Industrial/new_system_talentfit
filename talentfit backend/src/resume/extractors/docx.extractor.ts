import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as mammoth from 'mammoth';

@Injectable()
export class DocxExtractor {
  private readonly logger = new Logger(DocxExtractor.name);

  async extract(filePath: string): Promise<string> {
    try {
      const buffer = fs.readFileSync(filePath);
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      this.logger.error(`Erro ao extrair DOCX: ${filePath}`, error);
      return '';
    }
  }
}
