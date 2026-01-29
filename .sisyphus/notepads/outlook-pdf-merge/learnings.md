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
