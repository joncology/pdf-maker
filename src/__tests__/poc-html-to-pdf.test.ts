import { describe, it, expect, beforeEach } from 'vitest';
import { PdfConverter, PdfOptions } from '@/services/pdfConverter';
import { getSampleEmailHtml, generateEmailHtml } from '@/utils/sampleEmailHtml';

describe('PdfConverter - POC HTML to PDF', () => {
  let converter: PdfConverter;

  beforeEach(() => {
    converter = new PdfConverter();
  });

  describe('Basic HTML to PDF conversion', () => {
    it('should return a Uint8Array (PDF bytes)', async () => {
      const html = getSampleEmailHtml('basic');
      const result = await converter.htmlToPdf(html);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should create PDF from sample email HTML', async () => {
      const html = getSampleEmailHtml('basic');
      const result = await converter.htmlToPdf(html);

      expect(result).toBeInstanceOf(Uint8Array);
      const pdfHeader = new TextDecoder().decode(result.slice(0, 5));
      expect(pdfHeader).toBe('%PDF-');
    });

    it('should accept page size options', async () => {
      const html = getSampleEmailHtml('basic');
      const options: PdfOptions = { pageSize: 'a4' };
      const result = await converter.htmlToPdf(html, options);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should accept letter page size', async () => {
      const html = getSampleEmailHtml('basic');
      const options: PdfOptions = { pageSize: 'letter' };
      const result = await converter.htmlToPdf(html, options);

      expect(result).toBeInstanceOf(Uint8Array);
    });

    it('should accept margin option', async () => {
      const html = getSampleEmailHtml('basic');
      const options: PdfOptions = { margin: 20 };
      const result = await converter.htmlToPdf(html, options);

      expect(result).toBeInstanceOf(Uint8Array);
    });
  });

  describe('Korean text rendering', () => {
    it('should handle Korean text without crashing', async () => {
      const html = getSampleEmailHtml('korean');
      const result = await converter.htmlToPdf(html);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should preserve Korean text in the conversion process', async () => {
      const koreanEmail = generateEmailHtml({
        from: 'test@example.com',
        to: 'recipient@example.com',
        subject: '한글 제목',
        date: '2026-01-29',
        body: '<p>안녕하세요. 테스트입니다.</p>',
      });

      const result = await converter.htmlToPdf(koreanEmail);
      expect(result).toBeInstanceOf(Uint8Array);
      const pdfHeader = new TextDecoder().decode(result.slice(0, 5));
      expect(pdfHeader).toBe('%PDF-');
    });

    it('should handle mixed Korean and English text', async () => {
      const mixedEmail = generateEmailHtml({
        from: 'test@example.com',
        to: 'recipient@example.com',
        subject: 'Hello 안녕 World 세계',
        date: '2026-01-29',
        body: '<p>Mixed: Hello 안녕하세요 World 세계!</p>',
      });

      const result = await converter.htmlToPdf(mixedEmail);
      expect(result).toBeInstanceOf(Uint8Array);
    });
  });

  describe('External image failure handling', () => {
    it('should not crash when external image fails to load', async () => {
      const html = getSampleEmailHtml('image');
      const result = await converter.htmlToPdf(html);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should complete conversion even with broken image URLs', async () => {
      const htmlWithBrokenImage = generateEmailHtml({
        from: 'test@example.com',
        to: 'recipient@example.com',
        subject: 'Broken Image Test',
        date: '2026-01-29',
        body: `
          <p>Before image</p>
          <img src="https://nonexistent-domain-12345.com/broken.png" alt="Broken" />
          <p>After image</p>
        `,
      });

      const result = await converter.htmlToPdf(htmlWithBrokenImage);
      expect(result).toBeInstanceOf(Uint8Array);
      const pdfHeader = new TextDecoder().decode(result.slice(0, 5));
      expect(pdfHeader).toBe('%PDF-');
    });

    it('should handle multiple broken images gracefully', async () => {
      const htmlWithMultipleBrokenImages = generateEmailHtml({
        from: 'test@example.com',
        to: 'recipient@example.com',
        subject: 'Multiple Broken Images',
        date: '2026-01-29',
        body: `
          <img src="https://broken1.com/a.png" alt="Broken 1" />
          <img src="https://broken2.com/b.png" alt="Broken 2" />
          <img src="https://broken3.com/c.png" alt="Broken 3" />
        `,
      });

      const result = await converter.htmlToPdf(htmlWithMultipleBrokenImages);
      expect(result).toBeInstanceOf(Uint8Array);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty HTML', async () => {
      const result = await converter.htmlToPdf('<div></div>');
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it('should handle HTML with only whitespace', async () => {
      const result = await converter.htmlToPdf('<div>   </div>');
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it('should handle complex nested HTML', async () => {
      const complexHtml = `
        <div style="padding: 20px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="border: 1px solid #ccc; padding: 10px;">Cell 1</td>
              <td style="border: 1px solid #ccc; padding: 10px;">Cell 2</td>
            </tr>
          </table>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
        </div>
      `;
      const result = await converter.htmlToPdf(complexHtml);
      expect(result).toBeInstanceOf(Uint8Array);
    });
  });
});
