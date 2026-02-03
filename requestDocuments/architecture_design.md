# 自动化测试平台架构设计文档

**版本**: 1.0  
**日期**: 2026-02-02  
**作者**: Manus AI

## 1. 引言

本文档旨在为下一代 AI 驱动的自动化测试平台提供一个全面、可扩展且稳健的架构设计。设计目标是构建一个能够支持 Web、API 和移动端测试,并集成了先进的 AI 能力和企业级管理功能的综合性平台。

## 2. 系统架构

### 2.1 总体架构

系统采用基于微服务的分布式架构,以实现高内聚、低耦合和水平扩展。核心思想是将不同的业务能力拆分为独立的服务,通过 API Gateway 对外提供统一的接口。这种架构便于独立开发、部署和扩展各个功能模块。

![系统架构图](/home/ubuntu/system_architecture.png)

### 2.2 架构组件说明

- **用户 (User/Developer)**: 通过 Web 前端与系统交互,管理和执行测试。
- **CI/CD Pipeline**: 通过系统的 API 触发测试计划,实现自动化回归测试。
- **Frontend**: 基于 **React** 和 **Vite** 构建的单页应用(SPA),提供丰富的用户交互界面。
- **API Gateway**: 作为系统的统一入口,负责请求路由、认证、限流和负载均衡。选用 **NGINX** 或类似的成熟网关。
- **Backend Services**: 一组独立的微服务,每个服务负责一部分业务逻辑。
  - **Auth Service**: 负责用户认证、授权和角色管理(RBAC)。
  - **Test Management Service**: 核心业务服务,负责测试用例、套件、计划的管理和 CRUD 操作。
  - **Execution Master**: 测试执行的主控节点,负责将测试任务分发到执行节点池,并收集结果。
  - **AI Service**: 封装与 LLM 的交互,提供 NLP 解析、失败诊断等 AI 功能。
  - **Notification Service**: 负责向 Slack、Email 等发送通知。
  - **Integration Service**: 负责与 Jira、Git 等第三方系统进行双向集成。
- **Execution Agents**: 一个分布式的执行节点池,实际运行 Playwright 和 Appium 测试脚本。可以根据负载动态增减。
- **Data Stores**: 系统的持久化层。
  - **PostgreSQL**: 存储所有结构化的业务数据,如测试用例、用户、项目信息等。
  - **Redis**: 用作高速缓存和消息队列(用于任务分发)。
  - **MinIO**: 对象存储,用于存放测试产物,如截图、录屏视频和日志文件。
- **External Services**: 系统依赖的外部第三方服务。

### 2.3 技术选型

| 组件 | 技术栈 | 理由 |
| :--- | :--- | :--- |
| **前端** | React, Vite, TypeScript, TailwindCSS | 现代、高效的前端开发组合,拥有强大的社区支持和丰富的生态系统。 |
| **后端服务** | Go, Python (FastAPI) | **Go** 用于需要高并发和低延迟的服务(如 Auth, Execution Master, Notification)。**Python** 用于需要快速开发和强大 AI/数据科学生态的服务(如 Test Management, AI Service, Integration)。 |
| **API 网关** | NGINX | 成熟、高性能、稳定可靠,具备强大的路由和负载均衡能力。 |
| **数据库** | PostgreSQL, Redis, MinIO | **PostgreSQL** 是功能最强大的开源关系型数据库之一,支持复杂的查询和事务。**Redis** 是业界标准的内存数据库,适用于缓存和队列。**MinIO** 是兼容 S3 协议的开源对象存储,便于私有化部署。 |
| **测试引擎** | Playwright, Appium | **Playwright** 是现代 Web 测试的最佳选择。**Appium** 是移动端测试的事实标准,支持 iOS 和 Android。 |
| **容器化** | Docker, Kubernetes | 使用 Docker 进行服务打包,使用 Kubernetes (K8s) 进行容器编排、服务发现和弹性伸缩,是构建云原生应用的现代标准。 |


## 3. 核心模块与组件架构

