-- V2__test_cases_table.sql
-- 测试用例表创建脚本
-- 创建test_cases表及相关对象

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 删除可能存在的表（用于重新创建）
DROP TABLE IF EXISTS archived_test_cases CASCADE;
DROP TABLE IF EXISTS test_cases_stats CASCADE;
DROP TABLE IF EXISTS test_cases_list CASCADE;
DROP TABLE IF EXISTS test_cases CASCADE;

-- 创建测试用例表
CREATE TABLE test_cases (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    tags TEXT[],
    steps JSONB NOT NULL DEFAULT '[]',
    version INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    estimated_duration INTEGER,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    archived_at TIMESTAMP NULL
);

-- 创建索引
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

-- 创建外键约束
ALTER TABLE test_cases 
ADD CONSTRAINT fk_test_cases_project 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE test_cases 
ADD CONSTRAINT fk_test_cases_created_by 
FOREIGN KEY (created_by) REFERENCES users(id);

-- 创建约束
ALTER TABLE test_cases 
ADD CONSTRAINT chk_test_cases_status 
CHECK (status IN ('draft', 'active', 'archived'));

ALTER TABLE test_cases 
ADD CONSTRAINT chk_test_cases_priority 
CHECK (priority IN ('low', 'medium', 'high', 'critical'));

ALTER TABLE test_cases 
ADD CONSTRAINT chk_test_cases_version 
CHECK (version > 0);

-- 同一项目内名称唯一（未归档）
ALTER TABLE test_cases 
ADD CONSTRAINT uq_test_cases_project_name 
UNIQUE (project_id, name) 
WHERE status != 'archived';

-- 创建更新时间触发器函数（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建更新时间触发器
CREATE TRIGGER update_test_cases_updated_at 
BEFORE UPDATE ON test_cases 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 版本控制触发器函数
CREATE OR REPLACE FUNCTION test_cases_version_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.status != 'archived' AND NEW.status != 'archived' THEN
        NEW.version = OLD.version + 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建版本控制触发器
CREATE TRIGGER test_cases_version_update 
BEFORE UPDATE ON test_cases 
FOR EACH ROW EXECUTE FUNCTION test_cases_version_trigger();

-- 归档时间触发器函数
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

-- 创建归档时间触发器
CREATE TRIGGER test_cases_archive_update 
BEFORE UPDATE ON test_cases 
FOR EACH ROW EXECUTE FUNCTION test_cases_archive_trigger();

-- 创建视图：测试用例列表
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

-- 创建视图：归档测试用例
CREATE VIEW archived_test_cases AS
SELECT 
    tc.*,
    u.username as created_by_username,
    p.name as project_name
FROM test_cases tc
JOIN users u ON tc.created_by = u.id
JOIN projects p ON tc.project_id = p.id
WHERE tc.status = 'archived';

-- 创建视图：测试用例统计
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

-- 插入示例数据
INSERT INTO test_cases (project_id, name, description, tags, steps, status, priority, estimated_duration, created_by) VALUES 
(1, '用户登录功能测试', '验证用户能够成功登录系统', ['auth', 'login', 'smoke'], 
 '[{
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
   "timeout": 10000
 },
 {
   "id": "step_2",
   "type": "action",
   "name": "输入用户名和密码",
   "description": "在登录表单中输入有效的用户名和密码",
   "action": {
     "type": "input",
     "selector": "#username",
     "value": "testuser"
   },
   "expected_result": {
     "type": "text_set",
     "selector": "#username",
     "expected": "testuser"
   },
   "timeout": 5000
 }]',
 'active', 'high', 30, 1),

(1, 'API用户信息获取', '验证API能够正确返回用户信息', ['api', 'user'], 
 '[{
   "id": "step_1",
   "type": "api",
   "name": "获取用户信息",
   "description": "调用用户信息API",
   "action": {
     "type": "http",
     "method": "GET",
     "url": "https://api.example.com/users/1",
     "headers": {
       "Authorization": "Bearer {{token}}"
     }
   },
   "expected_result": {
     "type": "status_code",
     "expected": 200
   },
   "extract_data": {
     "user_id": "$.data.id",
     "username": "$.data.username"
   }
 }]',
 'draft', 'medium', 10, 1),

(2, '搜索功能测试', '验证搜索功能能够正确工作', ['search', 'ui'], 
 '[{
   "id": "step_1",
   "type": "action",
   "name": "打开搜索页面",
   "description": "导航到搜索页面",
   "action": {
     "type": "navigate",
     "url": "https://example.com/search"
   },
   "expected_result": {
     "type": "element_visible",
     "selector": "#search-input"
   }
 },
 {
   "id": "step_2",
   "type": "action",
   "name": "输入搜索关键词",
   "description": "在搜索框中输入测试关键词",
   "action": {
     "type": "input",
     "selector": "#search-input",
     "value": "测试关键词"
   },
   "expected_result": {
     "type": "text_set",
     "selector": "#search-input",
     "expected": "测试关键词"
   }
 },
 {
   "id": "step_3",
   "type": "action",
   "name": "点击搜索按钮",
   "description": "点击搜索按钮执行搜索",
   "action": {
     "type": "click",
     "selector": "#search-button"
   },
   "expected_result": {
     "type": "element_visible",
     "selector": "#search-results"
   }
 }]',
 'active', 'medium', 45, 1);

-- 输出创建完成信息
SELECT 'Test cases table created successfully!' as message;
SELECT 'Tables created: test_cases' as tables;
SELECT 'Views created: test_cases_list, archived_test_cases, test_cases_stats' as views;
SELECT 'Indexes created: project_id, status, priority, created_by, created_at, updated_at, project_status, project_priority, steps_type, steps_action_type, steps_api_method, tags, search' as indexes;
SELECT 'Example test cases inserted' as data;