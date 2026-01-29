import React from 'react';
import { MessageBar, MessageBarType } from '@fluentui/react';

interface ErrorDisplayProps {
  message: string;
  onDismiss?: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onDismiss }) => {
  return (
    <MessageBar
      messageBarType={MessageBarType.error}
      isMultiline={true}
      onDismiss={onDismiss}
      dismissButtonAriaLabel="Close"
    >
      {message}
    </MessageBar>
  );
};
