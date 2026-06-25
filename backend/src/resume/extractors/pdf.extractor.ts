import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (dataBuffer: Buffer) => Promise<{ text: string }>;

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
