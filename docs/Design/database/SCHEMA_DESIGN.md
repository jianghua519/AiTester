# 数据库表结构设计文档

**版本**: 1.0  
**日期**: 2026-02-03  
**作者**: AI Developer

## 1. 概述

本文档详细描述了测试自动化平台的数据库表结构设计，包括用户、角色、项目等核心业务实体的数据模型。设计遵循关系数据库的最佳实践，确保数据的完整性、一致性和可扩展性。

## 2. 数据模型分析

### 2.1 业务需求分析

根据任务描述，我们需要实现以下核心功能：

1. **用户管理**：用户注册、登录、个人信息管理
2. **角色管理**：角色定义、权限分配
3. **项目管理**：项目创建、编辑、删除、成员管理
4. **测试资产管理**：测试用例、测试套件、测试计划
5. **执行管理**：测试执行、结果记录

### 2.2 核心实体关系

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    users    │    │    roles    │    │  projects   │
│             │    │             │    │             │
│ id (PK)     │    │ id (PK)     │    │ id (PK)     │
│ username    │    │ name        │    │ name        │
│ email       │    │ description │    │ description │
│ password    │    │ permissions │    │ status      │
│ created_at  │    │ created_at  │    │ created_at  │
│ updated_at  │    │ updated_at  │    │ updated_at  │
└─────────────┘    └─────────────┘    └─────────────┘
       │                    │                    │
       │                    │                    │
       └────────┬───────────┘                    │
                │                                │
┌───────────────────────────────────────────────┐
│ user_project_mapping                          │
│                                               │
│ id (PK)                                       │
│ user_id (FK)                                  │
│ project_id (FK)                               │
│ role_id (FK)                                  │
│ joined_at                                     │
│                                               │
│ 用户-项目-角色关联表                           │
└───────────────────────────────────────────────┘
```

## 3. 表结构设计

### 3.1 users 表

**功能**：存储用户基本信息

| 字段名 | 类型 | 约束 | 描述 |
|--------|------|------|------|
| id | SERIAL PRIMARY KEY | 主键 | 用户唯一标识符 |
| username | VARCHAR(50) UNIQUE NOT NULL | 唯一约束 | 用户名 |
| email | VARCHAR(255) UNIQUE NOT NULL | 唯一约束 | 邮箱地址 |
| password_hash | VARCHAR(255) NOT NULL | 非空 | 密码哈希值 |
| full_name | VARCHAR(100) | 可空 | 用户全名 |
| avatar_url | VARCHAR(500) | 可空 | 头像URL |
| is_active | BOOLEAN DEFAULT TRUE | 默认值 | 用户是否激活 |
| created_at | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | 默认值 | 创建时间 |
| updated_at | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | 默认值 | 更新时间 |

### 3.2 roles 表

**功能**：存储角色定义和权限信息

| 字段名 | 类型 | 约束 | 描述 |
|--------|------|------|------|
| id | SERIAL PRIMARY KEY | 主键 | 角色唯一标识符 |
| name | VARCHAR(50) UNIQUE NOT NULL | 唯一约束 | 角色名称 |
| description | TEXT | 可空 | 角色描述 |
| permissions | JSONB | 可空 | 权限配置 |
| created_at | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | 默认值 | 创建时间 |
| updated_at | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | 默认值 | 更新时间 |

### 3.3 projects 表

**功能**：存储项目信息

| 字段名 | 类型 | 约束 | 描述 |
|--------|------|------|------|
| id | SERIAL PRIMARY KEY | 主键 | 项目唯一标识符 |
| name | VARCHAR(100) NOT NULL | 非空 | 项目名称 |
| description | TEXT | 可空 | 项目描述 |
| status | VARCHAR(20) DEFAULT 'active' | 默认值 | 项目状态 |
| created_by | INTEGER NOT NULL | 外键 | 创建者ID |
| created_at | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | 默认值 | 创建时间 |
| updated_at | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | 默认值 | 更新时间 |

### 3.4 user_project_mapping 表

**功能**：用户-项目关联关系表

| 字段名 | 类型 | 约束 | 描述 |
|--------|------|------|------|
| id | SERIAL PRIMARY KEY | 主键 | 关联记录ID |
| user_id | INTEGER NOT NULL | 外键 | 用户ID |
| project_id | INTEGER NOT NULL | 外键 | 项目ID |
| role_id | INTEGER NOT NULL | 外键 | 角色ID |
| joined_at | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | 默认值 | 加入时间 |
| is_active | BOOLEAN DEFAULT TRUE | 默认值 | 是否活跃 |

## 4. 外键关系

### 4.1 外键约束

```sql
-- user_project_mapping 表的外键约束
ALTER TABLE user_project_mapping 
ADD CONSTRAINT fk_upm_user 
FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE user_project_mapping 
ADD CONSTRAINT fk_upm_project 
FOREIGN KEY (project_id) REFERENCES projects(id);

ALTER TABLE user_project_mapping 
ADD CONSTRAINT fk_upm_role 
FOREIGN KEY (role_id) REFERENCES roles(id);

-- projects 表的外键约束
ALTER TABLE projects 
ADD CONSTRAINT fk_projects_creator 
FOREIGN KEY (created_by) REFERENCES users(id);
```

### 4.2 索引设计

```sql
-- 主要索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_upm_user_project ON user_project_mapping(user_id, project_id);
CREATE INDEX idx_upm_role ON user_project_mapping(role_id);
```

## 5. 数据完整性

### 5.1 唯一性约束

- 用户邮箱唯一
- 用户名唯一
- 角色名称唯一
- 用户在同一项目中的角色唯一

### 5.2 数据验证

- 邮箱格式验证
- 密码强度验证
- 用户名格式验证
- 项目状态枚举验证

## 6. 性能优化

### 6.1 查询优化

- 为常用查询字段创建索引
- 使用适当的字段类型
- 避免过度索引

### 6.2 分区策略

- 考虑对大型表进行分区
- 按时间范围分区

## 7. 安全考虑

### 7.1 数据加密

- 密码使用 bcrypt 哈希
- 敏感字段考虑加密存储

### 7.2 访问控制

- 基于角色的访问控制
- 数据行级安全策略

## 8. 扩展性设计

### 8.1 未来扩展

- 支持多租户架构
- 支持审计日志
- 支持软删除

### 8.2 版本控制

- 使用数据库迁移管理版本
- 保持向后兼容性