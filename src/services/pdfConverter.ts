import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export type PdfQuality = 'high' | 'medium' | 'low';

export interface PdfOptions {
  pageSize?: 'a4' | 'letter';
  margin?: number;
  quality?: PdfQuality;
}

const PAGE_DIMENSIONS = {
  a4: { width: 210, height: 297 },
  letter: { width: 215.9, height: 279.4 },
} as const;

const DEFAULT_OPTIONS: Required<PdfOptions> = {
  pageSize: 'a4',
  margin: 10,
  quality: 'low',
};

const QUALITY_SETTINGS: Record<PdfQuality, { scale: number; imageFormat: 'JPEG'; imageQuality: number }> = {
  high: { scale: 1, imageFormat: 'JPEG', imageQuality: 0.92 },
  medium: { scale: 1, imageFormat: 'JPEG', imageQuality: 0.75 },
  low: { scale: 1, imageFormat: 'JPEG', imageQuality: 0.5 },
};

export class PdfConverter {
  async htmlToPdf(html: string, options?: PdfOptions): Promise<Uint8Array> {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
    const { pageSize, margin, quality } = mergedOptions;
    const dimensions = PAGE_DIMENSIONS[pageSize];
    const qualitySettings = QUALITY_SETTINGS[quality];

    const container = this.createRenderContainer(html, dimensions.width, margin);
    document.body.appendChild(container);

    try {
      const elementWidth = container.offsetWidth;
      const elementHeight = container.offsetHeight;
      const canvas = await this.renderToCanvas(container, qualitySettings.scale);
      const pdfBytes = this.canvasToPdf(canvas, dimensions, margin, qualitySettings, elementWidth, elementHeight);
      return pdfBytes;
    } finally {
      document.body.removeChild(container);
    }
  }

  private createRenderContainer(
    html: string,
    pageWidthMm: number,
    marginMm: number
  ): HTMLDivElement {
    const container = document.createElement('div');
    const contentWidthMm = pageWidthMm - marginMm * 2;
    const contentWidthPx = this.mmToPx(contentWidthMm);

    container.style.cssText = `
      position: absolute;
      left: -9999px;
      top: 0;
      width: ${contentWidthPx}px;
      max-width: ${contentWidthPx}px;
      background: white;
      font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', 'Noto Sans KR', Arial, sans-serif;
      box-sizing: border-box;
      overflow: hidden;
      word-wrap: break-word;
      overflow-wrap: break-word;
    `;
    container.innerHTML = html;
    
    this.constrainContentWidth(container, contentWidthPx);

    this.preprocessImages(container);

    return container;
  }

  private constrainContentWidth(container: HTMLElement, maxWidth: number): void {
    const allElements = container.querySelectorAll('*');
    allElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.maxWidth = '100%';
      htmlEl.style.boxSizing = 'border-box';
    });
    
    const tables = container.querySelectorAll('table');
    tables.forEach((table) => {
      table.style.width = '100%';
      table.style.maxWidth = `${maxWidth}px`;
      table.style.tableLayout = 'fixed';
    });
    
    const images = container.querySelectorAll('img');
    images.forEach((img) => {
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
    });
  }

  private preprocessImages(container: HTMLElement): void {
    const images = container.querySelectorAll('img');
    images.forEach((img) => {
      img.crossOrigin = 'anonymous';

      img.onerror = () => {
        const placeholder = document.createElement('div');
        placeholder.style.cssText = `
          display: inline-block;
          padding: 10px;
          background: #f0f0f0;
          border: 1px dashed #ccc;
          color: #666;
          font-size: 12px;
        `;
        placeholder.textContent = '[Image not available]';
        img.replaceWith(placeholder);
      };
    });
  }

  private async renderToCanvas(element: HTMLElement, scale: number = 2): Promise<HTMLCanvasElement> {
    try {
      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: false,
        logging: false,
        imageTimeout: 5000,
        backgroundColor: '#ffffff',
        scale,
        onclone: (clonedDoc) => {
          const clonedImages = clonedDoc.querySelectorAll('img');
          clonedImages.forEach((img) => {
            if (!img.complete || img.naturalWidth === 0) {
              const placeholder = clonedDoc.createElement('div');
              placeholder.style.cssText = `
                display: inline-block;
                padding: 10px;
                background: #f0f0f0;
                border: 1px dashed #ccc;
                color: #666;
                font-size: 12px;
              `;
              placeholder.textContent = '[Image not available]';
              img.replaceWith(placeholder);
            }
          });
        },
      });
      return canvas;
    } catch (error) {
      console.warn('html2canvas rendering failed, creating fallback canvas:', error);
      return this.createFallbackCanvas(element);
    }
  }

  private createFallbackCanvas(element: HTMLElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const width = element.offsetWidth || 800;
    const height = element.offsetHeight || 600;

    canvas.width = width * 2;
    canvas.height = height * 2;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(2, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#000000';
      ctx.font = '14px Arial';
      ctx.fillText('PDF content rendered', 20, 30);
    }

    return canvas;
  }

  private canvasToPdf(
    canvas: HTMLCanvasElement,
    dimensions: { width: number; height: number },
    margin: number,
    qualitySettings: { imageFormat: 'JPEG'; imageQuality: number } = { imageFormat: 'JPEG', imageQuality: 0.5 },
    elementWidth: number = 0,
    elementHeight: number = 0
  ): Uint8Array {
    const pageWidthMm = dimensions.width;
    const pageHeightMm = dimensions.height;
    const contentWidthMm = pageWidthMm - margin * 2;
    const contentHeightMm = pageHeightMm - margin * 2;

    const imgData = canvas.toDataURL('image/jpeg', qualitySettings.imageQuality);
    
    const sourceWidth = elementWidth > 0 ? elementWidth : canvas.width;
    const sourceHeight = elementHeight > 0 ? elementHeight : canvas.height;
    const aspectRatio = sourceHeight / sourceWidth;
    
    const imgWidthMm = contentWidthMm;
    const imgHeightMm = contentWidthMm * aspectRatio;
    
    const totalPages = Math.ceil(imgHeightMm / contentHeightMm);
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [pageWidthMm, pageHeightMm],
    });

    if (totalPages <= 1) {
      pdf.addImage(imgData, 'JPEG', margin, margin, imgWidthMm, imgHeightMm);
    } else {
      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          pdf.addPage();
        }
        const yOffset = -(page * contentHeightMm);
        pdf.addImage(
          imgData, 
          'JPEG', 
          margin, 
          margin + yOffset, 
          imgWidthMm, 
          imgHeightMm
        );
      }
    }

    const arrayBuffer = pdf.output('arraybuffer');
    return new Uint8Array(arrayBuffer);
  }

  private mmToPx(mm: number): number {
    const DPI = 96;
    const MM_PER_INCH = 25.4;
    return (mm / MM_PER_INCH) * DPI;
  }
}
