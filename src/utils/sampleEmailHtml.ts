/**
 * Sample email HTML templates for testing PDF conversion.
 * Mimics Outlook email structure with inline styles.
 */

export interface EmailData {
  from: string;
  to: string;
  subject: string;
  date: string;
  body: string;
}

/**
 * Generates HTML that mimics Outlook email structure.
 */
export function generateEmailHtml(email: EmailData): string {
  return `
<div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto;">
  <div style="border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 20px;">
    <p style="margin: 5px 0;"><strong>From:</strong> ${email.from}</p>
    <p style="margin: 5px 0;"><strong>To:</strong> ${email.to}</p>
    <p style="margin: 5px 0;"><strong>Subject:</strong> ${email.subject}</p>
    <p style="margin: 5px 0;"><strong>Date:</strong> ${email.date}</p>
  </div>
  <div style="line-height: 1.6;">
    ${email.body}
  </div>
</div>
`.trim();
}

/**
 * Sample email with Korean text for testing Korean font rendering.
 */
export const sampleKoreanEmail: EmailData = {
  from: 'sender@example.com',
  to: 'recipient@example.com',
  subject: '테스트 이메일 (Test Email)',
  date: '2026-01-29',
  body: `
    <p>안녕하세요,</p>
    <p>This is a test email with Korean text: 한글 테스트입니다.</p>
    <p>Mixed content: Hello 세계 (World)!</p>
    <p>감사합니다.</p>
  `,
};

/**
 * Sample email with external image for testing image failure handling.
 */
export const sampleEmailWithExternalImage: EmailData = {
  from: 'sender@example.com',
  to: 'recipient@example.com',
  subject: 'Email with External Image',
  date: '2026-01-29',
  body: `
    <p>This email contains an external image:</p>
    <img src="https://external-image-that-will-fail.com/image.png" alt="External Image" style="max-width: 100%;" />
    <p>The image above should be replaced with a placeholder if it fails to load.</p>
  `,
};

/**
 * Simple English-only email for basic conversion testing.
 */
export const sampleBasicEmail: EmailData = {
  from: 'john.doe@company.com',
  to: 'jane.smith@company.com',
  subject: 'Meeting Tomorrow',
  date: '2026-01-29',
  body: `
    <p>Hi Jane,</p>
    <p>Just a reminder about our meeting tomorrow at 10 AM.</p>
    <p>Please bring the quarterly report.</p>
    <p>Best regards,<br/>John</p>
  `,
};

/**
 * Get sample email HTML for testing.
 */
export function getSampleEmailHtml(type: 'korean' | 'image' | 'basic' = 'basic'): string {
  const emailMap = {
    korean: sampleKoreanEmail,
    image: sampleEmailWithExternalImage,
    basic: sampleBasicEmail,
  };
  return generateEmailHtml(emailMap[type]);
}
