# 测试用例表设计文档
**版本**: 1.0
**修改履历**: 任务 1.3.1

## 1. 概述
测试用例表是平台的核心业务表，用于存储和管理测试用例的基本信息和结构化的测试步骤。每个测试用例属于一个项目，包含标题、描述、标签和具体的测试步骤数组。

## 2. 表结构设计

### 2.1 test_cases 表字段定义

```sql
CREATE TABLE test_cases (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    tags TEXT[],  -- 标签数组，用于分类和筛选
    steps JSONB NOT NULL DEFAULT '[]',  -- 结构化的测试步骤数组
    version INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    estimated_duration INTEGER,  -- 预估执行时间（秒）
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    archived_at TIMESTAMP NULL
);
```

### 2.2 字段详细说明

| 字段名 | 类型 | 约束 | 描述 |
|--------|------|------|------|
| `id` | SERIAL | PRIMARY KEY | 测试用例唯一标识符 |
| `project_id` | INTEGER | NOT NULL, 外键 | 所属项目ID，关联projects表 |
| `name` | VARCHAR(255) | NOT NULL | 测试用例名称 |
| `description` | TEXT | - | 测试用例描述，详细说明测试目的 |
| `tags` | TEXT[] | - | 标签数组，用于分类和筛选 |
| `steps` | JSONB | NOT NULL, DEFAULT '[]' | 结构化的测试步骤数组 |
| `version` | INTEGER | DEFAULT 1 | 版本号，每次更新递增 |
| `status` | VARCHAR(20) | DEFAULT 'draft', CHECK | 状态：draft（草稿）、active（活跃）、archived（归档） |
| `priority` | VARCHAR(20) | DEFAULT 'medium', CHECK | 优先级：low（低）、medium（中）、high（高）、critical（关键） |
| `estimated_duration` | INTEGER | - | 预估执行时间（秒） |
| `created_by` | INTEGER | NOT NULL, 外键 | 创建者ID，关联users表 |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 更新时间 |
| `archived_at` | TIMESTAMP | NULL | 归档时间，NULL表示未归档 |

## 3. steps 字段 JSON 结构设计

### 3.1 测试步骤基本结构

```json
[
  {
    "id": "step_1",
    "type": "action",
    "name": "打开登录页面",
    "description": "导航到登录页面",
    "action": {
      "type": "navigate",
      "url": "https://example.com/login"
    },
    "expected_result": {
      "type": "element_visible",
      "selector": "#login-form"
    },
    "timeout": 10000,
    "retry_count": 3,
    "retry_interval": 2000
  }
]
```

### 3.2 步骤类型定义

#### 3.2.1 Web 操作步骤 (Web Action)

```json
{
  "id": "step_1",
  "type": "action",
  "name": "点击登录按钮",
  "description": "点击页面上的登录按钮",
  "action": {
    "type": "click",
    "selector": "#login-button",
    "frame": null,
    "wait_for_stability": true
  },
  "expected_result": {
    "type": "element_disappeared",
    "selector": "#login-button",
    "timeout": 5000
  },
  "timeout": 10000,
  "retry_count": 2,
  "retry_interval": 1000
}
```

#### 3.2.2 API 请求步骤 (API Request)

```json
{
  "id": "step_2",
  "type": "api",
  "name": "获取用户信息",
  "description": "调用API获取当前用户信息",
  "action": {
    "type": "http",
    "method": "GET",
    "url": "https://api.example.com/users/me",
    "headers": {
      "Authorization": "Bearer {{token}}"
    },
    "timeout": 30000
  },
  "expected_result": {
    "type": "status_code",
    "expected": 200
  },
  "extract_data": {
    "user_id": "$.data.id",
    "user_name": "$.data.name"
  }
}
```

#### 3.2.3 断言步骤 (Assertion)

```json
{
  "id": "step_3",
  "type": "assert",
  "name": "验证用户信息",
  "description": "验证返回的用户信息是否正确",
  "action": {
    "type": "verify",
    "condition": "equals",
    "expected": {
      "id": "{{user_id}}",
      "name": "张三"
    }
  },
  "expected_result": {
    "type": "success"
  }
}
```

