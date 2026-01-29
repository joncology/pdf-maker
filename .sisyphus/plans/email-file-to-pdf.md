# Email File to PDF Converter

## Context

### Original Request
Outlook에서 내보낸 .eml 및 .msg 파일을 업로드하여 PDF로 변환하는 기능 추가

### Interview Summary
**Key Discussions**:
- 지원 파일 형식: .eml (postal-mime), .msg (@kenjiuno/msgreader 또는 outlook-email-parser)
- .pst는 브라우저 라이브러리 없어서 제외
- UI 배치: Task Pane에 탭 추가 + 독립 웹 페이지 제공
- 다중 파일 처리: 여러 파일을 하나의 PDF로 병합
- 첨부파일: 이름만 표시 (현재 방식과 동일)
- 에러 처리: 실패 파일 건너뛰기 (나머지 계속 처리)
- 파일 크기: 단일 100MB, 총 300MB 제한
- Drag & Drop: 추가

**Research Findings**:
- `postal-mime`: 150만+ 주간 다운로드, 0 dependencies, 브라우저 완벽 지원
- `@kenjiuno/msgreader`: TypeScript 지원, 브라우저 호환
- `outlook-email-parser`: .msg + .eml 둘 다 지원하나 dependents 적음

### Metis Review
**Identified Gaps** (addressed):
- 첨부파일 처리 방법 → 이름만 표시로 결정
- 에러 발생 시 동작 → 건너뛰기로 결정
- 파일 크기 제한 → 100MB/300MB로 결정
- Drag & Drop → 추가로 결정
- EmailData 인터페이스 수정 필요 여부 → 수정 없이 재사용

---

## Work Objectives

### Core Objective
.eml 및 .msg 파일을 업로드하여 PDF로 변환하는 기능 추가 (Task Pane 탭 + 독립 웹 페이지)

### Concrete Deliverables
- `src/services/emailFileParser.ts`: .eml/.msg 파일을 EmailData로 파싱
- `src/taskpane/components/FileUploadTab.tsx`: 파일 업로드 UI (드래그앤드롭 포함)
- `src/taskpane/App.tsx` 수정: 탭 UI 추가 (Outlook 선택 / 파일 업로드)
- `src/pages/standalone.html` + `Standalone.tsx`: 독립 웹 페이지
- `vite.config.ts` 수정: standalone entry point 추가

### Definition of Done
- [ ] .eml 파일 업로드 → PDF 생성 → 다운로드 성공
- [ ] .msg 파일 업로드 → PDF 생성 → 다운로드 성공
- [ ] 여러 파일 업로드 → 하나의 PDF로 병합
- [ ] Drag & Drop으로 파일 업로드 가능
- [ ] 독립 웹 페이지에서 Outlook 없이 동작
- [ ] Task Pane에서 탭 전환 동작
- [ ] 모든 테스트 통과: `npm test`

### Must Have
- .eml 파일 파싱 (postal-mime 사용)
- .msg 파일 파싱 (@kenjiuno/msgreader 사용)
- 기존 PDF 옵션 (구분선, 정렬, 파일명, 워터마크) 동일하게 적용
- 파일 드래그 앤 드롭 지원
- 파일 크기 제한 (단일 100MB, 총 300MB)
- 파싱 실패 시 해당 파일 건너뛰기
- 진행률 표시
- 한글 UI

### Must NOT Have (Guardrails)
- ❌ .pst 파일 지원 (브라우저 라이브러리 없음)
- ❌ 첨부파일 내용 PDF에 포함 (이름만 표시)
- ❌ 인라인 이미지 추출 (CID 이미지는 무시)
- ❌ CC/BCC 필드 추가 (EmailData 인터페이스 수정 없음)
- ❌ 파일 미리보기 기능
- ❌ 이메일 스레딩/그룹화
- ❌ 클라우드 저장소 연동 (OneDrive 등)
- ❌ 기존 서비스 수정 (EmailCollectorService, PdfGeneratorService)

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES (Vitest, 56 tests)
- **User wants tests**: TDD
- **Framework**: Vitest

### TDD Workflow
각 TODO는 RED-GREEN-REFACTOR 패턴:
1. **RED**: 실패하는 테스트 먼저 작성
2. **GREEN**: 테스트 통과하는 최소 코드 구현
3. **REFACTOR**: 코드 정리 (테스트 유지)

