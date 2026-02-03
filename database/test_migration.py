#!/usr/bin/env python3
"""
数据库迁移测试脚本
用于验证test_cases表的创建和基本功能
"""

import os
import sys
import psycopg2
from psycopg2 import sql
from psycopg2.extras import RealDictCursor
import json
from datetime import datetime

def get_db_connection():
    """获取数据库连接"""
    return psycopg2.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        port=os.getenv('DB_PORT', '5432'),
        database=os.getenv('DB_NAME', 'ai_tester'),
        user=os.getenv('DB_USER', 'postgres'),
        password=os.getenv('DB_PASSWORD', 'password')
    )

def execute_sql_file(file_path, connection):
    """执行SQL文件"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        with connection.cursor() as cursor:
            # 分割SQL语句并逐个执行
            statements = sql_content.split(';')
            for statement in statements:
                statement = statement.strip()
                if statement and not statement.startswith('--'):
                    cursor.execute(statement + ';')
            
            connection.commit()
            print(f"✅ 成功执行SQL文件: {file_path}")
            
    except Exception as e:
        connection.rollback()
        print(f"❌ 执行SQL文件失败: {e}")
        raise

def test_table_structure(connection):
    """测试表结构"""
    try:
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            # 检查表是否存在
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'test_cases'
            """)
            table_exists = cursor.fetchone()
            
            if not table_exists:
                print("❌ test_cases表不存在")
                return False
            
            print("✅ test_cases表存在")
            
            # 检查字段
            cursor.execute("""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = 'test_cases' 
                AND table_schema = 'public'
                ORDER BY ordinal_position
            """)
            
            columns = cursor.fetchall()
            expected_columns = [
                'id', 'project_id', 'name', 'description', 'tags', 
                'steps', 'version', 'status', 'priority', 'estimated_duration',
                'created_by', 'created_at', 'updated_at', 'archived_at'
            ]
            
            print("📋 表字段检查:")
            for col in columns:
                print(f"   - {col['column_name']}: {col['data_type']} ({'NULL' if col['is_nullable'] == 'YES' else 'NOT NULL'})")
                
                if col['column_name'] not in expected_columns:
                    print(f"⚠️  意外字段: {col['column_name']}")
            
            # 检查JSONB字段
            cursor.execute("SELECT steps FROM test_cases LIMIT 1")
            result = cursor.fetchone()
            if result and result['steps']:
                print(f"✅ JSONB字段测试成功，示例数据: {type(result['steps'])}")
            
            return True
            
    except Exception as e:
        print(f"❌ 表结构测试失败: {e}")
        return False

def test_data_integrity(connection):
    """测试数据完整性"""
    try:
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            # 检查示例数据
            cursor.execute("SELECT COUNT(*) as total FROM test_cases")
            total_count = cursor.fetchone()['total']
            print(f"📊 测试用例总数: {total_count}")
            
            # 检查不同状态的数量
            cursor.execute("""
                SELECT status, COUNT(*) as count
                FROM test_cases
                GROUP BY status
            """)
            status_counts = cursor.fetchall()
            print("📈 状态分布:")
            for status in status_counts:
                print(f"   - {status['status']}: {status['count']}")
            
            # 检查JSON数据结构
            cursor.execute("SELECT id, name, steps FROM test_cases LIMIT 1")
            test_case = cursor.fetchone()
            if test_case:
                print(f"🔍 示例测试用例: {test_case['name']}")
                print(f"   步骤数量: {len(test_case['steps'])}")
                if test_case['steps']:
                    print(f"   第一步类型: {test_case['steps'][0]['type']}")
            
            return True
            
    except Exception as e:
        print(f"❌ 数据完整性测试失败: {e}")
        return False

def test_views(connection):
    """测试视图"""
    try:
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            # 测试test_cases_list视图
            cursor.execute("SELECT COUNT(*) as total FROM test_cases_list")
            list_count = cursor.fetchone()['total']
            print(f"📋 test_cases_list视图记录数: {list_count}")
            
            # 测试test_cases_stats视图
            cursor.execute("SELECT * FROM test_cases_stats")
            stats = cursor.fetchall()
            print("📊 项目统计:")
            for stat in stats:
                print(f"   - 项目: {stat['project_name']}, 总用例: {stat['total_cases']}")
            
            return True
            
    except Exception as e:
        print(f"❌ 视图测试失败: {e}")
        return False

def cleanup_test_data(connection):
    """清理测试数据"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM test_cases")
            connection.commit()
            print("🧹 测试数据已清理")
    except Exception as e:
        print(f"❌ 清理测试数据失败: {e}")

def main():
    """主函数"""
    print("🚀 开始数据库迁移测试...")
    
    # 检查环境变量
    required_env_vars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']
    missing_vars = [var for var in required_env_vars if not os.getenv(var)]
    
    if missing_vars:
        print(f"❌ 缺少环境变量: {', '.join(missing_vars)}")
        print("请设置以下环境变量:")
        for var in missing_vars:
            print(f"   export {var}=your_value")
        return False
    
    connection = None
    try:
        # 连接数据库
        connection = get_db_connection()
        print("✅ 数据库连接成功")
        
        # 执行迁移
        migration_file = "/home/jh/develop/AiTester/database/migrations/V2__test_cases_table.sql"
        execute_sql_file(migration_file, connection)
        
        # 测试表结构
        print("\n🔍 测试表结构...")
        if not test_table_structure(connection):
            return False
        
        # 测试数据完整性
        print("\n📊 测试数据完整性...")
        if not test_data_integrity(connection):
            return False
        
        # 测试视图
        print("\n👁️ 测试视图...")
        if not test_views(connection):
            return False
        
        print("\n✅ 所有测试通过!")
        return True
        
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        return False
        
    finally:
        if 'connection' in locals() and connection:
            connection.close()
            print("🔌 数据库连接已关闭")

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)