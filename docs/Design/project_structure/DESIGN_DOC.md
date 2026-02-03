# 项目结构设计文档

**版本**: 1.0  
**日期**: 2026-02-03  
**作者**: AI Developer

## 1. 概述

本文档定义了 AiTester 项目的完整目录结构，包括后端微服务、前端应用、基础设施和配置文件的标准化组织方式。

## 2. 整体目录结构

```
AiTester/
├── backend/                    # 后端微服务
│   ├── auth_service/          # Auth Service (Go)
│   ├── test_management/       # Test Management Service (Python/FastAPI)
│   ├── execution_master/      # Execution Master (Go)
│   ├── execution_agent/       # Execution Agent (Python)
│   ├── ai_service/            # AI Service (Python/FastAPI)
│   ├── notification_service/  # Notification Service (Go)
│   └── integration_service/   # Integration Service (Python/FastAPI)
├── frontend/                  # 前端应用 (React + Vite + TS)
├── docs/                      # 项目文档
│   ├── infrastructure/        # 基础架构文档
│   ├── api/                   # API 文档
│   └── deployment/            # 部署文档
├── tests/                     # 测试代码
│   ├── backend/              # 后端测试
│   ├── frontend/             # 前端测试
│   ├── integration/          # 集成测试
│   └── evidence/             # 测试证据
├── scripts/                   # 自动化脚本
│   ├── install/              # 安装脚本
│   ├── deploy/               # 部署脚本
│   └── utils/                # 工具脚本
├── config/                    # 配置文件
│   ├── k8s/                  # Kubernetes 配置
│   ├── docker/               # Docker 配置
│   └── nginx/                # Nginx 配置
├── requestDocumets/           # 需求文档
├── .github/                   # GitHub 配置
│   └── workflows/            # GitHub Actions
├── .gitignore
└── README.md
```

## 3. 后端微服务结构

### 3.1 通用微服务结构

每个后端微服务遵循以下标准结构：

```
<service_name>/
├── cmd/                    # 应用入口
│   └── server/            # 主程序入口
├── internal/              # 内部代码（不对外暴露）
│   ├── api/               # API 层
│   ├── service/           # 业务逻辑层
│   ├── repository/        # 数据访问层
│   ├── model/             # 数据模型
│   └── middleware/        # 中间件
├── pkg/                   # 公共库（可被外部导入）
│   ├── config/           # 配置管理
│   ├── logger/            # 日志
│   └── utils/             # 工具函数
├── tests/                 # 测试代码
│   ├── unit/             # 单元测试
│   ├── integration/      # 集成测试
│   └── mock/             # Mock 数据
├── configs/               # 配置文件
│   ├── config.yaml       # 应用配置
│   └── config.dev.yaml   # 开发环境配置
├── Dockerfile             # Docker 镜像构建文件
├── go.mod                 # Go 模块定义（Go 服务）
├── requirements.txt       # Python 依赖（Python 服务）
├── pytest.ini            # pytest 配置（Python 服务）
├── .prettierrc            # Prettier 配置
└── README.md             # 服务说明文档
```

### 3.2 微服务技术栈

| 服务名称 | 语言/框架 | 端口 | 说明 |
|---------|----------|------|------|
| auth_service | Go + Gin | 8001 | 用户认证和授权 |
| test_management | Python + FastAPI | 8002 | 测试资产管理 |
| execution_master | Go + gRPC | 8003 | 测试任务调度 |
| execution_agent | Python + gRPC | - | 测试执行节点 |
| ai_service | Python + FastAPI | 8004 | AI 功能 |
| notification_service | Go + NATS | 8005 | 通知发送 |
| integration_service | Python + FastAPI | 8006 | 第三方集成 |

## 4. 前端应用结构