### 3.3 步骤通用字段说明

| 字段名 | 类型 | 描述 |
|--------|------|------|
| `id` | String | 步骤唯一标识符 |
| `type` | String | 步骤类型：action（操作）、api（API请求）、assert（断言） |
| `name` | String | 步骤名称，简洁明了 |
| `description` | String | 步骤详细描述 |
| `action` | Object | 执行动作的具体配置 |
| `expected_result` | Object | 期望结果验证配置 |
| `timeout` | Integer | 超时时间（毫秒） |
| `retry_count` | Integer | 重试次数 |
| `retry_interval` | Integer | 重试间隔（毫秒） |
| `extract_data` | Object | 数据提取配置，用于后续步骤 |

## 4. 索引设计

```sql
-- 主表索引
CREATE INDEX idx_test_cases_project_id ON test_cases(project_id);
CREATE INDEX idx_test_cases_status ON test_cases(status);
CREATE INDEX idx_test_cases_priority ON test_cases(priority);
CREATE INDEX idx_test_cases_created_by ON test_cases(created_by);
CREATE INDEX idx_test_cases_created_at ON test_cases(created_at);
CREATE INDEX idx_test_cases_updated_at ON test_cases(updated_at);

-- 复合索引
CREATE INDEX idx_test_cases_project_status ON test_cases(project_id, status);
CREATE INDEX idx_test_cases_project_priority ON test_cases(project_id, priority);

-- 步骤内容索引（JSONB）
CREATE INDEX idx_test_cases_steps_type ON test_cases USING GIN ((steps ->> 'type'));
CREATE INDEX idx_test_cases_steps_action_type ON test_cases USING GIN ((steps -> 'action' ->> 'type'));
CREATE INDEX idx_test_cases_steps_api_method ON test_cases USING GIN (
    CASE 
        WHEN steps @> '[{"type": "api"}]'::jsonb 
        THEN (steps -> 0 -> 'action' ->> 'method')
        ELSE NULL 
    END
);

-- 标签索引
CREATE INDEX idx_test_cases_tags ON test_cases USING GIN(tags);

-- 全文搜索索引
CREATE INDEX idx_test_cases_search ON test_cases USING GIN(
    to_tsvector('chinese', name || ' ' || coalesce(description, ''))
);
```

## 5. 约束和外键

```sql
-- 外键约束
ALTER TABLE test_cases 
ADD CONSTRAINT fk_test_cases_project 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE test_cases 
ADD CONSTRAINT fk_test_cases_created_by 
FOREIGN KEY (created_by) REFERENCES users(id);

-- 状态约束
ALTER TABLE test_cases 
ADD CONSTRAINT chk_test_cases_status 
CHECK (status IN ('draft', 'active', 'archived'));

-- 优先级约束
ALTER TABLE test_cases 
ADD CONSTRAINT chk_test_cases_priority 
CHECK (priority IN ('low', 'medium', 'high', 'critical'));

-- 版本约束
ALTER TABLE test_cases 
ADD CONSTRAINT chk_test_cases_version 
CHECK (version > 0);

-- 同一项目内名称唯一（未归档）
ALTER TABLE test_cases 
ADD CONSTRAINT uq_test_cases_project_name 
UNIQUE (project_id, name) 
WHERE status != 'archived';
```

## 6. 触发器和函数

```sql
-- 更新时间触发器
CREATE TRIGGER update_test_cases_updated_at 
BEFORE UPDATE ON test_cases 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 版本控制触发器
CREATE OR REPLACE FUNCTION test_cases_version_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.status != 'archived' AND NEW.status != 'archived' THEN
        NEW.version = OLD.version + 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER test_cases_version_update 
BEFORE UPDATE ON test_cases 
FOR EACH ROW EXECUTE FUNCTION test_cases_version_trigger();

-- 归档时间触发器
CREATE OR REPLACE FUNCTION test_cases_archive_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.status != 'archived' AND NEW.status = 'archived' THEN
        NEW.archived_at = CURRENT_TIMESTAMP;
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'archived' AND NEW.status != 'archived' THEN
        NEW.archived_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER test_cases_archive_update 
BEFORE UPDATE ON test_cases 
FOR EACH ROW EXECUTE FUNCTION test_cases_archive_trigger();

-- 软删除触发器
CREATE OR REPLACE FUNCTION test_cases_soft_delete_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'archived' AND NEW.status = 'archived' THEN
        -- 硬删除归档的测试用例
        DELETE FROM test_cases WHERE id = OLD.id;
        RETURN NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建软删除触发器（可选，根据业务需求决定是否启用）
-- CREATE TRIGGER test_cases_soft_delete 
-- AFTER UPDATE ON test_cases 
-- FOR EACH ROW EXECUTE FUNCTION test_cases_soft_delete_trigger();
```

