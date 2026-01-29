import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { EmailCollectorService } from '../services/emailCollector';

// Mock Office.js types
interface MockAsyncResult<T> {
  status: string;
  value: T;
  error?: { message: string };
}

interface MockSelectedItem {
  itemId: string;
  itemType: string;
  itemMode: string;
  subject: string;
}

interface MockEmailAddressDetails {
  emailAddress: string;
  displayName: string;
}

interface MockAttachment {
  name: string;
  size: number;
}

interface MockLoadedItem {
  itemId: string;
  subject: string;
  from: MockEmailAddressDetails;
  to: MockEmailAddressDetails[];
  dateTimeCreated: Date;
  attachments: MockAttachment[];
  body: {
    getAsync: (
      coercionType: string,
      callback: (result: MockAsyncResult<string>) => void
    ) => void;
  };
  unloadAsync: (callback: (result: MockAsyncResult<void>) => void) => void;
}

// Mock mailbox
const mockMailbox = {
  getSelectedItemsAsync: vi.fn(),
  loadItemByIdAsync: vi.fn(),
};

// Set up global Office mock
beforeEach(() => {
  vi.clearAllMocks();
  (global as Record<string, unknown>).Office = {
    context: { mailbox: mockMailbox },
    AsyncResultStatus: { Succeeded: 'succeeded', Failed: 'failed' },
    CoercionType: { Html: 'html' },
  };
});

afterEach(() => {
  delete (global as Record<string, unknown>).Office;
});

// Helper to create mock selected items
function createMockSelectedItems(count: number): MockSelectedItem[] {
  return Array.from({ length: count }, (_, i) => ({
    itemId: `item-${i + 1}`,
    itemType: 'message',
    itemMode: 'read',
    subject: `Email ${i + 1}`,
  }));
}

// Helper to create mock loaded item
function createMockLoadedItem(
  id: string,
  subject: string,
  date: Date,
  bodyHtml: string = '<p>Body content</p>'
): MockLoadedItem {
  return {
    itemId: id,
    subject,
    from: { emailAddress: 'sender@example.com', displayName: 'Sender Name' },
    to: [{ emailAddress: 'recipient@example.com', displayName: 'Recipient' }],
    dateTimeCreated: date,
    attachments: [
      { name: 'file1.pdf', size: 1024 },
      { name: 'file2.docx', size: 2048 },
    ],
    body: {
      getAsync: vi.fn((_coercionType, callback) => {
        callback({ status: 'succeeded', value: bodyHtml });
      }),
    },
    unloadAsync: vi.fn((callback) => {
      callback({ status: 'succeeded', value: undefined });
    }),
  };
}