```
frontend/
├── public/               # 静态资源
│   ├── locales/         # 国际化文件
│   │   ├── en/
│   │   │   └── translation.json
│   │   ├── zh/
│   │   │   └── translation.json
│   │   └── ja/
│   │       └── translation.json
│   └── favicon.ico
├── src/
│   ├── assets/          # 资源文件
│   │   ├── images/
│   │   ├── styles/
│   │   └── fonts/
│   ├── components/      # React 组件
│   │   ├── common/      # 通用组件
│   │   ├── layout/      # 布局组件
│   │   └── forms/       # 表单组件
│   ├── pages/           # 页面组件
│   │   ├── auth/        # 认证相关页面
│   │   ├── dashboard/   # 仪表盘
│   │   ├── testcases/   # 测试用例
│   │   ├── testplans/   # 测试计划
│   │   └── testruns/    # 测试运行
│   ├── services/        # API 服务
│   │   └── api.ts
│   ├── store/           # 状态管理（Redux/Zustand）
│   ├── hooks/           # 自定义 Hooks
│   ├── utils/           # 工具函数
│   ├── types/           # TypeScript 类型定义
│   ├── App.tsx          # 根组件
│   └── main.tsx         # 应用入口
├── tests/               # 测试代码
│   ├── unit/           # 单元测试
│   └── integration/    # 集成测试
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .eslintrc.cjs
├── .prettierrc
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## 5. 配置管理

### 5.1 Kubernetes 配置

```
config/k8s/
├── base/                  # 基础配置
│   ├── namespace.yaml
│   ├── postgres/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── pvc.yaml
│   ├── redis/
│   └── minio/
├── services/             # 微服务配置
│   ├── auth_service/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── configmap.yaml
│   ├── test_management/
│   └── ...
└── ingress/               # Ingress 配置
    └── ingress.yaml
```

### 5.2 Docker 配置

```
config/docker/
├── docker-compose.dev.yaml    # 开发环境 Docker Compose
└── docker-compose.prod.yaml   # 生产环境 Docker Compose
```

## 6. 文档结构

```
docs/
├── infrastructure/        # 基础架构文档
│   ├── DESIGN_DOC.md
│   └── setup_guide.md
├── api/                   # API 文档
│   ├── auth_service.md
│   ├── test_management.md
│   └── execution_master.md
└── deployment/            # 部署文档
    ├── development.md
    ├── staging.md
    └── production.md
```

## 7. 命名规范

### 7.1 文件命名

- Go 文件：使用蛇形命名法（snake_case），如 `user_service.go`
- Python 文件：使用蛇形命名法，如 `user_repository.py`
- TypeScript/React 文件：使用帕斯卡命名法（PascalCase），如 `UserService.ts`、`UserProfile.tsx`
- 配置文件：使用小写，如 `config.yaml`

### 7.2 目录命名

- 所有目录使用小写和下划线，如 `user_management/`
- 测试目录统一使用 `tests/`

### 7.3 Git 分支命名

- 功能分支：`feature/功能描述`
- 修复分支：`fix/问题描述`
- 发布分支：`release/版本号`

## 8. 代码规范

### 8.1 Go 代码规范

- 遵循 [Effective Go](https://golang.org/doc/effective_go)
- 使用 `gofmt` 格式化代码
- 使用 `golint` 进行代码检查
- 包名使用小写单词

### 8.2 Python 代码规范

- 遵循 PEP 8
- 使用 `flake8` 进行代码检查
- 使用 `black` 进行代码格式化
- 必须包含类型提示（Type Hints）
- 必须在虚拟环境中运行

### 8.3 TypeScript/React 代码规范

- 遵循 [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- 使用 Prettier 进行代码格式化
- 使用 ESLint 进行代码检查
- 所有组件必须有 PropTypes 或 TypeScript 类型

## 9. 环境配置

### 9.1 环境变量

所有环境变量存储在 `.env` 文件中（不提交到 Git），`.env.example` 作为模板提供：

```env
# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/aicd
REDIS_URL=redis://localhost:6379
MINIO_ENDPOINT=localhost:9000

# 服务配置
AUTH_SERVICE_PORT=8001
TEST_MANAGEMENT_PORT=8002
EXECUTION_MASTER_PORT=8003
AI_SERVICE_PORT=8004
NOTIFICATION_SERVICE_PORT=8005
INTEGRATION_SERVICE_PORT=8006

# JWT 配置
JWT_SECRET=your-secret-key
JWT_EXPIRATION=24h

# LLM 配置
OPENAI_API_KEY=sk-xxx
OLLAMA_BASE_URL=http://localhost:11434

# 第三方集成
JIRA_URL=https://your-jira.atlassian.net
JIRA_USERNAME=your-email
JIRA_API_TOKEN=your-token
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx
```

## 10. 总结

本设计文档定义了项目的完整目录结构和编码规范，确保：
- 代码组织清晰、易于维护
- 微服务之间解耦、独立开发
- 前后端分离、各司其职
- 配置集中管理、环境隔离
- 文档完善、便于协作

遵循本设计文档可以确保项目的可维护性和可扩展性。
