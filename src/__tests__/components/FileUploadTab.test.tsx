import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FileUploadTab } from '../../taskpane/components/FileUploadTab';
import { initializeIcons } from '@fluentui/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';

// Initialize icons for Fluent UI
initializeIcons();

// Hoist mocks
const { mockParseFiles, mockGeneratePdf } = vi.hoisted(() => {
  return {
    mockParseFiles: vi.fn(),
    mockGeneratePdf: vi.fn(),
  };
});

// Mock services
vi.mock('../../services/emailFileParser', () => {
  return {
    EmailFileParser: vi.fn().mockImplementation(function() {
      return { parseFiles: mockParseFiles };
    })
  };
});

vi.mock('../../services/pdfGenerator', () => {
  return {
    PdfGeneratorService: vi.fn().mockImplementation(function() {
      return { generatePdf: mockGeneratePdf };
    })
  };
});

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

describe('FileUploadTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParseFiles.mockResolvedValue([]);
    mockGeneratePdf.mockResolvedValue(new Uint8Array());
  });

  test('renders file input and drag zone', () => {
    render(<FileUploadTab />);
    
    expect(screen.getByText(/파일을 여기에 드래그하거나 클릭하여 선택하세요/i)).toBeTruthy();
    expect(screen.getByTestId('file-input')).toBeTruthy();
  });

  test('adds files via input selection', () => {
    render(<FileUploadTab />);
    
    const file = new File(['content'], 'test.eml', { type: 'message/rfc822' });
    const input = screen.getByTestId('file-input');
    
    fireEvent.change(input, { target: { files: [file] } });
    
    expect(screen.getByText('test.eml')).toBeTruthy();
    expect(screen.getByText(/선택된 파일 \(1개\)/i)).toBeTruthy();
  });

  test('adds files via drag and drop', () => {
    render(<FileUploadTab />);
    
    const file = new File(['content'], 'dragged.msg', { type: 'application/vnd.ms-outlook' });
    const dropZone = screen.getByTestId('drop-zone');
    
    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [file]
      }
    });
    
    expect(screen.getByText('dragged.msg')).toBeTruthy();
  });

  test('filters invalid file types', () => {
    render(<FileUploadTab />);
    
    const validFile = new File(['content'], 'valid.eml', { type: 'message/rfc822' });
    const invalidFile = new File(['content'], 'invalid.txt', { type: 'text/plain' });
    const dropZone = screen.getByTestId('drop-zone');
    
    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [validFile, invalidFile]
      }
    });
    
    expect(screen.getByText('valid.eml')).toBeTruthy();
    expect(screen.queryByText('invalid.txt')).toBeNull();
  });

  test('removes file from list', () => {
    render(<FileUploadTab />);
    
    const file = new File(['content'], 'toremove.eml', { type: 'message/rfc822' });
    const input = screen.getByTestId('file-input');
    fireEvent.change(input, { target: { files: [file] } });
    
    expect(screen.getByText('toremove.eml')).toBeTruthy();
    
    const removeButton = screen.getByTitle('제거');
    fireEvent.click(removeButton);
    
    expect(screen.queryByText('toremove.eml')).toBeNull();
  });

  test('PDF generation button disabled when no files', () => {
    render(<FileUploadTab />);
    
    const generateButton = screen.getByText('PDF 생성').closest('button') as HTMLButtonElement;
    expect(generateButton.disabled).toBe(true);
  });

  test('triggers PDF generation services on button click', async () => {
    render(<FileUploadTab />);
    
    const file = new File(['content'], 'test.eml', { type: 'message/rfc822' });
    const input = screen.getByTestId('file-input');
    fireEvent.change(input, { target: { files: [file] } });
    
    const generateButton = screen.getByText('PDF 생성').closest('button') as HTMLButtonElement;
    expect(generateButton.disabled).toBe(false);
    fireEvent.click(generateButton);
    
    await waitFor(() => {
      expect(mockParseFiles).toHaveBeenCalled();
      expect(mockGeneratePdf).toHaveBeenCalled();
    });
  });

  test('displays error when generation fails', async () => {
    mockParseFiles.mockRejectedValue(new Error('Parse failed'));
    
    render(<FileUploadTab />);
    
    const file = new File(['content'], 'test.eml', { type: 'message/rfc822' });
    const input = screen.getByTestId('file-input');
    fireEvent.change(input, { target: { files: [file] } });
    
    const generateButton = screen.getByText('PDF 생성');
    fireEvent.click(generateButton);
    
    await waitFor(() => {
      expect(screen.getByText('Parse failed')).toBeTruthy();
    });
  });
});
