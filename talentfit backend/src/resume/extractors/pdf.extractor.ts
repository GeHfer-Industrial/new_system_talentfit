import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as pdfParse from 'pdf-parse';

@Injectable()
export class PdfExtractor {
  private readonly logger = new Logger(PdfExtractor.name);

  async extract(filePath: string): Promise<string> {
    try {
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      this.logger.error(`Erro ao extrair PDF: ${filePath}`, error);
      return '';
    }
  }
}
