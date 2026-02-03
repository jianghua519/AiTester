# 测试用例API设计文档
**版本**: 1.0
**修改履历**: 任务 1.3.2

## 1. 概述
本设计文档描述了测试用例管理API的实现方案，包括完整的CRUD操作、项目级别的访问控制、分页、搜索和筛选功能。API基于FastAPI框架构建，使用Pydantic进行数据验证，并集成JWT认证机制。

## 2. API端点设计

### 2.1 基础路径和版本
- **基础路径**: `/api/v1`
- **认证方式**: JWT Bearer Token
- **响应格式**: JSON

### 2.2 API端点列表

| 方法 | 路径 | 描述 | 认证要求 | 权限要求 |
|------|------|------|----------|----------|
| `GET` | `/projects/{project_id}/testcases` | 获取项目下的测试用例列表 | ✅ | 项目成员 |
| `POST` | `/projects/{project_id}/testcases` | 创建新的测试用例 | ✅ | 项目成员 |
| `GET` | `/testcases/{case_id}` | 获取指定测试用例详情 | ✅ | 项目成员 |
| `PUT` | `/testcases/{case_id}` | 更新测试用例 | ✅ | 项目成员 |
| `DELETE` | `/testcases/{case_id}` | 删除测试用例 | ✅ | 项目管理员 |
| `GET` | `/testcases/{case_id}/history` | 获取测试用例版本历史 | ✅ | 项目成员 |
| `POST` | `/testcases/{case_id}/archive` | 归档测试用例 | ✅ | 项目管理员 |
| `POST` | `/testcases/{case_id}/restore` | 恢复归档的测试用例 | ✅ | 项目管理员 |

## 3. 数据模型设计

### 3.1 请求模型

#### 3.1.1 创建测试用例请求
```python
class TestCaseCreate(BaseModel):
    """创建测试用例请求模型"""
    name: str = Field(..., min_length=1, max_length=255, description="测试用例名称")
    description: Optional[str] = Field(None, description="测试用例描述")
    tags: Optional[List[str]] = Field(default_factory=list, description="标签列表")
    steps: List[Dict[str, Any]] = Field(..., description="测试步骤列表")
    priority: str = Field("medium", description="优先级: low, medium, high, critical")
    estimated_duration: Optional[int] = Field(None, description="预估执行时间(秒)")
    
    @validator('priority')
    def validate_priority(cls, v):
        allowed_priorities = ['low', 'medium', 'high', 'critical']
        if v not in allowed_priorities:
            raise ValueError(f"Priority must be one of {allowed_priorities}")
        return v
    
    @validator('steps')
    def validate_steps(cls, v):
        if not v:
            raise ValueError("Steps cannot be empty")
        
        for i, step in enumerate(v):
            if 'id' not in step:
                step['id'] = f"step_{i+1}"
            if 'type' not in step:
                raise ValueError(f"Step {i+1} must have a type")
            if 'action' not in step:
                raise ValueError(f"Step {i+1} must have an action")
        
        return v
```

#### 3.1.2 更新测试用例请求
```python
class TestCaseUpdate(BaseModel):
    """更新测试用例请求模型"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    steps: Optional[List[Dict[str, Any]]] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    estimated_duration: Optional[int] = None
    
    @validator('priority')
    def validate_priority(cls, v):
        if v is not None:
            allowed_priorities = ['low', 'medium', 'high', 'critical']
            if v not in allowed_priorities:
                raise ValueError(f"Priority must be one of {allowed_priorities}")
        return v
    
    @validator('status')
    def validate_status(cls, v):
        if v is not None:
            allowed_statuses = ['draft', 'active', 'archived']
            if v not in allowed_statuses:
                raise ValueError(f"Status must be one of {allowed_statuses}")
        return v
```

### 3.2 响应模型

