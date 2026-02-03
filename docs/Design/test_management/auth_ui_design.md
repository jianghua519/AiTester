# 登录和注册页面 UI 设计文档
**版本**: 1.0
**修改履历**: 任务 1.2.5

## 1. 概述
登录和注册页面是AI测试平台的入口界面，需要提供简洁、美观、用户友好的认证体验。页面采用响应式设计，支持桌面端和移动端访问。

## 2. UI 组件设计

### 2.1 登录页面 (LoginPage.tsx)
**职责**: 处理用户登录流程，收集邮箱和密码信息

**Props**:
```typescript
interface LoginPageProps {
  onLoginSuccess: (token: string) => void;
  onNavigateToRegister: () => void;
}
```

**State**:
```typescript
interface LoginPageState {
  email: string;
  password: string;
  isLoading: boolean;
  error: string | null;
}
```

**UI 元素**:
- 页面标题: "欢迎回到AI测试平台"
- 邮箱输入框 (带验证)
- 密码输入框 (带显示/隐藏切换)
- 登录按钮
- 错误提示信息
- "还没有账号？"链接，跳转到注册页
- "忘记密码？"链接 (未来功能)

### 2.2 注册页面 (RegisterPage.tsx)
**职责**: 处理用户注册流程，收集用户名、邮箱和密码信息

**Props**:
```typescript
interface RegisterPageProps {
  onRegisterSuccess: () => void;
  onNavigateToLogin: () => void;
}
```

**State**:
```typescript
interface RegisterPageState {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  isLoading: boolean;
  error: string | null;
}
```

**UI 元素**:
- 页面标题: "创建AI测试平台账号"
- 用户名输入框 (带验证)
- 邮箱输入框 (带验证)
- 密码输入框 (带强度指示)
- 确认密码输入框
- 注册按钮
- 错误提示信息
- "已有账号？"链接，跳转到登录页

## 3. 交互流程

### 3.1 登录流程
1. 用户进入登录页面
2. 输入邮箱和密码
3. 点击登录按钮
4. 显示加载状态
5. 登录成功后调用 onLoginSuccess 回调
6. 登录失败显示错误信息

### 3.2 注册流程
1. 用户进入注册页面
2. 输入用户名、邮箱、密码和确认密码
3. 点击注册按钮
4. 显示加载状态
5. 注册成功后调用 onRegisterSuccess 回调
6. 注册失败显示错误信息

## 4. 响应式设计

### 4.1 桌面端 (>768px)
- 容器宽度: 400px
- 居中显示
- 适当的间距和字体大小

### 4.2 移动端 (≤768px)
- 容器宽度: 100%
- 全屏显示
- 调整间距和字体大小
- 优化触摸交互

## 5. 样式规范

### 5.1 颜色方案
- 主色调: blue-600
- 悬停色: blue-700
- 错误色: red-500
- 成功色: green-500
- 背景色: gray-50

### 5.2 间距
- 组件间距: 1.5rem (24px)
- 输入框间距: 1rem (16px)
- 按钮高度: 2.5rem (40px)

### 5.3 字体
- 标题: text-xl (18px)
- 输入框标签: text-sm (14px)
- 输入框文本: base (16px)
- 按钮文本: base (16px)

## 6. 验证规则

### 6.1 邮箱验证
- 必须填写
- 符合邮箱格式
- 长度限制: 最多100字符

### 6.2 密码验证
- 必须填写
- 最少8位字符
- 包含大小写字母和数字

### 6.3 用户名验证
- 必须填写
- 长度: 3-20字符
- 只能包含字母、数字和下划线

### 6.4 确认密码验证
- 必须与密码一致