import React from 'react';
import { ProgressIndicator as FluentProgressIndicator, Stack, Label } from '@fluentui/react';

interface ProgressIndicatorProps {
  current: number;
  total: number;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ current, total }) => {
  const percentComplete = total > 0 ? current / total : 0;
  
  return (
    <Stack tokens={{ childrenGap: 10 }}>
      <Label>처리 중...</Label>
      <FluentProgressIndicator 
        percentComplete={percentComplete} 
        description={`${current} / ${total}`} 
      />
    </Stack>
  );
};
