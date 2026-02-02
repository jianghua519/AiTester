-- V1__initial_schema.sql
-- 初始数据库架构创建脚本
-- 创建用户、角色、项目相关的核心数据表

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 删除可能存在的表（用于重新创建）
DROP TABLE IF EXISTS user_project_mapping CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 创建 users 表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建 roles 表
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建 projects 表
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建 user_project_mapping 表
CREATE TABLE user_project_mapping (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    project_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- 创建索引
-- users 表索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_active ON users(is_active);

-- roles 表索引
CREATE INDEX idx_roles_name ON roles(name);

-- projects 表索引
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_created_at ON projects(created_at);

-- user_project_mapping 表索引
CREATE INDEX idx_upm_user_project ON user_project_mapping(user_id, project_id);
CREATE INDEX idx_upm_role ON user_project_mapping(role_id);
CREATE INDEX idx_upm_active ON user_project_mapping(is_active);

-- 创建外键约束
-- user_project_mapping 表的外键约束
ALTER TABLE user_project_mapping 
ADD CONSTRAINT fk_upm_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_project_mapping 
ADD CONSTRAINT fk_upm_project 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE user_project_mapping 
ADD CONSTRAINT fk_upm_role 
FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE;

-- projects 表的外键约束
ALTER TABLE projects 
ADD CONSTRAINT fk_projects_creator 
FOREIGN KEY (created_by) REFERENCES users(id);

-- 创建唯一约束
-- 用户在同一项目中的角色唯一
ALTER TABLE user_project_mapping 
ADD CONSTRAINT uq_user_project_role 
UNIQUE (user_id, project_id, role_id);

-- 插入初始数据

-- 插入默认角色
INSERT INTO roles (name, description, permissions) VALUES 
('admin', '系统管理员', '{
    "users": ["create", "read", "update", "delete"],
    "projects": ["create", "read", "update", "delete"],
    "test_cases": ["create", "read", "update", "delete"],
    "test_plans": ["create", "read", "update", "delete"],
    "test_runs": ["create", "read", "update", "delete"]
}'),
('manager', '项目经理', '{
    "users": ["read"],
    "projects": ["create", "read", "update", "delete"],
    "test_cases": ["create", "read", "update", "delete"],
    "test_plans": ["create", "read", "update", "delete"],
    "test_runs": ["create", "read", "update", "delete"]
}'),
('tester', '测试工程师', '{
    "users": ["read"],
    "projects": ["read"],
    "test_cases": ["create", "read", "update"],
    "test_plans": ["read"],
    "test_runs": ["create", "read", "update"]
}'),
('viewer', '查看者', '{
    "users": ["read"],
    "projects": ["read"],
    "test_cases": ["read"],
    "test_plans": ["read"],
    "test_runs": ["read"]
}');

-- 插入测试用户数据
INSERT INTO users (username, email, password_hash, full_name, is_active) VALUES 
('admin', 'admin@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '系统管理员', true),
('manager1', 'manager1@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '项目经理1', true),
('tester1', 'tester1@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '测试工程师1', true),
('viewer1', 'viewer1@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '查看者1', true);

-- 插入测试项目数据
INSERT INTO projects (name, description, status, created_by) VALUES 
('示例项目1', '这是一个示例项目，用于测试系统功能', 'active', 1),
('示例项目2', '另一个示例项目，展示多项目管理', 'active', 1),
('测试项目', '用于自动化测试的项目', 'active', 1);

-- 插入用户-项目关联数据
-- admin 用户拥有所有项目的管理员权限
INSERT INTO user_project_mapping (user_id, project_id, role_id) VALUES 
(1, 1, 1), -- admin 在项目1中的角色
(1, 2, 1), -- admin 在项目2中的角色
(1, 3, 1); -- admin 在项目3中的角色

-- manager1 在项目1中是项目经理
INSERT INTO user_project_mapping (user_id, project_id, role_id) VALUES 
(2, 1, 2);

-- tester1 在项目1中是测试工程师
INSERT INTO user_project_mapping (user_id, project_id, role_id) VALUES 
(3, 1, 3);

-- viewer1 在项目2中是查看者
INSERT INTO user_project_mapping (user_id, project_id, role_id) VALUES 
(4, 2, 4);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为相关表创建更新时间触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建视图：用户项目概览
CREATE VIEW user_project_overview AS
SELECT 
    u.id as user_id,
    u.username,
    u.email,
    u.full_name,
    p.id as project_id,
    p.name as project_name,
    r.name as role_name,
    r.description as role_description,
    upm.joined_at,
    upm.is_active
FROM users u
JOIN user_project_mapping upm ON u.id = upm.user_id
JOIN projects p ON upm.project_id = p.id
JOIN roles r ON upm.role_id = r.id
WHERE u.is_active = true AND upm.is_active = true;

-- 创建视图：项目成员统计
CREATE VIEW project_member_stats AS
SELECT 
    p.id as project_id,
    p.name as project_name,
    COUNT(upm.id) as total_members,
    SUM(CASE WHEN r.name = 'admin' THEN 1 ELSE 0 END) as admin_count,
    SUM(CASE WHEN r.name = 'manager' THEN 1 ELSE 0 END) as manager_count,
    SUM(CASE WHEN r.name = 'tester' THEN 1 ELSE 0 END) as tester_count,
    SUM(CASE WHEN r.name = 'viewer' THEN 1 ELSE 0 END) as viewer_count
FROM projects p
LEFT JOIN user_project_mapping upm ON p.id = upm.project_id
LEFT JOIN roles r ON upm.role_id = r.id
GROUP BY p.id, p.name;

-- 创建审计日志表（用于记录关键操作）
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 审计日志索引
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- 审计日志外键约束
ALTER TABLE audit_logs 
ADD CONSTRAINT fk_audit_logs_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- 输出创建完成信息
SELECT 'Database schema created successfully!' as message;
SELECT 'Tables created: users, roles, projects, user_project_mapping, audit_logs' as tables;
SELECT 'Views created: user_project_overview, project_member_stats' as views;
SELECT 'Default roles and test data inserted' as data;