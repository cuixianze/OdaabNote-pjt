# S3 프론트엔드 배포 가이드

## 아키텍처

- **프론트엔드**: S3 정적 웹사이트
- **백엔드**: EC2 (Spring Boot, Nginx는 /api만 프록시)

---

## Step 1: DB 구조 확인

EC2 SSH 터미널에서:

```bash
mysql -h oddabnote-db.cveakuq22o6u.ap-northeast-2.rds.amazonaws.com -u admin -p22865527 odaabnote -e "
  SHOW TABLES;
  SELECT COUNT(*) AS user_count FROM user;
  SELECT COUNT(*) AS subject_count FROM subject;
  SELECT COUNT(*) AS problem_count FROM problem;
"
```

또는 상세 확인:

```bash
mysql -h oddabnote-db.cveakuq22o6u.ap-northeast-2.rds.amazonaws.com -u admin -p22865527 odaabnote
```

MySQL 프롬프트에서:

```sql
-- 테이블 목록
SHOW TABLES;

-- 각 테이블 구조
DESCRIBE user;
DESCRIBE subject;
DESCRIBE unit;
DESCRIBE problem;
DESCRIBE exam;

-- 데이터 개수
SELECT 'user' AS tbl, COUNT(*) FROM user
UNION SELECT 'subject', COUNT(*) FROM subject
UNION SELECT 'unit', COUNT(*) FROM unit
UNION SELECT 'problem', COUNT(*) FROM problem
UNION SELECT 'tag', COUNT(*) FROM tag;

exit
```

**예상 테이블**: user, subject, unit, tag, problem, problem_tag, exam, exam_problem, user_problem_log, comment

---

## Step 2: EC2 Nginx 설정 (API 전용)

프론트엔드를 S3로 옮기므로 EC2는 API만 서빙합니다.

`/etc/nginx/sites-available/odaabnote`:

```nginx
server {
    listen 80;
    server_name _;

    location /api {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        client_max_body_size 20M;
    }
}
```

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 3: EC2 .env CORS 업데이트

S3 오리진을 허용하도록 수정:

```
ALLOWED_ORIGINS=http://43.200.170.32,http://odaabnote-frontend.s3-website.ap-northeast-2.amazonaws.com
```

S3 버킷 이름이 다르면 해당 URL로 변경하세요.

---

## Step 4: S3 버킷 설정

### 4-1. 정적 웹사이트 호스팅 활성화

1. AWS 콘솔 → S3 → 버킷 선택
2. **속성** → **정적 웹 사이트 호스팅** → **편집**
3. **활성화** 선택
4. **인덱스 문서**: `index.html`
5. **오류 문서**: `index.html` (SPA 라우팅용)
6. 저장

### 4-2. 퍼블릭 액세스 (필요 시)

- **퍼블릭 액세스 차단**이 켜져 있으면 정적 웹사이트 URL로 접근이 안 될 수 있음
- 정적 웹사이트 호스팅을 사용하면 `s3-website` 엔드포인트로 접근 가능 (버킷 정책으로 제어)

**버킷 정책** (읽기 허용):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::odaabnote-frontend/*"
        }
    ]
}
```

버킷 이름이 다르면 `Resource`의 버킷명을 수정하세요.

---

## Step 5: 프론트엔드 빌드 (API URL 포함)

로컬에서:

```bash
cd /Users/chris/OdaabNote-pjt/frontend

# EC2 API URL로 빌드
VITE_API_BASE=http://43.200.170.32/api npm run build
```

---

## Step 6: S3 업로드

```bash
# AWS CLI 설치 확인
aws --version

# 업로드 (버킷 이름 확인)
aws s3 sync dist/ s3://odaabnote-frontend/ --delete
```

버킷 이름이 다르면 `odaabnote-frontend`를 실제 버킷명으로 바꾸세요.

---

## Step 7: 접속 확인

**프론트엔드 (S3)**:
```
http://odaabnote-frontend.s3-website.ap-northeast-2.amazonaws.com
```

**API 직접 테스트**:
```
http://43.200.170.32/api/subjects
```

---

## 재배포 시

```bash
cd frontend
VITE_API_BASE=http://43.200.170.32/api npm run build
aws s3 sync dist/ s3://odaabnote-frontend/ --delete
```