#### 3.2.1 测试用例详情响应
```python
class TestCaseResponse(BaseModel):
    """测试用例详情响应模型"""
    id: int
    project_id: int
    name: str
    description: Optional[str]
    tags: List[str]
    steps: List[Dict[str, Any]]
    version: int
    status: str
    priority: str
    estimated_duration: Optional[int]
    created_by: int
    created_at: datetime
    updated_at: datetime
    archived_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class TestCaseListResponse(BaseModel):
    """测试用例列表响应模型"""
    test_cases: List[TestCaseResponse]
    total: int
    page: int
    size: int
    total_pages: int
    
    @validator('total_pages')
    def calculate_total_pages(cls, v, values):
        total = values.get('total', 0)
        size = values.get('size', 10)
        return (total + size - 1) // size if size > 0 else 0

class TestCaseHistoryResponse(BaseModel):
    """测试用例历史响应模型"""
    versions: List[Dict[str, Any]]
    total_versions: int
    
    class Config:
        from_attributes = True
```

### 3.3 分页和搜索参数

#### 3.3.1 分页参数
```python
class PaginationParams(BaseModel):
    """分页参数模型"""
    page: int = Field(1, ge=1, description="页码")
    size: int = Field(10, ge=1, le=100, description="每页数量")
    
    @validator('size')
    def validate_size(cls, v):
        if v > 100:
            raise ValueError("Page size cannot exceed 100")
        return v
```

#### 3.3.2 搜索和筛选参数
```python
class TestCaseFilterParams(BaseModel):
    """测试用例筛选参数模型"""
    search: Optional[str] = Field(None, description="搜索关键词")
    status: Optional[str] = Field(None, description="状态筛选")
    priority: Optional[str] = Field(None, description="优先级筛选")
    tags: Optional[List[str]] = Field(None, description="标签筛选")
    created_by: Optional[int] = Field(None, description="创建者筛选")
    date_from: Optional[datetime] = Field(None, description="创建时间起始")
    date_to: Optional[datetime] = Field(None, description="创建时间结束")
    
    @validator('status')
    def validate_status(cls, v):
        if v is not None:
            allowed_statuses = ['draft', 'active', 'archived']
            if v not in allowed_statuses:
                raise ValueError(f"Status must be one of {allowed_statuses}")
        return v
    
    @validator('priority')
    def validate_priority(cls, v):
        if v is not None:
            allowed_priorities = ['low', 'medium', 'high', 'critical']
            if v not in allowed_priorities:
                raise ValueError(f"Priority must be one of {allowed_priorities}")
        return v
```

## 4. 服务层设计

### 4.1 TestCaseService类

