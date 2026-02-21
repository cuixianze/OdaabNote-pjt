# OdaabNote 비밀키·민감정보 정리

이 프로젝트에서 사용하는 비밀키와 민감정보 목록입니다.  
**실제 값은 이 파일에 저장하지 마세요.** 별도 안전한 곳에 보관하세요.

---

## 1. AWS

| 항목 | 용도 | 저장 위치 |
|------|------|-----------|
| **Access Key ID** | S3 업로드, GitHub Actions | GitHub Secrets `AWS_ACCESS_KEY_ID` |
| **Secret Access Key** | S3 업로드, GitHub Actions | GitHub Secrets `AWS_SECRET_ACCESS_KEY` |
| **EC2 SSH 키 (.pem)** | EC2 접속, 배포 | 로컬 `~/Downloads/odaabnote-key.pem`, GitHub Secrets `EC2_SSH_KEY` |
| **RDS 마스터 비밀번호** | RDS MySQL 접속 | EC2 `.env` (`RDS_PASSWORD`), deploy/env.ec2 |

---

## 2. RDS (MySQL)

| 항목 | 용도 | 저장 위치 |
|------|------|-----------|
| **엔드포인트** | DB 호스트 | EC2 `.env` (`RDS_ENDPOINT`) |
| **사용자명** | DB 로그인 | EC2 `.env` (`RDS_USERNAME`) |
| **비밀번호** | DB 로그인 | EC2 `.env` (`RDS_PASSWORD`) |

---

## 3. Google Cloud (Vision API)

| 항목 | 용도 | 저장 위치 |
|------|------|-----------|
| **프로젝트 ID** | GCP 프로젝트 식별 | EC2 `.env` (`GCP_PROJECT_ID`) |
| **서비스 계정 JSON** | Vision API 인증 | 로컬 파일, EC2 `/var/www/odaabnote/google-vision-key.json` |
| **JSON 파일 경로** | 애플리케이션에서 참조 | EC2 `.env` (`GOOGLE_APPLICATION_CREDENTIALS`) |

---

## 4. Google Gemini API

| 항목 | 용도 | 저장 위치 |
|------|------|-----------|
| **API 키** | Gemini 2.5 Flash 호출 | EC2 `.env` (`GEMINI_API_KEY`), 로컬 `.env` |

---

## 5. GitHub Actions Secrets

| Secret 이름 | 용도 |
|-------------|------|
| `AWS_ACCESS_KEY_ID` | S3 업로드 |
| `AWS_SECRET_ACCESS_KEY` | S3 업로드 |
| `EC2_HOST` | EC2 IP (예: 43.200.170.32) |
| `EC2_USER` | EC2 SSH 사용자 (ubuntu) |
| `EC2_SSH_KEY` | .pem 파일 전체 내용 |

---

## 6. CORS

| 항목 | 용도 | 저장 위치 |
|------|------|-----------|
| **ALLOWED_ORIGINS** | 허용 프론트엔드 도메인 | EC2 `.env` |

예: `http://43.200.170.32,http://odaabnote-frontend.s3-website.ap-northeast-2.amazonaws.com`

---

## 7. 보안 주의사항

- `.env`, `deploy/env.ec2`, `*-key.json` 파일은 **절대 Git에 커밋하지 마세요**
- `.gitignore`에 포함되어 있는지 확인하세요
- 비밀키가 노출되었다면 **즉시 재발급**하세요 (AWS, Gemini, GCP)