---

## Task Flow

```
0. 의존성 설치
       ↓
1. EmailFileParser 서비스 구현
       ↓
2. FileUploadTab 컴포넌트 구현
       ↓
3. App.tsx 탭 UI 추가
       ↓
4. Standalone 페이지 구현
       ↓
5. 통합 테스트 및 최종 검증
```

## Parallelization

| Group | Tasks | Reason |
|-------|-------|--------|
| - | 모든 태스크 순차 | 각 단계가 이전 단계 결과에 의존 |

---

## TODOs

- [x] 0. 의존성 설치 및 타입 확인

  **What to do**:
  - `postal-mime` 설치 (eml 파싱)
  - `@kenjiuno/msgreader` 설치 (msg 파싱)
  - TypeScript 타입 정의 확인 (둘 다 내장 타입 있음)
  - 기존 테스트 및 빌드가 깨지지 않는지 확인

  **Must NOT do**:
  - 다른 라이브러리 추가
  - 기존 코드 수정

  **Parallelizable**: NO (첫 번째 태스크)

  **References**:
  
  **External References**:
  - postal-mime: https://www.npmjs.com/package/postal-mime
  - @kenjiuno/msgreader: https://www.npmjs.com/package/@kenjiuno/msgreader

  **Acceptance Criteria**:
  
  **Manual Verification**:
  - [ ] `npm install` 성공
  - [ ] `npm test` → 기존 56개 테스트 통과
  - [ ] `npm run build` → 에러 없음

  **Commit**: YES
  - Message: `chore: add postal-mime and msgreader for email file parsing`
  - Files: `package.json`, `package-lock.json`

---

- [x] 1. EmailFileParser 서비스 구현

  **What to do**:
  - `EmailFileParser` 클래스 생성
  - `parseEmlFile(file: File): Promise<EmailData>` 구현
  - `parseMsgFile(file: File): Promise<EmailData>` 구현
  - `parseFiles(files: File[]): Promise<EmailData[]>` 구현 (여러 파일 처리)
  - 파일 확장자 기반 자동 파서 선택
  - 파싱 실패 시 해당 파일 건너뛰고 계속 진행
  - 파일 크기 검증 (단일 100MB, 총 300MB)
  - 진행률 콜백 지원

  **Must NOT do**:
  - EmailData 인터페이스 수정
  - 첨부파일 내용 추출 (이름만)
  - 인라인 이미지(CID) 처리

  **Parallelizable**: NO (0번 완료 후)

  **References**:
  
  **Pattern References**:
  - `src/services/emailCollector.ts` - 서비스 클래스 패턴, EmailData 출력 형식
  - `src/types/email.ts:EmailData` - 출력 인터페이스 (수정 없이 사용)
  - `src/services/pdfGenerator.ts:PdfGeneratorOptions.onProgress` - 진행률 콜백 패턴

  **API/Type References**:
  - postal-mime 사용법: `PostalMime.parse(arrayBuffer)` → `{ from, to, subject, date, html, text, attachments }`
  - msgreader 사용법: `new MsgReader(arrayBuffer).getFileData()` → `{ subject, senderName, recipients, body, attachments }`

  **External References**:
  - postal-mime 문서: https://github.com/postalsys/postal-mime
  - msgreader 문서: https://github.com/nickshanks/msgreader

  **Acceptance Criteria**:
  
  **TDD**:
  - [ ] `src/__tests__/emailFileParser.test.ts` 생성
  - [ ] 테스트: .eml 파일 파싱 → EmailData 반환
  - [ ] 테스트: .msg 파일 파싱 → EmailData 반환
  - [ ] 테스트: 여러 파일 파싱 → EmailData[] 반환
  - [ ] 테스트: 파싱 실패 시 건너뛰기
  - [ ] 테스트: 100MB 초과 파일 거부
  - [ ] 테스트: 총 300MB 초과 거부
  - [ ] `npm test` → 모든 테스트 통과

  **Manual Verification**:
  - [ ] 실제 .eml 파일로 파싱 테스트 (Playwright 또는 수동)
  - [ ] 실제 .msg 파일로 파싱 테스트

  **Commit**: YES
  - Message: `feat: implement EmailFileParser for .eml and .msg files`
  - Files: `src/services/emailFileParser.ts`, `src/__tests__/emailFileParser.test.ts`

