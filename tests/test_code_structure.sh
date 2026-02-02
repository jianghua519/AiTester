#!/bin/bash

# 测试脚本：验证项目代码结构
# 任务 ID: 1.1.2

set -e

echo "========================================"
echo "开始测试项目代码结构"
echo "========================================"
echo ""

# 创建证据目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EVIDENCE_DIR="$SCRIPT_DIR/evidence/1.1.2"
mkdir -p "$EVIDENCE_DIR"

REPORT_FILE="$EVIDENCE_DIR/test_report.txt"
TEST_COUNT=0
PASS_COUNT=0
FAIL_COUNT=0

echo "测试证据目录: $EVIDENCE_DIR"

{
    echo "========================================"
    echo "项目代码结构测试报告"
    echo "测试时间: $(date)"
    echo "任务 ID: 1.1.2"
    echo "========================================"
    echo ""
} > "$REPORT_FILE"

# 测试用例 TC-001: 验证 backend 目录存在
echo ">>> 执行 TC-001: backend 目录存在"
{
    echo "测试用例: TC-001"
    echo "描述: backend 目录存在"
    echo ""
} >> "$REPORT_FILE"
TEST_COUNT=$((TEST_COUNT + 1))
if [ -d "backend" ]; then
    echo "结果: 通过" | tee -a "$REPORT_FILE"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo "结果: 失败" | tee -a "$REPORT_FILE"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# 测试用例 TC-002: 验证 frontend 目录存在
echo ">>> 执行 TC-002: frontend 目录存在"
{
    echo "测试用例: TC-002"
    echo "描述: frontend 目录存在"
    echo ""
} >> "$REPORT_FILE"
TEST_COUNT=$((TEST_COUNT + 1))
if [ -d "frontend" ]; then
    echo "结果: 通过" | tee -a "$REPORT_FILE"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo "结果: 失败" | tee -a "$REPORT_FILE"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# 测试用例 TC-003: 验证所有后端微服务目录存在
echo ">>> 执行 TC-003: 所有后端微服务目录存在"
{
    echo "测试用例: TC-003"
    echo "描述: 所有后端微服务目录存在"
    echo ""
} >> "$REPORT_FILE"
TEST_COUNT=$((TEST_COUNT + 1))
ALL_BACKEND_SERVICES="auth_service test_management execution_master execution_agent ai_service notification_service integration_service"
ALL_EXISTS=true
for service in $ALL_BACKEND_SERVICES; do
    if [ ! -d "backend/$service" ]; then
        echo "缺失服务: $service" | tee -a "$REPORT_FILE"
        ALL_EXISTS=false
    fi
done
if [ "$ALL_EXISTS" = true ]; then
    echo "结果: 通过 - 所有 7 个微服务目录都存在" | tee -a "$REPORT_FILE"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo "结果: 失败" | tee -a "$REPORT_FILE"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# 测试用例 TC-004: 验证前端项目配置文件存在
echo ">>> 执行 TC-004: 前端项目配置文件存在"
{
    echo "测试用例: TC-004"
    echo "描述: 前端项目配置文件存在"
    echo ""
} >> "$REPORT_FILE"
TEST_COUNT=$((TEST_COUNT + 1))
REQUIRED_FILES="package.json tsconfig.json vite.config.ts tailwind.config.js"
ALL_FILES_EXIST=true
for file in $REQUIRED_FILES; do
    if [ ! -f "frontend/$file" ]; then
        echo "缺失文件: frontend/$file" | tee -a "$REPORT_FILE"
        ALL_FILES_EXIST=false
    fi
done
if [ "$ALL_FILES_EXIST" = true ]; then
    echo "结果: 通过" | tee -a "$REPORT_FILE"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo "结果: 失败" | tee -a "$REPORT_FILE"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# 测试用例 TC-005: 验证 Git 提交
echo ">>> 执行 TC-005: Git 提交存在"
{
    echo "测试用例: TC-005"
    echo "描述: Git 提交存在"
    echo ""
} >> "$REPORT_FILE"
TEST_COUNT=$((TEST_COUNT + 1))
if git log --oneline | grep -q "feat(1.1.2):"; then
    echo "结果: 通过" | tee -a "$REPORT_FILE"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo "结果: 失败" | tee -a "$REPORT_FILE"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo ""

# 测试用例 TC-006: 验证远程仓库
echo ">>> 执行 TC-006: 远程仓库已配置"
{
    echo "测试用例: TC-006"
    echo "描述: 远程仓库已配置"
    echo ""
} >> "$REPORT_FILE"
TEST_COUNT=$((TEST_COUNT + 1))
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")
if [ -n "$REMOTE_URL" ]; then
    echo "结果: 通过 - $REMOTE_URL" | tee -a "$REPORT_FILE"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo "结果: 失败" | tee -a "$REPORT_FILE"
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
