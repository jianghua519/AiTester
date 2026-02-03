# 主导航框架和项目选择器设计文档
**版本**: 1.0
**修改履历**: 任务 1.2.7

## 1. 概述
主导航框架是应用的核心布局组件，包含左侧垂直导航栏和顶部全局页头。项目选择器用于管理和切换当前项目，确保所有 API 请求都携带正确的项目 ID。

## 2. 组件设计

### 2.1 MainLayout 组件
**职责**: 应用主体布局容器，包含导航栏和页头

**Props**:
```typescript
interface MainLayoutProps {
  children: React.ReactNode
}
```

**结构**:
```typescript
<MainLayout>
  <Header />
  <div className="flex">
    <Sidebar />
    <main className="flex-1">
      {children}
    </main>
  </div>
</MainLayout>
```

**状态管理**:
- 当前项目信息
- 导航菜单展开/收起状态
- 用户认证状态

### 2.2 Header 组件
**职责**: 顶部全局页头，包含项目选择器和用户信息

**Props**:
```typescript
interface HeaderProps {
  currentProject: Project
  onProjectChange: (projectId: string) => void
  onLogout: () => void
}
```

**UI 元素**:
- Logo/应用标题
- 项目选择器下拉菜单
- 用户头像和用户名
- 设置按钮
- 退出登录按钮

### 2.3 Sidebar 组件
**职责**: 左侧垂直导航栏，包含主要功能菜单

**Props**:
```typescript
interface SidebarProps {
  currentPath: string
  onNavigate: (path: string) => void
}
```

**菜单项**:
```typescript
interface MenuItem {
  id: string
  title: string
  icon: React.ReactNode
  path: string
  children?: MenuItem[]
}
```

**菜单结构**:
- 仪表盘 (`/dashboard`)
- 测试用例 (`/testcases`)
  - 测试用例列表
  - 创建测试用例
- 测试套件 (`/testsuites`)
- 测试计划 (`/testplans`)
- 测试运行 (`/testruns`)
- 设置 (`/settings`)

### 2.4 ProjectSelector 组件
**职责**: 项目选择下拉菜单，用于切换当前项目

**Props**:
```typescript
interface ProjectSelectorProps {
  currentProject: Project
  projects: Project[]
  onProjectChange: (projectId: string) => void
  isLoading: boolean
}
```

**状态**:
```typescript
interface ProjectSelectorState {
  isOpen: boolean
  searchQuery: string
  filteredProjects: Project[]
}
```

**功能**:
- 显示当前项目名称
- 下拉显示所有可访问项目
- 搜索过滤项目
- 切换项目后更新全局状态
- 加载状态显示

## 3. 数据模型

### 3.1 Project 接口
```typescript
interface Project {
  id: string
  name: string
  description: string
  created_at: string
  updated_at: string
  created_by: number
  member_count: number
}
```

### 3.2 GlobalState 扩展
```typescript
interface GlobalState {
  currentProject: Project | null
  projects: Project[]
  isLoading: boolean
  setCurrentProject: (project: Project) => void
  fetchProjects: () => Promise<void>
}
```

## 4. API 集成

### 4.1 获取项目列表 API
```typescript
// GET /api/v1/projects
const fetchProjects = async (): Promise<Project[]> => {
  const response = await apiClient.get<Project[]>('/api/v1/projects')
  return response.data
}
```

### 4.2 切换项目 API (可选)
```typescript
// POST /api/v1/projects/{projectId}/switch
const switchProject = async (projectId: string): Promise<void> => {
  await apiClient.post(`/api/v1/projects/${projectId}/switch`)
}
```

## 5. 交互流程

### 5.1 项目切换流程
1. 用户点击项目选择器
2. 显示项目列表下拉菜单
3. 用户选择新项目
4. 调用项目切换 API (可选)
5. 更新全局状态中的当前项目
6. 重新渲染应用，所有后续 API 请求携带新 project_id

### 5.2 导航流程
1. 用户点击侧边栏菜单项
2. 更新当前路径
3. 高亮当前菜单项
4. 主内容区域更新对应页面

## 6. 响应式设计

### 6.1 桌面端 (>768px)
- 侧边栏固定显示
- 页头固定在顶部
- 主内容区域自适应

### 6.2 移动端 (≤768px)
- 侧边栏可收起/展开
- 页头显示汉堡菜单
- 主内容区域全屏显示

## 7. 样式规范

### 7.1 颜色方案
- 主色调: blue-600
- 悬停色: blue-700
- 当前菜单色: blue-100
- 文字颜色: gray-700/gray-900

### 7.2 间距
- 页头高度: 4rem (64px)
- 侧边栏宽度: 16rem (256px)
- 菜单项间距: 0.5rem (8px)

### 7.3 字体
- 标题: text-lg (18px)
- 菜单项: base (16px)
- 项目名称: base (16px)

## 8. 图标设计
使用 Heroicons 或类似的图标库：
- 仪表盘: Chart Bar
- 测试用例: Document Text
- 测试套件: Folder
- 测试计划: Calendar
- 测试运行: Play
- 设置: Cog

## 9. 性能优化
- 项目列表缓存
- 菜单项懒加载
- 移动端状态记忆
- 防抖搜索功能