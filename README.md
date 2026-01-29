# PDF Maker (Outlook Add-in)

이 프로젝트는 여러 개의 아웃룩 이메일을 선택하여 하나의 PDF 파일로 병합하고 다운로드할 수 있는 Outlook용 오피스 추가 기능(Add-in)입니다.

This project is an Outlook Office Add-in that allows users to select multiple emails, merge them into a single PDF file, and download it.

## Features (기능)

- 다중 이메일 선택 및 PDF 병합 (최대 100개) / Select multiple emails and merge into PDF (up to 100)
- 이메일 구분 옵션 (새 페이지 / 구분선) / Email separation options (New page / Separator line)
- 정렬 옵션 (선택순 / 오래된순 / 최신순) / Sorting options (Selection order / Oldest first / Newest first)
- 파일명 커스터마이징 / Filename customization
- 텍스트 워터마크 / Text watermark
- 한글 지원 / Korean language support

## Quick Install (빠른 설치) - GitHub Pages Method

GitHub Pages를 사용하여 서버 구축 없이 바로 설치할 수 있습니다.

You can install it directly using GitHub Pages without setting up a server.

1. 이 저장소를 포크(Fork)합니다. / Fork this repository.
2. Settings → Pages 메뉴로 이동합니다. / Go to Settings → Pages.
3. Source: GitHub Actions를 선택합니다. / Select Source: GitHub Actions.
4. 저장소에 푸시하면 자동으로 빌드 및 배포됩니다 (Actions 탭에서 확인 가능). / Push to the repository and it will automatically build and deploy (check Actions tab).
5. `manifest-github.xml` 파일을 다운로드합니다. / Download `manifest-github.xml`.
6. 파일을 열고 `YOUR_USERNAME` 부분을 본인의 GitHub 사용자 이름으로 모두 변경합니다. / Open the file and replace all occurrences of `YOUR_USERNAME` with your GitHub username.
7. Outlook에 매니페스트 파일을 업로드(Sideload)합니다. / Sideload the manifest into Outlook:
   - Outlook Web: 설정(Settings) → 추가 기능 관리(Manage add-ins) → 내 추가 기능(Custom add-ins) → 파일에서 추가(Add from file)
   - Outlook Desktop: 파일(File) → 추가 기능 관리(Manage Add-ins) → 내 추가 기능(Custom add-ins)

## Local Development (로컬 개발)

로컬 환경에서 개발 및 테스트를 진행하려면 다음 명령어를 실행하세요.

To develop and test in a local environment, run the following commands:

```bash
npm install
npm run dev
```

그 후 `manifest.xml` 파일을 Outlook에 업로드하세요 (localhost:3000 사용). / Then sideload `manifest.xml` (uses localhost:3000).

## Usage (사용법)

1. 아웃룩에서 여러 개의 이메일을 선택합니다. / Select multiple emails in Outlook.
2. 리본 메뉴에서 "PDF Maker" 버튼을 클릭합니다. / Click "PDF Maker" button in ribbon.
3. 작업 창(Task Pane)에서 옵션을 설정합니다. / Configure options in task pane.
4. "PDF 생성" 버튼을 클릭합니다. / Click "PDF 생성" button.
5. PDF가 자동으로 다운로드됩니다. / PDF will download automatically.

## Tech Stack

- TypeScript
- React 19
- Vite
- html2canvas
- jsPDF
- pdf-lib
- Fluent UI React

## License

MIT