本章节深入探讨核心微服务内部的组件设计和它们之间的交互模式。

### 3.1 组件设计原则

每个微服务内部都遵循分层架构,以实现关注点分离:

- **API 层 (API Layer)**: 负责处理传入的 HTTP/gRPC 请求,进行参数校验和序列化,并调用业务逻辑层。它不包含任何业务逻辑。
- **业务逻辑层 (Business Logic/Use Cases)**: 实现服务的核心业务流程,编排数据访问和外部服务调用。
- **数据访问层 (Repository)**: 封装与数据库的交互,为业务逻辑层提供清晰、一致的数据操作接口,将业务逻辑与具体的数据库实现解耦。

### 3.2 核心子系统架构

![核心模块交互图](/home/ubuntu/component_architecture.png)

#### **测试管理服务 (Test Management Service)**
- 作为系统的核心,它负责所有测试资产的管理。
- 采用传统的 **API -> Logic -> Repository** 分层。API 层使用 FastAPI 快速构建,业务逻辑层处理所有与测试用例、套件、计划相关的操作,数据访问层通过 SQLAlchemy 或类似的 ORM 与 PostgreSQL 交互。

#### **执行子系统 (Execution Subsystem)**
- 该子系统由 **主控节点 (Master)** 和 **执行节点 (Agent)** 组成,是一个典型的生产者-消费者模型。
- **Execution Master**: 内部包含 API 层(用于接收测试计划)、调度器(Scheduler)和分发器(Dispatcher)。调度器从 Redis 的任务队列中获取测试计划,拆分成独立的任务,然后由分发器通过 gRPC 将任务分配给空闲的 Agent。
- **Execution Agents**: 每个 Agent 都是一个独立的 Go 程序,包含一个 Test Runner(用于调用 Playwright/Appium)和一个 Result Reporter。执行完成后,Reporter 将结果发布到 Redis 的结果队列。

#### **AI 服务 (AI Service)**
- 这是一个无状态的服务,专门用于处理计算密集型或需要与外部 LLM 交互的任务。
- 内部包含 API 层、一个 **提示词引擎 (Prompt Engine)** (用于根据不同场景生成和管理高质量的 Prompt)和一个 **LLM 客户端** (封装了与 OpenAI/Gemini 等多种 LLM API 的通信逻辑)。

### 3.3 服务交互模式: 异步消息队列

为了实现服务间的解耦和削峰填谷,核心的测试执行流程采用了基于 **Redis 消息队列** 的异步通信模式:

1.  当用户在前端点击“执行测试计划”时,请求被发送到 **Test Management Service**。
2.  该服务将测试计划的详细信息作为一个“作业(Job)”发布到 Redis 的 **`job_queue`**。
3.  **Execution Master** 的调度器持续监听 `job_queue`,获取作业后进行拆分和调度。
4.  **Execution Agent** 执行完测试后,将包含日志、截图路径和状态的结果发布到 **`result_queue`**。
5.  **Test Management Service** 监听 `result_queue`,获取测试结果并将其持久化到 PostgreSQL 数据库中。

这种异步设计极大地提高了系统的吞吐量和弹性,即使在执行大量测试时也能保持前端的响应能力。


## 4. 数据模型和存储架构

数据是平台的核心资产,一个良好设计的数据模型是系统可扩展性和可维护性的基石。本节将详细阐述数据存储的选型和核心实体关系模型。

### 4.1 数据存储策略

我们采用混合持久化策略,为不同类型的数据选择最合适的存储引擎:

- **PostgreSQL (关系型数据)**: 作为主数据库,用于存储所有结构化、需要事务一致性的核心业务数据。这包括用户信息、项目、测试资产(用例、套件、计划)以及测试结果等。选择 PostgreSQL 是因为它功能强大、稳定可靠,并支持 JSONB 等高级数据类型。
- **Redis (缓存与消息队列)**: 用于两个关键场景: 一是作为应用层缓存,存储热点数据(如项目列表、用户信息),减轻主数据库压力; 二是作为消息代理,实现服务间的异步通信,如上文提到的测试任务分发和结果收集。
- **MinIO (对象存储)**: 用于存储非结构化的二进制大文件,即测试产物。这包括测试过程中的截图、失败时的录屏视频、详细的执行日志文件等。将这些大文件与主数据库分离,可以避免数据库膨胀,并便于进行独立的备份和 CDN 加速。

