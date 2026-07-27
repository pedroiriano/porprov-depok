#!/bin/sh
apk add --no-cache openssh-client sshpass
export SSHPASS='@#Mn4rgonda54'
sshpass -e ssh -o StrictHostKeyChecking=no diskominfo@10.11.5.80 << 'EOF'
echo '@#Mn4rgonda54' | sudo -S apt-get update
echo '@#Mn4rgonda54' | sudo -S DEBIAN_FRONTEND=noninteractive apt-get install -y git curl ufw
curl -fsSL https://get.docker.com -o get-docker.sh
echo '@#Mn4rgonda54' | sudo -S sh get-docker.sh
echo '@#Mn4rgonda54' | sudo -S usermod -aG docker diskominfo
echo '@#Mn4rgonda54' | sudo -S ufw allow 22/tcp
echo '@#Mn4rgonda54' | sudo -S ufw allow 80/tcp
echo '@#Mn4rgonda54' | sudo -S ufw allow 443/tcp
echo '@#Mn4rgonda54' | sudo -S ufw allow 3000/tcp
echo '@#Mn4rgonda54' | sudo -S ufw allow 5173/tcp
echo '@#Mn4rgonda54' | sudo -S ufw --force enable
EOF
