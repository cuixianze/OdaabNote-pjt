#!/bin/bash
# EC2에서 실행: Docker 이미지 빌드 후 컨테이너 재시작
# CI/CD 또는 수동 배포 시 사용

set -e
cd /var/www/odaabnote

echo "=== systemd 서비스 중지 (포트 8080 확보) ==="
sudo systemctl stop odaabnote 2>/dev/null || true
sudo systemctl disable odaabnote 2>/dev/null || true

echo "=== 기존 컨테이너 중지/제거 ==="
sudo docker stop odaabnote-backend 2>/dev/null || true
sudo docker rm odaabnote-backend 2>/dev/null || true

echo "=== Docker 미사용 이미지·빌드캐시 정리 (디스크 공간 확보) ==="
sudo docker image prune -af 2>/dev/null || true
sudo docker builder prune -af 2>/dev/null || true

echo "=== Docker 이미지 빌드 ==="
sudo docker build -t odaabnote-backend:latest .

echo "=== 새 컨테이너 실행 (restart: always) ==="
sudo docker run -d \
  --name odaabnote-backend \
  --restart always \
  -p 8080:8080 \
  --env-file /var/www/odaabnote/.env \
  -v /var/www/odaabnote/google-vision-key.json:/app/google-vision-key.json:ro \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e GOOGLE_APPLICATION_CREDENTIALS=/app/google-vision-key.json \
  odaabnote-backend:latest

echo "=== 배포 완료 ==="
sudo docker ps | grep odaabnote-backend