### 4.2 核心实体关系图 (ERD)

下图展示了 PostgreSQL 中核心业务实体及其关系。

![数据模型ER图](/home/ubuntu/data_model.png)

### 4.3 核心实体说明

- **Projects**: 顶层容器,所有测试资产都属于一个项目,便于组织隔离。
- **Users & Roles**: 实现了基于角色的访问控制(RBAC)。每个用户有一个角色,决定了其操作权限。
- **TestCases**: 测试用例是最小的原子单元,包含了标题、描述和具体的测试步骤(`steps` 字段,使用 JSONB 类型存储)。每个用例都有版本控制。
- **TestSuites**: 测试套件,是测试用例的逻辑分组。一个套件可以包含多个用例,一个用例也可以属于多个套件 (通过 `suite_case_mapping` 多对多关系表实现)。
- **TestPlans**: 测试计划,是可执行的单元。一个计划包含一个或多个测试套件,并关联了执行环境、执行策略等信息。
- **TestRuns & RunResults**: `TestRuns` 记录了每次测试计划的执行历史。`RunResults` 则记录了该次执行中每个测试用例的具体结果(状态、日志路径、截图路径等)。
- **JiraMapping**: 一个独立的关系表,用于建立 `TestCases` 和外部 Jira Issue 之间的链接,实现可追溯性。

这种标准化的数据模型为平台提供了强大的组织能力,能够清晰地管理从测试定义到执行结果的全过程数据,为后续的报告、分析和 AI 功能打下了坚实的基础。


## 5. API 接口和集成架构

统一、规范的 API 是连接前后端、实现服务间通信以及与第三方系统集成的关键。本节定义了 API 的设计原则和核心集成策略。

### 5.1 API 设计原则

平台的所有对外和对内 HTTP 接口都遵循 RESTful 设计风格,以确保一致性、可预测性和易用性。

- **RESTful 规范**: 严格使用标准的 HTTP 方法 (GET, POST, PUT, DELETE, PATCH) 来表达对资源的操作。
- **资源导向的 URL**: URL 结构清晰地反映了资源的层级关系,例如: `/api/v1/projects/{project_id}/test-cases/{case_id}`。
- **URL 版本控制**: 在 URL 中明确包含版本号 (如 `/api/v1/`),以便在未来进行 API 升级时保持向后兼容。
- **JSON 数据格式**: 所有请求体和响应体均使用 `application/json` 格式,并遵循驼峰式命名法(camelCase)。
- **JWT 认证**: 所有需要认证的端点均通过 `Authorization: Bearer <token>` 头中的 JSON Web Token 进行保护。
- **统一的错误响应**: 定义标准的错误响应格式,例如: `{"error": {"code": "RESOURCE_NOT_FOUND", "message": "Test case with id X not found."}}`。
- **分页**: 对于返回列表的接口,使用 `limit` 和 `offset` 查询参数进行统一分页。

### 5.2 核心 API 端点示例

以下是 **Test Management Service** 提供的一些核心端点示例:

| 方法 | URL | 描述 |
| :--- | :--- | :--- |
| `POST` | `/api/v1/projects` | 创建一个新项目。 |
| `GET` | `/api/v1/projects/{projectId}/test-cases` | 获取指定项目下的所有测试用例(支持分页)。 |
| `POST` | `/api/v1/projects/{projectId}/test-cases` | 在项目中创建一个新的测试用例。 |
| `GET` | `/api/v1/test-cases/{caseId}` | 获取单个测试用例的详细信息,包括其版本历史。 |
| `PUT` | `/api/v1/test-cases/{caseId}` | 更新一个测试用例,将创建一个新版本。 |
| `POST` | `/api/v1/test-plans/{planId}/execute` | **(核心)** 触发一个测试计划的执行。这是 CI/CD 集成的关键入口。 |
| `GET` | `/api/v1/test-runs/{runId}` | 获取一次测试执行的总体状态和结果摘要。 |
| `GET` | `/api/v1/test-runs/{runId}/results` | 获取一次测试执行中所有用例的详细结果列表。 |