---

- [x] 2. FileUploadTab 컴포넌트 구현

  **What to do**:
  - `FileUploadTab.tsx` 컴포넌트 생성
  - 파일 선택 버튼 (`<input type="file" multiple accept=".eml,.msg">`)
  - Drag & Drop 영역 구현
  - 선택된 파일 목록 표시 (이름, 크기)
  - 파일 제거 버튼
  - 기존 OptionsPanel 재사용 (구분선, 정렬, 파일명, 워터마크)
  - "PDF 생성" 버튼 → EmailFileParser + PdfGeneratorService 호출
  - 진행률 및 에러 표시 (기존 ProgressIndicator, ErrorDisplay 재사용)

  **Must NOT do**:
  - 파일 미리보기 기능
  - 새로운 옵션 추가
  - 기존 컴포넌트 수정

  **Parallelizable**: NO (1번 완료 후)

  **References**:
  
  **Pattern References**:
  - `src/taskpane/App.tsx` - 메인 컨테이너 패턴, 상태 관리
  - `src/taskpane/components/OptionsPanel.tsx` - 옵션 UI 재사용
  - `src/taskpane/components/ProgressIndicator.tsx` - 진행률 표시 재사용
  - `src/taskpane/components/ErrorDisplay.tsx` - 에러 표시 재사용

  **External References**:
  - Fluent UI React File Input: 표준 HTML input + Fluent 스타일링
  - React Drag and Drop 패턴

  **Acceptance Criteria**:
  
  **TDD**:
  - [ ] `src/__tests__/components/FileUploadTab.test.tsx` 생성
  - [ ] 테스트: 파일 선택 시 목록에 추가
  - [ ] 테스트: 드래그 앤 드롭 동작
  - [ ] 테스트: 파일 제거 동작
  - [ ] 테스트: PDF 생성 버튼 클릭 시 서비스 호출

  **Manual Verification** (Playwright):
  - [ ] 브라우저에서 파일 드래그 앤 드롭 동작
  - [ ] 파일 목록 표시 확인
  - [ ] PDF 생성 및 다운로드 동작

  **Commit**: YES
  - Message: `feat: implement FileUploadTab with drag and drop support`
  - Files: `src/taskpane/components/FileUploadTab.tsx`, `src/__tests__/components/FileUploadTab.test.tsx`

---

- [x] 3. App.tsx 탭 UI 추가

  **What to do**:
  - Fluent UI `Pivot` 컴포넌트로 탭 추가
  - 탭 1: "Outlook 선택" - 기존 기능 (EmailCollectorService 사용)
  - 탭 2: "파일 업로드" - 새 기능 (FileUploadTab 사용)
  - 탭 전환 시 상태 초기화
  - Outlook API 없을 때 (standalone) 파일 업로드 탭만 표시

  **Must NOT do**:
  - 기존 Outlook 선택 기능 수정
  - 새로운 상태 관리 라이브러리 추가

  **Parallelizable**: NO (2번 완료 후)

  **References**:
  
  **Pattern References**:
  - `src/taskpane/App.tsx` - 현재 구조
  - Fluent UI Pivot: https://developer.microsoft.com/en-us/fluentui#/controls/web/pivot

  **Acceptance Criteria**:
  
  **TDD**:
  - [ ] 기존 App.tsx 테스트 업데이트 (탭 전환 테스트 추가)
  - [ ] 테스트: 탭 전환 동작
  - [ ] 테스트: Office.js 없을 때 파일 업로드 탭만 표시

  **Manual Verification** (Playwright):
  - [ ] http://localhost:3000 에서 탭 전환 동작
  - [ ] 각 탭에서 PDF 생성 동작

  **Commit**: YES
  - Message: `feat: add tab UI to switch between Outlook selection and file upload`
  - Files: `src/taskpane/App.tsx`

---

