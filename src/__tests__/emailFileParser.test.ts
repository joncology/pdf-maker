import { describe, test, expect, vi, beforeEach } from 'vitest';
import { EmailFileParser } from '../services/emailFileParser';

const mockParse = vi.fn();
const mockGetFileData = vi.fn();

vi.mock('postal-mime', () => {
  return {
    default: class MockPostalMime {
      parse = mockParse;
    },
  };
});

vi.mock('@kenjiuno/msgreader', () => {
  return {
    default: class MockMsgReader {
      getFileData = mockGetFileData;
    },
  };
});

interface MockFile {
  name: string;
  size: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
}

function createMockFile(name: string, size: number): MockFile {
  const content = new ArrayBuffer(size);
  return {
    name,
    size,
    arrayBuffer: () => Promise.resolve(content),
  };
}

describe('EmailFileParser', () => {
  let parser: EmailFileParser;

  beforeEach(() => {
    vi.clearAllMocks();
    parser = new EmailFileParser();
  });

  describe('parseEmlFile', () => {
    test('parses .eml file and returns EmailData', async () => {
      const mockEmail = {
        from: { name: 'John Doe', address: 'john@example.com' },
        to: [{ name: 'Jane Doe', address: 'jane@example.com' }],
        subject: 'Test Subject',
        date: '2024-01-15T10:00:00Z',
        html: '<p>Hello World</p>',
        text: 'Hello World',
        attachments: [
          { filename: 'doc.pdf', content: new ArrayBuffer(1024) },
        ],
      };

      mockParse.mockResolvedValue(mockEmail);

      const file = createMockFile('test.eml', 1000);
      const result = await parser.parseEmlFile(file as unknown as File);

      expect(result.subject).toBe('Test Subject');
      expect(result.from).toBe('John Doe');
      expect(result.to).toBe('Jane Doe');
      expect(result.bodyHtml).toBe('<p>Hello World</p>');
      expect(result.date).toEqual(new Date('2024-01-15T10:00:00Z'));
      expect(result.attachments).toHaveLength(1);
      expect(result.attachments[0]).toEqual({ name: 'doc.pdf', size: 1024 });
      expect(result.id).toMatch(/^email-\d+-[a-z0-9]+$/);
    });

    test('uses "(No Subject)" when subject is missing', async () => {
      const mockEmail = {
        from: { address: 'john@example.com' },
        to: [],
        subject: undefined,
        date: '2024-01-15T10:00:00Z',
        html: '<p>Body</p>',
        attachments: [],
      };

      mockParse.mockResolvedValue(mockEmail);

      const file = createMockFile('test.eml', 1000);
      const result = await parser.parseEmlFile(file as unknown as File);

      expect(result.subject).toBe('(No Subject)');
    });

    test('uses current date when date is missing', async () => {
      const beforeTest = new Date();
      const mockEmail = {
        from: { address: 'john@example.com' },
        to: [],
        subject: 'Test',
        date: undefined,
        html: '<p>Body</p>',
        attachments: [],
      };

      mockParse.mockResolvedValue(mockEmail);

      const file = createMockFile('test.eml', 1000);
      const result = await parser.parseEmlFile(file as unknown as File);
      const afterTest = new Date();

      expect(result.date.getTime()).toBeGreaterThanOrEqual(beforeTest.getTime());
      expect(result.date.getTime()).toBeLessThanOrEqual(afterTest.getTime());
    });

    test('uses "Unknown" when from is missing', async () => {
      const mockEmail = {
        from: undefined,
        to: [],
        subject: 'Test',
        date: '2024-01-15T10:00:00Z',
        html: '<p>Body</p>',
        attachments: [],
      };

      mockParse.mockResolvedValue(mockEmail);

      const file = createMockFile('test.eml', 1000);
      const result = await parser.parseEmlFile(file as unknown as File);

      expect(result.from).toBe('Unknown');
    });

    test('wraps plain text in <pre> when html is missing', async () => {
      const mockEmail = {
        from: { address: 'john@example.com' },
        to: [],
        subject: 'Test',
        date: '2024-01-15T10:00:00Z',
        html: undefined,
        text: 'Plain text body',
        attachments: [],
      };

      mockParse.mockResolvedValue(mockEmail);

      const file = createMockFile('test.eml', 1000);
      const result = await parser.parseEmlFile(file as unknown as File);

      expect(result.bodyHtml).toBe('<pre>Plain text body</pre>');
    });

    test('escapes HTML in plain text body', async () => {
      const mockEmail = {
        from: { address: 'john@example.com' },
        to: [],
        subject: 'Test',
        date: '2024-01-15T10:00:00Z',
        html: undefined,
        text: '<script>alert("xss")</script>',
        attachments: [],
      };

      mockParse.mockResolvedValue(mockEmail);

      const file = createMockFile('test.eml', 1000);
      const result = await parser.parseEmlFile(file as unknown as File);

      expect(result.bodyHtml).toBe(
        '<pre>&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;</pre>'
      );
    });
  });

  describe('parseMsgFile', () => {
    test('parses .msg file and returns EmailData', async () => {
      const mockFileData = {
        senderName: 'John Doe',
        senderEmail: 'john@example.com',
        recipients: [{ name: 'Jane Doe', email: 'jane@example.com' }],
        subject: 'Test Subject',
        messageDeliveryTime: '2024-01-15T10:00:00Z',
        bodyHtml: '<p>Hello World</p>',
        body: 'Hello World',
        attachments: [{ fileName: 'doc.pdf', dataLength: 2048 }],
      };

      mockGetFileData.mockReturnValue(mockFileData);

      const file = createMockFile('test.msg', 1000);
      const result = await parser.parseMsgFile(file as unknown as File);

      expect(result.subject).toBe('Test Subject');
      expect(result.from).toBe('John Doe');
      expect(result.to).toBe('Jane Doe');
      expect(result.bodyHtml).toBe('<p>Hello World</p>');
      expect(result.date).toEqual(new Date('2024-01-15T10:00:00Z'));
      expect(result.attachments).toHaveLength(1);
      expect(result.attachments[0]).toEqual({ name: 'doc.pdf', size: 2048 });
    });

    test('uses creationTime when messageDeliveryTime is missing', async () => {
      const mockFileData = {
        senderName: 'John Doe',
        recipients: [],
        subject: 'Test',
        messageDeliveryTime: undefined,
        creationTime: '2024-01-10T08:00:00Z',
        bodyHtml: '<p>Body</p>',
        attachments: [],
      };

      mockGetFileData.mockReturnValue(mockFileData);

      const file = createMockFile('test.msg', 1000);
      const result = await parser.parseMsgFile(file as unknown as File);

      expect(result.date).toEqual(new Date('2024-01-10T08:00:00Z'));
    });

    test('uses senderEmail when senderName is missing', async () => {
      const mockFileData = {
        senderName: undefined,
        senderEmail: 'john@example.com',
        recipients: [],
        subject: 'Test',
        messageDeliveryTime: '2024-01-15T10:00:00Z',
        bodyHtml: '<p>Body</p>',
        attachments: [],
      };

      mockGetFileData.mockReturnValue(mockFileData);

      const file = createMockFile('test.msg', 1000);
      const result = await parser.parseMsgFile(file as unknown as File);

      expect(result.from).toBe('john@example.com');
    });

    test('uses fileNameShort when fileName is missing', async () => {
      const mockFileData = {
        senderName: 'John',
        recipients: [],
        subject: 'Test',
        messageDeliveryTime: '2024-01-15T10:00:00Z',
        bodyHtml: '<p>Body</p>',
        attachments: [{ fileNameShort: 'short.pdf', dataLength: 512 }],
      };

      mockGetFileData.mockReturnValue(mockFileData);

      const file = createMockFile('test.msg', 1000);
      const result = await parser.parseMsgFile(file as unknown as File);

      expect(result.attachments[0]?.name).toBe('short.pdf');
    });
  });

  describe('parseFiles', () => {
    test('parses multiple .eml files', async () => {
      const mockEmail = {
        from: { name: 'John' },
        to: [],
        subject: 'Test',
        date: '2024-01-15T10:00:00Z',
        html: '<p>Body</p>',
        attachments: [],
      };

      mockParse.mockResolvedValue(mockEmail);

      const files = [
        createMockFile('email1.eml', 1000),
        createMockFile('email2.eml', 1000),
        createMockFile('email3.eml', 1000),
      ];

      const results = await parser.parseFiles(files as unknown as File[]);

      expect(results).toHaveLength(3);
    });

    test('parses mixed .eml and .msg files', async () => {
      const mockEmlEmail = {
        from: { name: 'EML Sender' },
        to: [],
        subject: 'EML Email',
        date: '2024-01-15T10:00:00Z',
        html: '<p>EML Body</p>',
        attachments: [],
      };

      const mockMsgFileData = {
        senderName: 'MSG Sender',
        recipients: [],
        subject: 'MSG Email',
        messageDeliveryTime: '2024-01-16T10:00:00Z',
        bodyHtml: '<p>MSG Body</p>',
        attachments: [],
      };

      mockParse.mockResolvedValue(mockEmlEmail);
      mockGetFileData.mockReturnValue(mockMsgFileData);

      const files = [
        createMockFile('email1.eml', 1000),
        createMockFile('email2.msg', 1000),
      ];

      const results = await parser.parseFiles(files as unknown as File[]);

      expect(results).toHaveLength(2);
      expect(results[0]?.subject).toBe('EML Email');
      expect(results[1]?.subject).toBe('MSG Email');
    });

    test('skips failed files and continues with rest', async () => {
      let callCount = 0;
      mockParse.mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          throw new Error('Parse error');
        }
        return Promise.resolve({
          from: { name: 'John' },
          to: [],
          subject: `Email ${callCount}`,
          date: '2024-01-15T10:00:00Z',
          html: '<p>Body</p>',
          attachments: [],
        });
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const files = [
        createMockFile('email1.eml', 1000),
        createMockFile('email2.eml', 1000),
        createMockFile('email3.eml', 1000),
      ];

      const results = await parser.parseFiles(files as unknown as File[]);

      expect(results).toHaveLength(2);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('throws error when all files fail to parse', async () => {
      mockParse.mockRejectedValue(new Error('Parse error'));

      vi.spyOn(console, 'error').mockImplementation(() => {});

      const files = [
        createMockFile('email1.eml', 1000),
        createMockFile('email2.eml', 1000),
      ];

      await expect(parser.parseFiles(files as unknown as File[])).rejects.toThrow(
        'All files failed to parse'
      );
    });

    test('skips unsupported file formats', async () => {
      const mockEmail = {
        from: { name: 'John' },
        to: [],
        subject: 'Test',
        date: '2024-01-15T10:00:00Z',
        html: '<p>Body</p>',
        attachments: [],
      };

      mockParse.mockResolvedValue(mockEmail);

      vi.spyOn(console, 'error').mockImplementation(() => {});

      const files = [
        createMockFile('email1.eml', 1000),
        createMockFile('document.txt', 1000),
        createMockFile('image.png', 1000),
      ];

      const results = await parser.parseFiles(files as unknown as File[]);

      expect(results).toHaveLength(1);
    });

    test('calls progress callback correctly', async () => {
      const mockEmail = {
        from: { name: 'John' },
        to: [],
        subject: 'Test',
        date: '2024-01-15T10:00:00Z',
        html: '<p>Body</p>',
        attachments: [],
      };

      mockParse.mockResolvedValue(mockEmail);

      const progressCallback = vi.fn();
      const files = [
        createMockFile('email1.eml', 1000),
        createMockFile('email2.eml', 1000),
        createMockFile('email3.eml', 1000),
      ];

      await parser.parseFiles(files as unknown as File[], { onProgress: progressCallback });

      expect(progressCallback).toHaveBeenCalledTimes(3);
      expect(progressCallback).toHaveBeenNthCalledWith(1, 1, 3);
      expect(progressCallback).toHaveBeenNthCalledWith(2, 2, 3);
      expect(progressCallback).toHaveBeenNthCalledWith(3, 3, 3);
    });

    test('applies dateAsc sort order', async () => {
      let callCount = 0;
      const dates = [
        '2024-01-17T10:00:00Z',
        '2024-01-15T10:00:00Z',
        '2024-01-16T10:00:00Z',
      ];

      mockParse.mockImplementation(() => {
        const currentCall = callCount++;
        return Promise.resolve({
          from: { name: 'John' },
          to: [],
          subject: `Email ${currentCall + 1}`,
          date: dates[currentCall],
          html: '<p>Body</p>',
          attachments: [],
        });
      });

      const files = [
        createMockFile('email1.eml', 1000),
        createMockFile('email2.eml', 1000),
        createMockFile('email3.eml', 1000),
      ];

      const results = await parser.parseFiles(files as unknown as File[], { sortOrder: 'dateAsc' });

      expect(results[0]?.subject).toBe('Email 2');
      expect(results[1]?.subject).toBe('Email 3');
      expect(results[2]?.subject).toBe('Email 1');
    });

    test('applies dateDesc sort order', async () => {
      let callCount = 0;
      const dates = [
        '2024-01-17T10:00:00Z',
        '2024-01-15T10:00:00Z',
        '2024-01-16T10:00:00Z',
      ];

      mockParse.mockImplementation(() => {
        const currentCall = callCount++;
        return Promise.resolve({
          from: { name: 'John' },
          to: [],
          subject: `Email ${currentCall + 1}`,
          date: dates[currentCall],
          html: '<p>Body</p>',
          attachments: [],
        });
      });

      const files = [
        createMockFile('email1.eml', 1000),
        createMockFile('email2.eml', 1000),
        createMockFile('email3.eml', 1000),
      ];

      const results = await parser.parseFiles(files as unknown as File[], { sortOrder: 'dateDesc' });

      expect(results[0]?.subject).toBe('Email 1');
      expect(results[1]?.subject).toBe('Email 3');
      expect(results[2]?.subject).toBe('Email 2');
    });

    test('preserves selection order by default', async () => {
      let callCount = 0;
      const dates = [
        '2024-01-17T10:00:00Z',
        '2024-01-15T10:00:00Z',
        '2024-01-16T10:00:00Z',
      ];

      mockParse.mockImplementation(() => {
        const currentCall = callCount++;
        return Promise.resolve({
          from: { name: 'John' },
          to: [],
          subject: `Email ${currentCall + 1}`,
          date: dates[currentCall],
          html: '<p>Body</p>',
          attachments: [],
        });
      });

      const files = [
        createMockFile('email1.eml', 1000),
        createMockFile('email2.eml', 1000),
        createMockFile('email3.eml', 1000),
      ];

      const results = await parser.parseFiles(files as unknown as File[]);

      expect(results[0]?.subject).toBe('Email 1');
      expect(results[1]?.subject).toBe('Email 2');
      expect(results[2]?.subject).toBe('Email 3');
    });
  });

  describe('file size validation', () => {
    test('rejects single file exceeding 100MB', async () => {
      const largeFile = createMockFile('large.eml', 101 * 1024 * 1024);

      await expect(parser.parseFiles([largeFile] as unknown as File[])).rejects.toThrow(
        'File "large.eml" exceeds maximum size of 100MB'
      );
    });

    test('rejects when total size exceeds 300MB', async () => {
      const files = [
        createMockFile('file1.eml', 100 * 1024 * 1024),
        createMockFile('file2.eml', 100 * 1024 * 1024),
        createMockFile('file3.eml', 100 * 1024 * 1024),
        createMockFile('file4.eml', 1 * 1024 * 1024),
      ];

      await expect(parser.parseFiles(files as unknown as File[])).rejects.toThrow(
        'Total file size exceeds maximum of 300MB'
      );
    });

    test('accepts files within size limits', async () => {
      const mockEmail = {
        from: { name: 'John' },
        to: [],
        subject: 'Test',
        date: '2024-01-15T10:00:00Z',
        html: '<p>Body</p>',
        attachments: [],
      };

      mockParse.mockResolvedValue(mockEmail);

      const files = [
        createMockFile('file1.eml', 50 * 1024 * 1024),
        createMockFile('file2.eml', 50 * 1024 * 1024),
      ];

      const results = await parser.parseFiles(files as unknown as File[]);

      expect(results).toHaveLength(2);
    });
  });

  describe('edge cases', () => {
    test('handles empty file list', async () => {
      const results = await parser.parseFiles([]);

      expect(results).toEqual([]);
    });

    test('handles email with no attachments', async () => {
      const mockEmail = {
        from: { name: 'John' },
        to: [],
        subject: 'Test',
        date: '2024-01-15T10:00:00Z',
        html: '<p>Body</p>',
        attachments: [],
      };

      mockParse.mockResolvedValue(mockEmail);

      const file = createMockFile('test.eml', 1000);
      const result = await parser.parseEmlFile(file as unknown as File);

      expect(result.attachments).toEqual([]);
    });

    test('handles multiple recipients', async () => {
      const mockEmail = {
        from: { name: 'John' },
        to: [
          { name: 'Jane', address: 'jane@example.com' },
          { name: 'Bob', address: 'bob@example.com' },
          { address: 'alice@example.com' },
        ],
        subject: 'Test',
        date: '2024-01-15T10:00:00Z',
        html: '<p>Body</p>',
        attachments: [],
      };

      mockParse.mockResolvedValue(mockEmail);

      const file = createMockFile('test.eml', 1000);
      const result = await parser.parseEmlFile(file as unknown as File);

      expect(result.to).toBe('Jane, Bob, alice@example.com');
    });

    test('uses address when name is missing in from field', async () => {
      const mockEmail = {
        from: { address: 'john@example.com' },
        to: [],
        subject: 'Test',
        date: '2024-01-15T10:00:00Z',
        html: '<p>Body</p>',
        attachments: [],
      };

      mockParse.mockResolvedValue(mockEmail);

      const file = createMockFile('test.eml', 1000);
      const result = await parser.parseEmlFile(file as unknown as File);

      expect(result.from).toBe('john@example.com');
    });

    test('handles attachment with string content', async () => {
      const mockEmail = {
        from: { name: 'John' },
        to: [],
        subject: 'Test',
        date: '2024-01-15T10:00:00Z',
        html: '<p>Body</p>',
        attachments: [{ filename: 'text.txt', content: 'Hello World' }],
      };

      mockParse.mockResolvedValue(mockEmail);

      const file = createMockFile('test.eml', 1000);
      const result = await parser.parseEmlFile(file as unknown as File);

      expect(result.attachments[0]).toEqual({ name: 'text.txt', size: 11 });
    });
  });
});
