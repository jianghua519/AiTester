# AiTester - 智能化自动化测试平台

## 项目简介

AiTester 是一个基于 Kubernetes 的智能化自动化测试平台，支持 Web、API 和移动端自动化测试，并提供 AI 赋能功能如自然语言生成测试用例和智能失败诊断。

## 项目状态

### 已完成任务

#### ✅ 任务 1.1.1: 搭建本地 Kubernetes 开发集群

**完成日期**: 2026-02-03

**完成内容**:
- 安装 Docker (v29.2.0)
- 安装 kubectl (v1.35.0)
- 安装 Kind (v0.20.0)
- 创建 Kind 集群 (aicd-dev)
- 集群运行 Kubernetes v1.27.3

**验收结果**:
- ✅ `kubectl cluster-info` 成功连接到集群
- ✅ `kubectl get nodes` 显示节点状态为 Ready
- ✅ 所有系统 Pod 正常运行

**文档**:
- [基础架构设计文档](docs/infrastructure/DESIGN_DOC.md)
- [任务 1.1.1 测试报告](tests/evidence/1.1.1/TEST_REPORT.md)

## 项目结构

```
AiTester/
├── backend/                 # 后端微服务
│   ├── auth_service/       # 认证服务 (Go)
│   ├── test_management/    # 测试管理服务 (Python/FastAPI)
│   ├── execution_master/   # 执行主控服务 (Go)
│   └── execution_agent/    # 执行代理 (Python)
├── frontend/                # 前端应用 (React + Vite + TS)
├── docs/                    # 项目文档
│   └── infrastructure/     # 基础架构文档
├── tests/                   # 测试代码和证据
│   └── evidence/           # 测试证据
├── scripts/                 # 自动化脚本
└── requestDocumets/         # 需求文档
```

## 开发环境

### 前置要求

- Docker (v29.2.0+)
- kubectl (v1.27.0+)
- Kind (v0.20.0+)
- Python 3.9+
- Node.js 18+
- Go 1.20+

### 本地集群启动

```bash
# 启动 Kind 集群
kind start cluster --name aicd-dev

# 或者重新创建集群
kind delete cluster --name aicd-dev
kind create cluster --name aicd-dev
```

### 常用命令

```bash
# 查看集群信息
kubectl cluster-info

# 查看节点状态
kubectl get nodes

# 查看所有 Pod
kubectl get pods --all-namespaces

# 查看集群日志
docker logs aicd-dev-control-plane
```

## 开发流程

每个原子任务遵循以下流程：

1. **思考**: 理解任务需求，拆解为可执行的步骤
2. **设计**: 更新或创建设计文档
3. **编码**: 分步骤生成代码（每次不超过 500 行）
4. **测试**: 编写并执行测试，保存证据
5. **文档**: 生成测试报告
6. **提交**: 执行 Git commit（格式: `feat([任务ID]): [任务名称]`）

## 文档索引

### 需求文档
- [README](requestDocumets/README.md) - 项目总体说明
- [必要功能](requestDocumets/necessary_features.md) - 功能需求列表
- [架构设计](requestDocumets/architecture_design.md) - 系统架构设计
- [UI 设计](requestDocumets/ui_design_document.md) - 用户界面设计

### 设计文档
- [存储设计](requestDocumets/storage_design_plan.md) - 存储架构设计
- [组件架构](requestDocumets/component_architecture.png) - 组件架构图
- [系统架构](requestDocumets/system_architecture.png) - 系统架构图
- [信息架构](requestDocumets/information_architecture.png) - 信息架构图
- [数据模型](requestDocumets/data_model.png) - 数据模型图
- [存储架构](requestDocumets/storage_architecture.png) - 存储架构图

### 开发文档
- [任务列表](requestDocumets/hyper-detailed_atomic_task_list.md) - 原子开发任务列表
- [AI 开发者提示词模板](requestDocumets/ai_developer_prompt_template.md) - AI 辅助开发规范

## 开发规范

### 代码规范
- Python: 遵循 PEP 8，使用类型提示，运行在 venv 环境中
- Go: 遵循 Go 官方规范和 golang-lint
- TypeScript: 遵循 Prettier 规范
- 所有依赖必须锁定版本号

### 国际化 (i18n)
- 所有界面文本禁止硬编码
- 使用 i18next 库
- 同时维护中文(zh)、日文(ja)、英文(en)三个语言文件
- 语言文件路径: `public/locales/{lang}/translation.json`

### 测试规范
- 必须为所有实现的功能编写测试用例
- 测试代码与实现代码分开存放
- 保存测试证据（日志或截图）
- 每个任务完成后生成 TEST_REPORT.md

## Git 工作流

### 分支策略
- `master` - 主分支，用于生产环境
- `develop` - 开发分支
- `feature/xxx` - 功能分支

### Commit 规范
```
feat([任务ID]): [任务名称]
fix([模块]): [问题描述]
docs([模块]): [文档更新]
test([模块]): [测试相关]
chore([模块]): [杂项]
```

示例:
- `feat(1.1.1): setup local Kubernetes development cluster with Kind`
- `feat(1.2.3): implement user login API and issue JWT`
- `fix(auth-service): resolve JWT token expiration issue`

## 许可证

Copyright © 2026 AiTester Team. All rights reserved.
