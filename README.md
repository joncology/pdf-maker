# PDF Maker (Outlook Add-in)

이 프로젝트는 여러 개의 아웃룩 이메일을 선택하여 하나의 PDF 파일로 병합하고 다운로드할 수 있는 Outlook용 오피스 추가 기능(Add-in)입니다.

This project is an Outlook Office Add-in that allows users to select multiple emails, merge them into a single PDF file, and download it.

## Features (기능)

- 다중 이메일 선택 및 PDF 병합 (최대 100개) / Select multiple emails and merge into PDF (up to 100)
- .eml, .msg 파일 업로드 및 변환 / Upload and convert .eml, .msg files
- 이메일 구분 옵션 (새 페이지 / 구분선) / Email separation options (New page / Separator line)
- 정렬 옵션 (선택순 / 오래된순 / 최신순) / Sorting options (Selection order / Oldest first / Newest first)
- 파일명 커스터마이징 / Filename customization
- 텍스트 워터마크 / Text watermark
- 한글 지원 / Korean language support

## File Upload Feature (파일 업로드 기능)

아웃룩 없이도 로컬에 저장된 이메일 파일을 직접 업로드하여 PDF로 변환할 수 있습니다.

You can upload email files stored locally and convert them to PDF even without Outlook.

- **지원 형식 (Supported Formats)**: .eml, .msg
- **파일 크기 제한 (File Size Limits)**: 단일 파일 최대 100MB, 전체 합계 최대 300MB / Max 100MB per file, 300MB total.
- **드래그 앤 드롭 (Drag & Drop)**: 파일을 작업 창으로 끌어다 놓아 간편하게 추가할 수 있습니다. / Easily add files by dragging them into the task pane.
- **독립 실행 (Standalone Usage)**: 아웃룩이 없는 환경에서도 `src/pages/standalone.html` 페이지를 통해 기능을 사용할 수 있습니다. / Use the feature without Outlook via the `src/pages/standalone.html` page.

## Quick Install (빠른 설치) - GitHub Pages Method

GitHub Pages를 사용하여 서버 구축 없이 바로 설치할 수 있습니다.

You can install it directly using GitHub Pages without setting up a server.

### 1단계: 저장소 포크 및 배포 / Step 1: Fork and Deploy

1. 이 저장소를 포크(Fork)합니다. / Fork this repository.
2. Settings → Pages 메뉴로 이동합니다. / Go to Settings → Pages.
3. Source: GitHub Actions를 선택합니다. / Select Source: GitHub Actions.
4. 저장소에 푸시하면 자동으로 빌드 및 배포됩니다 (Actions 탭에서 확인 가능). / Push to the repository and it will automatically build and deploy (check Actions tab).

### 2단계: 매니페스트 파일 준비 / Step 2: Prepare Manifest File

1. `manifest-github.xml` 파일을 다운로드합니다. / Download `manifest-github.xml`.
2. 파일을 열고 `YOUR_USERNAME` 부분을 본인의 GitHub 사용자 이름으로 모두 변경합니다. / Open the file and replace all occurrences of `YOUR_USERNAME` with your GitHub username.

### 3단계: Outlook에 추가 기능 설치 / Step 3: Install Add-in to Outlook

#### 방법 A: Outlook Web (권장) / Method A: Outlook Web (Recommended)

1. 브라우저에서 https://aka.ms/olksideload 접속 / Go to https://aka.ms/olksideload in your browser
2. **Add-Ins for Outlook** 대화상자가 열립니다 / The **Add-Ins for Outlook** dialog opens
3. **My add-ins** 탭 선택 / Select **My add-ins** tab
4. **Custom Addins** 섹션에서 **Add a custom add-in** → **Add from file** 클릭 / In **Custom Addins** section, click **Add a custom add-in** → **Add from file**
5. 준비한 `manifest-github.xml` 파일 선택 / Select your prepared `manifest-github.xml` file
6. **Install** 클릭 / Click **Install**

#### 방법 B: 새 Outlook for Windows / Method B: New Outlook for Windows

1. 브라우저에서 https://aka.ms/olksideload 접속 (Outlook Web과 동일) / Go to https://aka.ms/olksideload in your browser (same as Outlook Web)
2. 위의 Outlook Web 방법과 동일하게 진행 / Follow the same steps as Outlook Web above

#### 방법 C: 클래식 Outlook Desktop (Windows) / Method C: Classic Outlook Desktop (Windows)

1. Outlook 실행 / Open Outlook
2. 리본에서 **홈** → **모든 앱** (또는 **추가 기능 가져오기**) 클릭 / From ribbon, click **Home** → **All Apps** (or **Get Add-ins**)
3. **내 추가 기능** 탭 선택 / Select **My add-ins** tab
4. **사용자 지정 추가 기능** → **파일에서 추가** 클릭 / Click **Custom add-ins** → **Add from file**
5. `manifest-github.xml` 파일 선택 / Select `manifest-github.xml` file

## Local Development (로컬 개발)

로컬 환경에서 개발 및 테스트를 진행하려면 다음 명령어를 실행하세요.

To develop and test in a local environment, run the following commands:

```bash
npm install
npm run dev
```

그 후 `manifest.xml` 파일을 Outlook에 업로드하세요 (localhost:3000 사용). / Then sideload `manifest.xml` (uses localhost:3000).

## Usage (사용법)

### Outlook Add-in
1. 아웃룩에서 여러 개의 이메일을 선택합니다. / Select multiple emails in Outlook.
2. 리본 메뉴에서 "PDF Maker" 버튼을 클릭합니다. / Click "PDF Maker" button in ribbon.
3. 작업 창(Task Pane)에서 "이메일 선택" 탭을 사용합니다. / Use the "Select Emails" tab in the task pane.
4. 옵션을 설정하고 "PDF 생성" 버튼을 클릭합니다. / Configure options and click "PDF 생성" button.

### File Upload (파일 업로드)
1. 작업 창에서 "파일 업로드" 탭을 선택하거나 독립 실행 페이지(`src/pages/standalone.html`)를 엽니다. / Select the "File Upload" tab in the task pane or open the standalone page (`src/pages/standalone.html`).
2. .eml 또는 .msg 파일을 드래그하거나 클릭하여 선택합니다. / Drag or click to select .eml or .msg files.
3. 옵션을 설정하고 "PDF 생성" 버튼을 클릭합니다. / Configure options and click "PDF 생성" button.

## Tech Stack

- TypeScript
- React 19
- Vite
- html2canvas
- jsPDF
- pdf-lib
- postal-mime
- @kenjiuno/msgreader
- Fluent UI React

## License

MIT
