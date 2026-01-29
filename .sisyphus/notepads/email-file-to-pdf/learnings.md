# Learnings - Email File to PDF Converter

## Conventions

## Patterns

## Gotchas


## Email Parsing Dependencies Installation

### Installed Packages
- **postal-mime@2.7.3**: MIME format parser for .eml files
  - Zero dependencies, lightweight
  - 1.5M+ weekly downloads
  - Handles standard email format parsing
  
- **@kenjiuno/msgreader@1.28.0**: Outlook .msg format parser
  - TypeScript support
  - Browser-compatible
  - Handles Outlook-specific email format

### Installation Results
- Installation: ✅ Success (5 packages added, 0 vulnerabilities)
- Tests: ✅ All 56 tests passing
- Build: ✅ Success (Vite 7.3.1, TypeScript compilation clean)
- No source code modifications required
- No configuration changes needed

### Key Observations
- Both packages integrate cleanly with existing stack
- No breaking changes to existing tests
- Build warnings are pre-existing (chunk size > 500kB) - not related to new dependencies
- Ready for email file parsing implementation

## EmailFileParser Implementation

### Service Implementation (`src/services/emailFileParser.ts`)
- Follows service class pattern from `emailCollector.ts`
- Three public methods: `parseEmlFile`, `parseMsgFile`, `parseFiles`
- File size validation: 100MB per file, 300MB total
- Graceful error handling: skip failed files, continue with rest
- Sorting support: selection, dateAsc, dateDesc
- Progress callback for UI feedback

### Library API Notes

**postal-mime (for .eml)**:
- `from` is an object with `name` and `address` properties
- `to` is an array of objects with `name` and `address`
- `attachments[].content` can be `ArrayBuffer | string`
- `date` is a string (ISO format), needs `new Date()` conversion

**@kenjiuno/msgreader (for .msg)**:
- Property is `bodyHtml` (camelCase), NOT `bodyHTML`
- `recipients` array has `name` and `email` properties
- `attachments` have `fileName`, `fileNameShort`, `dataLength`
- Date fields: `messageDeliveryTime` (preferred), `creationTime` (fallback)

### Testing Patterns
- Mock classes with `vi.mock()` using class syntax, not arrow functions
- Create mock files with `arrayBuffer()` method (Node.js File doesn't have it)
- Use `as unknown as File` for type casting mock files
- Shared mock functions (`mockParse`, `mockGetFileData`) at module level

### Test Coverage (27 tests)
- .eml parsing: 6 tests (subject, date, from, html/text fallback, escaping)
- .msg parsing: 4 tests (basic, date fallback, sender fallback, attachment names)
- parseFiles: 9 tests (multiple files, mixed formats, errors, progress, sorting)
- File size validation: 3 tests (single file, total, within limits)
- Edge cases: 5 tests (empty list, no attachments, multiple recipients, etc.)

### Results
- All 83 tests passing (56 existing + 27 new)
- Build succeeds
- TypeScript compilation clean
