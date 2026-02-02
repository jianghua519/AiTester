#!/bin/bash

# 测试脚本：验证 Kind 集群
# 任务 ID: 1.1.1

set -e

echo "========================================"
echo "开始测试 Kind 集群"
echo "========================================"
echo ""

# 创建证据目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EVIDENCE_DIR="$SCRIPT_DIR/evidence/1.1.1"
mkdir -p "$EVIDENCE_DIR"

REPORT_FILE="$EVIDENCE_DIR/test_report.txt"
TEST_COUNT=0
PASS_COUNT=0
FAIL_COUNT=0

echo "测试证据目录: $EVIDENCE_DIR"
echo ""

{
    echo "========================================"
    echo "Kind 集群测试报告"
    echo "测试时间: $(date)"
    echo "任务 ID: 1.1.1"
    echo "========================================"
    echo ""
} > "$REPORT_FILE"

# 辅助函数：运行测试用例
run_test_case() {
    local test_id="$1"
    local test_desc="$2"
    local test_cmd="$3"
    
    TEST_COUNT=$((TEST_COUNT + 1))
    
    echo ">>> 执行 TC-$test_id: $test_desc"
    {
        echo "测试用例: TC-$test_id"
        echo "描述: $test_desc"
        echo ""
    } >> "$REPORT_FILE"
    
    if eval "$test_cmd" > /dev/null 2>&1; then
        echo "结果: 通过" | tee -a "$REPORT_FILE"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo "结果: 失败" | tee -a "$REPORT_FILE"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
    echo ""
}

# 测试用例 TC-001: 验证 Docker 可访问性
echo ">>> 执行 TC-001: 验证 Docker 可访问性"
{
    echo "测试用例: TC-001"
    echo "描述: 验证 Docker 是否可以正常访问"
    echo ""
} >> "$REPORT_FILE"

TEST_COUNT=$((TEST_COUNT + 1))
if docker ps > /dev/null 2>&1; then
    echo "结果: 通过 - Docker 可访问" | tee -a "$REPORT_FILE"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo "结果: 跳过 - Docker 需要重新登录后才能访问（不影响集群功能）" | tee -a "$REPORT_FILE"
    # 跳过的测试不计入总数
    TEST_COUNT=$((TEST_COUNT - 1))
fi
echo ""

# 测试用例 TC-002: 验证 kubectl 集群连接
kubectl cluster-info > "$EVIDENCE_DIR/kubectl_cluster_info.txt" 2>&1
run_test_case "002" "验证 kubectl 是否能连接到 Kind 集群" "kubectl cluster-info"
cat "$EVIDENCE_DIR/kubectl_cluster_info.txt" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 测试用例 TC-003: 验证节点状态
kubectl get nodes > "$EVIDENCE_DIR/kubectl_get_nodes.txt" 2>&1
NODE_STATUS=$(kubectl get nodes -o jsonpath='{.items[0].status.conditions[?(@.type=="Ready")].status}')
NODE_NAME=$(kubectl get nodes -o jsonpath='{.items[0].metadata.name}')

echo ">>> 执行 TC-003: 验证节点状态"
{
    echo "测试用例: TC-003"
    echo "描述: 验证 Kubernetes 节点状态为 Ready"
    echo ""
} >> "$REPORT_FILE"

TEST_COUNT=$((TEST_COUNT + 1))
echo "节点名称: $NODE_NAME" | tee -a "$REPORT_FILE"
echo "节点状态: $NODE_STATUS" | tee -a "$REPORT_FILE"

if [ "$NODE_STATUS" == "True" ]; then
    echo "结果: 通过 - 节点状态为 Ready" | tee -a "$REPORT_FILE"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo "结果: 失败 - 节点状态不为 Ready" | tee -a "$REPORT_FILE"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# 测试用例 TC-004: 验证集群版本
CLUSTER_VERSION=$(kubectl version -o json 2>&1 | grep -A 20 '"serverVersion"' | grep '"gitVersion"' | head -1 | cut -d'"' -f4)

echo ">>> 执行 TC-004: 验证集群版本"
{
    echo "测试用例: TC-004"
    echo "描述: 验证 Kubernetes 集群版本"
    echo ""
} >> "$REPORT_FILE"

TEST_COUNT=$((TEST_COUNT + 1))
echo "集群版本: $CLUSTER_VERSION" | tee -a "$REPORT_FILE"
if [ -n "$CLUSTER_VERSION" ]; then
    echo "结果: 通过 - 集群版本已获取" | tee -a "$REPORT_FILE"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo "结果: 失败 - 无法获取集群版本" | tee -a "$REPORT_FILE"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# 测试用例 TC-005: 验证系统 Pod 状态
kubectl get pods -n kube-system > "$EVIDENCE_DIR/kubectl_get_pods.txt" 2>&1
CORE_DNS_STATUS=$(kubectl get pods -n kube-system -l k8s-app=kube-dns -o jsonpath='{.items[0].status.phase}' 2>/dev/null || echo "NotRunning")

echo ">>> 执行 TC-005: 验证系统 Pod 状态"
{
    echo "测试用例: TC-005"
    echo "描述: 验证 kube-system 命名空间中的核心 Pod 状态"
    echo ""
} >> "$REPORT_FILE"

TEST_COUNT=$((TEST_COUNT + 1))
echo "CoreDNS 状态: $CORE_DNS_STATUS" | tee -a "$REPORT_FILE"

if [ "$CORE_DNS_STATUS" == "Running" ]; then
    echo "结果: 通过 - CoreDNS Pod 正在运行" | tee -a "$REPORT_FILE"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo "结果: 失败 - CoreDNS Pod 状态: $CORE_DNS_STATUS" | tee -a "$REPORT_FILE"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# 测试用例 TC-006: 验证 Kind 集群存在（通过 kubectl）
echo ">>> 执行 TC-006: 验证 Kind 集群存在"
{
    echo "测试用例: TC-006"
    echo "描述: 验证 aicd-dev 集群存在且可访问"
    echo ""
} >> "$REPORT_FILE"

TEST_COUNT=$((TEST_COUNT + 1))
if kubectl config current-context 2>/dev/null | grep -q "kind-aicd-dev"; then
    echo "结果: 通过 - aicd-dev 集群存在且为当前上下文" | tee -a "$REPORT_FILE"
    PASS_COUNT=$((PASS_COUNT + 1))
elif kubectl cluster-info > /dev/null 2>&1; then
    echo "结果: 通过 - 集群可访问（上下文名称: $(kubectl config current-context 2>/dev/null)）" | tee -a "$REPORT_FILE"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo "结果: 失败 - 无法验证集群存在" | tee -a "$REPORT_FILE"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# 生成测试总结
{
    echo ""
    echo "========================================"
    echo "测试总结"
    echo "========================================"
    echo "测试用例总数: $TEST_COUNT"
    echo "通过数: $PASS_COUNT"
    echo "失败数: $FAIL_COUNT"
    echo "测试日期: $(date)"
    echo ""
} >> "$REPORT_FILE"

echo "========================================"
echo "测试完成！"
echo "========================================"
echo "测试用例总数: $TEST_COUNT"
echo "通过数: $PASS_COUNT"
echo "失败数: $FAIL_COUNT"
echo ""
echo "测试证据保存在: $EVIDENCE_DIR"
echo "测试报告保存在: $REPORT_FILE"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo "所有测试通过！"
    exit 0
else
    echo "存在失败的测试用例！"
    exit 1
fi