## 7. 视图设计

```sql
-- 测试用例列表视图
CREATE VIEW test_cases_list AS
SELECT 
    tc.id,
    tc.name,
    tc.description,
    tc.status,
    tc.priority,
    tc.estimated_duration,
    tc.created_at,
    tc.updated_at,
    u.username as created_by_username,
    p.name as project_name,
    tc.tags,
    ARRAY_LENGTH(tc.steps, 1) as step_count
FROM test_cases tc
JOIN users u ON tc.created_by = u.id
JOIN projects p ON tc.project_id = p.id
WHERE tc.status != 'archived';

-- 归档测试用例视图
CREATE VIEW archived_test_cases AS
SELECT 
    tc.*,
    u.username as created_by_username,
    p.name as project_name
FROM test_cases tc
JOIN users u ON tc.created_by = u.id
JOIN projects p ON tc.project_id = p.id
WHERE tc.status = 'archived';

-- 测试用例统计视图
CREATE VIEW test_cases_stats AS
SELECT 
    p.id as project_id,
    p.name as project_name,
    COUNT(tc.id) as total_cases,
    COUNT(CASE WHEN tc.status = 'active' THEN 1 END) as active_cases,
    COUNT(CASE WHEN tc.status = 'draft' THEN 1 END) as draft_cases,
    COUNT(CASE WHEN tc.status = 'archived' THEN 1 END) as archived_cases,
    COUNT(CASE WHEN tc.priority = 'critical' THEN 1 END) as critical_cases,
    COUNT(CASE WHEN tc.priority = 'high' THEN 1 END) as high_priority_cases,
    COUNT(CASE WHEN tc.priority = 'medium' THEN 1 END) as medium_priority_cases,
    COUNT(CASE WHEN tc.priority = 'low' THEN 1 END) as low_priority_cases,
    COALESCE(SUM(tc.estimated_duration), 0) as total_estimated_duration
FROM projects p
LEFT JOIN test_cases tc ON p.id = tc.project_id AND tc.status != 'archived'
GROUP BY p.id, p.name;
```

## 8. 权限和安全考虑

### 8.1 访问控制
- 用户只能访问其有权限的项目中的测试用例
- 管理员可以访问所有项目的测试用例
- 归档的测试用例默认不显示在列表中，但可以通过查询访问

### 8.2 数据验证
- 使用JSON Schema验证steps字段的结构
- 确保steps数组中的每个步骤都包含必要的字段
- 验证动作类型和期望结果类型的匹配性

### 8.3 审计日志
- 所有对测试用例的增删改操作都会记录到audit_logs表
- 记录操作前后的数据变化，便于追踪和回滚

## 9. 性能优化建议

1. **分页查询**：使用LIMIT和OFFSET进行分页，避免一次性加载大量数据
2. **延迟加载**：对于包含大量步骤的测试用例，考虑延迟加载步骤详情
3. **缓存策略**：对频繁访问的测试用例实施缓存
4. **索引优化**：根据查询模式调整索引策略
5. **批量操作**：支持批量创建、更新和删除测试用例

## 10. 扩展性考虑

1. **步骤类型扩展**：设计支持未来新增步骤类型（如数据库操作、文件操作等）
2. **标签系统**：支持动态添加新的标签分类
3. **版本管理**：支持完整的版本历史和回滚功能
4. **国际化**：支持多语言字段和本地化
5. **集成能力**：支持与外部系统的数据同步和集成