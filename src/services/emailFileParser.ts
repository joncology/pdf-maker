import PostalMime from 'postal-mime';
import MsgReader from '@kenjiuno/msgreader';
import { EmailData, AttachmentInfo, SortOrder } from '../types/email';

const MAX_SINGLE_FILE_SIZE = 200 * 1024 * 1024;
const MAX_TOTAL_SIZE = 500 * 1024 * 1024;

export class EmailFileParser {
  async parseEmlFile(file: File): Promise<EmailData> {
    const arrayBuffer = await file.arrayBuffer();
    const parser = new PostalMime();
    const email = await parser.parse(arrayBuffer);

    const from = this.extractFromAddress(email.from);
    const to = this.extractToAddresses(email.to);
    const subject = email.subject || '(No Subject)';
    const date = email.date ? new Date(email.date) : new Date();
    const bodyHtml = this.extractBodyHtml(email.html, email.text);
    const attachments = this.extractEmlAttachments(email.attachments);

    return {
      id: this.generateId(),
      subject,
      from,
      to,
      date,
      bodyHtml,
      attachments,
    };
  }

  async parseMsgFile(file: File): Promise<EmailData> {
    const arrayBuffer = await file.arrayBuffer();
    const msgReader = new MsgReader(arrayBuffer);
    const fileData = msgReader.getFileData();

    const from = fileData.senderName || fileData.senderEmail || 'Unknown';
    const to = this.extractMsgRecipients(fileData.recipients);
    const subject = fileData.subject || '(No Subject)';
    const date = fileData.messageDeliveryTime
      ? new Date(fileData.messageDeliveryTime)
      : fileData.creationTime
        ? new Date(fileData.creationTime)
        : new Date();
    const bodyHtml = this.extractBodyHtml(fileData.bodyHtml, fileData.body);
    const attachments = this.extractMsgAttachments(fileData.attachments);

    return {
      id: this.generateId(),
      subject,
      from,
      to,
      date,
      bodyHtml,
      attachments,
    };
  }

  async parseFiles(
    files: File[],
    options?: {
      sortOrder?: SortOrder;
      onProgress?: (current: number, total: number) => void;
    }
  ): Promise<EmailData[]> {
    this.validateFileSizes(files);

    const emails: EmailData[] = [];
    const total = files.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue;

      try {
        options?.onProgress?.(i + 1, total);

        const extension = file.name.toLowerCase().split('.').pop();
        let email: EmailData;

        if (extension === 'eml') {
          email = await this.parseEmlFile(file);
        } else if (extension === 'msg') {
          email = await this.parseMsgFile(file);
        } else {
          console.error(`Unsupported file format: ${file.name}`);
          continue;
        }

        emails.push(email);
      } catch (error) {
        console.error(`Failed to parse file ${file.name}:`, error);
      }
    }

    if (emails.length === 0 && files.length > 0) {
      throw new Error('All files failed to parse');
    }

    return this.sortEmails(emails, options?.sortOrder ?? 'selection');
  }

  private validateFileSizes(files: File[]): void {
    let totalSize = 0;

    for (const file of files) {
      if (file.size > MAX_SINGLE_FILE_SIZE) {
        throw new Error(
          `File "${file.name}" exceeds maximum size of 200MB`
        );
      }
      totalSize += file.size;
    }

    if (totalSize > MAX_TOTAL_SIZE) {
      throw new Error('Total file size exceeds maximum of 500MB');
    }
  }

  private generateId(): string {
    return `email-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private extractFromAddress(
    from: { address?: string; name?: string } | undefined
  ): string {
    if (!from) return 'Unknown';
    return from.name || from.address || 'Unknown';
  }

  private extractToAddresses(
    to: Array<{ address?: string; name?: string }> | undefined
  ): string {
    if (!to || to.length === 0) return '';
    return to.map((r) => r.name || r.address || '').filter(Boolean).join(', ');
  }

  private extractMsgRecipients(
    recipients: Array<{ name?: string; email?: string }> | undefined
  ): string {
    if (!recipients || recipients.length === 0) return '';
    return recipients
      .map((r) => r.name || r.email || '')
      .filter(Boolean)
      .join(', ');
  }

  private extractBodyHtml(
    html: string | undefined,
    text: string | undefined
  ): string {
    if (html) return html;
    if (text) return `<pre>${this.escapeHtml(text)}</pre>`;
    return '';
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private extractEmlAttachments(
    attachments:
      | Array<{ filename: string | null; content: ArrayBuffer | string }>
      | undefined
  ): AttachmentInfo[] {
    if (!attachments) return [];
    return attachments.map((a) => ({
      name: a.filename || 'unnamed',
      size: typeof a.content === 'string' ? a.content.length : a.content.byteLength,
    }));
  }

  private extractMsgAttachments(
    attachments:
      | Array<{ fileName?: string; fileNameShort?: string; dataLength?: number; content?: Uint8Array }>
      | undefined
  ): AttachmentInfo[] {
    if (!attachments) return [];
    return attachments.map((a) => ({
      name: a.fileName || a.fileNameShort || 'unnamed',
      size: a.dataLength || a.content?.length || 0,
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
