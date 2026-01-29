import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { initializeIcons } from '@fluentui/react';
import { OptionsPanel } from '../../taskpane/components/OptionsPanel';

initializeIcons();

describe('OptionsPanel', () => {
  const mockOnGenerate = vi.fn();

  beforeEach(() => {
    mockOnGenerate.mockClear();
  });

  it('renders all options correctly', () => {
    render(<OptionsPanel onGenerate={mockOnGenerate} disabled={false} />);
    
    expect(screen.getByText('이메일 구분')).toBeTruthy();
    expect(screen.getByText('정렬 순서')).toBeTruthy();
    expect(screen.getByLabelText('파일명')).toBeTruthy();
    expect(screen.getByLabelText('워터마크 (선택사항)')).toBeTruthy();
    expect(screen.getByText('PDF 품질')).toBeTruthy();
    expect(screen.getByText('PDF 생성')).toBeTruthy();
  });

  it('calls onGenerate with correct values when button is clicked', () => {
    render(<OptionsPanel onGenerate={mockOnGenerate} disabled={false} />);
    
    const filenameInput = screen.getByLabelText('파일명') as HTMLInputElement;
    fireEvent.change(filenameInput, { target: { value: 'test-file' } });

    const watermarkInput = screen.getByLabelText('워터마크 (선택사항)') as HTMLInputElement;
    fireEvent.change(watermarkInput, { target: { value: 'confidential' } });

    const generateButton = screen.getByText('PDF 생성');
    fireEvent.click(generateButton);

    expect(mockOnGenerate).toHaveBeenCalledWith({
      separator: 'newPage',
      sortOrder: 'selection',
      filename: 'test-file',
      watermark: 'confidential',
      quality: 'medium',
    });
  });

  it('disables generate button when filename is empty', () => {
    render(<OptionsPanel onGenerate={mockOnGenerate} disabled={false} />);
    
    const filenameInput = screen.getByLabelText('파일명');
    fireEvent.change(filenameInput, { target: { value: '' } });

    const generateButton = screen.getByText('PDF 생성').closest('button') as HTMLButtonElement;
    expect(generateButton.disabled).toBe(true);
  });

  it('disables all inputs when disabled prop is true', () => {
    render(<OptionsPanel onGenerate={mockOnGenerate} disabled={true} />);
    
    const filenameInput = screen.getByLabelText('파일명') as HTMLInputElement;
    expect(filenameInput.disabled).toBe(true);

    const generateButton = screen.getByText('PDF 생성').closest('button') as HTMLButtonElement;
    expect(generateButton.disabled).toBe(true);
  });

  it('updates options when dropdowns are changed', () => {
    render(<OptionsPanel onGenerate={mockOnGenerate} disabled={false} />);
    
    const separatorDropdown = screen.getByText('새 페이지');
    fireEvent.click(separatorDropdown);
    const lineOption = screen.getByText('구분선');
    fireEvent.click(lineOption);

    const sortDropdown = screen.getByText('선택 순서');
    fireEvent.click(sortDropdown);
    const dateAscOption = screen.getByText('오래된 순');
    fireEvent.click(dateAscOption);

    const generateButton = screen.getByText('PDF 생성');
    fireEvent.click(generateButton);

    expect(mockOnGenerate).toHaveBeenCalledWith(expect.objectContaining({
      separator: 'line',
      sortOrder: 'dateAsc',
    }));
  });
});
