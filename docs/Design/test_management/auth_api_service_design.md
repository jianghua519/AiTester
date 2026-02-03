# 认证 API 服务设计文档
**版本**: 1.0
**修改履历**: 任务 1.2.6

## 1. 概述
认证 API 服务层负责处理用户登录、注册等认证相关的 API 调用，使用 axios 库进行 HTTP 请求，并集成 React Hook Form 进行表单状态管理。

## 2. API 端点设计

### 2.1 登录 API
- **URL**: `/api/v1/auth/login`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response (Success - 200)**:
  ```json
  {
    "token": "jwt-token-string",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "username": "username"
    }
  }
  ```
- **Response (Error - 401)**:
  ```json
  {
    "error": "Invalid credentials"
  }
  ```

### 2.2 注册 API
- **URL**: `/api/v1/auth/register`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "username": "string",
    "email": "string",
    "password": "string"
  }
  ```
- **Response (Success - 201)**:
  ```json
  {
    "message": "User registered successfully",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "username": "username"
    }
  }
  ```
- **Response (Error - 409)**:
  ```json
  {
    "error": "Email or username already exists"
  }
  ```

## 3. 服务层设计

### 3.1 AuthService 类
```typescript
class AuthService {
  private api: AxiosInstance
  
  // 登录方法
  async login(email: string, password: string): Promise<AuthResponse>
  
  // 注册方法
  async register(username: string, email: string, password: string): Promise<RegisterResponse>
  
  // 存储 JWT
  setToken(token: string): void
  
  // 获取当前 JWT
  getToken(): string | null
  
  // 清除 JWT
  clearToken(): void
}
```

### 3.2 表单验证规则
```typescript
// 登录表单验证
const loginValidationSchema = yup.object({
  email: yup.string()
    .email('auth.emailInvalid')
    .required('auth.emailRequired'),
  password: yup.string()
    .required('auth.passwordRequired')
})

// 注册表单验证
const registerValidationSchema = yup.object({
  username: yup.string()
    .min(3, 'auth.usernameMin')
    .max(20, 'auth.usernameMax')
    .matches(/^[a-zA-Z0-9_]+$/, 'auth.usernameInvalid')
    .required('auth.usernameRequired'),
  email: yup.string()
    .email('auth.emailInvalid')
    .required('auth.emailRequired'),
  password: yup.string()
    .min(8, 'auth.passwordMin')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'auth.passwordInvalid')
    .required('auth.passwordRequired'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'auth.passwordMismatch')
    .required('auth.confirmPasswordRequired')
})
```

## 4. 组件集成设计

### 4.1 登录页面集成
```typescript
const LoginPage: React.FC = () => {
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(loginValidationSchema)
  })
  
  const mutation = useMutation({
    mutationFn: (data: LoginData) => authService.login(data.email, data.password),
    onSuccess: (response) => {
      authService.setToken(response.token)
      // 跳转到仪表盘
    },
    onError: (error) => {
      // 显示错误信息
    }
  })
}
```

### 4.2 注册页面集成
```typescript
const RegisterPage: React.FC = () => {
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(registerValidationSchema)
  })
  
  const mutation = useMutation({
    mutationFn: (data: RegisterData) => authService.register(data),
    onSuccess: () => {
      // 跳转到登录页
    },
    onError: (error) => {
      // 显示错误信息
    }
  })
}
```

## 5. 状态管理

### 5.1 全局认证状态
使用 Zustand 管理全局认证状态：
```typescript
interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
}
```

### 5.2 路由保护
```typescript
const ProtectedRoute: React.FC = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }
  
  return children
}
```

## 6. 错误处理

### 6.1 API 错误分类
- **认证错误** (401): 显示"邮箱或密码错误"
- **冲突错误** (409): 显示"邮箱或用户名已存在"
- **网络错误**: 显示"网络连接失败"
- **服务器错误**: 显示"服务器错误，请稍后重试"

### 6.2 错误提示组件
```typescript
const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
  <div className="bg-red-50 border border-red-200 rounded-md p-3">
    <p className="text-sm text-red-800">{message}</p>
  </div>
)
```

## 7. 本地存储

### 7.1 JWT 存储
- 使用 localStorage 存储 JWT token
- 设置合理的过期时间
- 页面刷新时自动恢复认证状态

### 7.2 用户偏好
- 语言设置
- 主题设置 (未来功能)