#!/bin/bash
# EC2 Docker 원타임 설치 스크립트
# 사용법: ssh -i key.pem ubuntu@EC2_IP "curl -sL https://... | bash"
# 또는: scp scripts/ec2-docker-setup.sh ubuntu@EC2:/tmp/ && ssh ubuntu@EC2 "sudo bash /tmp/ec2-docker-setup.sh"

set -e
echo "=== Docker 설치 ==="
sudo apt-get update -qq
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -qq
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker ubuntu
echo "=== Docker 설치 완료. 로그아웃 후 재로그인 필요 (usermod 적용) ==="
echo "=== 기존 systemd 서비스 비활성화 ==="
sudo systemctl stop odaabnote 2>/dev/null || true
sudo systemctl disable odaabnote 2>/dev/null || true
echo "=== 완료 ==="
