import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PdfGeneratorService, PdfGeneratorOptions, SeparatorType } from '../services/pdfGenerator';
import { EmailData } from '../types/email';

const mockHtmlToPdf = vi.fn().mockResolvedValue(new Uint8Array([37, 80, 68, 70]));

vi.mock('pdf-lib', () => {
  const mockPage = {
    getWidth: vi.fn().mockReturnValue(595),
    getHeight: vi.fn().mockReturnValue(842),
    getSize: vi.fn().mockReturnValue({ width: 595, height: 842 }),
    drawText: vi.fn(),
    drawLine: vi.fn(),
  };

  const mockPdfDoc = {
    copyPages: vi.fn().mockResolvedValue([mockPage]),
    addPage: vi.fn().mockReturnValue(mockPage),
    getPages: vi.fn().mockReturnValue([mockPage]),
    getPageIndices: vi.fn().mockReturnValue([0]),
    save: vi.fn().mockResolvedValue(new Uint8Array([37, 80, 68, 70])),
  };

  return {
    PDFDocument: {
      create: vi.fn().mockResolvedValue(mockPdfDoc),
      load: vi.fn().mockResolvedValue(mockPdfDoc),
    },
    rgb: vi.fn().mockReturnValue({ type: 'RGB', red: 0.5, green: 0.5, blue: 0.5 }),
    StandardFonts: {
      Helvetica: 'Helvetica',
    },
  };
});

vi.mock('../services/pdfConverter', () => {
  return {
    PdfConverter: class MockPdfConverter {
      htmlToPdf = mockHtmlToPdf;
    },
  };
});

function createMockEmail(overrides: Partial<EmailData> = {}): EmailData {
  return {
    id: 'test-id-1',
    subject: 'Test Subject',
    from: 'sender@example.com',
    to: 'recipient@example.com',
    date: new Date('2026-01-15T10:30:00Z'),
    bodyHtml: '<p>Test email body</p>',
    attachments: [],
    ...overrides,
  };
}

describe('PdfGeneratorService', () => {
  let service: PdfGeneratorService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockHtmlToPdf.mockResolvedValue(new Uint8Array([37, 80, 68, 70]));
    service = new PdfGeneratorService();
  });

  describe('generatePdf', () => {
    it('should generate PDF from 3 emails with newPage separator', async () => {
      const emails: EmailData[] = [
        createMockEmail({ id: '1', subject: 'Email 1' }),
        createMockEmail({ id: '2', subject: 'Email 2' }),
        createMockEmail({ id: '3', subject: 'Email 3' }),
      ];

      const options: PdfGeneratorOptions = {
        separator: 'newPage',
      };

      const result = await service.generatePdf(emails, options);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should generate PDF from 3 emails with line separator', async () => {
      const emails: EmailData[] = [
        createMockEmail({ id: '1', subject: 'Email 1' }),
        createMockEmail({ id: '2', subject: 'Email 2' }),
        createMockEmail({ id: '3', subject: 'Email 3' }),
      ];

      const options: PdfGeneratorOptions = {
        separator: 'line',
      };

      const result = await service.generatePdf(emails, options);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should add watermark text to PDF when specified', async () => {
      const { PDFDocument } = await import('pdf-lib');
      const emails: EmailData[] = [createMockEmail()];

      const options: PdfGeneratorOptions = {
        separator: 'newPage',
        watermark: 'CONFIDENTIAL',
      };

      await service.generatePdf(emails, options);

      const mockPdfDoc = await PDFDocument.create();
      const pages = mockPdfDoc.getPages();
      expect(pages[0]!.drawText).toHaveBeenCalled();
    });

    it('should call progress callback correct number of times', async () => {
      const emails: EmailData[] = [
        createMockEmail({ id: '1' }),
        createMockEmail({ id: '2' }),
        createMockEmail({ id: '3' }),
      ];

      const progressCallback = vi.fn();

      const options: PdfGeneratorOptions = {
        separator: 'newPage',
        onProgress: progressCallback,
      };

      await service.generatePdf(emails, options);

      expect(progressCallback).toHaveBeenCalledTimes(3);
      expect(progressCallback).toHaveBeenNthCalledWith(1, 1, 3);
      expect(progressCallback).toHaveBeenNthCalledWith(2, 2, 3);
      expect(progressCallback).toHaveBeenNthCalledWith(3, 3, 3);
    });

    it('should handle empty email list by returning empty PDF', async () => {
      const emails: EmailData[] = [];

      const options: PdfGeneratorOptions = {
        separator: 'newPage',
      };

      const result = await service.generatePdf(emails, options);

      expect(result).toBeInstanceOf(Uint8Array);
    });

    it('should include email metadata in output HTML', async () => {
      const email = createMockEmail({
        subject: 'Important Meeting',
        from: 'boss@company.com',
        to: 'employee@company.com',
        date: new Date('2026-01-20T14:00:00Z'),
        attachments: [
          { name: 'document.pdf', size: 1024 },
          { name: 'image.png', size: 2048 },
        ],
      });

      const options: PdfGeneratorOptions = {
        separator: 'newPage',
      };

      await service.generatePdf([email], options);

      expect(mockHtmlToPdf).toHaveBeenCalled();
      const htmlArg = mockHtmlToPdf.mock.calls[0]![0] as string;

      expect(htmlArg).toContain('Important Meeting');
      expect(htmlArg).toContain('boss@company.com');
      expect(htmlArg).toContain('employee@company.com');
      expect(htmlArg).toContain('document.pdf');
      expect(htmlArg).toContain('image.png');
    });

    it('should format date correctly in email header', async () => {
      const email = createMockEmail({
        date: new Date('2026-01-20T14:30:00Z'),
      });

      await service.generatePdf([email], { separator: 'newPage' });

      const htmlArg = mockHtmlToPdf.mock.calls[0]![0] as string;
      expect(htmlArg).toMatch(/2026/);
    });

    it('should not include attachment content, only names', async () => {
      const email = createMockEmail({
        attachments: [
          { name: 'secret.pdf', size: 5000 },
        ],
      });

      await service.generatePdf([email], { separator: 'newPage' });

      const htmlArg = mockHtmlToPdf.mock.calls[0]![0] as string;
      expect(htmlArg).toContain('secret.pdf');
      expect(htmlArg).not.toContain('5000');
    });

    it('should handle emails without attachments', async () => {
      const email = createMockEmail({
        attachments: [],
      });

      await service.generatePdf([email], { separator: 'newPage' });

      const htmlArg = mockHtmlToPdf.mock.calls[0]![0] as string;
      expect(htmlArg).not.toContain('Attachments:');
    });

    it('should add line separator between emails when separator is line', async () => {
      const emails: EmailData[] = [
        createMockEmail({ id: '1', subject: 'Email 1' }),
        createMockEmail({ id: '2', subject: 'Email 2' }),
      ];

      await service.generatePdf(emails, { separator: 'line' });

      expect(mockHtmlToPdf).toHaveBeenCalledTimes(1);
      const htmlArg = mockHtmlToPdf.mock.calls[0]![0] as string;
      expect(htmlArg).toContain('Email 1');
      expect(htmlArg).toContain('Email 2');
      expect(htmlArg).toContain('border-top');
    });
  });

  describe('SeparatorType', () => {
    it('should accept newPage as valid separator', () => {
      const separator: SeparatorType = 'newPage';
      expect(separator).toBe('newPage');
    });

    it('should accept line as valid separator', () => {
      const separator: SeparatorType = 'line';
      expect(separator).toBe('line');
    });
  });
});
