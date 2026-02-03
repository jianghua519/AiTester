# Test Management Service - Project Management Design Document
**Version**: 1.0

## 1. Overview
The Project Management module is responsible for managing projects within the AI Tester platform. It provides functionalities to create, list, update, and delete projects. This module serves as the top-level organization unit for test cases, test suites, and test plans.

## 2. API Endpoints

### 2.1 List Projects
- **URL**: `GET /api/v1/projects`
- **Method**: `GET`
- **Query Params**:
  - `skip`: int (default 0)
  - `limit`: int (default 100)
- **Response**: `200 OK`
  ```json
  [
    {
      "id": 1,
      "name": "Project Alpha",
      "description": "Main project",
      "created_at": "2023-10-27T10:00:00Z",
      "updated_at": "2023-10-27T10:00:00Z",
      "created_by": 1
    }
  ]
  ```

### 2.2 Create Project
- **URL**: `POST /api/v1/projects`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "name": "Project Alpha",
    "description": "Main project"
  }
  ```
- **Response**: `201 Created`
- **Errors**: `409 Conflict` (if name exists)

### 2.3 Get Project
- **URL**: `GET /api/v1/projects/{project_id}`
- **Method**: `GET`
- **Response**: `200 OK`
- **Errors**: `404 Not Found`

### 2.4 Update Project
- **URL**: `PUT /api/v1/projects/{project_id}`
- **Method**: `PUT`
- **Body**:
  ```json
  {
    "name": "Project Beta",
    "description": "Updated description"
  }
  ```
- **Response**: `200 OK`
- **Errors**: `404 Not Found`, `409 Conflict`

### 2.5 Delete Project
- **URL**: `DELETE /api/v1/projects/{project_id}`
- **Method**: `DELETE`
- **Response**: `204 No Content`
- **Errors**: `404 Not Found`

## 3. Data Model

### Projects Table (`projects`)
| Field | Type | Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | Integer | PK, Auto-inc | Unique identifier |
| `name` | String | Unique, Not Null | Project name |
| `description` | Text | Nullable | Project description |
| `created_at` | DateTime | Default Now | Creation timestamp |
| `updated_at` | DateTime | Default Now, On Update Now | Last update timestamp |
| `created_by` | Integer | Not Null | ID of the user who created the project |

## 4. Architecture
- **Layered Architecture**:
  - **API Layer**: `app/api/v1/endpoints/projects.py` handles HTTP requests and validation.
  - **Service Layer**: `app/services/project_service.py` contains business logic.
  - **Repository Layer**: `app/repositories/project_repository.py` handles DB interactions.
  - **Model Layer**: `app/models/project.py` defines SQLAlchemy models.
  - **Schema Layer**: `app/schemas/project.py` defines Pydantic models.

## 5. Security
- **Authentication**: JWT Bearer Token required for all endpoints.
- **Authorization**: (Future) RBAC to restrict creation/deletion to Admins.