- [x] 4. Standalone 페이지 구현

  **What to do**:
  - `src/pages/standalone.html` 생성 (Office.js 스크립트 없음)
  - `src/pages/Standalone.tsx` 생성 (FileUploadTab + 옵션 + 진행률)
  - `vite.config.ts` 수정: standalone entry point 추가
  - 독립 페이지용 스타일링 (헤더, 푸터 등)

  **Must NOT do**:
  - Office.js 의존성 추가
  - 서버 사이드 기능

  **Parallelizable**: NO (3번 완료 후)

  **References**:
  
  **Pattern References**:
  - `src/taskpane/taskpane.html` - HTML 템플릿 참조
  - `vite.config.ts` - 현재 entry point 설정

  **Acceptance Criteria**:
  
  **Manual Verification** (Playwright):
  - [ ] `npm run build` → dist/pages/standalone.html 생성 확인
  - [ ] 브라우저에서 standalone.html 직접 열기
  - [ ] 파일 업로드 → PDF 생성 동작
  - [ ] 모든 옵션 (구분선, 정렬, 워터마크 등) 동작

  **Commit**: YES
  - Message: `feat: add standalone web page for file upload without Outlook`
  - Files: `src/pages/standalone.html`, `src/pages/Standalone.tsx`, `vite.config.ts`

---

- [x] 5. 통합 테스트 및 최종 검증

  **What to do**:
  - 다양한 .eml/.msg 파일로 테스트
  - 한글 이메일 파일 테스트
  - 대용량 파일 테스트 (크기 제한 동작 확인)
  - Task Pane과 Standalone 페이지 둘 다 검증
  - 발견된 버그 수정

  **Must NOT do**:
  - 새 기능 추가
  - 대규모 리팩토링

  **Parallelizable**: NO (4번 완료 후, 마지막 단계)

  **References**:
  
  **Pattern References**:
  - 이전 단계에서 생성된 모든 서비스 및 컴포넌트

  **Acceptance Criteria**:
  
  **Manual Verification** (Playwright):
  - [ ] .eml 파일 5개 업로드 → PDF 생성 성공
  - [ ] .msg 파일 3개 업로드 → PDF 생성 성공
  - [ ] 혼합 (.eml + .msg) 업로드 → PDF 병합 성공
  - [ ] 한글 이메일 제목/본문 깨지지 않음
  - [ ] 드래그 앤 드롭 동작
  - [ ] 진행률 표시 동작
  - [ ] 에러 발생 시 메시지 표시
  - [ ] Standalone 페이지에서 전체 플로우 동작

  **Commit**: YES
  - Message: `test: complete integration testing for email file to PDF feature`
  - Files: 버그 수정된 파일들

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 0 | `chore: add email parsing dependencies` | package.json | `npm test`, `npm run build` |
| 1 | `feat: implement EmailFileParser` | emailFileParser.ts | `npm test` |
| 2 | `feat: implement FileUploadTab` | FileUploadTab.tsx | `npm test` |
| 3 | `feat: add tab UI` | App.tsx | `npm test`, Playwright |
| 4 | `feat: add standalone page` | standalone.html, Standalone.tsx | Playwright |
| 5 | `test: integration testing` | 수정된 파일들 | 전체 E2E 테스트 |

---

## Success Criteria

### Verification Commands
```bash
npm test          # Expected: All tests pass (기존 + 신규)
npm run build     # Expected: No errors, dist/pages/standalone.html 생성
npm run dev       # Expected: Server starts, 탭 UI 동작
```

### Final Checklist
- [ ] **Must Have** - 모든 필수 기능 구현됨
  - [ ] .eml 파일 파싱 및 PDF 생성
  - [ ] .msg 파일 파싱 및 PDF 생성
  - [ ] 다중 파일 병합
  - [ ] Drag & Drop 지원
  - [ ] 파일 크기 제한 동작
  - [ ] 에러 시 건너뛰기 동작
  - [ ] 탭 UI (Outlook 선택 / 파일 업로드)
  - [ ] Standalone 페이지
- [ ] **Must NOT Have** - 제외 항목 확인
  - [ ] .pst 파일 지원 없음
  - [ ] 첨부파일 내용 없음 (이름만)
  - [ ] 인라인 이미지 없음
  - [ ] EmailData 인터페이스 수정 없음
- [ ] **Quality**
  - [ ] 모든 테스트 통과
  - [ ] 한글 깨짐 없음
  - [ ] Task Pane + Standalone 둘 다 동작
