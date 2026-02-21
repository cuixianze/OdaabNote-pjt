# OdaabNote

9급 공무원 컴퓨터일반 과목 문제 관리 및 모의고사 앱입니다.  
이미지 OCR(Google Vision) + AI 분석(Gemini)으로 문제를 자동 등록할 수 있습니다.

## 기술 스택

- **Backend**: Spring Boot 3.2, Java 17, MySQL 8.0
- **Frontend**: React 19, Vite 7, TypeScript, Tailwind CSS
- **외부 API**: Google Vision (OCR), Gemini 2.5 Flash (문제 분석)

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

## 프로덕션 배포 (AWS)

### 아키텍처

- **EC2**: Spring Boot 백엔드
- **RDS**: MySQL
- **S3 + CloudFront**: React 프론트엔드

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
| `ALLOWED_ORIGINS` | CORS 허용 오리진 (쉼표 구분, 예: `https://xxx.cloudfront.net`) |

### 실행 예시

```bash
java -jar -Dspring.profiles.active=prod app.jar
```

---

## 라이선스

Private

---

## 데이터 초기화 (스키마 유지)

```bash
scp -i ~/Downloads/odaabnote-key.pem scripts/truncate-data.sql ubuntu@43.200.170.32:/tmp/
ssh -i ~/Downloads/odaabnote-key.pem ubuntu@43.200.170.32 "mysql -h <RDS_ENDPOINT> -u admin -p odaabnote < /tmp/truncate-data.sql"
```
