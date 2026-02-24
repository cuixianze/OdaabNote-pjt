# OdaabNote API 및 기능 정리

배포·기능 변경 시 함께 갱신하는 기록입니다.

---

## 1. API 목록 (백엔드)

Base URL: `/api` (프로덕션: `http://43.200.170.32/api`)

### 문제 (Problem)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/problems` | 문제 등록. `multipart/form-data`: `request`(JSON), `file`(이미지 선택). 이미지 있으면 OCR → Gemini 분석(정답, 선지별 해설, 키워드 반사신경) 후 저장. `tagIds`만 사용(자유 입력 아님). |
| POST | `/problems/import` | 기출문제 JSON 일괄 등록. Body: `{ "ownerUserId": 1, "problems": [ ProblemImportItemRequest, ... ] }`. 과목/단원/태그는 이름으로 자동 매핑. |
| GET | `/problems/{problemId}` | 문제 단건 조회. |
| PUT | `/problems/{problemId}` | 문제 수정. `tagIds`, 선지별 해설, 핵심개념, 키워드 등. |
| GET | `/problems?tagId={tagId}` | 해당 태그가 붙은 문제 목록. 각 문제의 **전체 태그** 포함. |
| GET | `/units/{unitId}/problems` | 단원별 문제 목록. |
| GET | `/subjects/{subjectId}/problems` | 과목별 문제 목록. |
| GET | `/users/{userId}/problems` | 유저(소유자)별 문제 목록. |

### 태그 (Tag)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/tags` | 태그 전체 목록. |
| POST | `/tags` | 태그 생성. Body: `{ "name", "color" }`. |
| GET | `/tags/{tagId}` | 태그 단건 조회. |

### 과목·단원 (Subject / Unit)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/subjects` | 과목 목록. |
| GET | `/subjects/{subjectId}/units` | 해당 과목의 단원 목록. |

### 모의고사 (Exam)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/exams/random` | 랜덤 모의고사 생성. |
| POST | `/exams/subject` | 과목별 모의고사 생성. |
| POST | `/exams/full` | 전체 모의고사 생성. |
| GET | `/exams/{examId}` | 모의고사 단건 조회. |

### 댓글 (Comment)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/problems/{problemId}/comments` | 해당 문제의 댓글 목록. |
| POST | `/problems/{problemId}/comments` | 댓글 등록. Body: `{ "userId", "content" }`. |

### 사용자 (User)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/users` | 회원가입. 가입 시 해당 유저 이름으로 태그 자동 생성(없으면). |
| GET | `/users?name=` | 유저 목록(이름 검색). |
| GET | `/users/{userId}` | 유저 단건 조회. |

### 디버그 (개발용)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/gemini-test` | OCR 텍스트만 보내 Gemini 분석 결과 확인. |

---

## 2. 주요 기능 요약

### 2.1 태그

- **고정 태그**: 앱 기동 시 시드 — 초빈출, 별표100개, 지엽적, 기출, 통암기.
- **유저 이름 태그**: 회원가입 시 해당 이름으로 태그 생성(이미 있으면 재사용).
- **문제 등록/수정**: `tagIds`만 허용. 자유 텍스트로 새 태그 생성 불가. 프론트는 `GET /tags` 목록에서 다중 선택 후 `tagIds` 전송.
- **태그별 검색**: `GET /api/problems?tagId=` 응답에 각 문제의 **모든 태그** 포함(JOIN FETCH로 조회).

### 2.2 Gemini (문제 분석)

- **역할**: 9급 공무원 컴퓨터일반 1타 강사. 이미지 업로드 후 OCR 텍스트를 분석해 정답, 선지별 해설, **키워드 반사신경** 추출.
- **키워드 반사신경**: 핵심 정답 개념 1개 + 라이벌(오답) 개념들. 각 개념당 3개 이상 키워드 배열. 문장형 서술 금지.
- **출력**: `correctAnswer`, `choiceExplanations`, `keywordReflexes`. DB에는 `coreConcept`(첫 항목 요약), `keyConcepts`(개념: 키워드1, 키워드2, ... 문자열 배열)로 저장.

### 2.3 기출 일괄 등록 (Import)

- **엔드포인트**: `POST /api/problems/import`.
- **입력**: `subjectName`, `unitName`, `tagNames` 사용 시 DB에 있는 이름과 매칭(일부 표기 차이는 서비스에서 정규화: 예: 데이터통신론 → 데이터 통신론).
- **저장**: questionText, choices, correctChoiceKey, choiceExplanations, keyConcepts, source 등 전부 저장.
- **예시 스크립트**: `scripts/import-4problems.json`. curl 예시는 `guide/DEPLOYMENT.md` §7 참고.

### 2.4 Docker·배포

- **백엔드 이미지**: `eclipse-temurin:17-jre` (Debian). Alpine 미사용( netty-tcnative SIGSEGV 방지).
- **배포**: `git push` → GitHub Actions가 JAR 빌드, EC2 업로드, Docker 빌드·재시작, S3 프론트 동기화.

---

## 3. 참고 문서

| 문서 | 내용 |
|------|------|
| `guide/DEPLOYMENT.md` | 배포 절차, Docker, 기출 import curl 예시 |
| `guide/SECRETS.md` | 비밀키·환경변수 정리 |
| `docs/PDF_PROBLEM_IMPORT_FORMAT.md` | 기출 JSON 형식 및 import API 상세 |
| `docs/TAG_FEATURE_ANALYSIS_AND_PLAN.md` | 태그 기능 분석·개선 계획(적용 완료 반영) |
