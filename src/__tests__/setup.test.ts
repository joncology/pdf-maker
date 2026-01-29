import { describe, it, expect } from 'vitest';

describe('Test Environment Setup', () => {
  it('should have jsdom environment configured', () => {
    expect(typeof document).toBe('object');
    expect(typeof window).toBe('object');
  });

  it('should be able to create DOM elements', () => {
    const div = document.createElement('div');
    div.id = 'test-element';
    div.textContent = 'Hello, PDF Maker!';
    document.body.appendChild(div);

    const element = document.getElementById('test-element');
    expect(element).not.toBeNull();
    expect(element?.textContent).toBe('Hello, PDF Maker!');

    document.body.removeChild(div);
  });

  it('should pass basic assertions', () => {
    expect(1 + 1).toBe(2);
    expect(true).toBeTruthy();
    expect([1, 2, 3]).toHaveLength(3);
  });
});
