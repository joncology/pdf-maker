import { PDFDocument, rgb } from 'pdf-lib';
import { EmailData } from '../types/email';
import { PdfConverter } from './pdfConverter';

export type SeparatorType = 'newPage' | 'line';

export interface PdfGeneratorOptions {
  separator: SeparatorType;
  watermark?: string;
  filename?: string;
  onProgress?: (current: number, total: number) => void;
}

export class PdfGeneratorService {
  private pdfConverter: PdfConverter;

  constructor() {
    this.pdfConverter = new PdfConverter();
  }

  async generatePdf(
    emails: EmailData[],
    options: PdfGeneratorOptions
  ): Promise<Uint8Array> {
    if (emails.length === 0) {
      const emptyPdf = await PDFDocument.create();
      return emptyPdf.save();
    }

    const mergedPdf = await PDFDocument.create();

    if (options.separator === 'line') {
      await this.generateWithLineSeparator(emails, mergedPdf, options);
    } else {
      await this.generateWithNewPageSeparator(emails, mergedPdf, options);
    }

    if (options.watermark) {
      await this.addWatermark(mergedPdf, options.watermark);
    }

    return mergedPdf.save();
  }

  private async generateWithNewPageSeparator(
    emails: EmailData[],
    mergedPdf: PDFDocument,
    options: PdfGeneratorOptions
  ): Promise<void> {
    const total = emails.length;

    for (let i = 0; i < emails.length; i++) {
      const email = emails[i]!;
      const html = this.emailToHtml(email);
      const pdfBytes = await this.pdfConverter.htmlToPdf(html);

      const emailPdfDoc = await PDFDocument.load(pdfBytes);
      const pages = await mergedPdf.copyPages(
        emailPdfDoc,
        emailPdfDoc.getPageIndices()
      );
      pages.forEach((page) => mergedPdf.addPage(page));

      options.onProgress?.(i + 1, total);
    }
  }

  private async generateWithLineSeparator(
    emails: EmailData[],
    mergedPdf: PDFDocument,
    options: PdfGeneratorOptions
  ): Promise<void> {
    const combinedHtml = emails
      .map((email, index) => {
        const emailHtml = this.emailToHtml(email);
        if (index > 0) {
          return `<div style="border-top: 2px solid #999; margin: 30px 0; padding-top: 30px;">${emailHtml}</div>`;
        }
        return emailHtml;
      })
      .join('');

    const pdfBytes = await this.pdfConverter.htmlToPdf(combinedHtml);
    const emailPdfDoc = await PDFDocument.load(pdfBytes);
    const pages = await mergedPdf.copyPages(
      emailPdfDoc,
      emailPdfDoc.getPageIndices()
    );
    pages.forEach((page) => mergedPdf.addPage(page));

    const total = emails.length;
    for (let i = 0; i < total; i++) {
      options.onProgress?.(i + 1, total);
    }
  }

  private emailToHtml(email: EmailData): string {
    const formattedDate = this.formatDate(email.date);
    const attachmentNames = email.attachments.map((a) => a.name).join(', ');

    const attachmentsSection =
      email.attachments.length > 0
        ? `<p style="margin: 5px 0;"><strong>Attachments:</strong> ${attachmentNames}</p>`
        : '';

    return `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px;">
          <h2 style="margin: 0 0 10px 0;">${this.escapeHtml(email.subject)}</h2>
          <p style="margin: 5px 0;"><strong>From:</strong> ${this.escapeHtml(email.from)}</p>
          <p style="margin: 5px 0;"><strong>To:</strong> ${this.escapeHtml(email.to)}</p>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
          ${attachmentsSection}
        </div>
        <div>${email.bodyHtml}</div>
      </div>
    `;
  }

  private formatDate(date: Date): string {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private escapeHtml(text: string): string {
    const htmlEntities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return text.replace(/[&<>"']/g, (char) => htmlEntities[char] ?? char);
  }

  private async addWatermark(
    pdfDoc: PDFDocument,
    watermarkText: string
  ): Promise<void> {
    // Filter to ASCII-only characters to avoid WinAnsi encoding errors
    // (e.g., Korean characters like "기밀" cause "WinAnsi cannot encode" error)
    const safeWatermark = watermarkText.replace(/[^\x00-\x7F]/g, '');

    // Skip watermark if no ASCII characters remain
    if (!safeWatermark.trim()) {
      return;
    }

    const pages = pdfDoc.getPages();

    for (const page of pages) {
      const { width } = page.getSize();
      page.drawText(safeWatermark, {
        x: width - 100,
        y: 20,
        size: 10,
        color: rgb(0.5, 0.5, 0.5),
        opacity: 0.5,
      });
    }
  }
}
