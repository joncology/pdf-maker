import React, { useState, useRef, useMemo } from 'react';
import {
  Stack,
  Text,
  Icon,
  IconButton,
  FontIcon,
  DefaultButton,
  mergeStyles,
  DefaultPalette,
  IStackStyles,
} from '@fluentui/react';
import { OptionsPanel, GenerateOptions } from './OptionsPanel';
import { ProgressIndicator } from './ProgressIndicator';
import { ErrorDisplay } from './ErrorDisplay';
import { EmailFileParser } from '../../services/emailFileParser';
import { PdfGeneratorService } from '../../services/pdfGenerator';

export interface FileUploadTabProps {
  standalone?: boolean;
}

const dragZoneStyles = (isDragging: boolean) => mergeStyles({
  border: `2px dashed ${isDragging ? DefaultPalette.themePrimary : DefaultPalette.neutralTertiary}`,
  borderRadius: '4px',
  padding: '30px 20px',
  textAlign: 'center',
  backgroundColor: isDragging ? DefaultPalette.neutralLighter : DefaultPalette.white,
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
  selectors: {
    ':hover': {
      borderColor: DefaultPalette.themePrimary,
      backgroundColor: DefaultPalette.neutralLighter,
    },
  },
});

const fileItemStyles: IStackStyles = {
  root: {
    padding: '8px 12px',
    backgroundColor: DefaultPalette.neutralLighterAlt,
    borderRadius: '4px',
    selectors: {
      ':hover': {
        backgroundColor: DefaultPalette.neutralLighter,
      },
    },
  },
};

const iconClass = mergeStyles({
  fontSize: 24,
  height: 24,
  width: 24,
  color: DefaultPalette.themePrimary,
  marginBottom: 10,
});

export const FileUploadTab: React.FC<FileUploadTabProps> = () => {
  // Initialize services inside component for better testability
  const emailFileParser = useMemo(() => new EmailFileParser(), []);
  const pdfGenerator = useMemo(() => new PdfGeneratorService(), []);

  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
      // Reset input so the same file can be selected again if needed
      e.target.value = '';
    }
  };

  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(f => 
      f.name.toLowerCase().endsWith('.eml') || 
      f.name.toLowerCase().endsWith('.msg')
    );
    
    if (validFiles.length < newFiles.length) {
      // Silently filter invalid files
    }

    setFiles(prev => [...prev, ...validFiles]);
    setError(null);
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleZoneClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const handleGenerate = async (options: GenerateOptions) => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setError(null);
    setProgress({ current: 0, total: files.length * 2 }); // *2 for parsing + generating steps roughly

    try {
      // 1. Parse Files
      const parsedEmails = await emailFileParser.parseFiles(files, {
        sortOrder: options.sortOrder,
        onProgress: (current, total) => {
          setProgress({ current, total: total * 2 }); // First half of progress
        }
      });

      // 2. Generate PDF
      const pdfBytes = await pdfGenerator.generatePdf(parsedEmails, {
        separator: options.separator,
        watermark: options.watermark,
        filename: options.filename,
        quality: options.quality,
        onProgress: (current, total) => {
          setProgress({ current: total + current, total: total * 2 }); // Second half
        }
      });

      // 3. Download
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${options.filename || 'emails'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error('Error generating PDF:', err);
      setError(err instanceof Error ? err.message : 'PDF 생성 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  return (
    <Stack tokens={{ childrenGap: 20 }} styles={{ root: { padding: 20 } }}>
      <Text variant="xLarge" styles={{ root: { fontWeight: 600 } }}>파일 선택</Text>
      
      {/* Hidden Input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        multiple
        accept=".eml,.msg"
        onChange={handleFileSelect}
        data-testid="file-input"
      />

      {/* Drag & Drop Zone */}
      <div
        className={dragZoneStyles(isDragging)}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleZoneClick}
        data-testid="drop-zone"
      >
        <Stack horizontalAlign="center" tokens={{ childrenGap: 10 }}>
          <FontIcon iconName="CloudUpload" className={iconClass} />
          <Text variant="mediumPlus" styles={{ root: { fontWeight: 600 } }}>
            파일을 여기에 드래그하거나 클릭하여 선택하세요
          </Text>
          <Text variant="small" styles={{ root: { color: DefaultPalette.neutralSecondary } }}>
            (.eml, .msg 파일)
          </Text>
        </Stack>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <Stack tokens={{ childrenGap: 10 }}>
          <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
            <Text variant="medium" styles={{ root: { fontWeight: 600 } }}>
              선택된 파일 ({files.length}개):
            </Text>
            <DefaultButton
              text="전체 삭제"
              iconProps={{ iconName: 'Delete' }}
              onClick={() => setFiles([])}
              styles={{ root: { height: 28, minWidth: 'auto', padding: '0 10px' } }}
            />
          </Stack>
          <Stack tokens={{ childrenGap: 8 }} styles={{ root: { maxHeight: '200px', overflowY: 'auto' } }}>
            {files.map((file, index) => (
              <Stack
                key={`${file.name}-${index}`}
                horizontal
                verticalAlign="center"
                horizontalAlign="space-between"
                styles={fileItemStyles}
              >
                <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 10 }}>
                  <Icon iconName="Mail" />
                  <Text>{file.name}</Text>
                  <Text variant="small" styles={{ root: { color: DefaultPalette.neutralSecondary } }}>
                    ({formatFileSize(file.size)})
                  </Text>
                </Stack>
                <IconButton
                  iconProps={{ iconName: 'Cancel' }}
                  title="제거"
                  ariaLabel="제거"
                  onClick={() => handleRemoveFile(index)}
                  styles={{ root: { height: 24, width: 24 } }}
                />
              </Stack>
            ))}
          </Stack>
        </Stack>
      )}

      {/* Options & Actions */}
      <OptionsPanel 
        onGenerate={handleGenerate} 
        disabled={files.length === 0 || isProcessing} 
      />

      {/* Feedback */}
      {isProcessing && (
        <ProgressIndicator current={progress.current} total={progress.total} />
      )}
      
      {error && (
        <ErrorDisplay message={error} onDismiss={() => setError(null)} />
      )}
    </Stack>
  );
};
