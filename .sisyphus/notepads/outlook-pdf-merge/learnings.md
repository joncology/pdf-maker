# Learnings - Outlook PDF Merge Extension

## Conventions

## Patterns

## Gotchas


## Project Setup (2026-01-29)

### Tech Stack
- Vite 7.x for build (NOT webpack)
- Vitest 4.x for testing with jsdom environment
- TypeScript 5.x with strict mode
- React 19.x
- @fluentui/react v8 (NOT @fluentui/react-components v9)

### Key Configurations
- Path alias `@/` → `src/` configured in both tsconfig.json and vite.config.ts
- Vite build entry point: `src/taskpane/taskpane.html`
- Dev server runs on port 3000
- TypeScript uses `noEmit: true` (Vite handles transpilation)

### Office Add-in Specifics
- manifest.xml requires Office.js script in taskpane.html
- Office.js loaded from CDN: `https://appsforoffice.microsoft.com/lib/1/hosted/office.js`
- Manifest uses localhost:3000 URLs for development

### Dependencies Installed
- Production: react, react-dom, @fluentui/react, html2canvas, jspdf, pdf-lib
- Dev: typescript, vite, vitest, @vitejs/plugin-react, @types/react, @types/react-dom, @testing-library/react, jsdom, @types/office-js, @types/node

## POC: HTML to PDF Conversion (2026-01-29)

### Architecture
- `PdfConverter` class in `src/services/pdfConverter.ts`
- Uses html2canvas to render HTML to canvas, then jsPDF to convert canvas to PDF
- Fallback canvas creation when html2canvas fails (for robustness)

### Korean Font Support
- html2canvas renders text as images, so Korean fonts work if the browser has them
- Font stack: 'Malgun Gothic', 'Apple SD Gothic Neo', 'Noto Sans KR', Arial, sans-serif
- jsPDF's built-in fonts don't support Korean, but since we use canvas-based rendering, this is not an issue
- For direct text rendering in jsPDF, would need to embed TTF font as base64

### Image Handling
- External images may fail due to CORS
- html2canvas options: `useCORS: true`, `allowTaint: false`, `imageTimeout: 5000`
- Fallback: Replace failed images with "[Image not available]" placeholder
- `onclone` callback in html2canvas to handle incomplete images

### Testing Strategy
- html2canvas is extremely slow in jsdom (30+ seconds per test)
- Solution: Mock html2canvas in test setup (`src/__tests__/setup.ts`)
- Mock creates a simple canvas with text content for fast testing
- Real html2canvas will be used in browser environment

### Key Files Created
- `src/services/pdfConverter.ts` - Core PDF conversion service
- `src/utils/sampleEmailHtml.ts` - Sample email HTML templates
- `src/__tests__/poc-html-to-pdf.test.ts` - 14 tests covering basic, Korean, image failure, edge cases
- `src/__tests__/setup.ts` - Test setup with html2canvas mock

### Dependencies Added
- `canvas` (dev) - Required for jsdom to support canvas operations