### 5.3 服务间通信

- **同步通信 (gRPC)**: 对于需要低延迟、强类型的服务内部调用,如 **Execution Master** 向 **Execution Agent** 分配任务,采用 gRPC。它基于 HTTP/2,性能高效,并通过 Protocol Buffers 定义服务契约。
- **异步通信 (消息队列)**: 对于可接受最终一致性、需要解耦和削峰填谷的场景,如测试任务的提交和结果的回收,采用基于 Redis 的消息队列,如前文所述。

### 5.4 第三方集成架构

集成架构的核心是 **Integration Service**, 它作为所有外部系统与平台内部服务之间的“适配器”和“翻译官”。

- **Jira 集成**: 
  - **出向**: 当测试失败需要创建 Bug 时,`Test Management Service` 会调用 `Integration Service` 的一个内部接口。`Integration Service` 随后调用 Jira 的 REST API 来创建 Issue。
  - **入向**: 在 Jira 中配置 Webhook,当 Issue 状态变更时,Jira 会向 `Integration Service` 的一个专用端点 (`/webhooks/jira`) 发送通知。`Integration Service` 解析通知内容,并更新平台内部数据库中对应的测试用例或需求状态。

- **CI/CD 集成**: 
  - 集成的核心是提供一个稳定的、基于 API Key 认证的 REST API 端点 (`/api/v1/test-plans/{planId}/execute`)。
  - 在 Jenkins、GitHub Actions 等流水线中,开发者只需使用 `curl` 或其他 HTTP 工具调用此端点即可触发测试。
  - 该 API 支持同步和异步两种模式。异步模式下,API 会立即返回一个 `runId`,CI/CD 工具可以通过轮询 `/api/v1/test-runs/{runId}` 端点来获取最终的测试结果,并据此决定流水线的成功或失败。

- **通知集成 (Slack/Email)**: 
  - **Notification Service** 负责所有通知的发送。它提供了统一的内部接口,如 `sendSlackMessage(channel, message)`。
  - 当 `Test Management Service` 中发生关键事件(如测试计划完成)时,它会调用 `Notification Service`,由后者负责与 Slack 的 Incoming Webhooks API 或 SMTP 服务器进行通信。

这种分层、解耦的集成架构使得添加对新工具的支持变得简单,只需在 `Integration Service` 中增加一个新的适配器,而无需修改核心业务逻辑。


## 6. 部署架构

为了实现高可用、可扩展和便于运维,平台采用基于 **Kubernetes** 的容器化部署策略。

### 6.1 容器化策略

- 每个微服务(如 Auth Service, Test Management Service 等)都被打包为一个独立的 Docker 镜像。
- 使用多阶段构建(Multi-stage Build)来减小镜像体积,并确保生产镜像中不包含构建工具和源代码。
- 镜像存储在私有的 Docker Registry 中(如 Harbor),并通过 CI/CD 流水线自动构建和推送。

### 6.2 Kubernetes 编排

- **Deployment**: 每个微服务都作为一个 Deployment 部署,可以轻松地进行滚动更新和回滚。
- **Service**: 使用 Kubernetes Service 为每个微服务提供稳定的内部 DNS 名称和负载均衡。
- **Ingress**: 通过 Ingress Controller (如 NGINX Ingress) 将外部流量路由到 API Gateway,并实现 TLS 终止。
- **ConfigMap & Secret**: 将应用配置和敏感信息(如数据库密码、API Key)分别存储在 ConfigMap 和 Secret 中,与镜像解耦。
- **Horizontal Pod Autoscaler (HPA)**: 为关键服务(如 Execution Master, Test Management Service)配置 HPA,根据 CPU 或内存使用率自动扩缩容。
- **StatefulSet**: 对于有状态的服务(如 PostgreSQL, Redis),使用 StatefulSet 并挂载持久卷(PVC)来保证数据持久化。

