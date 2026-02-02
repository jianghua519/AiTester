#!/bin/bash
set -e

echo "=== 安装 Docker ==="
# 安装 Docker
if ! command -v docker &> /dev/null; then
    echo "Docker 未安装，开始安装..."

    # 更新包索引
    sudo apt-get update

    # 安装依赖
    sudo apt-get install -y \
        ca-certificates \
        curl \
        gnupg \
        lsb-release

    # 添加 Docker 官方 GPG 密钥
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

    # 设置 Docker 仓库
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
        $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    # 安装 Docker
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # 将当前用户添加到 docker 组
    sudo usermod -aG docker $USER

    echo "Docker 安装完成！"
    echo "请运行: newgrp docker 或注销并重新登录以使组更改生效"
else
    echo "Docker 已安装: $(docker --version)"
fi

echo ""
echo "=== 安装 kubectl ==="
if ! command -v kubectl &> /dev/null; then
    echo "kubectl 未安装，开始安装..."

    # 下载最新稳定版 kubectl
    curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

    # 安装 kubectl
    sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

    # 验证安装
    kubectl version --client

    echo "kubectl 安装完成！"
else
    echo "kubectl 已安装: $(kubectl version --client --short)"
fi

echo ""
echo "=== 安装 Kind ==="
if ! command -v kind &> /dev/null; then
    echo "Kind 未安装，开始安装..."

    # 下载 Kind 二进制文件
    curl -Lo ./kind "https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64"
    chmod +x ./kind
    sudo mv ./kind /usr/local/bin/kind

    # 验证安装
    kind version

    echo "Kind 安装完成！"
else
    echo "Kind 已安装: $(kind version)"
fi

echo ""
echo "=== 所有工具安装完成！==="
echo "请运行以下命令以激活 docker 组（如果需要）："
echo "  newgrp docker"
echo ""
echo "然后运行以下命令创建 Kubernetes 集群："
echo "  kind create cluster --name aicd-dev"
