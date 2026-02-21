# EC2 Docker 전환 계획

**목표**: Java 직접 설치 → Docker 컨테이너 기반 배포, 다운 시 자동 재시작

---

## 1. 현재 vs 목표

| 항목 | 현재 | 목표 |
|------|------|------|
| **Spring Boot** | systemd + java -jar | Docker 컨테이너 |
| **재시작** | systemd Restart=always | Docker `--restart always` |
| **Java** | EC2에 직접 설치 | 컨테이너 내부만 |
| **Nginx** | EC2 호스트 | 유지 (또는 컨테이너화) |

---

## 2. 아키텍처 옵션

### 옵션 A: Spring Boot만 Docker (권장)

```
[EC2 호스트]
├── Docker: odaabnote-backend (Spring Boot, restart: always)
├── Nginx: 호스트에 설치 (기존 유지)
└── .env, google-vision-key.json: 호스트에 마운트
```

- **장점**: 변경 범위 작음, Nginx 설정 그대로
- **단점**: Nginx는 호스트에 남음

### 옵션 B: Nginx + Spring Boot 모두 Docker

```
[EC2 호스트]
└── Docker Compose
    ├── nginx (reverse proxy)
    └── odaabnote-backend (Spring Boot, restart: always)
```

- **장점**: 전체 컨테이너화
- **단점**: docker-compose 설정 추가, Nginx 설정 이전

**권장**: 옵션 A (단계적 전환)

---

## 3. 작업 단계

### Phase 1: Dockerfile 및 이미지 빌드

| 순서 | 작업 | 산출물 |
|------|------|--------|
| 1-1 | `Dockerfile` 작성 (Java 17, JAR 실행) | `Dockerfile` |
| 1-2 | `.dockerignore` 작성 | `.dockerignore` |
| 1-3 | 로컬에서 `docker build` 테스트 | 이미지 빌드 확인 |

### Phase 2: EC2 Docker 환경 구성

| 순서 | 작업 | 산출물 |
|------|------|--------|
| 2-1 | EC2에 Docker 설치 | `docker --version` |
| 2-2 | 기존 systemd 서비스 비활성화 | `systemctl stop odaabnote` |
| 2-3 | Docker 컨테이너 실행 (`--restart always`) | 실행 중인 컨테이너 |
| 2-4 | Nginx → 8080 프록시 동작 확인 | API 응답 확인 |

### Phase 3: CI/CD 수정

| 순서 | 작업 | 산출물 |
|------|------|--------|
| 3-1 | GitHub Actions: JAR + Dockerfile 전송 | `deploy.yml` 수정 |
| 3-2 | EC2에서 `docker build` + `docker run` 실행 | 자동 배포 |
| 3-3 | 배포 후 헬스체크 (선택) | `curl /api/subjects` |

### Phase 4: 정리 및 검증

| 순서 | 작업 | 산출물 |
|------|------|--------|
| 4-1 | EC2에서 Java 제거 (선택) | 디스크 절약 |
| 4-2 | `guide/DEPLOYMENT.md` 업데이트 | 문서 반영 |
| 4-3 | 재시작 동작 테스트 | `docker kill` 후 자동 재시작 확인 |

---

## 4. Dockerfile 개요

```dockerfile
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY app.jar app.jar
# .env, google-vision-key.json는 -v로 마운트
ENTRYPOINT ["java", "-Xmx256m", "-Xms128m", "-jar", "app.jar"]
```

- JAR는 CI/CD에서 빌드 후 EC2로 전송
- `.env`, `google-vision-key.json`는 `-v`로 호스트 경로 마운트

---

## 5. Docker 실행 명령 예시

```bash
docker run -d \
  --name odaabnote-backend \
  --restart always \
  -p 8080:8080 \
  -v /var/www/odaabnote/.env:/app/.env:ro \
  -v /var/www/odaabnote/google-vision-key.json:/app/google-vision-key.json:ro \
  -e SPRING_PROFILES_ACTIVE=prod \
  odaabnote-backend:latest
```

- `--restart always`: 종료 시 자동 재시작
- `-v`: 환경변수·키 파일 마운트

---

## 6. CI/CD 변경 요약

**현재**: `scp app.jar` → `systemctl restart odaabnote`

**변경 후**:
1. `scp` app.jar + Dockerfile
2. `docker build -t odaabnote-backend .`
3. `docker stop` + `docker rm` (기존 컨테이너)
4. `docker run` (새 이미지로 컨테이너 생성)

---

## 7. 롤백 계획

- Docker 전환 실패 시: systemd 서비스 재활성화, `systemctl start odaabnote`
- Java는 제거하지 않고, 검증 후 제거

---

## 8. 예상 소요 시간

| Phase | 예상 시간 |
|-------|-----------|
| Phase 1 | 30분 |
| Phase 2 | 30분 |
| Phase 3 | 30분 |
| Phase 4 | 15분 |
| **합계** | **약 2시간** |

---

## 9. 진행 순서

1. **Phase 1** → Dockerfile 작성 및 로컬 테스트
2. **Phase 2** → EC2 Docker 설치 및 수동 컨테이너 실행
3. **Phase 3** → GitHub Actions 수정
4. **Phase 4** → 정리 및 검증

이 순서대로 진행하면 됩니다.

---

## 10. 구현 완료 체크리스트 (2025-02)

- [x] Phase 1: `deploy/Dockerfile`, `deploy/.dockerignore` 작성
- [x] Phase 2: `scripts/ec2-docker-setup.sh`, `scripts/docker-deploy.sh` 작성
- [x] Phase 3: `.github/workflows/deploy.yml` Docker 배포로 수정
- [x] Phase 4: `guide/DEPLOYMENT.md` 업데이트
- [ ] EC2에서 `ec2-docker-setup.sh` 실행 (수동 1회)
- [ ] `git push` 후 CI/CD 동작 확인