```python
class TestCaseService:
    """测试用例业务逻辑服务类"""
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = TestCaseRepository(db)
    
    def create_test_case(
        self, 
        project_id: int, 
        case_data: TestCaseCreate, 
        user_id: int
    ) -> TestCaseResponse:
        """创建测试用例"""
        # 验证项目访问权限
        self._validate_project_access(user_id, project_id)
        
        # 验证项目存在
        project = self._get_project_or_raise(project_id)
        
        # 创建测试用例
        db_case = self.repository.create(case_data, project_id, user_id)
        
        return TestCaseResponse.from_orm(db_case)
    
    def get_test_cases(
        self,
        project_id: int,
        user_id: int,
        pagination: PaginationParams,
        filters: TestCaseFilterParams = None
    ) -> TestCaseListResponse:
        """获取测试用例列表"""
        # 验证项目访问权限
        self._validate_project_access(user_id, project_id)
        
        # 获取测试用例
        cases, total = self.repository.get_by_project(
            project_id, 
            pagination.page, 
            pagination.size,
            filters
        )
        
        case_responses = [TestCaseResponse.from_orm(case) for case in cases]
        
        return TestCaseListResponse(
            test_cases=case_responses,
            total=total,
            page=pagination.page,
            size=pagination.size,
            total_pages=(total + pagination.size - 1) // pagination.size
        )
    
    def get_test_case(self, case_id: int, user_id: int) -> TestCaseResponse:
        """获取测试用例详情"""
        # 获取测试用例
        db_case = self.repository.get_by_id(case_id)
        if not db_case:
            raise HTTPException(status_code=404, detail="Test case not found")
        
        # 验证项目访问权限
        self._validate_project_access(user_id, db_case.project_id)
        
        return TestCaseResponse.from_orm(db_case)
    
    def update_test_case(
        self,
        case_id: int,
        update_data: TestCaseUpdate,
        user_id: int
    ) -> TestCaseResponse:
        """更新测试用例"""
        # 获取测试用例
        db_case = self.repository.get_by_id(case_id)
        if not db_case:
            raise HTTPException(status_code=404, detail="Test case not found")
        
        # 验证项目访问权限
        self._validate_project_access(user_id, db_case.project_id)
        
        # 更新测试用例
        updated_case = self.repository.update(case_id, update_data)
        
        return TestCaseResponse.from_orm(updated_case)
    
    def delete_test_case(self, case_id: int, user_id: int) -> bool:
        """删除测试用例"""
        # 获取测试用例
        db_case = self.repository.get_by_id(case_id)
        if not db_case:
            raise HTTPException(status_code=404, detail="Test case not found")
        
        # 验证项目访问权限
        self._validate_project_access(user_id, db_case.project_id)
        
        # 检查用户是否有删除权限
        self._validate_delete_permission(user_id, db_case.project_id)
        
        return self.repository.delete(case_id)
    
    def get_test_case_history(self, case_id: int, user_id: int) -> TestCaseHistoryResponse:
        """获取测试用例版本历史"""
        # 获取测试用例
        db_case = self.repository.get_by_id(case_id)
        if not db_case:
            raise HTTPException(status_code=404, detail="Test case not found")
        
        # 验证项目访问权限
        self._validate_project_access(user_id, db_case.project_id)
        
        # 获取版本历史
        history = self.repository.get_history(case_id)
        
        return TestCaseHistoryResponse(
            versions=history,
            total_versions=len(history)
        )
    
    def archive_test_case(self, case_id: int, user_id: int) -> TestCaseResponse:
        """归档测试用例"""
        # 获取测试用例
        db_case = self.repository.get_by_id(case_id)
        if not db_case:
            raise HTTPException(status_code=404, detail="Test case not found")
        
        # 验证项目访问权限
        self._validate_project_access(user_id, db_case.project_id)
        
        # 检查用户是否有归档权限
        self._validate_admin_permission(user_id, db_case.project_id)
        
        # 归档测试用例
        archived_case = self.repository.archive(case_id)
        
        return TestCaseResponse.from_orm(archived_case)
    
    def restore_test_case(self, case_id: int, user_id: int) -> TestCaseResponse:
        """恢复归档的测试用例"""
        # 获取测试用例
        db_case = self.repository.get_by_id(case_id)
        if not db_case:
            raise HTTPException(status_code=404, detail="Test case not found")
        
        # 验证项目访问权限
        self._validate_project_access(user_id, db_case.project_id)
        
        # 检查用户是否有恢复权限
        self._validate_admin_permission(user_id, db_case.project_id)
        
        # 恢复测试用例
        restored_case = self.repository.restore(case_id)
        
        return TestCaseResponse.from_orm(restored_case)
    
    # 私有方法
    def _validate_project_access(self, user_id: int, project_id: int):
        """验证项目访问权限"""
        project_service = ProjectService(self.db)
        try:
            project_service.get_project(project_id, user_id)
        except ValueError:
            raise HTTPException(
                status_code=403,
                detail="Access denied to this project"
            )
    
    def _get_project_or_raise(self, project_id: int):
        """获取项目或抛出异常"""
        project_service = ProjectService(self.db)
        project = project_service.get_project(project_id, 1)  # 临时使用user_id=1
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        return project
    
    def _validate_delete_permission(self, user_id: int, project_id: int):
        """验证删除权限"""
        # 检查用户是否为项目管理员
        project_service = ProjectService(self.db)
        user_role = project_service.get_user_role(user_id, project_id)
        
        if user_role not in ['admin', 'manager']:
            raise HTTPException(
                status_code=403,
                detail="Only project admin or manager can delete test cases"
            )
    
    def _validate_admin_permission(self, user_id: int, project_id: int):
        """验证管理员权限"""
        # 检查用户是否为项目管理员
        project_service = ProjectService(self.db)
        user_role = project_service.get_user_role(user_id, project_id)
        
        if user_role != 'admin':
            raise HTTPException(
                status_code=403,
                detail="Only project admin can perform this action"
            )
```

