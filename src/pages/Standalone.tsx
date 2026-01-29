import React from 'react';
import { ThemeProvider, PartialTheme, initializeIcons, Stack, Text } from '@fluentui/react';
import { FileUploadTab } from '../taskpane/components/FileUploadTab';

initializeIcons();

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

export const Standalone: React.FC = () => {
  return (
    <ThemeProvider theme={appTheme}>
      <Stack tokens={{ childrenGap: 20 }} styles={{ root: { padding: 20, maxWidth: 800, margin: '0 auto' } }}>
        <Stack horizontalAlign="center" styles={{ root: { marginBottom: 10 } }}>
          <h1 style={{ margin: 0, fontSize: 28 }}>프로젝트 메일 추출기</h1>
          <Text variant="medium" styles={{ root: { color: '#605e5c', marginTop: 8 } }}>
            이메일 파일(.eml, .msg)을 PDF로 변환
          </Text>
        </Stack>
        
        <FileUploadTab standalone={true} />
        
        <Stack styles={{ root: { marginTop: 40, borderTop: '1px solid #edebe9', paddingTop: 20 } }} tokens={{ childrenGap: 8 }}>
          <Text variant="small" styles={{ root: { color: '#605e5c' } }}>
            Outlook Add-in으로도 사용 가능합니다.
          </Text>
          <Text variant="small" styles={{ root: { color: '#605e5c' } }}>
            문의사항: <a href="mailto:jykang@cosmax.com" style={{ color: '#0078d4' }}>jykang@cosmax.com</a>
          </Text>
        </Stack>
      </Stack>
    </ThemeProvider>
  );
};
