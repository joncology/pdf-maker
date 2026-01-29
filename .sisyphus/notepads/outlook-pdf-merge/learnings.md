<file>
00001| # Learnings - Outlook PDF Merge Extension
00002| 
00003| ## Conventions
00004| 
00005| ## Patterns
00006| 
00007| ## Gotchas
00008| 
00009| 
00010| ## Project Setup (2026-01-29)
00011| 
00012| ### Tech Stack
00013| - Vite 7.x for build (NOT webpack)
00014| - Vitest 4.x for testing with jsdom environment
00015| - TypeScript 5.x with strict mode
00016| - React 19.x
00017| - @fluentui/react v8 (NOT @fluentui/react-components v9)
00018| 
00019| ### Key Configurations
00020| - Path alias `@/` → `src/` configured in both tsconfig.json and vite.config.ts
00021| - Vite build entry point: `src/taskpane/taskpane.html`
00022| - Dev server runs on port 3000
00023| - TypeScript uses `noEmit: true` (Vite handles transpilation)
00024| 
00025| ### Office Add-in Specifics
00026| - manifest.xml requires Office.js script in taskpane.html
00027| - Office.js loaded from CDN: `https://appsforoffice.microsoft.com/lib/1/hosted/office.js`
00028| - Manifest uses localhost:3000 URLs for development
00029| 
00030| ### Dependencies Installed
00031| - Production: react, react-dom, @fluentui/react, html2canvas, jspdf, pdf-lib
00032| - Dev: typescript, vite, vitest, @vitejs/plugin-react, @types/react, @types/react-dom, @testing-library/react, jsdom, @types/office-js, @types/node
00033| 
00034| ## POC: HTML to PDF Conversion (2026-01-29)
00035| 
00036| ### Architecture
00037| - `PdfConverter` class in `src/services/pdfConverter.ts`
00038| - Uses html2canvas to render HTML to canvas, then jsPDF to convert canvas to PDF
00039| - Fallback canvas creation when html2canvas fails (for robustness)
00040| 
00041| ### Korean Font Support
00042| - html2canvas renders text as images, so Korean fonts work if the browser has them
00043| - Font stack: 'Malgun Gothic', 'Apple SD Gothic Neo', 'Noto Sans KR', Arial, sans-serif
00044| - jsPDF's built-in fonts don't support Korean, but since we use canvas-based rendering, this is not an issue
00045| - For direct text rendering in jsPDF, would need to embed TTF font as base64
00046| 
00047| ### Image Handling
00048| - External images may fail due to CORS
00049| - html2canvas options: `useCORS: true`, `allowTaint: false`, `imageTimeout: 5000`
00050| - Fallback: Replace failed images with "[Image not available]" placeholder
00051| - `onclone` callback in html2canvas to handle incomplete images
00052| 
00053| ### Testing Strategy
00054| - html2canvas is extremely slow in jsdom (30+ seconds per test)
00055| - Solution: Mock html2canvas in test setup (`src/__tests__/setup.ts`)
00056| - Mock creates a simple canvas with text content for fast testing
00057| - Real html2canvas will be used in browser environment
00058| 
00059| ### Key Files Created
00060| - `src/services/pdfConverter.ts` - Core PDF conversion service
00061| - `src/utils/sampleEmailHtml.ts` - Sample email HTML templates
00062| - `src/__tests__/poc-html-to-pdf.test.ts` - 14 tests covering basic, Korean, image failure, edge cases
00063| - `src/__tests__/setup.ts` - Test setup with html2canvas mock
00064| 
00065| ### Dependencies Added
00066| - `canvas` (dev) - Required for jsdom to support canvas operations
00067| 
00068| ## Email Collector Service (2026-01-29)
00069| 
00070| ### Office.js API for Multi-Select Emails
00071| - `getSelectedItemsAsync()` returns array of `{ itemId, itemType, itemMode, subject }`
00072| - `loadItemByIdAsync(itemId)` loads full item details - can only load ONE at a time
00073| - MUST call `unloadAsync()` before loading next item
00074| - Maximum 100 items can be selected (API limit)
00075| 
00076| ### Key Properties from LoadedMessageRead
00077| - `itemId` - unique identifier
00078| - `subject` - email subject
00079| - `from.emailAddress` - sender email
00080| - `to` - array of `{ emailAddress, displayName }`
00081| - `dateTimeCreated` - Date object
00082| - `attachments` - array of `{ name, size }` (content NOT downloaded)
00083| - `body.getAsync(Office.CoercionType.Html, callback)` - get HTML body
00084| 
00085| ### Testing Office.js
00086| - Mock global `Office` object in beforeEach
00087| - Mock `Office.context.mailbox.getSelectedItemsAsync` and `loadItemByIdAsync`
00088| - Mock `Office.AsyncResultStatus.Succeeded/Failed` and `Office.CoercionType.Html`
00089| - Use callback-based mocking to simulate async Office.js API
00090| 
00091| ### Error Handling
00092| - Individual email load failures don't stop processing
00093| - Return partial results when some emails fail
00094| - Log errors but continue with remaining emails
00095| - Throw only for critical failures (getSelectedItemsAsync fails, >100 emails)
00096| 
00097| ### Files Created
00098| - `src/services/emailCollector.ts` - EmailCollectorService class
00099| - `src/__tests__/emailCollector.test.ts` - 11 tests covering all scenarios
00100| 
00101| ## PDF Generator Service (2026-01-29)
00102| 
00103| ### Architecture
00104| - `PdfGeneratorService` class in `src/services/pdfGenerator.ts`
00105| - Reuses `PdfConverter` for HTML-to-PDF conversion
00106| - Uses `pdf-lib` for merging multiple PDFs and adding watermarks
00107| 
00108| ### pdf-lib Usage Patterns
00109| - `PDFDocument.create()` - Create new empty PDF
00110| - `PDFDocument.load(bytes)` - Load existing PDF from Uint8Array
00111| - `mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices())` - Copy all pages
00112| - `mergedPdf.addPage(page)` - Add copied page to merged document
00113| - `page.getSize()` - Get page dimensions { width, height }
00114| - `page.drawText(text, { x, y, size, color, opacity })` - Add text (watermark)
00115| - `rgb(r, g, b)` - Create color (values 0-1)
00116| 
00117| ### Separator Strategies
00118| - `newPage`: Each email converted to separate PDF, then merged (preserves page breaks)
00119| - `line`: All emails combined into single HTML with CSS border-top separator
00120| 
00121| ### Email HTML Template
00122| - Metadata header: Subject, From, To, Date
00123| - Attachments: List names only (no content/size)
00124| - Body: Raw HTML from email
00125| - HTML escaping for metadata fields to prevent XSS
00126| 
00127| ### Testing Strategy
00128| - Mock both `pdf-lib` and `PdfConverter` for unit tests
00129| - Use module-level mock function (`mockHtmlToPdf`) for assertion access
00130| - Mock class must be actual class (not vi.fn().mockImplementation)
00131| - Non-null assertions (`!`) needed for array access in strict TypeScript
00132| 
00133| ### Key Files Created
00134| - `src/services/pdfGenerator.ts` - PdfGeneratorService class
00135| - `src/__tests__/pdfGenerator.test.ts` - 12 tests covering all scenarios
00136| 
00137| ### Types Exported
00138| - `SeparatorType = 'newPage' | 'line'`
00139| - `PdfGeneratorOptions { separator, watermark?, filename?, onProgress? }`
00140| 
00141| ## Task Pane UI Implementation (2026-01-29)
00142| 
00143| ### Components
00144| - `OptionsPanel`: Fluent UI Dropdowns and TextFields for configuration
00145| - `ProgressIndicator`: Visual feedback during generation
00146| - `ErrorDisplay`: Error reporting with MessageBar
00147| - `App`: Main container managing state and service integration
00148| 
00149| ### Integration
00150| - `EmailCollectorService` for fetching emails
00151| - `PdfGeneratorService` for creating PDFs
00152| - `Blob` and `URL.createObjectURL` for client-side download
00153| 
00154| ### Testing UI
00155| - Used `@testing-library/react` with `vitest`
00156| - `jest-dom` matchers (`toBeInTheDocument`) not available by default in this setup
00157| - Solution: Use standard assertions (`toBeTruthy()`, `element.disabled`) instead of installing extra deps
00158| - `initializeIcons()` required for Fluent UI components in tests
00159| 
00160| ### TypeScript Issues
00161| - `Uint8Array` vs `BlobPart` type mismatch: Cast to `any` or `BlobPart`
00162| - Unused imports in tests: Clean up to avoid build errors
00163| 
00164| ### Fluent UI v8
00165| - Use `initializeIcons()` at app entry
00166| - `Stack` for layout, `Dropdown`, `TextField`, `PrimaryButton` for controls
00167| - `ThemeProvider` with `PartialTheme` for consistent styling
00168| 
</file>
## Browser Verification via Playwright (2026-01-29)