### 6.3 部署环境

- **开发环境 (Dev)**: 单节点 Kubernetes 集群(如 Minikube 或 Kind),用于本地开发和快速验证。
- **测试环境 (Staging)**: 与生产环境配置相同,但规模较小,用于集成测试和预发布验证。
- **生产环境 (Production)**: 多节点 Kubernetes 集群,部署在云平台(如 AWS EKS, Google GKE)或私有数据中心,配置了高可用、监控和备份策略。

## 7. 安全架构

安全是企业级平台的生命线,本节概述了多层次的安全防护措施。

### 7.1 认证与授权

- **JWT 认证**: 用户登录后,Auth Service 会签发一个 JWT Token,包含用户 ID 和角色信息。该 Token 的有效期为 24 小时,并可通过刷新 Token 机制延长。
- **RBAC (基于角色的访问控制)**: 在 API Gateway 或各个微服务的中间件中,根据 JWT 中的角色信息,检查用户是否有权限执行当前操作。权限检查逻辑基于预定义的角色-权限映射表。

### 7.2 数据安全

- **传输加密**: 所有外部通信(用户到 API Gateway)都强制使用 HTTPS (TLS 1.2+)。内部服务间通信在生产环境中也建议使用 mTLS (Mutual TLS)。
- **静态数据加密**: 敏感字段(如用户密码)在数据库中使用 bcrypt 或 Argon2 进行哈希存储。对于需要可逆加密的数据(如第三方 API Token),使用 AES-256 加密,密钥存储在 Kubernetes Secret 中。
- **数据脱敏**: 在日志和错误消息中,自动脱敏敏感信息(如密码、Token),防止泄露。

### 7.3 审计与合规

- **审计日志**: 所有关键的写操作(如创建/修改测试用例、执行测试计划、修改权限)都会被记录到 `audit_logs` 表中,包含操作人、操作时间、操作类型和操作对象。
- **日志不可篡改**: 审计日志一旦写入,不可修改或删除,只能追加。可以考虑将日志定期归档到不可变的对象存储中。
- **合规性报告**: 提供导出审计日志的功能,生成符合 SOC 2、ISO 27001 等标准的合规性报告。

### 7.4 防护措施

- **API 限流**: 在 API Gateway 层实现基于 IP 或用户的请求速率限制,防止 DDoS 攻击和恶意爬虫。
- **输入校验**: 所有 API 端点都进行严格的输入校验,防止 SQL 注入、XSS 等攻击。
- **依赖扫描**: 在 CI/CD 流水线中集成依赖扫描工具(如 Snyk, Trivy),及时发现和修复第三方库的安全漏洞。

## 8. 可观测性架构

在分布式微服务架构中,可观测性(Observability)是快速定位问题和优化性能的关键。

### 8.1 日志 (Logging)

- 所有服务都将日志输出到标准输出(stdout/stderr),由 Kubernetes 自动收集。
- 使用 **ELK Stack** (Elasticsearch, Logstash, Kibana) 或 **Loki + Grafana** 进行日志聚合、索引和可视化。
- 日志格式采用结构化的 JSON,包含时间戳、服务名、日志级别、Trace ID 等字段,便于查询和关联。

### 8.2 指标 (Metrics)

- 每个服务都暴露 `/metrics` 端点,以 Prometheus 格式输出关键指标,如请求数、响应时间、错误率、队列长度等。
- 使用 **Prometheus** 定期抓取这些指标,并存储在时序数据库中。
- 在 **Grafana** 中创建仪表盘,实时监控系统的健康状况和性能趋势。

### 8.3 追踪 (Tracing)

