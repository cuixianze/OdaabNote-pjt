# OdaabNote 배포 가이드

프론트엔드와 동등한 레벨의 `guide/` 폴더에 배포 방법을 정리합니다.

---

## 0. EC2 Docker 원타임 설정 (최초 1회)

Docker로 전환한 경우, EC2에 Docker 설치 및 systemd 서비스 비활성화가 필요합니다.

```bash
scp -i ~/Downloads/odaabnote-key.pem scripts/ec2-docker-setup.sh ubuntu@43.200.170.32:/tmp/
ssh -i ~/Downloads/odaabnote-key.pem ubuntu@43.200.170.32 "sudo bash /tmp/ec2-docker-setup.sh"
# 완료 후 로그아웃 → 재로그인 (usermod 적용)
```

이후 `.env`, `google-vision-key.json`이 `/var/www/odaabnote/`에 있는지 확인하세요.

---

## 1. 백엔드(서버) 수정 시

```bash
git add .
git commit -m "백엔드 수정 내용"
git push
```

**자동 처리**: GitHub Actions가 JAR 빌드 → EC2 업로드 → Docker 이미지 빌드 → 컨테이너 재시작 (`--restart always`)

---

## 2. 프론트엔드 수정 시

```bash
git add .
git commit -m "프론트엔드 수정 내용"
git push
```

**자동 처리**: GitHub Actions가 npm build → S3 업로드

---

## 3. DB 데이터 수정 시 (수동)

CI/CD로 처리되지 않음. 직접 실행 필요.

### 3-1. 과목·단원 시드

```bash
scp -i ~/Downloads/odaabnote-key.pem scripts/seed-subjects-units.sql ubuntu@43.200.170.32:/tmp/
ssh -i ~/Downloads/odaabnote-key.pem ubuntu@43.200.170.32 "mysql -h <RDS_ENDPOINT> -u admin -p odaabnote < /tmp/seed-subjects-units.sql"
```

### 3-2. 데이터 전체 초기화 (스키마 유지)

```bash
scp -i ~/Downloads/odaabnote-key.pem scripts/truncate-data.sql ubuntu@43.200.170.32:/tmp/
ssh -i ~/Downloads/odaabnote-key.pem ubuntu@43.200.170.32 "mysql -h <RDS_ENDPOINT> -u admin -p odaabnote < /tmp/truncate-data.sql"
```

### 3-3. 스키마 변경 (테이블 추가/수정)

```bash
scp -i ~/Downloads/odaabnote-key.pem scripts/migration-xxx.sql ubuntu@43.200.170.32:/tmp/
ssh -i ~/Downloads/odaabnote-key.pem ubuntu@43.200.170.32 "mysql -h <RDS_ENDPOINT> -u admin -p odaabnote < /tmp/migration-xxx.sql"
```

---

## 4. 요약 표

| 수정 대상 | 배포 방법 | 자동화 |
|----------|-----------|--------|
| 백엔드 | `git push` | ✅ CI/CD |
| 프론트엔드 | `git push` | ✅ CI/CD |
| DB 데이터 | SQL 실행 | ❌ 수동 |
| DB 스키마 | SQL 실행 | ❌ 수동 |

---

## 5. 접속 URL

| 서비스 | URL |
|--------|-----|
| 프론트엔드 | http://odaabnote-frontend.s3-website.ap-northeast-2.amazonaws.com |
| API | http://43.200.170.32/api |

---

## 6. EC2 디스크 부족 시 (no space left on device)

배포 중 `no space left on device` 오류가 나면 EC2 디스크가 꽉 찬 상태입니다. **한 번만** 아래를 실행해 주세요.

```bash
ssh -i ~/Downloads/odaabnote-key.pem ubuntu@43.200.170.32

# 기존 앱 컨테이너 중지·제거
sudo docker stop odaabnote-backend 2>/dev/null || true
sudo docker rm odaabnote-backend 2>/dev/null || true

# 미사용 Docker 이미지·캐시 전부 삭제 (용량 확보)
sudo docker image prune -af
sudo docker builder prune -af

# (선택) 디스크 사용량 확인
df -h
sudo docker system df

exit
```

이후 **다시 배포** (Git push 또는 수동으로 JAR 업로드 후 `sudo bash /tmp/docker-deploy.sh`).  
이후부터는 `docker-deploy.sh`가 배포 전에 자동으로 정리하므로 같은 오류는 줄어듭니다.

---

## 7. Docker 관련 (백엔드)

- **베이스 이미지**: `eclipse-temurin:17-jre` (Debian). Alpine(`*-alpine`)은 Google Vision/gRPC netty-tcnative에서 JVM SIGSEGV가 발생하므로 사용하지 않음.
- **실행**: `scripts/docker-deploy.sh` (CI에서 자동 실행, 수동 배포 시에도 사용)
- **재시작 정책**: `--restart always` (다운 시 자동 재시작)
- **수동 배포**: `scp` 후 EC2에서 `sudo bash /tmp/docker-deploy.sh` 실행

---

## 8. 기출문제 일괄 등록 (API)

- **엔드포인트**: `POST /api/problems/import`
- **Body**: `{ "ownerUserId": 1, "problems": [ {...}, ... ] }` (형식은 `docs/PDF_PROBLEM_IMPORT_FORMAT.md` 참고)
- **로컬에서 curl 예시**: `curl -X POST http://43.200.170.32/api/problems/import -H "Content-Type: application/json" -d @scripts/import-4problems.json`
