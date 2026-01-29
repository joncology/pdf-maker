import { EmailData, AttachmentInfo, SortOrder } from '../types/email';

declare const Office: {
  context: {
    mailbox: {
      getSelectedItemsAsync: (
        callback: (result: {
          status: string;
          value: Array<{ itemId: string }>;
          error?: { message: string };
        }) => void
      ) => void;
      loadItemByIdAsync: (
        itemId: string,
        callback: (result: {
          status: string;
          value: LoadedItem;
          error?: { message: string };
        }) => void
      ) => void;
    };
  };
  AsyncResultStatus: {
    Succeeded: string;
    Failed: string;
  };
  CoercionType: {
    Html: string;
  };
};

interface LoadedItem {
  itemId: string;
  subject: string;
  from: { emailAddress: string };
  to: Array<{ emailAddress: string }>;
  dateTimeCreated: Date;
  attachments: Array<{ name: string; size: number }>;
  body: {
    getAsync: (
      coercionType: string,
      callback: (result: { status: string; value: string }) => void
    ) => void;
  };
  unloadAsync: (callback: (result: { status: string }) => void) => void;
}

const MAX_EMAILS = 100;

export class EmailCollectorService {
  async getSelectedEmails(sortOrder: SortOrder = 'selection'): Promise<EmailData[]> {
    const selectedItems = await this.getSelectedItems();

    if (selectedItems.length === 0) {
      return [];
    }

    if (selectedItems.length > MAX_EMAILS) {
      throw new Error('Cannot process more than 100 emails at once');
    }

    const emails: EmailData[] = [];

    for (const item of selectedItems) {
      try {
        const email = await this.loadEmailDetails(item.itemId);
        if (email) {
          emails.push(email);
        }
      } catch {
        console.error(`Failed to load email ${item.itemId}`);
      }
    }

    return this.sortEmails(emails, sortOrder);
  }

  private getSelectedItems(): Promise<Array<{ itemId: string }>> {
    return new Promise((resolve, reject) => {
      Office.context.mailbox.getSelectedItemsAsync((result) => {
        if (result.status === Office.AsyncResultStatus.Succeeded) {
          resolve(result.value);
        } else {
          reject(new Error(result.error?.message ?? 'Failed to get selected items'));
        }
      });
    });
  }

  private loadEmailDetails(itemId: string): Promise<EmailData | null> {
    return new Promise((resolve) => {
      Office.context.mailbox.loadItemByIdAsync(itemId, async (result) => {
        if (result.status !== Office.AsyncResultStatus.Succeeded) {
          resolve(null);
          return;
        }

        const loadedItem = result.value;

        try {
          const bodyHtml = await this.getBodyHtml(loadedItem);
          const attachments = this.extractAttachments(loadedItem.attachments);

          const email: EmailData = {
            id: loadedItem.itemId,
            subject: loadedItem.subject,
            from: loadedItem.from.emailAddress,
            to: loadedItem.to.map((r) => r.emailAddress).join(', '),
            date: loadedItem.dateTimeCreated,
            bodyHtml,
            attachments,
          };

          await this.unloadItem(loadedItem);
          resolve(email);
        } catch {
          await this.unloadItem(loadedItem);
          resolve(null);
        }
      });
    });
  }

  private getBodyHtml(loadedItem: LoadedItem): Promise<string> {
    return new Promise((resolve) => {
      loadedItem.body.getAsync(Office.CoercionType.Html, (result) => {
        if (result.status === Office.AsyncResultStatus.Succeeded) {
          resolve(result.value);
        } else {
          resolve('');
        }
      });
    });
  }

  private unloadItem(loadedItem: LoadedItem): Promise<void> {
    return new Promise((resolve) => {
      loadedItem.unloadAsync(() => {
        resolve();
      });
    });
  }

  private extractAttachments(
    attachments: Array<{ name: string; size: number }>
  ): AttachmentInfo[] {
    return attachments.map((a) => ({
      name: a.name,
      size: a.size,
    }));
  }

  private sortEmails(emails: EmailData[], sortOrder: SortOrder): EmailData[] {
    if (sortOrder === 'selection') {
      return emails;
    }

    return [...emails].sort((a, b) => {
      const dateA = a.date.getTime();
      const dateB = b.date.getTime();

      if (sortOrder === 'dateAsc') {
        return dateA - dateB;
      }
      return dateB - dateA;
    });
  }
}