### 4.2 数据访问层设计

```python
class TestCaseRepository:
    """测试用例数据访问层"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, case_data: TestCaseCreate, project_id: int, user_id: int) -> TestCaseDB:
        """创建测试用例"""
        db_case = TestCaseDB(
            project_id=project_id,
            name=case_data.name,
            description=case_data.description,
            tags=case_data.tags,
            steps=json.dumps(case_data.steps, ensure_ascii=False),
            version=1,
            status=case_data.status or 'draft',
            priority=case_data.priority,
            estimated_duration=case_data.estimated_duration,
            created_by=user_id
        )
        
        self.db.add(db_case)
        self.db.commit()
        self.db.refresh(db_case)
        
        return db_case
    
    def get_by_id(self, case_id: int) -> Optional[TestCaseDB]:
        """根据ID获取测试用例"""
        return self.db.query(TestCaseDB).filter(TestCaseDB.id == case_id).first()
    
    def get_by_project(
        self,
        project_id: int,
        page: int = 1,
        size: int = 10,
        filters: TestCaseFilterParams = None
    ) -> tuple[List[TestCaseDB], int]:
        """根据项目ID获取测试用例列表"""
        query = self.db.query(TestCaseDB).filter(TestCaseDB.project_id == project_id)
        
        # 应用筛选条件
        if filters:
            if filters.search:
                search_term = f"%{filters.search}%"
                query = query.filter(
                    or_(
                        TestCaseDB.name.ilike(search_term),
                        TestCaseDB.description.ilike(search_term),
                        TestCaseDB.tags.ilike(search_term)
                    )
                )
            
            if filters.status:
                query = query.filter(TestCaseDB.status == filters.status)
            
            if filters.priority:
                query = query.filter(TestCaseDB.priority == filters.priority)
            
            if filters.tags:
                for tag in filters.tags:
                    query = query.filter(TestCaseDB.tags.contains([tag]))
            
            if filters.created_by:
                query = query.filter(TestCaseDB.created_by == filters.created_by)
            
            if filters.date_from:
                query = query.filter(TestCaseDB.created_at >= filters.date_from)
            
            if filters.date_to:
                query = query.filter(TestCaseDB.created_at <= filters.date_to)
        
        # 获取总数
        total = query.count()
        
        # 分页查询
        offset = (page - 1) * size
        cases = query.offset(offset).limit(size).all()
        
        return cases, total
    
    def update(self, case_id: int, update_data: TestCaseUpdate) -> TestCaseDB:
        """更新测试用例"""
        db_case = self.get_by_id(case_id)
        if not db_case:
            return None
        
        # 更新字段
        update_dict = update_data.dict(exclude_unset=True)
        for field, value in update_dict.items():
            if field == 'steps' and value is not None:
                db_case.steps = json.dumps(value, ensure_ascii=False)
            else:
                setattr(db_case, field, value)
        
        # 如果有状态变更，更新版本号
        if 'status' in update_dict and update_dict['status'] != db_case.status:
            db_case.version += 1
        
        self.db.commit()
        self.db.refresh(db_case)
        
        return db_case
    
    def delete(self, case_id: int) -> bool:
        """删除测试用例"""
        db_case = self.get_by_id(case_id)
        if not db_case:
            return False
        
        self.db.delete(db_case)
        self.db.commit()
        
        return True
    
    def get_history(self, case_id: int) -> List[Dict[str, Any]]:
        """获取测试用例版本历史"""
        # 这里可以扩展为从专门的版本历史表查询
        # 目前返回基本信息
        db_case = self.get_by_id(case_id)
        if not db_case:
            return []
        
        return [
            {
                'version': db_case.version,
                'status': db_case.status,
                'updated_at': db_case.updated_at,
                'updated_by': db_case.created_by
            }
        ]
    
    def archive(self, case_id: int) -> TestCaseDB:
        """归档测试用例"""
        db_case = self.get_by_id(case_id)
        if not db_case:
            return None
        
        db_case.status = 'archived'
        db_case.archived_at = datetime.utcnow()
        db_case.version += 1
        
        self.db.commit()
        self.db.refresh(db_case)
        
        return db_case
    
    def restore(self, case_id: int) -> TestCaseDB:
        """恢复归档的测试用例"""
        db_case = self.get_by_id(case_id)
        if not db_case:
            return None
        
        db_case.status = 'active'
        db_case.archived_at = None
        db_case.version += 1
        
        self.db.commit()
        self.db.refresh(db_case)
        
        return db_case
```

