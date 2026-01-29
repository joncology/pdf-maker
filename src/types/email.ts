export interface EmailData {
  id: string;
  subject: string;
  from: string;
  to: string;
  date: Date;
  bodyHtml: string;
  attachments: AttachmentInfo[];
}

export interface AttachmentInfo {
  name: string;
  size: number;
}

export type SortOrder = 'selection' | 'dateAsc' | 'dateDesc';
