# CI 流水线设计文档

**版本**: 1.0  
**日期**: 2026-02-03  
**作者**: AI Developer

## 1. 概述

本文档描述了基于 GitHub Actions 的基础 CI 流水线设计，用于自动化代码质量检查和单元测试。该流水线将在代码提交时触发，确保代码质量和功能正确性。

## 2. CI 流水线架构

### 2.1 触发条件

- **Push 事件**: 推送到 `main` 和 `develop` 分支
- **Pull Request 事件**: 针对 `main` 和 `develop` 分支的 PR
- **手动触发**: 通过 GitHub Actions UI 手动触发

### 2.2 流水线阶段

```yaml
stages:
  - lint: 代码风格检查
  - test: 单元测试
  - build: 构建和打包
```

### 2.3 服务支持

- **Go 服务**: auth_service, execution_master, notification_service
- **Python 服务**: test_management, execution_agent, ai_service, integration_service
- **前端项目**: React + TypeScript + Vite

## 3. 代码风格检查

### 3.1 Go 服务

使用 `golangci-lint` 进行代码风格检查：

```yaml
- name: Go Lint
  uses: golangci/golangci-lint-action@v3
  with:
    version: latest
    args: --timeout=5m
```

### 3.2 Python 服务

使用 `flake8` 和 `black` 进行代码风格检查：

```yaml
- name: Python Lint
  run: |
    pip install flake8 black
    flake8 .
    black --check .
```

### 3.3 前端项目

使用 `ESLint` 进行代码风格检查：

```yaml
- name: ESLint
  run: npm run lint
```

## 4. 单元测试

### 4.1 Go 服务

使用 `go test` 运行单元测试：

```yaml
- name: Go Test
  run: |
    go test -v ./...
```

### 4.2 Python 服务

使用 `pytest` 运行单元测试：

```yaml
- name: Python Test
  run: |
    python -m pytest tests/ -v
```

### 4.3 前端项目

使用 `vitest` 运行单元测试：

```yaml
- name: Frontend Test
  run: npm run test
```

## 5. 构建和打包

### 5.1 Go 服务

构建 Docker 镜像：

```yaml
- name: Build Go Docker
  run: |
    docker build -t ${GITHUB_REPOSITORY}/${service}:${{ github.sha }} .
```

### 5.2 Python 服务

构建 Docker 镜像：

```yaml
- name: Build Python Docker
  run: |
    docker build -t ${GITHUB_REPOSITORY}/${service}:${{ github.sha }} .
```

### 5.3 前端项目

构建生产版本：

```yaml
- name: Build Frontend
  run: |
    npm run build
```

## 6. 缓存策略

### 6.1 Go 缓存

```yaml
- name: Cache Go modules
  uses: actions/cache@v3
  with:
    path: |
      ~/go/pkg/mod
      ~/.cache/go-build
    key: ${{ runner.os }}-go-${{ hashFiles('**/go.sum') }}
```

### 6.2 Node.js 缓存

```yaml
- name: Cache Node.js modules
  uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

### 6.3 Python 缓存

```yaml
- name: Cache Python modules
  uses: actions/cache@v3
  with:
    path: ~/.cache/pip
    key: ${{ runner.os }}-pip-${{ hashFiles('**/requirements.txt') }}
```

## 7. 环境变量配置

### 7.1 GitHub Secrets

- `DOCKERHUB_USERNAME`: Docker Hub 用户名
- `DOCKERHUB_TOKEN`: Docker Hub 访问令牌
- `POSTGRES_URL`: PostgreSQL 数据库 URL
- `REDIS_URL`: Redis 连接 URL

### 7.2 环境变量

```yaml
env:
  GO_VERSION: '1.20'
  PYTHON_VERSION: '3.9'
  NODE_VERSION: '18'
```

## 8. 工作流程文件

### 8.1 主 CI 流水线

文件位置：`.github/workflows/ci.yml`

包含所有服务的 lint、test 和 build 流程。

### 8.2 PR 检查流水线

文件位置：`.github/workflows/pr-check.yml`

仅在 PR 时运行 lint 和 test，不运行 build。

### 8.3 代码质量报告

文件位置：`.github/workflows/quality-report.yml`

生成代码覆盖率报告和代码质量统计。

## 9. 错误处理和通知

### 9.1 错误处理

- 任何阶段失败都会导致整个流水线失败
- 提供详细的错误日志和步骤信息
- 自动回滚失败的构建

### 9.2 通知

- PR 评论：自动在 PR 中添加构建状态
- Slack 通知：配置 Slack webhook 通知构建结果
- Email 通知：通过 GitHub Actions 发送邮件通知

## 10. 安全考虑

### 10.1 代码安全

- 使用 `Trivy` 进行漏洞扫描
- 检查依赖项安全性
- 扫描 secrets 和敏感信息

### 10.2 构建安全

- 使用官方基础镜像
- 定期更新依赖项
- 限制构建权限

## 11. 性能优化

### 11.1 并行执行

- 并行运行不同服务的 lint 和 test
- 使用矩阵策略构建多版本

### 11.2 增量构建

- 只构建变更的文件和目录
- 使用缓存减少重复工作

## 12. 监控和日志

### 12.1 构建监控

- 构建时间统计
- 失败率监控
- 代码覆盖率追踪

### 12.2 日志管理

- 结构化日志输出
- 日志聚合和分析
- 长期存储和检索

## 13. 扩展性

### 13.1 微服务支持

- 支持添加新的微服务
- 模块化的工作流程设计
- 易于配置和扩展

### 13.2 环境支持

- 支持多环境（dev, staging, prod）
- 环境特定的配置和变量
- 条件执行和分支策略

## 14. 总结

本 CI 流水线设计提供了完整的代码质量保证和自动化测试流程，确保每次代码提交都符合质量标准，并通过自动化测试验证功能正确性。流水线具有良好的扩展性和可维护性，能够适应项目的发展和变化。
