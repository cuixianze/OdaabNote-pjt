# OdaabNote

9급 공무원 컴퓨터일반 과목 문제 관리 및 모의고사 앱입니다.  
이미지 OCR(Google Vision) + AI 분석(Gemini)으로 문제를 자동 등록할 수 있으며, PDF/Gemini로 추출한 기출문제를 JSON 일괄 등록할 수 있습니다.

## 주요 기능

- **문제 등록**: 이미지 업로드 → Vision OCR → Gemini 분석(정답, 선지별 해설, **키워드 반사신경**) → DB 저장
- **기출 일괄 등록**: `POST /api/problems/import` 로 JSON 배열 전송 시 과목/단원/태그 자동 매핑
- **태그**: DB에 정의된 태그만 선택 가능(초빈출, 별표100개, 지엽적, 기출, 통암기 + 회원가입 시 유저 이름 태그). 태그별 검색 시 각 문제의 **전체 태그** 표시
- **단원/과목/태그별 문제 목록**, **모의고사**(랜덤/과목별/전체), **댓글**

## 기술 스택

- **Backend**: Spring Boot 3.2, Java 17, MySQL 8.0
- **Frontend**: React 19, Vite 7, TypeScript, Tailwind CSS
- **외부 API**: Google Vision (OCR), Gemini 2.5 Flash (문제 분석·키워드 반사신경)
- **배포**: EC2 + Docker(Debian 기반 JRE), RDS MySQL, S3 정적 호스팅

---

## 로컬 개발

### 사전 요구사항

- Java 17+
- Node.js 18+
- Docker, Docker Compose (MySQL용)
- Google Cloud 프로젝트 (Vision API)
- Gemini API 키

### 1. 환경변수 설정

```bash
cp .env.example .env
# .env 파일을 열어 실제 값으로 수정
```

필수 환경변수:

| 변수 | 설명 |
|------|------|
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/)에서 발급 |
| `GCP_PROJECT_ID` | Google Cloud 프로젝트 ID |
| `GOOGLE_APPLICATION_CREDENTIALS` | Vision API 서비스 계정 JSON 파일 경로 |

### 2. MySQL 실행

```bash
docker-compose up -d mysql
```

### 3. 백엔드 실행

```bash
./gradlew bootRun
```

- API: http://localhost:8080
- Swagger: http://localhost:8080/swagger-ui.html

### 4. 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

- 앱: http://localhost:5173

---

## API 요약

| 구분 | 메서드 | 경로 | 설명 |
|------|--------|------|------|
| 문제 | POST | `/api/problems` | 이미지/JSON으로 문제 등록 (OCR+Gemini) |
| 문제 | POST | `/api/problems/import` | 기출 JSON 배열 일괄 등록 |
| 문제 | GET | `/api/problems/{id}` | 문제 단건 조회 |
| 문제 | PUT | `/api/problems/{id}` | 문제 수정 |
| 문제 | GET | `/api/problems?tagId=` | 태그별 문제 목록 |
| 문제 | GET | `/api/units/{unitId}/problems` | 단원별 문제 |
| 문제 | GET | `/api/subjects/{subjectId}/problems` | 과목별 문제 |
| 문제 | GET | `/api/users/{userId}/problems` | 유저별 문제 |
| 태그 | GET | `/api/tags` | 태그 목록 |
| 태그 | POST | `/api/tags` | 태그 생성 |
| 과목/단원 | GET | `/api/subjects`, `/api/subjects/{id}/units` | 과목·단원 목록 |
| 모의고사 | POST | `/api/exams/random`, `/subject`, `/full` | 모의고사 생성 |
| 댓글 | GET/POST | `/api/problems/{id}/comments` | 댓글 목록/등록 |

상세: `docs/API_AND_FEATURES.md`, `docs/PDF_PROBLEM_IMPORT_FORMAT.md`

---

## 프로덕션 배포 (AWS)

### 아키텍처

- **EC2**: Spring Boot 백엔드 (Docker, Debian 기반 JRE 17)
- **RDS**: MySQL
- **S3**: React 프론트엔드 정적 호스팅

### 프로덕션 환경변수

`spring.profiles.active=prod` 로 실행 시 다음 환경변수가 필요합니다.

| 변수 | 설명 |
|------|------|
| `RDS_ENDPOINT` | RDS MySQL 엔드포인트 (호스트명만) |
| `RDS_USERNAME` | RDS 마스터 사용자명 |
| `RDS_PASSWORD` | RDS 마스터 비밀번호 |
| `GEMINI_API_KEY` | Gemini API 키 |
| `GCP_PROJECT_ID` | Google Cloud 프로젝트 ID |
| `GOOGLE_APPLICATION_CREDENTIALS` | Vision API JSON 키 파일 경로 (EC2 내) |
| `ALLOWED_ORIGINS` | CORS 허용 오리진 (쉼표 구분) |

### Docker (백엔드)

- **베이스 이미지**: `eclipse-temurin:17-jre` (Debian). Alpine은 Google Vision/gRPC(netty-tcnative)에서 SIGSEGV가 발생하므로 사용하지 않음.
- 자세한 배포 절차: `guide/DEPLOYMENT.md`

---

## 데이터·시드

- **과목/단원**: `scripts/seed-subjects-units.sql`
- **태그**: 앱 기동 시 `TagSeedRunner`가 초빈출, 별표100개, 지엽적, 기출, 통암기 자동 생성. 회원가입 시 유저 이름 태그 생성.
- **기출 일괄 등록 예시**: `scripts/import-4problems.json` 참고 후 `POST /api/problems/import` 호출.

---

## 라이선스

Private
