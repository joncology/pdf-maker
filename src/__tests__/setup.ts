import { vi } from 'vitest';

vi.mock('html2canvas', () => ({
  default: vi.fn().mockImplementation((element: HTMLElement) => {
    return Promise.resolve(createMockCanvas(element));
  }),
}));

function createMockCanvas(element: HTMLElement): HTMLCanvasElement {
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
    ctx.fillText(element.textContent?.slice(0, 50) || 'PDF content', 20, 30);
  }

  return canvas;
}
