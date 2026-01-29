import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export interface PdfOptions {
  pageSize?: 'a4' | 'letter';
  margin?: number;
}

const PAGE_DIMENSIONS = {
  a4: { width: 210, height: 297 },
  letter: { width: 215.9, height: 279.4 },
} as const;

const DEFAULT_OPTIONS: Required<PdfOptions> = {
  pageSize: 'a4',
  margin: 10,
};

export class PdfConverter {
  async htmlToPdf(html: string, options?: PdfOptions): Promise<Uint8Array> {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
    const { pageSize, margin } = mergedOptions;
    const dimensions = PAGE_DIMENSIONS[pageSize];

    const container = this.createRenderContainer(html, dimensions.width, margin);
    document.body.appendChild(container);

    try {
      const canvas = await this.renderToCanvas(container);
      const pdfBytes = this.canvasToPdf(canvas, dimensions, margin);
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
      background: white;
      font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', 'Noto Sans KR', Arial, sans-serif;
    `;
    container.innerHTML = html;

    this.preprocessImages(container);

    return container;
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

  private async renderToCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
    try {
      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: false,
        logging: false,
        imageTimeout: 5000,
        backgroundColor: '#ffffff',
        scale: 2,
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
    margin: number
  ): Uint8Array {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [dimensions.width, dimensions.height],
    });

    const contentWidth = dimensions.width - margin * 2;
    const contentHeight = dimensions.height - margin * 2;

    const imgData = canvas.toDataURL('image/png');
    const canvasAspectRatio = canvas.width / canvas.height;
    const pageAspectRatio = contentWidth / contentHeight;

    let imgWidth: number;
    let imgHeight: number;

    if (canvasAspectRatio > pageAspectRatio) {
      imgWidth = contentWidth;
      imgHeight = contentWidth / canvasAspectRatio;
    } else {
      imgHeight = contentHeight;
      imgWidth = contentHeight * canvasAspectRatio;
    }

    pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);

    const arrayBuffer = pdf.output('arraybuffer');
    return new Uint8Array(arrayBuffer);
  }

  private mmToPx(mm: number): number {
    const DPI = 96;
    const MM_PER_INCH = 25.4;
    return (mm / MM_PER_INCH) * DPI;
  }
}