describe('EmailCollectorService', () => {
  let service: EmailCollectorService;

  beforeEach(() => {
    service = new EmailCollectorService();
  });

  describe('getSelectedEmails', () => {
    test('collects 3 emails successfully with mocked Office.js', async () => {
      const selectedItems = createMockSelectedItems(3);
      const dates = [
        new Date('2024-01-15T10:00:00Z'),
        new Date('2024-01-16T10:00:00Z'),
        new Date('2024-01-17T10:00:00Z'),
      ];

      mockMailbox.getSelectedItemsAsync.mockImplementation((callback) => {
        callback({ status: 'succeeded', value: selectedItems });
      });

      mockMailbox.loadItemByIdAsync.mockImplementation((itemId, callback) => {
        const index = parseInt(itemId.split('-')[1] ?? '1') - 1;
        const loadedItem = createMockLoadedItem(
          itemId,
          `Email ${index + 1}`,
          dates[index] ?? new Date(),
          `<p>Body of email ${index + 1}</p>`
        );
        callback({ status: 'succeeded', value: loadedItem });
      });

      const emails = await service.getSelectedEmails();

      expect(emails).toHaveLength(3);
      expect(emails[0]).toMatchObject({
        id: 'item-1',
        subject: 'Email 1',
        from: 'sender@example.com',
        to: 'recipient@example.com',
        bodyHtml: '<p>Body of email 1</p>',
      });
      expect(emails[0]?.attachments).toHaveLength(2);
      expect(emails[0]?.attachments[0]).toEqual({ name: 'file1.pdf', size: 1024 });
    });

    test('handles 1 email load failure, returns other 2', async () => {
      const selectedItems = createMockSelectedItems(3);
      const dates = [
        new Date('2024-01-15T10:00:00Z'),
        new Date('2024-01-16T10:00:00Z'),
        new Date('2024-01-17T10:00:00Z'),
      ];

      mockMailbox.getSelectedItemsAsync.mockImplementation((callback) => {
        callback({ status: 'succeeded', value: selectedItems });
      });

      let callCount = 0;
      mockMailbox.loadItemByIdAsync.mockImplementation((itemId, callback) => {
        callCount++;
        // Fail the second email
        if (callCount === 2) {
          callback({
            status: 'failed',
            error: { message: 'Failed to load item' },
          });
          return;
        }
        const index = parseInt(itemId.split('-')[1] ?? '1') - 1;
        const loadedItem = createMockLoadedItem(
          itemId,
          `Email ${index + 1}`,
          dates[index] ?? new Date()
        );
        callback({ status: 'succeeded', value: loadedItem });
      });

      const emails = await service.getSelectedEmails();

      expect(emails).toHaveLength(2);
      expect(emails.map((e) => e.id)).toEqual(['item-1', 'item-3']);
    });

    test('sorts by selection order (default)', async () => {
      const selectedItems = createMockSelectedItems(3);
      // Dates are NOT in order to verify selection order is preserved
      const dates = [
        new Date('2024-01-17T10:00:00Z'), // newest
        new Date('2024-01-15T10:00:00Z'), // oldest
        new Date('2024-01-16T10:00:00Z'), // middle
      ];

      mockMailbox.getSelectedItemsAsync.mockImplementation((callback) => {
        callback({ status: 'succeeded', value: selectedItems });
      });

      mockMailbox.loadItemByIdAsync.mockImplementation((itemId, callback) => {
        const index = parseInt(itemId.split('-')[1] ?? '1') - 1;
        const loadedItem = createMockLoadedItem(
          itemId,
          `Email ${index + 1}`,
          dates[index] ?? new Date()
        );
        callback({ status: 'succeeded', value: loadedItem });
      });

      const emails = await service.getSelectedEmails('selection');

      expect(emails.map((e) => e.id)).toEqual(['item-1', 'item-2', 'item-3']);
    });

    test('sorts by date ascending', async () => {
      const selectedItems = createMockSelectedItems(3);
      const dates = [
        new Date('2024-01-17T10:00:00Z'), // newest
        new Date('2024-01-15T10:00:00Z'), // oldest
        new Date('2024-01-16T10:00:00Z'), // middle
      ];

      mockMailbox.getSelectedItemsAsync.mockImplementation((callback) => {
        callback({ status: 'succeeded', value: selectedItems });
      });

      mockMailbox.loadItemByIdAsync.mockImplementation((itemId, callback) => {
        const index = parseInt(itemId.split('-')[1] ?? '1') - 1;
        const loadedItem = createMockLoadedItem(
          itemId,
          `Email ${index + 1}`,
          dates[index] ?? new Date()
        );
        callback({ status: 'succeeded', value: loadedItem });
      });

      const emails = await service.getSelectedEmails('dateAsc');

      // Should be sorted oldest to newest: item-2, item-3, item-1
      expect(emails.map((e) => e.id)).toEqual(['item-2', 'item-3', 'item-1']);
    });

    test('sorts by date descending', async () => {
      const selectedItems = createMockSelectedItems(3);
      const dates = [
        new Date('2024-01-17T10:00:00Z'), // newest
        new Date('2024-01-15T10:00:00Z'), // oldest
        new Date('2024-01-16T10:00:00Z'), // middle
      ];

      mockMailbox.getSelectedItemsAsync.mockImplementation((callback) => {
        callback({ status: 'succeeded', value: selectedItems });
      });

      mockMailbox.loadItemByIdAsync.mockImplementation((itemId, callback) => {
        const index = parseInt(itemId.split('-')[1] ?? '1') - 1;
        const loadedItem = createMockLoadedItem(
          itemId,
          `Email ${index + 1}`,
          dates[index] ?? new Date()
        );
        callback({ status: 'succeeded', value: loadedItem });
      });

      const emails = await service.getSelectedEmails('dateDesc');

      // Should be sorted newest to oldest: item-1, item-3, item-2
      expect(emails.map((e) => e.id)).toEqual(['item-1', 'item-3', 'item-2']);
    });

    test('returns empty array when no emails selected', async () => {
      mockMailbox.getSelectedItemsAsync.mockImplementation((callback) => {
        callback({ status: 'succeeded', value: [] });
      });

      const emails = await service.getSelectedEmails();

      expect(emails).toEqual([]);
    });

    test('throws error when more than 100 emails selected', async () => {
      const selectedItems = createMockSelectedItems(101);

      mockMailbox.getSelectedItemsAsync.mockImplementation((callback) => {
        callback({ status: 'succeeded', value: selectedItems });
      });

      await expect(service.getSelectedEmails()).rejects.toThrow(
        'Cannot process more than 100 emails at once'
      );
    });

    test('throws error when getSelectedItemsAsync fails', async () => {
      mockMailbox.getSelectedItemsAsync.mockImplementation((callback) => {
        callback({
          status: 'failed',
          error: { message: 'Failed to get selected items' },
        });
      });

      await expect(service.getSelectedEmails()).rejects.toThrow(
        'Failed to get selected items'
      );
    });

    test('handles body.getAsync failure gracefully', async () => {
      const selectedItems = createMockSelectedItems(1);

      mockMailbox.getSelectedItemsAsync.mockImplementation((callback) => {
        callback({ status: 'succeeded', value: selectedItems });
      });

      mockMailbox.loadItemByIdAsync.mockImplementation((itemId, callback) => {
        const loadedItem = createMockLoadedItem(
          itemId,
          'Email 1',
          new Date('2024-01-15T10:00:00Z')
        );
        loadedItem.body.getAsync = vi.fn((_coercionType, cb) => {
          cb({ status: 'failed', error: { message: 'Body fetch failed' }, value: '' });
        });
        callback({ status: 'succeeded', value: loadedItem });
      });

      const emails = await service.getSelectedEmails();

      // Should still return the email with empty body
      expect(emails).toHaveLength(1);
      expect(emails[0]?.bodyHtml).toBe('');
    });

    test('properly calls unloadAsync after loading each item', async () => {
      const selectedItems = createMockSelectedItems(2);
      const unloadMocks: ReturnType<typeof vi.fn>[] = [];

      mockMailbox.getSelectedItemsAsync.mockImplementation((callback) => {
        callback({ status: 'succeeded', value: selectedItems });
      });

      mockMailbox.loadItemByIdAsync.mockImplementation((itemId, callback) => {
        const index = parseInt(itemId.split('-')[1] ?? '1') - 1;
        const loadedItem = createMockLoadedItem(
          itemId,
          `Email ${index + 1}`,
          new Date('2024-01-15T10:00:00Z')
        );
        unloadMocks.push(loadedItem.unloadAsync as ReturnType<typeof vi.fn>);
        callback({ status: 'succeeded', value: loadedItem });
      });

      await service.getSelectedEmails();

      // Both items should have been unloaded
      expect(unloadMocks).toHaveLength(2);
      unloadMocks.forEach((mock) => {
        expect(mock).toHaveBeenCalledTimes(1);
      });
    });

    test('formats multiple recipients correctly', async () => {
      const selectedItems = createMockSelectedItems(1);

      mockMailbox.getSelectedItemsAsync.mockImplementation((callback) => {
        callback({ status: 'succeeded', value: selectedItems });
      });

      mockMailbox.loadItemByIdAsync.mockImplementation((itemId, callback) => {
        const loadedItem: MockLoadedItem = {
          itemId,
          subject: 'Email 1',
          from: { emailAddress: 'sender@example.com', displayName: 'Sender' },
          to: [
            { emailAddress: 'recipient1@example.com', displayName: 'Recipient 1' },
            { emailAddress: 'recipient2@example.com', displayName: 'Recipient 2' },
          ],
          dateTimeCreated: new Date('2024-01-15T10:00:00Z'),
          attachments: [],
          body: {
            getAsync: vi.fn((_coercionType, cb) => {
              cb({ status: 'succeeded', value: '<p>Body</p>' });
            }),
          },
          unloadAsync: vi.fn((cb) => {
            cb({ status: 'succeeded', value: undefined });
          }),
        };
        callback({ status: 'succeeded', value: loadedItem });
      });

      const emails = await service.getSelectedEmails();

      expect(emails[0]?.to).toBe('recipient1@example.com, recipient2@example.com');
    });
  });
});
