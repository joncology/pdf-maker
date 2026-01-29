import React from 'react';
import {
  Dropdown,
  IDropdownOption,
  TextField,
  PrimaryButton,
  Stack,
} from '@fluentui/react';

export type PdfQuality = 'high' | 'medium' | 'low';

export interface GenerateOptions {
  separator: 'newPage' | 'line';
  sortOrder: 'selection' | 'dateAsc' | 'dateDesc';
  filename: string;
  watermark: string;
  quality: PdfQuality;
}

interface OptionsPanelProps {
  onGenerate: (options: GenerateOptions) => void;
  disabled: boolean;
}

const separatorOptions: IDropdownOption[] = [
  { key: 'newPage', text: '새 페이지' },
  { key: 'line', text: '구분선' },
];

const sortOptions: IDropdownOption[] = [
  { key: 'selection', text: '선택 순서' },
  { key: 'dateAsc', text: '오래된 순' },
  { key: 'dateDesc', text: '최신 순' },
];

const qualityOptions: IDropdownOption[] = [
  { key: 'high', text: '고품질 (용량 큼)' },
  { key: 'medium', text: '중간 품질 (권장)' },
  { key: 'low', text: '저품질 (용량 작음)' },
];

export const OptionsPanel: React.FC<OptionsPanelProps> = ({ onGenerate, disabled }) => {
  const [separator, setSeparator] = React.useState<'newPage' | 'line'>('newPage');
  const [sortOrder, setSortOrder] = React.useState<'selection' | 'dateAsc' | 'dateDesc'>('selection');
  const [filename, setFilename] = React.useState<string>('emails');
  const [watermark, setWatermark] = React.useState<string>('');
  const [quality, setQuality] = React.useState<PdfQuality>('medium');

  const handleGenerate = () => {
    onGenerate({
      separator,
      sortOrder,
      filename,
      watermark,
      quality,
    });
  };

  return (
    <Stack tokens={{ childrenGap: 15 }}>
      <Dropdown
        label="이메일 구분"
        selectedKey={separator}
        options={separatorOptions}
        onChange={(_, option) => setSeparator(option?.key as any)}
        disabled={disabled}
      />
      <Dropdown
        label="정렬 순서"
        selectedKey={sortOrder}
        options={sortOptions}
        onChange={(_, option) => setSortOrder(option?.key as any)}
        disabled={disabled}
      />
      <TextField
        label="파일명"
        value={filename}
        onChange={(_, newValue) => setFilename(newValue || '')}
        disabled={disabled}
      />
      <TextField
        label="워터마크 (선택사항)"
        value={watermark}
        onChange={(_, newValue) => setWatermark(newValue || '')}
        disabled={disabled}
      />
      <Dropdown
        label="PDF 품질"
        selectedKey={quality}
        options={qualityOptions}
        onChange={(_, option) => setQuality(option?.key as PdfQuality)}
        disabled={disabled}
      />
      <PrimaryButton
        text="PDF 생성"
        onClick={handleGenerate}
        disabled={disabled || !filename}
        styles={{ root: { marginTop: 10 } }}
      />
    </Stack>
  );
};
