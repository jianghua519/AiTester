# PostgreSQL 服务部署设计文档

**版本**: 1.0  
**日期**: 2026-02-03  
**作者**: AI Developer

## 1. 概述

本模块负责在本地 Kubernetes 开发集群中部署和管理 PostgreSQL 数据库服务。PostgreSQL 作为核心数据存储，将用于存储用户信息、项目数据、测试用例、测试执行结果等关键业务数据。

### 1.1 目标

- 部署单实例 PostgreSQL 数据库服务
- 配置持久化存储确保数据安全
- 通过 Kubernetes Secret 管理数据库凭据
- 提供稳定的数据库连接和服务发现

### 1.2 范围

- PostgreSQL 数据库部署
- 持久卷配置和管理
- 数据库 Secret 配置
- Service 和 Ingress 配置
- 数据库备份和恢复策略

## 2. 技术选型

### 2.1 PostgreSQL

**选择原因**:
- 开源关系型数据库，功能强大
- 支持复杂查询和事务
- 良好的扩展性和性能
- 活跃的社区支持
- 完整的 JSON 支持

**版本**: 15.3 (稳定版本)

### 2.2 存储方案

**选择原因**:
- 使用 PersistentVolume 确保数据持久化
- 支持数据在 Pod 重启后不丢失
- 适合开发环境的数据存储需求

### 2.3 配置管理

**选择原因**:
- Kubernetes Secrets 确保敏感信息安全
- 配置与代码分离
- 便于环境切换和配置管理

## 3. 部署架构

### 3.1 组件架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │     Service     │    │     Ingress     │
│   StatefulSet   │◄──►│   ClusterIP     │    │    (可选)       │
│     Pod         │    │                 │    │                 │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │                 │    │                 │
│ │ Persistent  │ │    │                 │    │                 │
│ │ Volume      │ │    │                 │    │                 │
│ └─────────────┘ │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                │
                    ┌─────────────────┐
                    │   Kubernetes    │
                    │   Namespace     │
                    │   aicd-dev      │
                    └─────────────────┘
```

### 3.2 数据模型

主要数据表：
- `users` - 用户信息
- `roles` - 角色信息
- `projects` - 项目信息
- `user_project_mapping` - 用户项目关联
- `test_cases` - 测试用例
- `test_suites` - 测试套件
- `test_plans` - 测试计划
- `test_runs` - 测试运行记录
- `run_results` - 运行结果详情

## 4. 配置详情

### 4.1 数据库配置

```yaml
# 主要配置参数
postgresql:
  postgresqlDatabase: aicd_dev
  postgresqlUsername: aicd_user
  postgresqlPassword: ${POSTGRES_PASSWORD}
  postgresqlPort: 5432
  persistence:
    enabled: true
    size: 8Gi
    storageClass: standard
```

### 4.2 资源配置

```yaml
# 资源限制
resources:
  limits:
    cpu: 500m
    memory: 1Gi
  requests:
    cpu: 250m
    memory: 512Mi
```

### 4.3 网络配置

```yaml
# Service 配置
service:
  name: postgresql-service
  port: 5432
  targetPort: 5432
  type: ClusterIP
```

## 5. 部署流程

### 5.1 部署步骤

1. 创建数据库 Secret
2. 创建 PersistentVolumeClaim
3. 部署 PostgreSQL StatefulSet
4. 创建 Service
5. 验证部署状态

### 5.2 配置文件结构

```
k8s/
├── database/
│   ├── postgresql-secret.yaml    # 数据库凭据
│   ├── postgresql-pvc.yaml       # 持久卷声明
│   ├── postgresql-statefulset.yaml # StatefulSet 配置
│   ├── postgresql-service.yaml    # Service 配置
│   └── postgresql-configmap.yaml # 配置映射
└── namespace.yaml               # 命名空间配置
```

## 6. 安全考虑

### 6.1 访问控制

- 使用 Kubernetes Secret 管理数据库密码
- 限制数据库访问来源
- 定期更新密码

### 6.2 数据安全

- 启用 SSL/TLS 连接（生产环境）
- 定期备份数据
- 数据加密存储

## 7. 监控和维护

### 7.1 健康检查

- 就绪探针：检查数据库服务是否就绪
- 存活探针：检查数据库进程是否存活

### 7.2 日志管理

- 集成 Kubernetes 日志收集
- 数据库错误日志监控
- 性能指标监控

### 7.3 备份策略

- 定期数据备份
- 备份数据加密存储
- 备份恢复测试

## 8. 相关资源

- PostgreSQL 官方文档: https://www.postgresql.org/docs/
- Kubernetes StatefulSet: https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/
- Kubernetes Secrets: https://kubernetes.io/docs/concepts/configuration/secret/