- 使用 **OpenTelemetry** 作为统一的追踪框架,在每个服务中注入追踪代码。
- 当一个请求跨越多个服务时(如从 Test Management Service 到 AI Service),会生成一个全局唯一的 Trace ID,并在所有相关的日志和 Span 中记录。
- 使用 **Jaeger** 或 **Zipkin** 作为追踪后端,可以可视化请求的完整调用链,快速定位性能瓶颈。

## 9. AI 能力实现策略

AI 是本平台的核心差异化竞争力,本节详细阐述 AI 功能的技术实现路径。

### 9.1 LLM 集成策略

为了实现本地部署和灵活性,平台支持多种 LLM 后端:

- **OpenAI / Gemini (云端)**: 通过 REST API 调用,适用于对延迟不敏感且希望使用最先进模型的场景。
- **Ollama (本地)**: 支持在本地服务器上运行开源模型(如 Llama 2, Mistral),适用于对数据隐私有严格要求的企业客户。
- **配置化**: 在 AI Service 中,通过配置文件或环境变量指定使用哪个 LLM 后端。LLM Client 根据配置动态选择调用路径。

### 9.2 核心 AI 功能实现

- **自然语言生成测试 (NLP to Test)**: 
  - 用户输入的自然语言描述会被发送到 AI Service。
  - Prompt Engine 会将用户输入包装在一个精心设计的 Prompt 中,指导 LLM 输出结构化的 JSON,包含测试步骤的序列(如 `[{"action": "click", "target": "Login Button"}, {"action": "input", "target": "Username Field", "value": "testuser"}]`)。
  - 解析 JSON 后,调用现有的代码生成器,将其转换为可执行的 Playwright/Appium 脚本。

- **元素自愈 (Auto-Healing)**: 
  - 在录制时,为每个元素生成多个备选定位器(基于 ID, Class, Text, XPath 等)。
  - 在执行时,如果主定位器失败,依次尝试备选定位器。如果某个备选定位器成功,将其升级为主定位器,并记录到数据库中。
  - 可选地,使用 LLM 进行"语义自愈": 将失败的元素定位器和当前页面的 DOM 结构发送给 LLM,让其推荐一个新的定位器。

- **智能失败诊断**: 
  - 收集失败时的上下文(错误日志、截图、网络请求)。
  - 将这些信息发送给 LLM,并使用 Few-shot Learning 提示词(包含几个典型的失败案例和诊断结果)。
  - LLM 会返回可能的失败原因和修复建议,展示在测试报告中。

## 10. 总结与未来展望

本架构设计为下一代 AI 驱动的自动化测试平台提供了一个全面、稳健且可扩展的蓝图。通过采用微服务架构、混合持久化策略、标准化的 API 设计以及多层次的安全防护,平台能够满足从小型团队到大型企业的不同需求。

核心亮点包括:

- **全平台覆盖**: 支持 Web (Playwright)、API 和移动端 (Appium) 测试,提供统一的管理界面。
- **AI 赋能**: 通过集成 LLM,实现自然语言生成测试、元素自愈和智能失败诊断,大幅降低使用门槛和维护成本。
- **企业级特性**: 分布式并行执行、RBAC、审计日志、CI/CD 集成等功能,满足企业对性能、安全和合规性的要求。
- **云原生设计**: 基于 Kubernetes 的容器化部署,天然支持弹性伸缩和高可用。

未来,随着技术的演进,平台可以进一步增强:

- **更深度的 AI 集成**: 如基于历史数据的测试用例自动生成、智能测试优先级排序等。
- **跨云支持**: 提供在多个云平台(AWS, Azure, GCP)上一键部署的能力。
- **测试数据管理**: 增强测试数据的生成、脱敏和版本控制能力。
- **可视化测试编排**: 提供拖拽式的测试流程设计器,进一步降低使用门槛。

本架构设计旨在为开发团队提供清晰的技术路线图,确保在实施过程中能够保持一致性、可维护性和前瞻性。

---

**文档版本**: 1.0  
**最后更新**: 2026-02-02  
**作者**: Manus AI
