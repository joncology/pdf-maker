import React, { useState, useRef } from 'react';
import { Stack, DefaultButton, ThemeProvider, PartialTheme, initializeIcons, Pivot, PivotItem } from '@fluentui/react';
import { OptionsPanel, GenerateOptions } from './components/OptionsPanel';
import { FileUploadTab } from './components/FileUploadTab';

initializeIcons();

import { ProgressIndicator } from './components/ProgressIndicator';
import { ErrorDisplay } from './components/ErrorDisplay';
import { EmailCollectorService } from '../services/emailCollector';
import { PdfGeneratorService } from '../services/pdfGenerator';

const emailCollector = new EmailCollectorService();
const pdfGenerator = new PdfGeneratorService();

const appTheme: PartialTheme = {
  palette: {
    themePrimary: '#0078d4',
    themeLighterAlt: '#eff6fc',
    themeLighter: '#deecf9',
    themeLight: '#c7e0f4',
    themeTertiary: '#71afe5',
    themeSecondary: '#2b88d8',
    themeDarkAlt: '#106ebe',
    themeDark: '#005a9e',
    themeDarker: '#004578',
    neutralLighterAlt: '#faf9f8',
    neutralLighter: '#f3f2f1',
    neutralLight: '#edebe9',
    neutralQuaternaryAlt: '#e1dfdd',
    neutralQuaternary: '#d0d0d0',
    neutralTertiaryAlt: '#c8c6c4',
    neutralTertiary: '#a19f9d',
    neutralSecondary: '#605e5c',
    neutralPrimaryAlt: '#3b3a39',
    neutralPrimary: '#323130',
    neutralDark: '#201f1e',
    black: '#000000',
    white: '#ffffff',
  }
};

export const App: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const isCancelled = useRef(false);

  const downloadPdf = (pdfBytes: Uint8Array, filename: string) => {
    const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerate = async (options: GenerateOptions) => {
    setIsGenerating(true);
    setError(null);
    setProgress({ current: 0, total: 0 });
    isCancelled.current = false;

    try {
      const emails = await emailCollector.getSelectedEmails(options.sortOrder);
      
      if (isCancelled.current) return;

      if (emails.length === 0) {
        throw new Error('선택된 이메일이 없습니다.');
      }

      setProgress({ current: 0, total: emails.length });

      const pdfBytes = await pdfGenerator.generatePdf(emails, {
        separator: options.separator,
        watermark: options.watermark,
        filename: options.filename,
        onProgress: (current, total) => {
          if (!isCancelled.current) {
            setProgress({ current, total });
          }
        }
      });

      if (isCancelled.current) return;

      downloadPdf(pdfBytes, options.filename);

    } catch (err: any) {
      if (!isCancelled.current) {
        setError(err.message || 'PDF 생성 중 오류가 발생했습니다.');
      }
    } finally {
      if (!isCancelled.current) {
        setIsGenerating(false);
      }
    }
  };

  const handleCancel = () => {
    isCancelled.current = true;
    setIsGenerating(false);
    setProgress({ current: 0, total: 0 });
  };

  if (typeof Office === 'undefined') {
    return (
      <ThemeProvider theme={appTheme}>
        <Stack tokens={{ childrenGap: 20 }} styles={{ root: { padding: 20 } }}>
           <h2 style={{ margin: 0 }}>프로젝트 메일 추출기</h2>
           <FileUploadTab standalone={true} />
        </Stack>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={appTheme}>
      <Stack tokens={{ childrenGap: 20 }} styles={{ root: { padding: 20 } }}>
        <h2 style={{ margin: 0 }}>프로젝트 메일 추출기</h2>
        
        <Pivot aria-label="PDF 생성 모드">
          <PivotItem headerText="Outlook 선택" itemKey="outlook">
            <Stack tokens={{ childrenGap: 20 }} styles={{ root: { paddingTop: 20 } }}>
              {error && (
                <ErrorDisplay 
                  message={error} 
                  onDismiss={() => setError(null)} 
                />
              )}

              {!isGenerating ? (
                <OptionsPanel 
                  onGenerate={handleGenerate} 
                  disabled={false} 
                />
              ) : (
                <Stack tokens={{ childrenGap: 15 }}>
                  <ProgressIndicator 
                    current={progress.current} 
                    total={progress.total} 
                  />
                  <DefaultButton 
                    text="취소" 
                    onClick={handleCancel} 
                  />
                </Stack>
              )}
            </Stack>
          </PivotItem>
          
          <PivotItem headerText="파일 업로드" itemKey="fileUpload">
            <FileUploadTab />
          </PivotItem>
        </Pivot>
      </Stack>
    </ThemeProvider>
  );
};