## 5. 认证和权限控制

### 5.1 JWT认证集成
- 使用现有的`JWTBearer`类进行token验证
- 所有端点都需要认证（除了健康检查端点）
- 用户信息从JWT token中提取

### 5.2 项目级别访问控制
- 使用现有的`require_project_access`装饰器
- 每个API端点都验证用户对项目的访问权限
- 删除和归档操作需要管理员权限

### 5.3 权限级别
- **项目成员**：可以查看、创建、更新测试用例
- **项目经理**：可以执行所有操作，包括删除和归档
- **系统管理员**：可以访问所有项目

## 6. 错误处理

### 6.1 错误响应格式
```python
class ErrorResponse(BaseModel):
    """错误响应模型"""
    error: str
    message: str
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
```

### 6.2 常见错误类型
- `401 Unauthorized`: JWT token无效或过期
- `403 Forbidden`: 用户没有访问权限
- `404 Not Found`: 测试用例或项目不存在
- `422 Unprocessable Entity`: 请求数据验证失败
- `500 Internal Server Error`: 服务器内部错误

### 6.3 错误处理中间件
```python
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """HTTP异常处理"""
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error="HTTP_ERROR",
            message=exc.detail,
            timestamp=datetime.utcnow()
        ).dict()
    )

@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    """值错误处理"""
    return JSONResponse(
        status_code=422,
        content=ErrorResponse(
            error="VALIDATION_ERROR",
            message=str(exc),
            timestamp=datetime.utcnow()
        ).dict()
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """通用异常处理"""
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error="INTERNAL_ERROR",
            message="Internal server error",
            timestamp=datetime.utcnow()
        ).dict()
    )
```

## 7. 性能优化

### 7.1 数据库优化
- 使用索引加速查询（已创建）
- 分页查询避免大数据量
- 延迟加载大字段（如steps的JSON数据）

### 7.2 缓存策略
- 缓存用户项目列表
- 缓存常用测试用例
- 使用Redis进行缓存

### 7.3 搜索优化
- 使用全文搜索索引
- 支持模糊搜索和精确搜索
- 搜索结果缓存

## 8. 监控和日志

### 8.1 日志记录
- 记录所有API请求和响应
- 记录错误和异常
- 记录用户操作审计

### 8.2 性能监控
- 记录API响应时间
- 监控数据库查询性能
- 监控缓存命中率

### 8.3 审计日志
- 记录测试用例的创建、更新、删除操作
- 记录用户权限变更
- 记录数据访问模式

## 9. 测试策略

### 9.1 单元测试
- 测试服务层逻辑
- 测试数据访问层
- 测试模型验证

### 9.2 集成测试
- 测试API端点
- 测试认证和权限控制
- 测试数据库事务

### 9.3 端到端测试
- 测试完整的业务流程
- 测试错误场景
- 测试性能表现

## 10. 扩展性考虑

### 10.1 版本管理
- 支持API版本控制
- 向后兼容性保证
- 废弃API的迁移策略

### 10.2 功能扩展
- 支持批量操作
- 支持导入导出
- 支持模板和复用

### 10.3 集成能力
- 支持Webhook通知
- 支持第三方系统集成
- 支持插件扩展