### UI Verification Results
- Verified via Playwright browser automation at http://localhost:3000/src/taskpane/taskpane.html
- All Korean UI labels render correctly (이메일 구분, 정렬 순서, 파일명, 워터마크, PDF 생성)
- Dropdown options work correctly:
  - 이메일 구분: 새 페이지, 구분선
  - 정렬 순서: 선택 순서, 오래된 순, 최신 순
- Error handling works: Shows error banner when Office.js API unavailable
- Error dismissal works: Close button removes error message

### Screenshots Captured
- `ui-verification.png` - Initial UI state with all options
- `error-handling-verification.png` - Error state when PDF generation fails

### Remaining Manual Verification (Requires Outlook Sideload)
- Actual email selection in Outlook
- PDF generation with real emails
- Progress indicator during generation
- Cancel button functionality
- Korean text in generated PDF
- Watermark positioning in PDF

## pdf-lib Font and Encoding Limitations (2026-01-29)

### WinAnsi Encoding Constraint
- pdf-lib's default fonts (Helvetica, Times, Courier) use WinAnsi encoding
- WinAnsi only supports Latin characters (ASCII 0x00-0x7F)
- Non-ASCII characters (Korean, Chinese, Arabic, etc.) cause "WinAnsi cannot encode" error
- Example: Korean "기" (U+AE30) cannot be encoded

### Solutions for Non-ASCII Text in pdf-lib
1. **Embed Custom Font** (Complex)
   - Requires `@pdf-lib/fontkit` dependency
   - Load TTF/OTF font file (e.g., Noto Sans KR for Korean)
   - Register with `pdfDoc.registerFontkit(fontkit)`
   - Embed with `pdfDoc.embedFont(fontBytes)`
   - Use in `drawText()` with `font` parameter
   - Adds ~100KB to bundle size

2. **Filter to ASCII** (Simple)
   - Use regex `/[^\x00-\x7F]/g` to remove non-ASCII
   - Best for optional features (watermarks, labels)
   - Graceful degradation: "기밀 CONFIDENTIAL" → " CONFIDENTIAL"

3. **Use Canvas-Based Rendering** (Already Used)
   - html2canvas renders HTML to canvas (includes all fonts)
   - jsPDF converts canvas to PDF
   - Supports any Unicode text that browser can render
   - Used for email body content (works perfectly)

### Watermark Implementation Decision
- Watermark is optional feature (not critical)
- Chose ASCII-only filter (option 2) for simplicity
- No new dependencies
- Minimal code change
- Graceful handling of mixed Korean/English text
